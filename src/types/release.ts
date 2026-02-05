export interface RolloutHistoryEntry {
  percentage: number;
  date: string;
  notes?: string;
  updatedBy?: string; // Email of user who made the update
  updatedByName?: string; // Display name of user
}

export interface ConceptRelease {
  id: string;
  concepts: string[];
  version: string;
  buildId: string;
  rolloutPercentage: number;
  status: 'Not Started' | 'In Progress' | 'Complete' | 'On Hold' | 'Paused'; // Added 'Paused'
  notes?: string;
  buildLink?: string;
  rolloutHistory?: RolloutHistoryEntry[];
}

export interface PlatformRelease {
  platform: 'iOS' | 'Android GMS' | 'Android HMS';
  conceptReleases: ConceptRelease[];
  // Legacy fields for backward compatibility
  version?: string;
  buildId?: string;
  rolloutPercentage?: number;
  status?: 'Not Started' | 'In Progress' | 'Complete' | 'On Hold';
  concepts?: string[];
  notes?: string;
  buildLink?: string;
  rolloutHistory?: RolloutHistoryEntry[];
}

export interface Release {
  id: string;
  releaseDate: string;
  releaseName: string;
  environment: string;
  platforms: PlatformRelease[];
  changes: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // Email of user who created
  createdByName?: string; // Display name of creator
  updatedBy?: string; // Email of user who last updated
  updatedByName?: string; // Display name of last updater
  
  // Legacy field for backward compatibility
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
  concept?: string; // Keep for backward compatibility
}