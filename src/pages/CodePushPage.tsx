import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Key, RefreshCw, LogOut, GitCompare, Settings, Package, ExternalLink } from 'lucide-react';
import {
  Territory,
  CodePushPlatform,
  CodePushEnvironment,
  ConceptConfig,
  getAppName,
  getTerritoryConfig,
  TERRITORIES,
} from '../config/codepushApps';
import { useCodePush } from '../hooks/useCodePush';
import { DeploymentHistoryItem } from '../services/api/interfaces';
import { apiClient } from '../services/api/ApiClient';
import { codePushService } from '../services/api/CodePushService';
import { TerritoryToggle } from '../components/codepush/TerritoryToggle';
import { PlatformToggle } from '../components/codepush/PlatformToggle';
import { ConceptPills } from '../components/codepush/ConceptPills';
import { EnvironmentTabs } from '../components/codepush/EnvironmentTabs';
import { LatestDeployment } from '../components/codepush/LatestDeployment';
import { DeploymentAnalytics } from '../components/codepush/DeploymentAnalytics';
import { DeploymentHistory } from '../components/codepush/DeploymentHistory';
import { DeploymentKeysModal } from '../components/codepush/DeploymentKeysModal';
import { CompareDeploymentsModal } from '../components/codepush/CompareDeploymentsModal';
import { EditRolloutModal } from '../components/codepush/EditRolloutModal';
import { CodePushLogin } from '../components/codepush/CodePushLogin';
import { useAppContext } from '../contexts/AppContext';
import { findMatchingReleases } from '../services/codepushReleaseSync';

const CODEPUSH_TOKEN_KEY = 'codepush_token';

// Validate URL param values against allowed values
const isValidTerritory = (v: string | null): v is Territory =>
  v === 'BLC' || v === 'Hybris';
const isValidPlatform = (v: string | null): v is CodePushPlatform =>
  v === 'iOS' || v === 'Android';
const isValidEnvironment = (v: string | null): v is CodePushEnvironment =>
  v === 'Production' || v === 'ProductionStaging' || v === 'Staging';

export const CodePushPage: React.FC = () => {
  const { darkMode, canEdit, releases } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');

  // ── Derive navigation state from URL search params (source of truth) ──
  const rawTerritory = searchParams.get('territory');
  const rawPlatform = searchParams.get('platform');
  const rawEnv = searchParams.get('env');
  const rawConcept = searchParams.get('concept');
  const highlightVersion = searchParams.get('version') || '';

  const territory: Territory = isValidTerritory(rawTerritory) ? rawTerritory : 'BLC';
  const platform: CodePushPlatform = isValidPlatform(rawPlatform) ? rawPlatform : 'iOS';

  const territoryConfig = getTerritoryConfig(territory);
  const availableEnvironments = territoryConfig.environments[platform];

  const environment: CodePushEnvironment =
    isValidEnvironment(rawEnv) && availableEnvironments.includes(rawEnv)
      ? rawEnv
      : availableEnvironments[0];

  const selectedConcept: ConceptConfig = useMemo(() => {
    if (rawConcept) {
      const found = territoryConfig.concepts.find((c) => c.appNameKey === rawConcept);
      if (found) return found;
    }
    return territoryConfig.concepts[0];
  }, [rawConcept, territoryConfig]);

  // Helper to update URL params (pushes to history for back/forward support)
  const updateParams = useCallback(
    (updates: Partial<Record<'territory' | 'platform' | 'env' | 'concept' | 'version', string>>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  // Convenience setters that update the URL
  const setTerritory = useCallback(
    (t: Territory) => {
      const config = getTerritoryConfig(t);
      updateParams({
        territory: t,
        concept: config.concepts[0].appNameKey,
      });
    },
    [updateParams]
  );

  const setPlatform = useCallback(
    (p: CodePushPlatform) => updateParams({ platform: p }),
    [updateParams]
  );

  const setEnvironment = useCallback(
    (e: CodePushEnvironment) => updateParams({ env: e }),
    [updateParams]
  );

  const setSelectedConcept = useCallback(
    (c: ConceptConfig) => updateParams({ concept: c.appNameKey }),
    [updateParams]
  );

  // Modal state (not URL-driven)
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<DeploymentHistoryItem | null>(null);

  // On mount, check if we have a saved token and validate it
  useEffect(() => {
    const savedToken = localStorage.getItem(CODEPUSH_TOKEN_KEY);
    if (!savedToken) {
      setAuthChecking(false);
      return;
    }

    apiClient.setAccessToken(savedToken);
    codePushService
      .getApps()
      .then(() => {
        setIsAuthenticated(true);
        setAuthChecking(false);
      })
      .catch((err: any) => {
        apiClient.clearAccessToken();
        localStorage.removeItem(CODEPUSH_TOKEN_KEY);
        setAuthError('Your session has expired. Please sign in again.');
        setAuthChecking(false);
      });
  }, []);

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

  // Find matching releases for the "View Release" link
  const matchingReleases = findMatchingReleases(releases, latestDeployment?.appVersion || '');

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

  // Auth guard
  if (authChecking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <svg
            className={`animate-spin h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Checking authentication...
          </span>
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
          {/* View Release button — if matching release found */}
          {matchingReleases.length > 0 && (
            <Link
              to={`/releases/${matchingReleases[0].id}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                darkMode
                  ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-700'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
              }`}
            >
              <Package className="w-4 h-4" />
              View Release
            </Link>
          )}
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
        <div
          className={`rounded-lg border px-4 py-3 flex items-center justify-between ${
            darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
            Showing mock data — API call failed. Check browser console for details.
          </p>
          <button
            onClick={refetch}
            className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
              darkMode
                ? 'bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
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
        <div
          className={`rounded-lg border p-6 text-center ${
            darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          }`}
        >
          <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            Error loading deployments: {error}
          </p>
          <button
            onClick={refetch}
            className={`mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode
                ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
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
            <div className="flex items-center gap-2">
              {/* View Release for latest deployment */}
              {latestDeployment && matchingReleases.length > 0 && (
                <Link
                  to={`/releases/${matchingReleases[0].id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    darkMode
                      ? 'text-green-400 hover:bg-green-900/30'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Release Details
                </Link>
              )}
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
          </div>

          {/* Analytics Layout */}
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
              releases={releases}
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
        releases={releases}
      />
    </div>
  );
};
