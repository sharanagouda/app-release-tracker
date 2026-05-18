import React from 'react';
import { TrendingUp, Download, XCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DeploymentHistoryItem, DeploymentMetrics } from '../../services/api/interfaces';
import { CircularProgress } from '../common/CircularProgress';

interface DeploymentAnalyticsProps {
  deployment: DeploymentHistoryItem | null;
  deploymentMetrics: { active: number; downloaded: number; failed: number; installed: number } | null;
  allHistory: DeploymentHistoryItem[];
  allMetrics: DeploymentMetrics;
  darkMode: boolean;
}

/**
 * Abbreviate large numbers for Y-axis labels: 1000 → 1K, 150000 → 150K
 */
function abbreviateNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

export const DeploymentAnalytics: React.FC<DeploymentAnalyticsProps> = ({
  deployment,
  deploymentMetrics,
  allHistory,
  allMetrics,
  darkMode,
}) => {
  if (!deployment) return null;

  const m = deploymentMetrics || { active: 0, downloaded: 0, failed: 0, installed: 0 };
  const rolloutPercentage = deployment.rollout ?? 100;
  const totalInstalls = m.active + m.failed + m.installed;
  const activeInstallPercent = totalInstalls > 0
    ? Math.round((m.active / totalInstalls) * 1000) / 10
    : 0;

  // Metric cards
  const metricCards = [
    { label: 'Active', value: m.active, icon: TrendingUp, color: darkMode ? 'text-blue-400' : 'text-blue-600', bg: darkMode ? 'bg-blue-900/20' : 'bg-blue-50' },
    { label: 'Downloaded', value: m.downloaded, icon: Download, color: darkMode ? 'text-green-400' : 'text-green-600', bg: darkMode ? 'bg-green-900/20' : 'bg-green-50' },
    { label: 'Failed', value: m.failed, icon: XCircle, color: darkMode ? 'text-red-400' : 'text-red-600', bg: darkMode ? 'bg-red-900/20' : 'bg-red-50' },
    { label: 'Installed', value: m.installed, icon: CheckCircle, color: darkMode ? 'text-emerald-400' : 'text-emerald-600', bg: darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50' },
  ];

  // Metrics breakdown bar chart for latest deployment
  const barChartData = [
    { name: 'Active', value: m.active, fill: darkMode ? '#60a5fa' : '#3b82f6' },
    { name: 'Failed', value: m.failed, fill: darkMode ? '#f87171' : '#ef4444' },
    { name: 'Installed', value: m.installed, fill: darkMode ? '#34d399' : '#10b981' },
  ];

  // Per-version chart — Active, Downloaded, Failed for each version
  const versionChartData = allHistory
    .slice(0, 10)
    .reverse()
    .map((h) => {
      const vm = allMetrics[h.label];
      return {
        version: h.label,
        Active: vm?.active ?? 0,
        Downloaded: vm?.downloaded ?? 0,
        Failed: vm?.failed ?? 0,
      };
    });

  const tooltipStyle = {
    backgroundColor: darkMode ? '#1f2937' : '#fff',
    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    color: darkMode ? '#f3f4f6' : '#111827',
    fontSize: '12px',
  };

  const axisTick = { fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280' };
  const gridStroke = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-lg border p-4 ${card.bg} ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${card.color}`} />
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {card.label}
                </span>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Circular Progress + Metrics Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rollout Progress */}
        <div className={`rounded-lg border p-5 flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CircularProgress
            percentage={rolloutPercentage}
            label="Rollout"
            color={rolloutPercentage === 100 ? 'stroke-green-500' : 'stroke-blue-500'}
            darkMode={darkMode}
          />
        </div>

        {/* Active Installs Progress */}
        <div className={`rounded-lg border p-5 flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CircularProgress
            percentage={activeInstallPercent}
            label="Active Installs"
            color={activeInstallPercent > 80 ? 'stroke-green-500' : activeInstallPercent > 50 ? 'stroke-yellow-500' : 'stroke-red-500'}
            darkMode={darkMode}
          />
        </div>

        {/* Metrics Breakdown Bar Chart */}
        <div className={`rounded-lg border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className={`text-xs font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Metrics Breakdown
          </h4>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={barChartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={abbreviateNumber} width={45} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Version Metrics Chart */}
      {versionChartData.length > 1 && (
        <div className={`rounded-lg border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className={`text-sm font-medium mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Metrics per Version
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={versionChartData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="version" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={abbreviateNumber} width={50} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                cursor={{ fill: darkMode ? 'rgba(55, 65, 81, 0.4)' : 'rgba(229, 231, 235, 0.6)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280' }}
              />
              <Bar dataKey="Active" fill={darkMode ? '#60a5fa' : '#3b82f6'} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Downloaded" fill={darkMode ? '#34d399' : '#10b981'} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Failed" fill={darkMode ? '#f87171' : '#ef4444'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
