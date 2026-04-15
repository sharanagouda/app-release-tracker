/**
 * ActivityLogModal
 *
 * Displays a timeline of all audit-trail entries for a given release.
 * Data is fetched from Firestore on open; never on every keystroke.
 *
 * Features:
 *  - Timeline view with action icons and colour-coded badges
 *  - Field-level diff (old → new value)
 *  - Filter by action type
 *  - Relative + absolute timestamps
 *  - Empty state and loading skeleton
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Clock,
  User,
  RefreshCw,
  PlusCircle,
  Trash2,
  Edit3,
  TrendingUp,
  Tag,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { ActivityLogEntry, ActivityAction } from '../types/release';
import { getActivityLogsForRelease, subscribeToActivityLogs, formatActivityTimestamp } from '../services/firebaseActivityLog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: string;
  releaseName: string;
  darkMode?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_META: Record<
  ActivityAction,
  { label: string; icon: React.ReactNode; colorLight: string; colorDark: string }
> = {
  created: {
    label: 'Created',
    icon: <PlusCircle className="w-4 h-4" />,
    colorLight: 'bg-green-100 text-green-700 border-green-200',
    colorDark: 'bg-green-900/30 text-green-300 border-green-700',
  },
  updated: {
    label: 'Updated',
    icon: <Edit3 className="w-4 h-4" />,
    colorLight: 'bg-blue-100 text-blue-700 border-blue-200',
    colorDark: 'bg-blue-900/30 text-blue-300 border-blue-700',
  },
  deleted: {
    label: 'Deleted',
    icon: <Trash2 className="w-4 h-4" />,
    colorLight: 'bg-red-100 text-red-700 border-red-200',
    colorDark: 'bg-red-900/30 text-red-300 border-red-700',
  },
  rollout_updated: {
    label: 'Rollout',
    icon: <TrendingUp className="w-4 h-4" />,
    colorLight: 'bg-purple-100 text-purple-700 border-purple-200',
    colorDark: 'bg-purple-900/30 text-purple-300 border-purple-700',
  },
  status_changed: {
    label: 'Status',
    icon: <RefreshCw className="w-4 h-4" />,
    colorLight: 'bg-orange-100 text-orange-700 border-orange-200',
    colorDark: 'bg-orange-900/30 text-orange-300 border-orange-700',
  },
  tags_updated: {
    label: 'Tags',
    icon: <Tag className="w-4 h-4" />,
    colorLight: 'bg-teal-100 text-teal-700 border-teal-200',
    colorDark: 'bg-teal-900/30 text-teal-300 border-teal-700',
  },
  commented: {
    label: 'Comment',
    icon: <MessageCircle className="w-4 h-4" />,
    colorLight: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    colorDark: 'bg-indigo-900/30 text-indigo-300 border-indigo-700',
  },
};

const getRelativeTime = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonRow: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <div className={`flex gap-3 p-3 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700/40' : 'bg-gray-100'}`}>
    <div className={`w-8 h-8 rounded-full flex-shrink-0 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
    <div className="flex-1 space-y-2">
      <div className={`h-3 rounded w-3/4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
      <div className={`h-3 rounded w-1/2 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
    </div>
  </div>
);

interface LogEntryRowProps {
  entry: ActivityLogEntry;
  darkMode: boolean;
}

const LogEntryRow: React.FC<LogEntryRowProps> = ({ entry, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = ACTION_META[entry.action] ?? ACTION_META.updated;
  const hasDiff = entry.oldValue !== undefined || entry.newValue !== undefined;

  return (
    <div
      className={`rounded-lg border transition-colors ${
        darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Action icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
            darkMode ? meta.colorDark : meta.colorLight
          }`}
        >
          {meta.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                darkMode ? meta.colorDark : meta.colorLight
              }`}
            >
              {meta.label}
            </span>
            <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {entry.summary}
            </span>
          </div>

          <div className={`flex flex-wrap items-center gap-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {entry.userName || entry.userEmail}
            </span>
            <span className="flex items-center gap-1" title={formatActivityTimestamp(entry.timestamp)}>
              <Clock className="w-3 h-3" />
              {getRelativeTime(entry.timestamp)}
            </span>
            <span className={`hidden sm:inline ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatActivityTimestamp(entry.timestamp)}
            </span>
          </div>
        </div>

        {/* Expand toggle for diff */}
        {hasDiff && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className={`flex-shrink-0 p-1 rounded transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={expanded ? 'Hide diff' : 'Show diff'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Diff panel */}
      {hasDiff && expanded && (
        <div className={`mx-3 mb-3 rounded-md p-3 text-xs font-mono space-y-1 ${
          darkMode ? 'bg-gray-900/60 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}>
          {entry.oldValue !== undefined && (
            <div className={`flex gap-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              <span className="select-none">−</span>
              <span className="break-all">{entry.oldValue || '(empty)'}</span>
            </div>
          )}
          {entry.newValue !== undefined && (
            <div className={`flex gap-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              <span className="select-none">+</span>
              <span className="break-all">{entry.newValue || '(empty)'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ALL_ACTIONS: ActivityAction[] = [
  'created',
  'updated',
  'deleted',
  'rollout_updated',
  'status_changed',
  'tags_updated',
  'commented',
];

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  releaseId,
  releaseName,
  darkMode = false,
}) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<ActivityAction | 'all'>('all');

  const fetchLogs = useCallback(async () => {
    if (!releaseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityLogsForRelease(releaseId);
      setLogs(data);
    } catch (err) {
      setError('Failed to load activity log. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [releaseId]);

  // Subscribe to real-time updates when modal opens
  useEffect(() => {
    if (!isOpen || !releaseId) return;
    
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToActivityLogs(
      releaseId,
      (data) => {
        setLogs(data);
        setLoading(false);
      },
      (err) => {
        setError('Failed to load activity log. Please try again.');
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, releaseId]);

  if (!isOpen) return null;

  const filteredLogs =
    filterAction === 'all' ? logs : logs.filter((l) => l.action === filterAction);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-2xl my-4 max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* ── Header ── */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h2 className="text-base font-semibold leading-tight">Activity Log</h2>
              <p className={`text-xs truncate max-w-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {releaseName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              title="Refresh"
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div
          className={`flex items-center gap-2 px-5 py-3 border-b overflow-x-auto ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          }`}
        >
          <button
            onClick={() => setFilterAction('all')}
            className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
              filterAction === 'all'
                ? darkMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-600 text-white border-blue-600'
                : darkMode
                ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                : 'text-gray-600 border-gray-300 hover:bg-gray-100'
            }`}
          >
            All ({logs.length})
          </button>
          {ALL_ACTIONS.map((action) => {
            const count = logs.filter((l) => l.action === action).length;
            if (count === 0) return null;
            const meta = ACTION_META[action];
            return (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={`flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterAction === action
                    ? darkMode
                      ? meta.colorDark + ' border-current'
                      : meta.colorLight + ' border-current'
                    : darkMode
                    ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                    : 'text-gray-600 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {meta.icon}
                {meta.label} ({count})
              </button>
            );
          })}
        </div>

        {/* ── Log list ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonRow key={i} darkMode={darkMode} />
              ))}
            </>
          )}

          {!loading && error && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                darkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={fetchLogs}
                className="ml-auto text-xs underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Activity className={`w-10 h-10 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {filterAction === 'all'
                  ? 'No activity recorded yet for this release.'
                  : `No "${ACTION_META[filterAction]?.label}" events found.`}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredLogs.map((entry) => (
              <LogEntryRow key={entry.id} entry={entry} darkMode={darkMode} />
            ))}
        </div>

        {/* ── Footer ── */}
        {!loading && !error && logs.length > 0 && (
          <div
            className={`px-5 py-3 border-t text-xs ${
              darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'
            }`}
          >
            {filteredLogs.length} of {logs.length} event{logs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
