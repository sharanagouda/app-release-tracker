export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'rollout_updated'
  | 'status_changed'
  | 'tags_updated'
  | 'commented';

export interface ActivityLogEntry {
  id: string;
  releaseId: string;
  releaseName: string;
  action: ActivityAction;
  /** Human-readable summary, e.g. "Changed status from In Progress → Complete" */
  summary: string;
  /** Field that changed (optional, for field-level diffs) */
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string; // ISO string
  userEmail: string;
  userName: string;
}

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
  versionChanges?: string[]; // Version-specific changes/what's new in this version
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
  tags?: string[]; // Release tags/labels e.g. ['hotfix', 'critical', 'feature']
  isNative?: boolean; // Whether this is a native release
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

export interface ReleaseComment {
  id: string;
  releaseId: string;
  text: string;
  userEmail: string;
  userName: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string, set when edited
  edited?: boolean;
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