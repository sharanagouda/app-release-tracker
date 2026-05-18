// Types for CodePush Dashboard

export interface App {
  id: string;
  name: string;
  os: 'ios' | 'android';
  deployments: Deployment[];
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  name: string;
  key: string;
  releases: Release[];
}

export interface Release {
  id: string;
  label: string;
  appVersion: string;
  description: string;
  releaseMethod: 'Upload' | 'Promote' | 'Rollback';
  releasedBy: string;
  size: number;
  uploadTime: string;
  metrics: ReleaseMetrics;
  isMandatory: boolean;
  isDisabled: boolean;
  rollout?: number;
}

export interface ReleaseMetrics {
  active: number;
  downloaded: number;
  failed: number;
  installed: number;
  totalDevices: number;
}

export interface AppState {
  apps: App[];
  selectedApp: App | null;
  selectedDeployment: Deployment | null;
  loading: boolean;
  error: string | null;
}

