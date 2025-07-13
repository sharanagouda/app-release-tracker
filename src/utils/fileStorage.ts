import { Release } from '../types/release';

// Note: Web browsers cannot directly write to arbitrary local files for security reasons
// This utility provides download functionality instead

export const downloadJSON = (data: Release[], filename?: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `releases-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadMockData = (data: Release[], filename?: string) => {
  const mockDataContent = `import { Release } from '../types/release';

export const CONCEPTS = [
  'lifestyle',
  'babyshop',
  'splash',
  'shoemart',
  'centrepoint',
  'shoexpress',
  'mothercare',
  'homecentre',
  'homebox',
  'max'
];

export const PLATFORMS = ['iOS', 'Android GMS', 'Android HMS'] as const;

export const mockReleases: Release[] = ${JSON.stringify(data, null, 2)};
`;

  const blob = new Blob([mockDataContent], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `mockData-${new Date().toISOString().split('T')[0]}.ts`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<Release[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the data structure
        if (!Array.isArray(data)) {
          throw new Error('JSON file must contain an array of releases');
        }
        
        // Basic validation of release structure
        data.forEach((release, index) => {
          if (!release.id || !release.releaseName || !release.releaseDate) {
            throw new Error(`Invalid release structure at index ${index}`);
          }
        });
        
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

export const downloadCSV = (releases: Release[]) => {
  const csvContent = [
    ['Release Date', 'Release Name', 'Concept', 'Platform', 'Version', 'Build ID', 'Rollout %', 'Status', 'Platform Notes', 'Changes', 'General Notes'],
    ...releases.flatMap(release =>
      release.platforms.map(platform => [
        release.releaseDate,
        release.releaseName,
        release.concept,
        platform.platform,
        platform.version,
        platform.buildId,
        platform.rolloutPercentage.toString(),
        platform.status,
        platform.notes || '',
        release.changes.join('; '),
        release.notes || ''
      ])
    )
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `release-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};