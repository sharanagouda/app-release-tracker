import { Release } from '../types/release';

/**
 * Safely convert any value to string, avoiding circular references
 */
const safeStringify = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.join('; ');
  return String(value);
};

/**
 * Export releases to CSV format
 */
export const exportToCSVFunction = (releases: Release[]): void => {
  if (!releases || releases.length === 0) {
    alert('No releases to export');
    return;
  }

  try {
    const rows: string[][] = [];
    
    // Add headers
    const headers = [
      'Release ID',
      'Release Date',
      'Release Name',
      'Environment',
      'Platform',
      'Concept Release ID',
      'Concepts',
      'Version',
      'Build ID',
      'Rollout %',
      'Status',
      'Build Link',
      'Platform Notes',
      'Changes',
      'General Notes',
      'Created At',
      'Updated At'
    ];
    rows.push(headers);

    // Process each release
    for (let i = 0; i < releases.length; i++) {
      const release = releases[i];
      const platforms = release.platforms || [];
      
      for (let j = 0; j < platforms.length; j++) {
        const platform = platforms[j];
        const conceptReleases = platform.conceptReleases || [];
        
        if (conceptReleases.length > 0) {
          // New structure with conceptReleases
          for (let k = 0; k < conceptReleases.length; k++) {
            const cr = conceptReleases[k];
            rows.push([
              safeStringify(release.id),
              safeStringify(release.releaseDate),
              safeStringify(release.releaseName),
              safeStringify(release.environment),
              safeStringify(platform.platform),
              safeStringify(cr.id),
              safeStringify(cr.concepts),
              safeStringify(cr.version),
              safeStringify(cr.buildId),
              safeStringify(cr.rolloutPercentage),
              safeStringify(cr.status),
              safeStringify(cr.buildLink),
              safeStringify(cr.notes),
              safeStringify(release.changes),
              safeStringify(release.notes),
              safeStringify(release.createdAt),
              safeStringify(release.updatedAt)
            ]);
          }
        } else {
          // Legacy structure
          rows.push([
            safeStringify(release.id),
            safeStringify(release.releaseDate),
            safeStringify(release.releaseName),
            safeStringify(release.environment),
            safeStringify(platform.platform),
            '',
            safeStringify(platform.concepts || ['All Concepts']),
            safeStringify(platform.version),
            safeStringify(platform.buildId),
            safeStringify(platform.rolloutPercentage),
            safeStringify(platform.status),
            safeStringify(platform.buildLink),
            safeStringify(platform.notes),
            safeStringify(release.changes),
            safeStringify(release.notes),
            safeStringify(release.createdAt),
            safeStringify(release.updatedAt)
          ]);
        }
      }
    }

    // Convert to CSV string
    const csvContent = rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes
        const escaped = cell.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ).join('\n');

    // Download the file
    downloadFile(csvContent, 'text/csv', 'csv');
  } catch (error) {
    console.error('CSV Export Error:', error);
    alert('Error exporting to CSV. Check console for details.');
  }
};

/**
 * Export releases to JSON format
 */
export const exportToJSONFunction = (releases: Release[]): void => {
  if (!releases || releases.length === 0) {
    alert('No releases to export');
    return;
  }

  try {
    // Build clean JSON structure manually
    const cleanData: any[] = [];
    
    for (let i = 0; i < releases.length; i++) {
      const release = releases[i];
      const platforms = release.platforms || [];
      
      const cleanPlatforms: any[] = [];
      for (let j = 0; j < platforms.length; j++) {
        const platform = platforms[j];
        const conceptReleases = platform.conceptReleases || [];
        
        const cleanConceptReleases: any[] = [];
        for (let k = 0; k < conceptReleases.length; k++) {
          const cr = conceptReleases[k];
          const rolloutHistory = cr.rolloutHistory || [];
          
          const cleanRolloutHistory: any[] = [];
          for (let m = 0; m < rolloutHistory.length; m++) {
            const rh = rolloutHistory[m];
            cleanRolloutHistory.push({
              percentage: rh.percentage || 0,
              date: rh.date || '',
              notes: rh.notes || ''
            });
          }
          
          cleanConceptReleases.push({
            id: cr.id || '',
            concepts: Array.isArray(cr.concepts) ? cr.concepts : [],
            version: cr.version || '',
            buildId: cr.buildId || '',
            rolloutPercentage: cr.rolloutPercentage || 0,
            status: cr.status || '',
            notes: cr.notes || '',
            buildLink: cr.buildLink || '',
            rolloutHistory: cleanRolloutHistory
          });
        }
        
        cleanPlatforms.push({
          platform: platform.platform || '',
          conceptReleases: cleanConceptReleases
        });
      }
      
      const changes = release.changes || [];
      const cleanChanges: string[] = [];
      for (let j = 0; j < changes.length; j++) {
        cleanChanges.push(String(changes[j]));
      }
      
      cleanData.push({
        id: release.id || '',
        releaseDate: release.releaseDate || '',
        releaseName: release.releaseName || '',
        environment: release.environment || '',
        platforms: cleanPlatforms,
        changes: cleanChanges,
        notes: release.notes || '',
        createdAt: release.createdAt || '',
        updatedAt: release.updatedAt || ''
      });
    }

    // Manually build JSON string to avoid any circular reference issues
    const jsonString = buildJSONString(cleanData);
    
    // Download the file
    downloadFile(jsonString, 'application/json', 'json');
  } catch (error) {
    console.error('JSON Export Error:', error);
    alert('Error exporting to JSON. Check console for details.');
  }
};

/**
 * Manually build JSON string to avoid circular references
 */
const buildJSONString = (data: any[]): string => {
  const indent = '  ';
  let result = '[\n';
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    result += indent + '{\n';
    result += indent + indent + `"id": "${item.id}",\n`;
    result += indent + indent + `"releaseDate": "${item.releaseDate}",\n`;
    result += indent + indent + `"releaseName": "${item.releaseName}",\n`;
    result += indent + indent + `"environment": "${item.environment}",\n`;
    
    // Platforms
    result += indent + indent + '"platforms": [\n';
    for (let j = 0; j < item.platforms.length; j++) {
      const platform = item.platforms[j];
      result += indent + indent + indent + '{\n';
      result += indent + indent + indent + indent + `"platform": "${platform.platform}",\n`;
      
      // Concept Releases
      result += indent + indent + indent + indent + '"conceptReleases": [\n';
      for (let k = 0; k < platform.conceptReleases.length; k++) {
        const cr = platform.conceptReleases[k];
        result += indent + indent + indent + indent + indent + '{\n';
        result += indent + indent + indent + indent + indent + indent + `"id": "${cr.id}",\n`;
        result += indent + indent + indent + indent + indent + indent + `"concepts": [${cr.concepts.map((c: string) => `"${c}"`).join(', ')}],\n`;
        result += indent + indent + indent + indent + indent + indent + `"version": "${cr.version}",\n`;
        result += indent + indent + indent + indent + indent + indent + `"buildId": "${cr.buildId}",\n`;
        result += indent + indent + indent + indent + indent + indent + `"rolloutPercentage": ${cr.rolloutPercentage},\n`;
        result += indent + indent + indent + indent + indent + indent + `"status": "${cr.status}",\n`;
        result += indent + indent + indent + indent + indent + indent + `"notes": "${cr.notes}",\n`;
        result += indent + indent + indent + indent + indent + indent + `"buildLink": "${cr.buildLink}",\n`;
        result += indent + indent + indent + indent + indent + indent + `"rolloutHistory": []\n`;
        result += indent + indent + indent + indent + indent + '}';
        if (k < platform.conceptReleases.length - 1) result += ',';
        result += '\n';
      }
      result += indent + indent + indent + indent + ']\n';
      result += indent + indent + indent + '}';
      if (j < item.platforms.length - 1) result += ',';
      result += '\n';
    }
    result += indent + indent + '],\n';
    
    // Changes
    result += indent + indent + `"changes": [${item.changes.map((c: string) => `"${c}"`).join(', ')}],\n`;
    result += indent + indent + `"notes": "${item.notes}",\n`;
    result += indent + indent + `"createdAt": "${item.createdAt}",\n`;
    result += indent + indent + `"updatedAt": "${item.updatedAt}"\n`;
    result += indent + '}';
    if (i < data.length - 1) result += ',';
    result += '\n';
  }
  
  result += ']';
  return result;
};

/**
 * Common download function
 */
const downloadFile = (content: string, mimeType: string, extension: string): void => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `releases_export_${new Date().toISOString().split('T')[0]}.${extension}`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Export filtered releases to CSV
 */
export const exportFilteredToCSV = (
  releases: Release[],
  filters: {
    platform?: string;
    environment?: string;
    concept?: string;
    status?: string;
    searchQuery?: string;
  }
): void => {
  try {
    const filtered: Release[] = [];
    
    for (let i = 0; i < releases.length; i++) {
      const release = releases[i];
      let include = true;
      
      // Platform filter
      if (filters.platform && filters.platform !== 'All Platforms') {
        const platforms = release.platforms || [];
        let hasPlatform = false;
        for (let j = 0; j < platforms.length; j++) {
          if (platforms[j].platform === filters.platform) {
            hasPlatform = true;
            break;
          }
        }
        if (!hasPlatform) include = false;
      }
      
      // Environment filter
      if (include && filters.environment && filters.environment !== 'All') {
        if (release.environment !== filters.environment) include = false;
      }
      
      // Concept filter
      if (include && filters.concept && filters.concept !== 'All Concepts') {
        const platforms = release.platforms || [];
        let hasConcept = false;
        for (let j = 0; j < platforms.length; j++) {
          const conceptReleases = platforms[j].conceptReleases || [];
          for (let k = 0; k < conceptReleases.length; k++) {
            const concepts = conceptReleases[k].concepts || [];
            for (let m = 0; m < concepts.length; m++) {
              if (concepts[m] === filters.concept) {
                hasConcept = true;
                break;
              }
            }
            if (hasConcept) break;
          }
          if (hasConcept) break;
        }
        if (!hasConcept) include = false;
      }
      
      // Status filter
      if (include && filters.status && filters.status !== 'All') {
        const platforms = release.platforms || [];
        let hasStatus = false;
        for (let j = 0; j < platforms.length; j++) {
          const conceptReleases = platforms[j].conceptReleases || [];
          for (let k = 0; k < conceptReleases.length; k++) {
            if (conceptReleases[k].status === filters.status) {
              hasStatus = true;
              break;
            }
          }
          if (hasStatus) break;
        }
        if (!hasStatus) include = false;
      }
      
      // Search query
      if (include && filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          (release.releaseName || '').toLowerCase().includes(query) ||
          (release.releaseDate || '').includes(query) ||
          (release.notes || '').toLowerCase().includes(query);
        if (!matchesSearch) include = false;
      }
      
      if (include) {
        filtered.push(release);
      }
    }
    
    exportToCSV(filtered);
  } catch (error) {
    console.error('Filtered CSV Export Error:', error);
    alert('Error exporting filtered data to CSV.');
  }
};

/**
 * Export filtered releases to JSON
 */
export const exportFilteredToJSON = (
  releases: Release[],
  filters: {
    platform?: string;
    environment?: string;
    concept?: string;
    status?: string;
    searchQuery?: string;
  }
): void => {
  try {
    const filtered: Release[] = [];
    
    for (let i = 0; i < releases.length; i++) {
      const release = releases[i];
      let include = true;
      
      // Platform filter
      if (filters.platform && filters.platform !== 'All Platforms') {
        const platforms = release.platforms || [];
        let hasPlatform = false;
        for (let j = 0; j < platforms.length; j++) {
          if (platforms[j].platform === filters.platform) {
            hasPlatform = true;
            break;
          }
        }
        if (!hasPlatform) include = false;
      }
      
      // Environment filter
      if (include && filters.environment && filters.environment !== 'All') {
        if (release.environment !== filters.environment) include = false;
      }
      
      // Concept filter
      if (include && filters.concept && filters.concept !== 'All Concepts') {
        const platforms = release.platforms || [];
        let hasConcept = false;
        for (let j = 0; j < platforms.length; j++) {
          const conceptReleases = platforms[j].conceptReleases || [];
          for (let k = 0; k < conceptReleases.length; k++) {
            const concepts = conceptReleases[k].concepts || [];
            for (let m = 0; m < concepts.length; m++) {
              if (concepts[m] === filters.concept) {
                hasConcept = true;
                break;
              }
            }
            if (hasConcept) break;
          }
          if (hasConcept) break;
        }
        if (!hasConcept) include = false;
      }
      
      // Status filter
      if (include && filters.status && filters.status !== 'All') {
        const platforms = release.platforms || [];
        let hasStatus = false;
        for (let j = 0; j < platforms.length; j++) {
          const conceptReleases = platforms[j].conceptReleases || [];
          for (let k = 0; k < conceptReleases.length; k++) {
            if (conceptReleases[k].status === filters.status) {
              hasStatus = true;
              break;
            }
          }
          if (hasStatus) break;
        }
        if (!hasStatus) include = false;
      }
      
      // Search query
      if (include && filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          (release.releaseName || '').toLowerCase().includes(query) ||
          (release.releaseDate || '').includes(query) ||
          (release.notes || '').toLowerCase().includes(query);
        if (!matchesSearch) include = false;
      }
      
      if (include) {
        filtered.push(release);
      }
    }
    
    exportToJSON(filtered);
  } catch (error) {
    console.error('Filtered JSON Export Error:', error);
    alert('Error exporting filtered data to JSON.');
  }
};