import React, { useState, useRef } from 'react';
import { X, ClipboardPaste, Upload, FileSpreadsheet, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ParsedSpreadsheetData,
  ParsedItem,
  parseTSV,
  parseFile,
  parsedItemsToChanges,
} from '../utils/spreadsheetParser';

interface SpreadsheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: {
    concepts?: string;
    version?: string;
    codepushId?: string;
    dateReleased?: string;
    crLink?: string;
    changes: string[];
  }) => void;
  darkMode: boolean;
}

type ImportTab = 'paste' | 'upload';

export const SpreadsheetImportModal: React.FC<SpreadsheetImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  darkMode,
}) => {
  const [activeTab, setActiveTab] = useState<ImportTab>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedSpreadsheetData | null>(null);
  const [error, setError] = useState('');
  const [showRawItems, setShowRawItems] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const dm = darkMode;

  const handleParse = () => {
    setError('');
    setParsedData(null);

    if (!pasteText.trim()) {
      setError('Please paste some data from your spreadsheet.');
      return;
    }

    try {
      const data = parseTSV(pasteText);
      if (data.items.length === 0 && !data.version && !data.concepts) {
        setError('Could not detect any release data. Make sure you copied the full table including the header rows.');
        return;
      }
      setParsedData(data);
    } catch (err) {
      setError(`Parse error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setParsedData(null);

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError('Please upload an .xlsx, .xls, or .csv file.');
      return;
    }

    try {
      const data = await parseFile(file);
      if (data.items.length === 0 && !data.version && !data.concepts) {
        setError('Could not detect any release data in the file. Check the sheet format.');
        return;
      }
      setParsedData(data);
    } catch (err) {
      setError(`File error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Reset file input so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = () => {
    if (!parsedData) return;

    const changes = parsedItemsToChanges(parsedData.items);

    onImport({
      concepts: parsedData.concepts,
      version: parsedData.version,
      codepushId: parsedData.codepushId,
      dateReleased: parsedData.dateReleased,
      crLink: parsedData.crLink,
      changes,
    });

    // Reset and close
    setPasteText('');
    setParsedData(null);
    setError('');
    onClose();
  };

  const handleReset = () => {
    setPasteText('');
    setParsedData(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div
        className={`rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col ${
          dm ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            dm ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className={`h-5 w-5 ${dm ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`text-lg font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>
              Import from Spreadsheet
            </h3>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className={`p-1 rounded-lg transition-colors ${
              dm
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
          {([
            { id: 'paste' as const, label: 'Copy & Paste', icon: ClipboardPaste },
            { id: 'upload' as const, label: 'Upload File', icon: Upload },
          ]).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  handleReset();
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? dm
                      ? 'border-blue-400 text-blue-400'
                      : 'border-blue-600 text-blue-600'
                    : dm
                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Paste tab */}
          {activeTab === 'paste' && !parsedData && (
            <div className="space-y-3">
              <p className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                Open your spreadsheet, select the release data (including header rows with Owner, Concepts, etc. and the items table), copy it, and paste below.
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={12}
                placeholder={
                  'Owner:\tBasavannevva Palled\tcodepush id\tversion\tdate released\n' +
                  'Concepts\tMax Codepush only\t9076\t10.46.2\t13-May\n' +
                  'CR link\tCH-3490\n\n' +
                  's.no\titem/task\tfor max?\tDescription\n' +
                  '1\thttps://dev.azure.com/...\tYes\tShow VPN error page\n' +
                  '2\thttps://dev.azure.com/...\tNo\t\n'
                }
                className={`w-full rounded-lg border p-3 text-xs font-mono leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  dm
                    ? 'bg-gray-900 border-gray-600 text-gray-300 placeholder-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400'
                }`}
              />
              <button
                onClick={handleParse}
                disabled={!pasteText.trim()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Parse Data
              </button>
            </div>
          )}

          {/* Upload tab */}
          {activeTab === 'upload' && !parsedData && (
            <div className="space-y-3">
              <p className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                Upload your release spreadsheet (.xlsx, .xls, or .csv). The first sheet will be parsed.
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  dm
                    ? 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
              >
                <Upload className={`w-8 h-8 mb-2 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                  Click to upload or drag & drop
                </p>
                <p className={`text-xs mt-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                  .xlsx, .xls, or .csv
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg ${
                dm ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}
            >
              <AlertCircle
                className={`h-4 w-4 flex-shrink-0 mt-0.5 ${dm ? 'text-red-400' : 'text-red-600'}`}
              />
              <p className={`text-sm ${dm ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}

          {/* Preview */}
          {parsedData && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  dm ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                }`}
              >
                <Check className={`h-4 w-4 ${dm ? 'text-green-400' : 'text-green-600'}`} />
                <p className={`text-sm font-medium ${dm ? 'text-green-300' : 'text-green-700'}`}>
                  Parsed successfully! Review the data below.
                </p>
              </div>

              {/* Metadata */}
              <div className={`rounded-lg p-4 ${dm ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                <h4
                  className={`text-sm font-semibold mb-3 ${dm ? 'text-gray-200' : 'text-gray-800'}`}
                >
                  Release Metadata
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {parsedData.concepts && (
                    <div>
                      <span className={`font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                        Concepts:{' '}
                      </span>
                      <span className={dm ? 'text-gray-200' : 'text-gray-900'}>
                        {parsedData.concepts}
                      </span>
                    </div>
                  )}
                  {parsedData.version && (
                    <div>
                      <span className={`font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                        Version:{' '}
                      </span>
                      <span className={dm ? 'text-gray-200' : 'text-gray-900'}>
                        {parsedData.version}
                      </span>
                    </div>
                  )}
                  {parsedData.codepushId && (
                    <div>
                      <span className={`font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                        CodePush ID:{' '}
                      </span>
                      <span className={dm ? 'text-gray-200' : 'text-gray-900'}>
                        {parsedData.codepushId}
                      </span>
                    </div>
                  )}
                  {parsedData.dateReleased && (
                    <div>
                      <span className={`font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                        Date:{' '}
                      </span>
                      <span className={dm ? 'text-gray-200' : 'text-gray-900'}>
                        {parsedData.dateReleased}
                      </span>
                    </div>
                  )}
                  {parsedData.owner && (
                    <div>
                      <span className={`font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                        Owner:{' '}
                      </span>
                      <span className={dm ? 'text-gray-200' : 'text-gray-900'}>
                        {parsedData.owner}
                      </span>
                    </div>
                  )}
                  {parsedData.crLink && (
                    <div>
                      <span className={`font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                        CR Link:{' '}
                      </span>
                      <span className={dm ? 'text-gray-200' : 'text-gray-900'}>
                        {parsedData.crLink}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items/Changes Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4
                    className={`text-sm font-semibold ${dm ? 'text-gray-200' : 'text-gray-800'}`}
                  >
                    Changes ({parsedData.items.length} items)
                  </h4>
                  <button
                    onClick={() => setShowRawItems(!showRawItems)}
                    className={`flex items-center gap-1 text-xs ${
                      dm ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {showRawItems ? 'Show formatted' : 'Show raw data'}
                    {showRawItems ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {showRawItems ? (
                  // Raw items table
                  <div
                    className={`rounded-lg border overflow-x-auto ${
                      dm ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={dm ? 'bg-gray-900/50' : 'bg-gray-50'}>
                          <th
                            className={`px-3 py-2 text-left font-medium ${
                              dm ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            #
                          </th>
                          <th
                            className={`px-3 py-2 text-left font-medium ${
                              dm ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            Task
                          </th>
                          <th
                            className={`px-3 py-2 text-left font-medium ${
                              dm ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            For Concept?
                          </th>
                          <th
                            className={`px-3 py-2 text-left font-medium ${
                              dm ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.items.map((item, i) => (
                          <tr
                            key={i}
                            className={`border-t ${dm ? 'border-gray-700' : 'border-gray-200'}`}
                          >
                            <td className={`px-3 py-2 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                              {item.sno}
                            </td>
                            <td
                              className={`px-3 py-2 max-w-[200px] truncate ${
                                dm ? 'text-gray-300' : 'text-gray-700'
                              }`}
                              title={item.task}
                            >
                              {item.task}
                            </td>
                            <td className={`px-3 py-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                              {item.forConcept || '-'}
                            </td>
                            <td className={`px-3 py-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                              {item.description || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Formatted changes list
                  <div
                    className={`rounded-lg border p-3 space-y-1.5 max-h-[200px] overflow-y-auto ${
                      dm ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {parsedItemsToChanges(parsedData.items).map((change, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div
                          className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            dm ? 'bg-blue-400' : 'bg-blue-500'
                          }`}
                        />
                        <p
                          className={`text-xs break-all ${dm ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {change}
                        </p>
                      </div>
                    ))}
                    {parsedData.items.length === 0 && (
                      <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                        No items found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between gap-2 p-4 border-t ${
            dm ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div>
            {parsedData && (
              <button
                onClick={handleReset}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  dm
                    ? 'text-gray-400 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dm ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            {parsedData && (
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Import {parsedData.items.length} Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
