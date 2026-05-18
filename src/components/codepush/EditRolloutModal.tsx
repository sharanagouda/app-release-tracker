import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Settings, RotateCcw, CheckCircle2 } from 'lucide-react';
import { DeploymentHistoryItem } from '../../services/api/interfaces';
import { codePushService } from '../../services/api/CodePushService';
import { RollbackModal } from './RollbackModal';

interface EditRolloutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: DeploymentHistoryItem | null;
  appName: string;
  environment: string;
  darkMode: boolean;
  onSuccess: () => void;
}

const ROLLOUT_PRESETS = [10, 25, 50, 75, 100];

export const EditRolloutModal: React.FC<EditRolloutModalProps> = ({
  isOpen,
  onClose,
  deployment,
  appName,
  environment,
  darkMode,
  onSuccess,
}) => {
  // Form state
  const [rollout, setRollout] = useState(100);
  const [isMandatory, setIsMandatory] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [description, setDescription] = useState('');
  const [targetBinaryVersion, setTargetBinaryVersion] = useState('');

  const [loading, setLoading] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && deployment) {
      setRollout(deployment.rollout ?? 100);
      setIsMandatory(deployment.isMandatory);
      setIsDisabled(deployment.isDisabled);
      setDescription(deployment.description?.replace(/^'+|'+$/g, '') || '');
      setTargetBinaryVersion(deployment.appVersion);
      setError('');
      setSuccess('');
    }
  }, [isOpen, deployment]);

  if (!isOpen || !deployment) return null;

  const currentRollout = deployment.rollout ?? 100;

  // Check what changed
  const changes: string[] = [];
  if (rollout !== currentRollout) changes.push('rollout');
  if (isMandatory !== deployment.isMandatory) changes.push('mandatory');
  if (isDisabled !== deployment.isDisabled) changes.push('disabled');
  const cleanDesc = deployment.description?.replace(/^'+|'+$/g, '') || '';
  if (description !== cleanDesc) changes.push('description');
  if (targetBinaryVersion !== deployment.appVersion) changes.push('targetBinaryVersion');
  const hasChanges = changes.length > 0;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const options: Record<string, unknown> = { label: deployment.label };

      if (rollout !== currentRollout) options.rollout = rollout;
      if (isMandatory !== deployment.isMandatory) options.isMandatory = isMandatory;
      if (isDisabled !== deployment.isDisabled) options.isDisabled = isDisabled;
      if (description !== cleanDesc) options.description = description;
      if (targetBinaryVersion !== deployment.appVersion) options.appVersion = targetBinaryVersion;

      await codePushService.updateRelease(appName, environment, options);

      setSuccess('Deployment updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('[CodePush] Update failed:', err);
      if (err.status === 409) {
        setError('Conflict: Rollout can only be increased. Set to 100% to complete.');
      } else if (err.status === 401) {
        setError('Session expired. Please sign in again.');
      } else {
        setError(err.message || 'Failed to update deployment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRollbackSuccess = () => {
    setShowRollbackModal(false);
    onSuccess();
    onClose();
  };

  const dm = darkMode;
  const inputClass = `w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    dm ? 'bg-gray-900 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const labelClass = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative z-50 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Settings className={`w-5 h-5 ${dm ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-lg font-semibold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
              Edit Deployment
            </h2>
          </div>
          <button onClick={onClose} className={`p-1 rounded-md ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className={`w-5 h-5 ${dm ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="px-6 py-5 space-y-5">
          {/* Deployment info header */}
          <div className={`rounded-lg p-3 ${dm ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{deployment.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>{deployment.appVersion}</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                deployment.isDisabled
                  ? (dm ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                  : (dm ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
              }`}>{deployment.isDisabled ? 'Disabled' : 'Active'}</span>
            </div>
            <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{appName} — {environment}</p>
          </div>

          {/* ── Rollout ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass + ' mb-0'}>Rollout Percentage</label>
              {currentRollout >= 100 ? (
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${dm ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                  Fully rolled out
                </span>
              ) : (
                <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                  Current: {currentRollout}%
                </span>
              )}
            </div>
            {currentRollout >= 100 ? (
              <>
                {/* Rollout complete — show disabled state */}
                <div className={`flex gap-2 mb-2 opacity-40 pointer-events-none`}>
                  {ROLLOUT_PRESETS.map((preset) => (
                    <div key={preset} className={`flex-1 py-2 text-sm font-medium rounded-lg text-center ${dm ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                      {preset}%
                    </div>
                  ))}
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-green-500" style={{ width: '100%' }} />
                </div>
              </>
            ) : (
              <>
                {/* Rollout in progress — only allow increasing */}
                <div className="flex gap-2 mb-2">
                  {ROLLOUT_PRESETS.map((preset) => {
                    const isBelowCurrent = preset < currentRollout;
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={isBelowCurrent}
                        onClick={() => setRollout(preset)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          rollout === preset
                            ? 'bg-blue-600 text-white'
                            : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {preset}%
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={currentRollout}
                    max={100}
                    value={rollout}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= currentRollout && val <= 100) setRollout(val);
                    }}
                    className={inputClass}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>%</span>
                </div>
                {/* Progress bar */}
                <div className={`mt-2 w-full h-2 rounded-full overflow-hidden ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {/* Current rollout portion (dimmer) */}
                  <div className="h-full rounded-full transition-all duration-300 relative" style={{ width: `${rollout}%` }}>
                    <div className={`absolute inset-y-0 left-0 rounded-full ${dm ? 'bg-blue-800' : 'bg-blue-200'}`} style={{ width: `${(currentRollout / Math.max(rollout, 1)) * 100}%` }} />
                    <div className="absolute inset-y-0 rounded-full bg-blue-500" style={{ left: `${(currentRollout / Math.max(rollout, 1)) * 100}%`, right: 0 }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{currentRollout}%</span>
                  <span className={`text-[10px] font-medium ${dm ? 'text-blue-400' : 'text-blue-600'}`}>{rollout}%</span>
                </div>
              </>
            )}
          </div>

          {/* ── Mandatory ── */}
          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Mandatory</label>
              <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Force users to update immediately</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMandatory(!isMandatory)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isMandatory ? 'bg-blue-600' : (dm ? 'bg-gray-600' : 'bg-gray-300')
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMandatory ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* ── Disabled ── */}
          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Disabled</label>
              <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Prevent this release from being installed</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDisabled(!isDisabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDisabled ? 'bg-red-600' : (dm ? 'bg-gray-600' : 'bg-gray-300')
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDisabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* ── Target Binary Version ── */}
          <div>
            <label className={labelClass}>Target Binary Version</label>
            <input
              type="text"
              value={targetBinaryVersion}
              onChange={(e) => setTargetBinaryVersion(e.target.value)}
              placeholder="e.g., 10.46.5, >=1.0.0"
              className={inputClass}
            />
            <p className={`mt-1 text-xs ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
              Semver expression for compatible app versions
            </p>
          </div>

          {/* ── Description ── */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Release notes..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${dm ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${dm ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${dm ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}
          {success && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${dm ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <CheckCircle2 className={`h-4 w-4 ${dm ? 'text-green-400' : 'text-green-600'}`} />
              <p className={`text-sm font-medium ${dm ? 'text-green-400' : 'text-green-700'}`}>{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className={`flex gap-3 pt-2 border-t ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Rollback button — left side */}
            {!deployment.isDisabled && deployment.releaseMethod !== 'Rollback' && (
              <button
                type="button"
                onClick={() => setShowRollbackModal(true)}
                disabled={!!success}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  dm
                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-700'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rollback
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Cancel + Update — right side */}
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasChanges || loading || !!success}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : `Update${changes.length > 0 ? ` (${changes.length})` : ''}`}
            </button>
          </div>
        </form>

        {/* Rollback confirmation modal */}
        <RollbackModal
          isOpen={showRollbackModal}
          onClose={() => setShowRollbackModal(false)}
          deployment={deployment}
          appName={appName}
          environment={environment}
          darkMode={darkMode}
          onSuccess={handleRollbackSuccess}
        />
      </div>
    </div>
  );
};
