export interface PlatformRelease {
  platform: 'iOS' | 'Android GMS' | 'Android HMS';
  version: string;
  buildId: string;
  rolloutPercentage: number;
  status: 'Complete' | 'In Progress' | 'Paused';
  notes?: string;
  buildLink?: string;
}

export interface Release {
  id: string;
  releaseDate: string;
  releaseName: string;
  concept: string;
  platforms: PlatformRelease[];
  changes: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseStats {
  totalReleases: number;
  activeReleases: number;
  completedReleases: number;
  pausedReleases: number;
}

export interface FilterOptions {
  status: string;
  dateRange: {
    start: string;
    end: string;
  };
}