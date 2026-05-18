import React, { useState, useEffect } from 'react';
import { Key, RefreshCw, LogOut, GitCompare, Settings } from 'lucide-react';
import {
  Territory,
  CodePushPlatform,
  CodePushEnvironment,
  ConceptConfig,
  getAppName,
  getTerritoryConfig,
} from '../../config/codepushApps';
import { useCodePush } from '../../hooks/useCodePush';
import { DeploymentHistoryItem } from '../../services/api/interfaces';
import { apiClient } from '../../services/api/ApiClient';
import { codePushService } from '../../services/api/CodePushService';
import { TerritoryToggle } from './TerritoryToggle';
import { PlatformToggle } from './PlatformToggle';
import { ConceptPills } from './ConceptPills';
import { EnvironmentTabs } from './EnvironmentTabs';
import { LatestDeployment } from './LatestDeployment';
import { DeploymentAnalytics } from './DeploymentAnalytics';
import { DeploymentHistory } from './DeploymentHistory';
import { DeploymentKeysModal } from './DeploymentKeysModal';
import { CompareDeploymentsModal } from './CompareDeploymentsModal';
import { EditRolloutModal } from './EditRolloutModal';
import { CodePushLogin } from './CodePushLogin';

interface CodePushTabProps {
  darkMode: boolean;
  canEdit: boolean;
}

const CODEPUSH_TOKEN_KEY = 'codepush_token';

export const CodePushTab: React.FC<CodePushTabProps> = ({
  darkMode,
  canEdit,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');

  // On mount, check if we have a saved token and validate it
  useEffect(() => {
    const savedToken = localStorage.getItem(CODEPUSH_TOKEN_KEY);
    if (!savedToken) {
      setAuthChecking(false);
      return;
    }

    // Validate the saved token with a real API call
    apiClient.setAccessToken(savedToken);
    codePushService.getApps()
      .then(() => {
        console.log('[CodePush] Saved token is valid');
        setIsAuthenticated(true);
        setAuthChecking(false);
      })
      .catch((err: any) => {
        console.warn('[CodePush] Saved token is invalid/expired:', err.status, err.message);
        apiClient.clearAccessToken();
        localStorage.removeItem(CODEPUSH_TOKEN_KEY);
        setAuthError('Your session has expired. Please sign in again.');
        setAuthChecking(false);
      });
  }, []);

  // Navigation state
  const [territory, setTerritory] = useState<Territory>('BLC');
  const [platform, setPlatform] = useState<CodePushPlatform>('iOS');
  const [selectedConcept, setSelectedConcept] = useState<ConceptConfig | null>(null);
  const [environment, setEnvironment] = useState<CodePushEnvironment>('Production');
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<DeploymentHistoryItem | null>(null);

  const handleAuthenticated = (token: string) => {
    apiClient.setAccessToken(token);
    localStorage.setItem(CODEPUSH_TOKEN_KEY, token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiClient.clearAccessToken();
    localStorage.removeItem(CODEPUSH_TOKEN_KEY);
    setIsAuthenticated(false);
  };

  const territoryConfig = getTerritoryConfig(territory);
  const availableEnvironments = territoryConfig.environments[platform];

  // Set default concept when territory changes
  useEffect(() => {
    setSelectedConcept(territoryConfig.concepts[0]);
  }, [territory, territoryConfig]);

  // Reset environment if current one isn't available for this territory+platform combo
  useEffect(() => {
    if (!availableEnvironments.includes(environment)) {
      setEnvironment(availableEnvironments[0]);
    }
  }, [territory, platform, availableEnvironments, environment]);

  const appName = selectedConcept
    ? getAppName(territoryConfig.prefix, selectedConcept.appNameKey, platform)
    : '';

  const {
    history,
    metrics,
    latestDeployment,
    latestMetrics,
    loading,
    error,
    refetch,
    deploymentKeys,
    usingMockData,
  } = useCodePush({ appName, environment, enabled: isAuthenticated });

  // Rollback and edit are both handled inside the EditRolloutModal now

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`h-64 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-20 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-40 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>
      <div className={`h-48 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
    </div>
  );

  // ─── Auth guard ────────────────────────────────────────────────────────────
  if (authChecking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <svg className={`animate-spin h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <CodePushLogin darkMode={darkMode} onAuthenticated={handleAuthenticated} initialError={authError} />;
  }

  return (
    <div className="space-y-6">
      {/* Territory + Platform Toggles */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <TerritoryToggle selected={territory} onChange={setTerritory} darkMode={darkMode} />
          <PlatformToggle selected={platform} onChange={setPlatform} darkMode={darkMode} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompareOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode
                ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 border border-purple-700'
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Compare Versions
          </button>
          <button
            onClick={() => setIsKeysModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode
                ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 border border-yellow-700'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
            }`}
          >
            <Key className="w-4 h-4" />
            View Deployment Keys
          </button>
          <button
            onClick={refetch}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
            title="Sign out of CodePush"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Concept Pills */}
      {selectedConcept && (
        <ConceptPills
          concepts={territoryConfig.concepts}
          selectedKey={selectedConcept.appNameKey}
          onChange={setSelectedConcept}
          darkMode={darkMode}
        />
      )}

      {/* Selected App Name */}
      <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Selected: <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{appName}</span>
      </p>

      {/* Environment Tabs */}
      <EnvironmentTabs
        environments={availableEnvironments}
        selected={environment}
        onChange={setEnvironment}
        darkMode={darkMode}
      />

      {/* Mock data warning banner */}
      {!loading && usingMockData && (
        <div className={`rounded-lg border px-4 py-3 flex items-center justify-between ${darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
            Showing mock data — API call failed. Check browser console for details.
          </p>
          <button
            onClick={refetch}
            className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
              darkMode ? 'bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        renderSkeleton()
      ) : error ? (
        <div className={`rounded-lg border p-6 text-center ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            Error loading deployments: {error}
          </p>
          <button
            onClick={refetch}
            className={`mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Header: Latest Deployment Analytics */}
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Latest Deployment Analytics
            </h3>
            {canEdit && latestDeployment && (
              <button
                onClick={() => setEditingDeployment(latestDeployment)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-700'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                Edit Deployment
              </button>
            )}
          </div>

          {/* Analytics Layout: Left card + Right metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <LatestDeployment deployment={latestDeployment} darkMode={darkMode} />
            </div>
            <div className="lg:col-span-2">
              <DeploymentAnalytics
                deployment={latestDeployment}
                deploymentMetrics={latestMetrics}
                allHistory={history}
                allMetrics={metrics}
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* Deployment History Table */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Deployment History
            </h3>
            <DeploymentHistory
              history={history}
              metrics={metrics}
              canEdit={canEdit}
              darkMode={darkMode}
              onEdit={(dep) => setEditingDeployment(dep)}
            />
          </div>
        </>
      )}

      {/* Deployment Keys Modal */}
      <DeploymentKeysModal
        isOpen={isKeysModalOpen}
        onClose={() => setIsKeysModalOpen(false)}
        appName={appName}
        deploymentKeys={deploymentKeys}
        darkMode={darkMode}
      />

      {/* Compare Deployments Modal */}
      <CompareDeploymentsModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        appName={appName}
        history={history}
        metrics={metrics}
        environments={availableEnvironments}
        currentEnvironment={environment}
        darkMode={darkMode}
      />

      {/* Edit Rollout Modal */}
      <EditRolloutModal
        isOpen={editingDeployment !== null}
        onClose={() => setEditingDeployment(null)}
        deployment={editingDeployment}
        appName={appName}
        environment={environment}
        darkMode={darkMode}
        onSuccess={refetch}
      />
    </div>
  );
};
