import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Download, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';
import { DeploymentHistoryItem, DeploymentMetrics } from '../../services/api/interfaces';

type CompareMode = 'versions' | 'codepushId';

interface CompareDeploymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  history: DeploymentHistoryItem[];
  metrics: DeploymentMetrics;
  environments: string[];
  currentEnvironment: string;
  darkMode: boolean;
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Extract CodePush build ID from description.
 * "'9075 | ios hc | 61943f5b...'" → "9075"
 * "'10.28.2 10282_05 | Apr 3rd Release...'" → "10.28.2 10282_05"
 */
function extractCodePushId(description?: string): string {
  if (!description) return '';
  const clean = description.replace(/^'+|'+$/g, '').trim();
  return clean.split('|')[0].trim();
}

export const CompareDeploymentsModal: React.FC<CompareDeploymentsModalProps> = ({
  isOpen,
  onClose,
  appName,
  history,
  metrics,
  darkMode,
}) => {
  const [mode, setMode] = useState<CompareMode>('versions');

  // Version compare state
  const [leftLabel, setLeftLabel] = useState('');
  const [rightLabel, setRightLabel] = useState('');

  // CodePush ID compare state
  const [leftCpId, setLeftCpId] = useState('');
  const [rightCpId, setRightCpId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLeftLabel('');
      setRightLabel('');
      setLeftCpId('');
      setRightCpId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dm = darkMode;
  const selectClass = `w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    dm ? 'bg-gray-900 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
  }`;

  // ─── Version compare helpers ──────────────────────────────────────────────
  const leftDep = history.find((h) => h.label === leftLabel) || null;
  const rightDep = history.find((h) => h.label === rightLabel) || null;
  const leftMetrics = leftDep ? metrics[leftDep.label] : null;
  const rightMetrics = rightDep ? metrics[rightDep.label] : null;
  const versionOptLabel = (dep: DeploymentHistoryItem) => `${dep.label} (${dep.appVersion})`;
  const handleSwapVersions = () => { setLeftLabel(rightLabel); setRightLabel(leftLabel); };
  const versionRows = (leftDep && rightDep) ? buildComparisonRows(leftDep, rightDep, leftMetrics, rightMetrics) : [];

  // ─── CodePush ID compare helpers ──────────────────────────────────────────
  // Build unique list of CodePush IDs from history
  const cpIdEntries = history
    .map((h) => ({ dep: h, cpId: extractCodePushId(h.description) }))
    .filter((x) => x.cpId);

  const uniqueCpIds = Array.from(new Map(cpIdEntries.map((x) => [x.cpId, x])).values());

  const leftCpDep = cpIdEntries.find((x) => x.cpId === leftCpId)?.dep || null;
  const rightCpDep = cpIdEntries.find((x) => x.cpId === rightCpId)?.dep || null;
  const leftCpMetrics = leftCpDep ? metrics[leftCpDep.label] : null;
  const rightCpMetrics = rightCpDep ? metrics[rightCpDep.label] : null;
  const handleSwapCpIds = () => { setLeftCpId(rightCpId); setRightCpId(leftCpId); };
  const cpIdRows = (leftCpDep && rightCpDep) ? buildComparisonRows(leftCpDep, rightCpDep, leftCpMetrics, rightCpMetrics) : [];

  const cpIdOptLabel = (entry: { dep: DeploymentHistoryItem; cpId: string }) =>
    `${entry.cpId}  —  ${entry.dep.label} (${entry.dep.appVersion})`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative z-50 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div>
            <h2 className={`text-lg font-semibold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Compare Deployments</h2>
            <p className={`text-sm mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{appName}</p>
          </div>
          <button onClick={onClose} className={`p-1 rounded-md ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className={`w-5 h-5 ${dm ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="px-6 pt-4 flex gap-2">
          {([
            { id: 'versions' as CompareMode, label: 'Compare Versions' },
            { id: 'codepushId' as CompareMode, label: 'Compare CodePush ID' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === tab.id
                  ? 'bg-blue-600 text-white'
                  : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ─── VERSION COMPARISON ─── */}
          {mode === 'versions' && (
            <CompareSection
              dm={dm}
              selectClass={selectClass}
              leftValue={leftLabel}
              rightValue={rightLabel}
              onLeftChange={setLeftLabel}
              onRightChange={setRightLabel}
              onSwap={handleSwapVersions}
              leftLabel="Version A"
              rightLabel="Version B"
              options={history.map((dep) => ({ value: dep.label, label: versionOptLabel(dep) }))}
              leftDep={leftDep}
              rightDep={rightDep}
              leftMetrics={leftMetrics}
              rightMetrics={rightMetrics}
              rows={versionRows}
              emptyText="Select two versions above to compare"
            />
          )}

          {/* ─── CODEPUSH ID COMPARISON ─── */}
          {mode === 'codepushId' && (
            <CompareSection
              dm={dm}
              selectClass={selectClass}
              leftValue={leftCpId}
              rightValue={rightCpId}
              onLeftChange={setLeftCpId}
              onRightChange={setRightCpId}
              onSwap={handleSwapCpIds}
              leftLabel="CodePush ID A"
              rightLabel="CodePush ID B"
              options={uniqueCpIds.map((entry) => ({ value: entry.cpId, label: cpIdOptLabel(entry) }))}
              leftDep={leftCpDep}
              rightDep={rightCpDep}
              leftMetrics={leftCpMetrics}
              rightMetrics={rightCpMetrics}
              rows={cpIdRows}
              emptyText="Select two CodePush build IDs above to compare"
            />
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex justify-end px-6 py-4 border-t ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <button onClick={onClose} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Shared Compare Section ─────────────────────────────────────────────────

interface CompareSectionProps {
  dm: boolean;
  selectClass: string;
  leftValue: string;
  rightValue: string;
  onLeftChange: (v: string) => void;
  onRightChange: (v: string) => void;
  onSwap: () => void;
  leftLabel: string;
  rightLabel: string;
  options: { value: string; label: string }[];
  leftDep: DeploymentHistoryItem | null;
  rightDep: DeploymentHistoryItem | null;
  leftMetrics: { active: number; downloaded: number; failed: number; installed: number } | null;
  rightMetrics: { active: number; downloaded: number; failed: number; installed: number } | null;
  rows: { label: string; left: string; right: string }[];
  emptyText: string;
}

const CompareSection: React.FC<CompareSectionProps> = ({
  dm, selectClass, leftValue, rightValue, onLeftChange, onRightChange, onSwap,
  leftLabel, rightLabel, options, leftDep, rightDep, leftMetrics, rightMetrics, rows, emptyText,
}) => (
  <div className="space-y-5">
    {/* Dropdowns */}
    <div className="flex items-end gap-4">
      <div className="flex-1">
        <label className={`block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{leftLabel}</label>
        <select value={leftValue} onChange={(e) => onLeftChange(e.target.value)} className={selectClass}>
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.value === rightValue}>{opt.label}</option>
          ))}
        </select>
      </div>
      <button onClick={onSwap} disabled={!leftValue || !rightValue} className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors mb-0.5 disabled:opacity-30 ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title="Swap">
        <ArrowUpDown className="w-4 h-4" />
      </button>
      <div className="flex-1">
        <label className={`block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{rightLabel}</label>
        <select value={rightValue} onChange={(e) => onRightChange(e.target.value)} className={selectClass}>
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.value === leftValue}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>

    {/* Content */}
    {(!leftValue || !rightValue) ? (
      <div className={`rounded-lg border p-10 text-center ${dm ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <p className={`text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{emptyText}</p>
      </div>
    ) : (leftDep && rightDep) ? (
      <>
        {/* Descriptions */}
        <div className="grid grid-cols-2 gap-4">
          <DescBlock label={`${leftDep.label} — Description`} text={leftDep.description} darkMode={dm} />
          <DescBlock label={`${rightDep.label} — Description`} text={rightDep.description} darkMode={dm} />
        </div>
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricsCard label={leftDep.label} version={leftDep.appVersion} metrics={leftMetrics} darkMode={dm} />
          <MetricsCard label={rightDep.label} version={rightDep.appVersion} metrics={rightMetrics} darkMode={dm} />
        </div>
        {/* Comparison table */}
        <ComparisonTable rows={rows} leftHeader={`${leftDep.label} (${leftDep.appVersion})`} rightHeader={`${rightDep.label} (${rightDep.appVersion})`} darkMode={dm} />
      </>
    ) : null}
  </div>
);

// ─── Helper: build comparison rows ──────────────────────────────────────────

function buildComparisonRows(
  left: DeploymentHistoryItem, right: DeploymentHistoryItem,
  lm: { active: number; downloaded: number; failed: number; installed: number } | null,
  rm: { active: number; downloaded: number; failed: number; installed: number } | null,
): { label: string; left: string; right: string }[] {
  const l = lm || { active: 0, downloaded: 0, failed: 0, installed: 0 };
  const r = rm || { active: 0, downloaded: 0, failed: 0, installed: 0 };
  const lTotal = l.active + l.failed + l.installed;
  const rTotal = r.active + r.failed + r.installed;
  return [
    { label: 'Label', left: left.label, right: right.label },
    { label: 'App Version', left: left.appVersion, right: right.appVersion },
    { label: 'CodePush ID', left: extractCodePushId(left.description), right: extractCodePushId(right.description) },
    { label: 'Date', left: formatDate(left.uploadTime), right: formatDate(right.uploadTime) },
    { label: 'Size', left: formatBytes(left.size), right: formatBytes(right.size) },
    { label: 'Mandatory', left: left.isMandatory ? 'Yes' : 'No', right: right.isMandatory ? 'Yes' : 'No' },
    { label: 'Rollout', left: left.rollout != null ? `${left.rollout}%` : '100%', right: right.rollout != null ? `${right.rollout}%` : '100%' },
    { label: 'Status', left: left.isDisabled ? 'Disabled' : 'Active', right: right.isDisabled ? 'Disabled' : 'Active' },
    { label: 'Method', left: left.releaseMethod, right: right.releaseMethod },
    { label: 'Released By', left: left.releasedBy, right: right.releasedBy },
    { label: 'Active', left: l.active.toLocaleString(), right: r.active.toLocaleString() },
    { label: 'Downloaded', left: l.downloaded.toLocaleString(), right: r.downloaded.toLocaleString() },
    { label: 'Installed', left: l.installed.toLocaleString(), right: r.installed.toLocaleString() },
    { label: 'Failed', left: l.failed.toLocaleString(), right: r.failed.toLocaleString() },
    { label: 'Active Install %', left: lTotal > 0 ? `${((l.active / lTotal) * 100).toFixed(1)}%` : '0%', right: rTotal > 0 ? `${((r.active / rTotal) * 100).toFixed(1)}%` : '0%' },
  ];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const DescBlock: React.FC<{ label: string; text?: string; darkMode: boolean }> = ({ label, text, darkMode: dm }) => {
  const desc = text?.replace(/^'+|'+$/g, '') || '—';
  return (
    <div className={`rounded-lg border p-4 ${dm ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <p className={`text-xs font-medium mb-2 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-sm font-mono leading-relaxed break-all ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{desc}</p>
    </div>
  );
};

const MetricsCard: React.FC<{ label: string; version: string; metrics: { active: number; downloaded: number; failed: number; installed: number } | null; darkMode: boolean }> = ({ label, version, metrics: m, darkMode: dm }) => {
  const data = m || { active: 0, downloaded: 0, failed: 0, installed: 0 };
  return (
    <div className={`rounded-lg border p-4 ${dm ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <p className={`text-sm font-semibold mb-3 ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{label} <span className={`font-normal ${dm ? 'text-gray-500' : 'text-gray-400'}`}>({version})</span></p>
      <div className="grid grid-cols-2 gap-2">
        {([
          { l: 'Active', v: data.active, icon: TrendingUp, c: dm ? 'text-blue-400' : 'text-blue-600' },
          { l: 'Downloaded', v: data.downloaded, icon: Download, c: dm ? 'text-green-400' : 'text-green-600' },
          { l: 'Installed', v: data.installed, icon: CheckCircle, c: dm ? 'text-emerald-400' : 'text-emerald-600' },
          { l: 'Failed', v: data.failed, icon: XCircle, c: dm ? 'text-red-400' : 'text-red-600' },
        ]).map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.l} className={`rounded p-2 ${dm ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center gap-1 mb-0.5"><Icon className={`w-3 h-3 ${item.c}`} /><span className={`text-[10px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{item.l}</span></div>
              <p className={`text-sm font-bold ${item.c}`}>{item.v.toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ComparisonTable: React.FC<{ rows: { label: string; left: string; right: string }[]; leftHeader: string; rightHeader: string; darkMode: boolean }> = ({ rows, leftHeader, rightHeader, darkMode: dm }) => (
  <div>
    <div className={`rounded-lg border overflow-hidden ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
      <table className="w-full">
        <thead>
          <tr className={dm ? 'bg-gray-900/50' : 'bg-gray-50'}>
            <th className={`px-4 py-2.5 text-left text-xs font-medium uppercase w-1/4 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Field</th>
            <th className={`px-4 py-2.5 text-center text-xs font-medium uppercase ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{leftHeader}</th>
            <th className={`px-4 py-2.5 text-center text-xs font-medium uppercase ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{rightHeader}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${dm ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {rows.map((row) => {
            const isDiff = row.left !== row.right;
            return (
              <tr key={row.label}>
                <td className={`px-4 py-2.5 text-xs font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{row.label}</td>
                <td className={`px-4 py-2.5 text-xs text-center font-medium ${isDiff ? (dm ? 'text-yellow-400 bg-yellow-900/10' : 'text-yellow-700 bg-yellow-50') : (dm ? 'text-gray-300' : 'text-gray-800')}`}>{row.left}</td>
                <td className={`px-4 py-2.5 text-xs text-center font-medium ${isDiff ? (dm ? 'text-yellow-400 bg-yellow-900/10' : 'text-yellow-700 bg-yellow-50') : (dm ? 'text-gray-300' : 'text-gray-800')}`}>{row.right}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <p className={`mt-2 text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Differences are highlighted in yellow.</p>
  </div>
);
