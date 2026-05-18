import { useState, useEffect, useCallback } from 'react';
import { DeploymentHistoryItem, DeploymentMetrics } from '../services/api/interfaces';
import { codePushService } from '../services/api/CodePushService';
import { CodePushEnvironment } from '../config/codepushApps';

// Import mock data as fallback
import { mockDeploymentHistory } from '../lib/MockData/deploymentHistory';
import { mockDeploymentMetrics } from '../lib/MockData/deploymentMetrics';

interface UseCodePushOptions {
  appName: string;
  environment: CodePushEnvironment;
  enabled?: boolean;  // Only fetch when true (e.g., after auth is confirmed)
}

interface UseCodePushResult {
  history: DeploymentHistoryItem[];
  metrics: DeploymentMetrics;
  latestDeployment: DeploymentHistoryItem | null;
  latestMetrics: { active: number; downloaded: number; failed: number; installed: number } | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  deploymentKeys: { name: string; key: string }[];
  usingMockData: boolean;
}

export const useCodePush = ({ appName, environment, enabled = true }: UseCodePushOptions): UseCodePushResult => {
  const [history, setHistory] = useState<DeploymentHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<DeploymentMetrics>({});
  const [deploymentKeys, setDeploymentKeys] = useState<{ name: string; key: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchData = useCallback(async () => {
    if (!appName || !environment || !enabled) {
      setHistory([]);
      setMetrics({});
      setDeploymentKeys([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setUsingMockData(false);

    let historyFromApi = false;
    let metricsFromApi = false;

    try {
      // Fetch history, metrics, and deployment keys in parallel
      const [historyRes, metricsRes, deploymentsRes] = await Promise.allSettled([
        codePushService.getDeploymentHistory({ appName, deploymentName: environment }),
        codePushService.getDeploymentMetrics({ appName, deploymentName: environment }),
        codePushService.getDeployments(appName),
      ]);

      // ── Handle history ──────────────────────────────────────────────────────
      if (historyRes.status === 'fulfilled') {
        const raw = historyRes.value.data;
        console.log('[CodePush] History raw response:', raw);

        // The API may return: DeploymentHistoryItem[] directly, or { history: [...] }
        // Empty array is valid (new app with no deployments) — NOT a failure
        const items = Array.isArray(raw) ? raw : (raw as any)?.history || [];
        // Filter out placeholder entries with version "0.0", then reverse (latest first)
        const filtered = items.filter((item: any) => item.appVersion !== '0.0');
        setHistory([...filtered].reverse());
        historyFromApi = true;
      } else {
        console.error('[CodePush] History API failed:', historyRes.reason);
        setHistory([...mockDeploymentHistory].filter((item) => item.appVersion !== '0.0').reverse());
      }

      // ── Handle metrics ──────────────────────────────────────────────────────
      if (metricsRes.status === 'fulfilled') {
        const raw = metricsRes.value.data;
        console.log('[CodePush] Metrics raw response:', raw);

        // API may return: { metrics: { v1: {...}, v2: {...} } } or the map directly
        // Empty metrics {} is valid (no installs yet) — NOT a failure
        const metricsMap = (raw as any)?.metrics || raw || {};
        setMetrics(metricsMap);
        metricsFromApi = true;
      } else {
        console.error('[CodePush] Metrics API failed:', metricsRes.reason);
        setMetrics(mockDeploymentMetrics);
      }

      // ── Handle deployment keys ──────────────────────────────────────────────
      if (deploymentsRes.status === 'fulfilled') {
        const raw = deploymentsRes.value.data;
        console.log('[CodePush] Deployments raw response:', raw);

        const depList = (raw as any)?.deployments || (Array.isArray(raw) ? raw : []);
        if (Array.isArray(depList)) {
          setDeploymentKeys(
            depList.map((d: any) => ({ name: d.name, key: d.key || '' }))
          );
        }
      } else {
        console.error('[CodePush] Deployments API failed:', deploymentsRes.reason);
      }

      if (!historyFromApi || !metricsFromApi) {
        setUsingMockData(true);
      }
    } catch (err) {
      console.error('[CodePush] Unexpected fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments');
      setHistory([...mockDeploymentHistory].filter((item) => item.appVersion !== '0.0').reverse());
      setMetrics(mockDeploymentMetrics);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [appName, environment, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Latest deployment = first item in history (already reversed so latest is first)
  const latestDeployment = history.length > 0 ? history[0] : null;

  // Metrics for the latest deployment label
  const latestMetrics = latestDeployment && metrics[latestDeployment.label]
    ? metrics[latestDeployment.label]
    : null;

  return {
    history,
    metrics,
    latestDeployment,
    latestMetrics,
    loading,
    error,
    refetch: fetchData,
    deploymentKeys,
    usingMockData,
  };
};
