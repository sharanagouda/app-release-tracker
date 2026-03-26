export type ReleaseNoteType = 'Hybris Hotfix' | 'BLC Hotfix' | 'LMD Theme Release';

export interface ReleaseNote {
  id: string;
  type: ReleaseNoteType;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  isLocked?: boolean;
  history?: {
    field: string;
    oldValue: any;
    newValue: any;
    updatedBy: string;
    updatedAt: string;
  }[];
  [key: string]: any; // Allow dynamic fields based on configuration
}

export interface ColumnDefinition {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'boolean' | 'textarea';
  options?: string[]; // For select type
  required?: boolean;
  width?: string;
}

export interface ReleaseNoteConfig {
  type: ReleaseNoteType;
  columns: ColumnDefinition[];
}
