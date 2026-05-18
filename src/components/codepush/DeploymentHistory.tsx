import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Download, CheckCircle, XCircle, Edit3, ExternalLink } from 'lucide-react';
import { DeploymentHistoryItem, DeploymentMetrics } from '../../services/api/interfaces';
import { Release } from '../../types/release';
import { findMatchingReleases } from '../../services/codepushReleaseSync';

interface DeploymentHistoryProps {
  history: DeploymentHistoryItem[];
  metrics: DeploymentMetrics;
  onEdit?: (deployment: DeploymentHistoryItem) => void;
  canEdit: boolean;
  darkMode: boolean;
  /** Current releases list — used to show "View Release" links */
  releases?: Release[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(ts: string): string {
  const d = new Date(Number(ts));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(ts: string): string {
  const d = new Date(Number(ts));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export const DeploymentHistory: React.FC<DeploymentHistoryProps> = ({
  history,
  metrics,
  onEdit,
  canEdit,
  darkMode,
  releases = [],
}) => {
  if (history.length === 0) {
    return (
      <div className={`rounded-lg border p-8 text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No deployment history available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((dep) => {
        const m = metrics[dep.label];
        const activeCount = m?.active ?? 0;
        const downloadedCount = m?.downloaded ?? 0;
        const installedCount = m?.installed ?? 0;
        const failedCount = m?.failed ?? 0;
        const total = activeCount + failedCount + installedCount;
        const activeInstallPercent = total > 0 ? ((activeCount / total) * 100).toFixed(0) : '0';

        const isDisabled = dep.isDisabled;
        const isRollback = dep.releaseMethod === 'Rollback';
        const statusLabel = isDisabled ? 'Disabled' : isRollback ? 'Rolled Back' : 'Active';
        const statusStyle = isDisabled
          ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
          : isRollback
            ? (darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
            : (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700');

        // Parse description — clean up surrounding quotes
        const desc = dep.description?.replace(/^'+|'+$/g, '') || '';

        return (
          <div
            key={dep.label}
            className={`rounded-lg border overflow-hidden shadow-md hover:shadow-lg transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700 shadow-gray-900/40' : 'bg-white border-gray-200 shadow-gray-200/60'}`}
          >
            {/* Header: Label + Version + Status */}
            <div className={`px-5 py-3 flex items-center justify-between ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {dep.label}
                </span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  {dep.appVersion}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle}`}>
                  {statusLabel}
                </span>
                {dep.isMandatory && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                    Mandatory
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* View Release link */}
                {(() => {
                  const matching = findMatchingReleases(releases, dep.appVersion);
                  if (matching.length === 0) return null;
                  return (
                    <Link
                      to={`/releases/${matching[0].id}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        darkMode
                          ? 'text-green-400 hover:bg-green-900/30'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Release
                    </Link>
                  );
                })()}
                {canEdit && (
                  <button
                    onClick={() => onEdit?.(dep)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      darkMode
                        ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            {desc && (
              <div className={`px-5 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <p className={`text-sm font-mono leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {desc}
                </p>
              </div>
            )}

            {/* Metrics Row: Active | Downloaded | Installed | Failed */}
            <div className={`grid grid-cols-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {[
                { label: 'Active', value: activeCount, icon: TrendingUp, color: darkMode ? 'text-blue-400' : 'text-blue-600' },
                { label: 'Downloaded', value: downloadedCount, icon: Download, color: darkMode ? 'text-green-400' : 'text-green-600' },
                { label: 'Installed', value: installedCount, icon: CheckCircle, color: darkMode ? 'text-emerald-400' : 'text-emerald-600' },
                { label: 'Failed', value: failedCount, icon: XCircle, color: darkMode ? 'text-red-400' : 'text-red-600' },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className={`px-4 py-3 text-center border-r last:border-r-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {metric.label}
                      </span>
                    </div>
                    <p className={`text-lg font-bold ${metric.color}`}>
                      {metric.value.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Footer: Date, User, Size, Method, Rollout, Active Install % */}
            <div className={`px-5 py-3 border-t flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${darkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-200 bg-gray-50/50'}`}>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date:</span>{' '}
                {formatDate(dep.uploadTime)}
              </span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>User:</span>{' '}
                {dep.releasedBy}
              </span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Size:</span>{' '}
                {formatBytes(dep.size)}
              </span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Method:</span>{' '}
                {dep.releaseMethod}
              </span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Rollout:</span>{' '}
                {dep.rollout != null ? `${dep.rollout}%` : '100%'}
              </span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active Install:</span>{' '}
                {activeInstallPercent}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
