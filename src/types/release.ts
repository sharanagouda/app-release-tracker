export interface PlatformRelease {
  platform: 'iOS' | 'Android GMS' | 'Android HMS';
  version: string;
  buildId: string;
  rolloutPercentage: number;
  status: 'Complete' | 'In Progress' | 'Paused';
  concepts: string[]; // New field for concept selection per platform
  notes?: string;
  buildLink?: string;
  rolloutHistory?: RolloutHistoryEntry[];
}

export interface RolloutHistoryEntry {
  percentage: number;
  date: string;
  notes?: string;
}

export interface Release {
  id: string;
  releaseDate: string;
  releaseName: string;
  environment: string; // Changed from 'concept' to 'environment'
  platforms: PlatformRelease[];
  changes: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Keep concept for backward compatibility
  concept?: string;
}

export interface ReleaseStats {
  totalReleases: number;
  activeReleases: number;
  completedReleases: number;
  pausedReleases: number;
}

export interface FilterOptions {
  status: string;
  environment: string;
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: string;
  // Keep concept for backward compatibility
  concept?: string;
}