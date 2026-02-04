export interface ConceptRelease {
  id: string;
  concepts: string[]; // ['CP'] or ['All Concepts'] or ['CP', 'MX', 'SP']
  version: string;
  buildId: string;
  rolloutPercentage: number;
  status: 'Complete' | 'In Progress' | 'Paused' | 'Not Started';
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
  status?: 'In Progress' | 'Complete' | 'Paused' | 'On Hold';
  concepts?: string[];
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
  environment: string;
  platforms: PlatformRelease[];
  changes: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
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