/**
 * Spreadsheet Parser
 *
 * Parses release data from two sources:
 * 1. Copy-pasted TSV text (from Excel / Google Sheets clipboard)
 * 2. Uploaded .xlsx / .csv files
 *
 * Expected spreadsheet format (RM's format):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Owner:      Basavannevva Palled   codepush id   version   date     │
 * │ Concepts    Max Codepush only     9076          10.46.2   13-May   │
 * │ CR link     CH-3490                                                │
 * │                                                                    │
 * │ s.no   item/task                  for max?   Description           │
 * │ 1      https://dev.azure.com/...  No                               │
 * │ 2      https://dev.azure.com/...  Yes        Show VPN error page   │
 * │ ...                                                                │
 * └─────────────────────────────────────────────────────────────────────┘
 */

import * as XLSX from 'xlsx';

export interface ParsedSpreadsheetData {
  // Header metadata
  owner?: string;
  concepts?: string;
  codepushId?: string;
  version?: string;
  dateReleased?: string;
  crLink?: string;

  // Items table
  items: ParsedItem[];

  // Raw text for debugging
  rawText?: string;
}

export interface ParsedItem {
  sno: string;
  task: string;       // URL or description
  forConcept: string; // "Yes", "No", or concept name
  description: string;
}

/**
 * Parse TSV text (tab-separated values from clipboard).
 * When you copy from Excel/Sheets, it uses tabs between columns and newlines between rows.
 */
export function parseTSV(text: string): ParsedSpreadsheetData {
  const lines = text.split('\n').map((line) => line.split('\t').map((cell) => cell.trim()));
  return parseRows(lines, text);
}

/**
 * Parse an uploaded .xlsx or .csv file.
 * Returns a promise because FileReader is async.
 */
export function parseFile(file: File): Promise<ParsedSpreadsheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // Get as array of arrays (preserves empty cells)
        const rows: string[][] = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: '',
          raw: false,
        });

        resolve(parseRows(rows));
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Core parser: takes a 2D array of rows and extracts metadata + items.
 */
function parseRows(rows: string[][], rawText?: string): ParsedSpreadsheetData {
  const result: ParsedSpreadsheetData = {
    items: [],
    rawText,
  };

  let itemsStartRow = -1;

  // Pass 1: Extract header metadata from the first ~10 rows
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const firstCell = (row[0] || '').toLowerCase().trim();

    // Look for "Owner:" pattern
    if (firstCell.includes('owner')) {
      result.owner = row[1]?.trim() || '';
      // Look for codepush id, version, date in remaining cells
      for (let j = 2; j < row.length; j++) {
        const cell = (row[j] || '').toLowerCase();
        if (cell.includes('codepush') || cell.includes('code push')) {
          result.codepushId = rows[i + 1]?.[j]?.trim() || row[j + 1]?.trim() || '';
        }
        if (cell.includes('version')) {
          result.version = rows[i + 1]?.[j]?.trim() || row[j + 1]?.trim() || '';
        }
        if (cell.includes('date')) {
          result.dateReleased = rows[i + 1]?.[j]?.trim() || row[j + 1]?.trim() || '';
        }
      }
    }

    // Look for "Concepts" row
    if (firstCell.includes('concept')) {
      result.concepts = row[1]?.trim() || '';
      // Also check if codepush id / version / date are on this row
      if (!result.codepushId) {
        for (let j = 2; j < row.length; j++) {
          const val = (row[j] || '').trim();
          if (/^\d{4,}$/.test(val)) result.codepushId = val; // 4+ digit number
          if (/^\d+\.\d+/.test(val)) result.version = val;   // Version pattern
          if (/\d{1,2}[-/]\w+/.test(val) || /\w+[-/]\d{1,2}/.test(val)) result.dateReleased = val;
        }
      }
    }

    // Look for "CR link" row
    if (firstCell.includes('cr') && (firstCell.includes('link') || firstCell.includes(' '))) {
      result.crLink = row[1]?.trim() || '';
    }

    // Detect the items table header row (s.no / item / task)
    if (
      firstCell === 's.no' ||
      firstCell === 'sno' ||
      firstCell === 's no' ||
      firstCell === '#' ||
      firstCell === 'no' ||
      firstCell === 'no.'
    ) {
      itemsStartRow = i + 1;
    }
  }

  // If we didn't find the header row by pattern, look for the first row with a number in column 0
  if (itemsStartRow === -1) {
    for (let i = 0; i < rows.length; i++) {
      const firstCell = (rows[i]?.[0] || '').trim();
      if (/^\d+$/.test(firstCell) && rows[i].length >= 2) {
        itemsStartRow = i;
        break;
      }
    }
  }

  // Pass 2: Extract items
  if (itemsStartRow >= 0) {
    for (let i = itemsStartRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const sno = (row[0] || '').trim();
      // Skip empty rows or non-numeric s.no rows (unless they have content)
      if (!sno && !(row[1] || '').trim()) continue;

      const task = (row[1] || '').trim();
      const forConcept = (row[2] || '').trim();
      const description = (row[3] || '').trim();

      // Skip rows that look like headers or empty
      if (!task && !description) continue;

      result.items.push({
        sno: sno || String(result.items.length + 1),
        task,
        forConcept,
        description,
      });
    }
  }

  return result;
}

/**
 * Convert parsed data to changes array for the release form.
 * Format: "Description (URL)" or just "URL" or just "Description"
 */
export function parsedItemsToChanges(items: ParsedItem[]): string[] {
  return items
    .map((item) => {
      const parts: string[] = [];

      // Use description if available
      if (item.description) {
        parts.push(item.description);
      }

      // Add task URL/text
      if (item.task) {
        if (item.task.startsWith('http')) {
          // If we have a description, append URL in parens; otherwise use URL as the change
          if (parts.length > 0) {
            parts[0] = `${parts[0]} (${item.task})`;
          } else {
            parts.push(item.task);
          }
        } else if (!item.description) {
          // Non-URL task text without description
          parts.push(item.task);
        } else if (item.task !== item.description) {
          // Both task text and description exist and differ
          parts[0] = `${item.task} - ${parts[0]}`;
        }
      }

      // Add concept marker if specified
      if (item.forConcept && item.forConcept.toLowerCase() !== 'yes' && item.forConcept.toLowerCase() !== 'no') {
        parts[0] = `[${item.forConcept}] ${parts[0] || ''}`;
      }

      return parts.join('');
    })
    .filter((change) => change.trim() !== '');
}
