// API Interfaces for CodePush Dashboard

// Deployment History Response Types
export interface DeploymentHistoryItem {
  label: string;
  appVersion: string;
  description: string;
  releaseMethod: 'Upload' | 'Promote' | 'Rollback';
  releasedBy: string;
  size: number;
  uploadTime: string;
  blobUrl?: string;
  diffPackageMap?: Record<string, DiffPackageInfo>;
  isMandatory: boolean;
  isDisabled: boolean;
  rollout?: number;
  packageHash?: string;
}

export interface DiffPackageInfo {
  url: string;
  size: number;
}

export interface DeploymentMetrics {
  [label: string]: {
    active: number;
    downloaded: number;
    failed: number;
    installed: number;
  };
}

// API Request Parameters
export interface GetDeploymentHistoryParams {
  appName: string;
  deploymentName: string;
}

export interface GetDeploymentMetricsParams {
  appName: string;
  deploymentName: string;
}

// API Response Types
export interface DeploymentHistoryResponse {
  history: DeploymentHistoryItem[];
}

export interface DeploymentMetricsResponse {
  metrics: DeploymentMetrics;
}

// App related interfaces
export interface CodePushApp {
  name: string;
  collaborators: Record<string, CollaboratorInfo>;
  deployments: string[];
}

export interface CollaboratorInfo {
  permission: 'Owner' | 'Collaborator';
  isCurrentAccount?: boolean;
}

export interface AppListResponse {
  apps: CodePushApp[];
}

// Deployment related interfaces
export interface CodePushDeployment {
  name: string;
  key: string;
  package?: DeploymentHistoryItem;
}

export interface DeploymentListResponse {
  deployments: CodePushDeployment[];
}
