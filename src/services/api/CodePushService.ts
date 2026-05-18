import { apiClient, ApiResponse } from './ApiClient';
import {
  DeploymentHistoryItem,
  DeploymentHistoryResponse,
  GetDeploymentHistoryParams,
  GetDeploymentMetricsParams,
  DeploymentMetricsResponse,
  CodePushApp,
  AppListResponse,
  CodePushDeployment,
  DeploymentListResponse,
} from './interfaces';

// API Endpoints
const ENDPOINTS = {
  // Apps
  getApps: () => '/apps',
  getApp: (appName: string) => `/apps/${appName}`,

  // Deployments
  getDeployments: (appName: string) => `/apps/${appName}/deployments`,
  getDeployment: (appName: string, deploymentName: string) =>
    `/apps/${appName}/deployments/${deploymentName}`,

  // History & Metrics
  getDeploymentHistory: (appName: string, deploymentName: string) =>
    `/apps/${appName}/deployments/${deploymentName}/history`,
  getDeploymentMetrics: (appName: string, deploymentName: string) =>
    `/apps/${appName}/deployments/${deploymentName}/metrics`,

  // Releases
  releaseUpdate: (appName: string, deploymentName: string) =>
    `/apps/${appName}/deployments/${deploymentName}/release`,
  promoteRelease: (
    appName: string,
    sourceDeploymentName: string,
    destDeploymentName: string
  ) =>
    `/apps/${appName}/deployments/${sourceDeploymentName}/promote/${destDeploymentName}`,
  rollbackRelease: (appName: string, deploymentName: string) =>
    `/apps/${appName}/deployments/${deploymentName}/rollback`,
  updateRollout: (appName: string, deploymentName: string) =>
    `/apps/${appName}/deployments/${deploymentName}/release`,
};

class CodePushService {
  // ==================== Apps ====================

  /**
   * Get list of all apps
   */
  public async getApps(): Promise<ApiResponse<AppListResponse>> {
    return apiClient.get<AppListResponse>(ENDPOINTS.getApps());
  }

  /**
   * Get a specific app by name
   */
  public async getApp(appName: string): Promise<ApiResponse<CodePushApp>> {
    return apiClient.get<CodePushApp>(ENDPOINTS.getApp(appName));
  }

  // ==================== Deployments ====================

  /**
   * Get all deployments for an app
   */
  public async getDeployments(
    appName: string
  ): Promise<ApiResponse<DeploymentListResponse>> {
    return apiClient.get<DeploymentListResponse>(
      ENDPOINTS.getDeployments(appName)
    );
  }

  /**
   * Get a specific deployment
   */
  public async getDeployment(
    appName: string,
    deploymentName: string
  ): Promise<ApiResponse<CodePushDeployment>> {
    return apiClient.get<CodePushDeployment>(
      ENDPOINTS.getDeployment(appName, deploymentName)
    );
  }

  // ==================== History & Metrics ====================

  /**
   * Get deployment history (release history)
   * This corresponds to the curl:
   * GET /apps/{appName}/deployments/{deploymentName}/history
   */
  public async getDeploymentHistory(
    params: GetDeploymentHistoryParams
  ): Promise<ApiResponse<DeploymentHistoryItem[]>> {
    return apiClient.get<DeploymentHistoryItem[]>(
      ENDPOINTS.getDeploymentHistory(params.appName, params.deploymentName)
    );
  }

  /**
   * Get deployment metrics
   */
  public async getDeploymentMetrics(
    params: GetDeploymentMetricsParams
  ): Promise<ApiResponse<DeploymentMetricsResponse>> {
    return apiClient.get<DeploymentMetricsResponse>(
      ENDPOINTS.getDeploymentMetrics(params.appName, params.deploymentName)
    );
  }

  // ==================== Releases ====================

  /**
   * Release an update to a deployment
   */
  public async releaseUpdate(
    appName: string,
    deploymentName: string,
    data: {
      packageInfo: {
        appVersion: string;
        description?: string;
        isMandatory?: boolean;
        rollout?: number;
      };
      package: File | Blob;
    }
  ): Promise<ApiResponse<DeploymentHistoryItem>> {
    const formData = new FormData();
    formData.append('packageInfo', JSON.stringify(data.packageInfo));
    formData.append('package', data.package);

    return apiClient.post<DeploymentHistoryItem>(
      ENDPOINTS.releaseUpdate(appName, deploymentName),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Promote a release from one deployment to another
   */
  public async promoteRelease(
    appName: string,
    sourceDeploymentName: string,
    destDeploymentName: string,
    options?: {
      label?: string;
      rollout?: number;
    }
  ): Promise<ApiResponse<DeploymentHistoryItem>> {
    return apiClient.post<DeploymentHistoryItem>(
      ENDPOINTS.promoteRelease(
        appName,
        sourceDeploymentName,
        destDeploymentName
      ),
      options
    );
  }

  /**
   * Rollback a deployment to a previous release
   */
  public async rollbackRelease(
    appName: string,
    deploymentName: string,
    targetRelease?: string
  ): Promise<ApiResponse<DeploymentHistoryItem>> {
    return apiClient.post<DeploymentHistoryItem>(
      ENDPOINTS.rollbackRelease(appName, deploymentName),
      targetRelease ? { targetRelease } : undefined
    );
  }

  /**
   * Update deployment release settings.
   * PATCH /apps/{appName}/deployments/{deploymentName}/release
   *
   * Supports: rollout, isMandatory, description, isDisabled, appVersion (targetBinaryVersion)
   */
  public async updateRelease(
    appName: string,
    deploymentName: string,
    options: {
      label?: string;
      rollout?: number;
      isMandatory?: boolean;
      description?: string;
      isDisabled?: boolean;
      appVersion?: string;
    }
  ): Promise<ApiResponse<DeploymentHistoryItem>> {
    return apiClient.patch<DeploymentHistoryItem>(
      ENDPOINTS.updateRollout(appName, deploymentName),
      {
        packageInfo: options,
      }
    );
  }
}

// Create and export a singleton instance
export const codePushService = new CodePushService();

// Export the class for testing or custom instances
export default CodePushService;
