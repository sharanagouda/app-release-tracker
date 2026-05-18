import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { DeploymentHistoryItem } from '../../services/api/interfaces';
import { codePushService } from '../../services/api/CodePushService';

interface RollbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: DeploymentHistoryItem | null;
  appName: string;
  environment: string;
  darkMode: boolean;
  onSuccess: () => void;
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export const RollbackModal: React.FC<RollbackModalProps> = ({
  isOpen,
  onClose,
  deployment,
  appName,
  environment,
  darkMode,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !deployment) return null;

  const dm = darkMode;
  const desc = deployment.description?.replace(/^'+|'+$/g, '') || '';

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      await codePushService.rollbackRelease(appName, environment, deployment.label);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset state after close
        setSuccess(false);
        setError('');
      }, 1500);
    } catch (err: any) {
      console.error('[CodePush] Rollback failed:', err);
      if (err.status === 409) {
        setError('Cannot rollback — there is no previous release to revert to.');
      } else if (err.status === 401) {
        setError('Session expired. Please sign in again.');
      } else {
        setError(err.message || 'Failed to rollback. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative z-50 w-full max-w-md mx-4 rounded-lg shadow-xl ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <RotateCcw className={`w-5 h-5 ${dm ? 'text-red-400' : 'text-red-600'}`} />
            <h2 className={`text-lg font-semibold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
              Rollback Confirmation
            </h2>
          </div>
          <button onClick={onClose} className={`p-1 rounded-md ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className={`w-5 h-5 ${dm ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Warning */}
          <div className={`flex items-start gap-3 p-3 rounded-lg ${dm ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${dm ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <div>
              <p className={`text-sm font-medium ${dm ? 'text-yellow-300' : 'text-yellow-800'}`}>
                This will revert to the previous release
              </p>
              <p className={`text-xs mt-1 ${dm ? 'text-yellow-400/80' : 'text-yellow-700'}`}>
                A new deployment entry will be created that rolls back to the version before this one. Active users will receive the previous release.
              </p>
            </div>
          </div>

          {/* Deployment details */}
          <div className={`rounded-lg border p-4 ${dm ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-base font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                {deployment.label}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                {deployment.appVersion}
              </span>
            </div>

            {desc && (
              <p className={`text-xs font-mono mb-3 leading-relaxed break-all ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                {desc.length > 120 ? desc.substring(0, 120) + '...' : desc}
              </p>
            )}

            <div className={`space-y-1.5 text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex justify-between">
                <span>App</span>
                <span className={`font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{appName}</span>
              </div>
              <div className="flex justify-between">
                <span>Environment</span>
                <span className={`font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{environment}</span>
              </div>
              <div className="flex justify-between">
                <span>Released</span>
                <span className={`font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(deployment.uploadTime)}</span>
              </div>
              <div className="flex justify-between">
                <span>Size</span>
                <span className={`font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{formatBytes(deployment.size)}</span>
              </div>
              <div className="flex justify-between">
                <span>Released By</span>
                <span className={`font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{deployment.releasedBy}</span>
              </div>
              <div className="flex justify-between">
                <span>Mandatory</span>
                <span className={`font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{deployment.isMandatory ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Rollout</span>
                <span className={`font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{deployment.rollout != null ? `${deployment.rollout}%` : '100%'}</span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${dm ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${dm ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${dm ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${dm ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <CheckCircle2 className={`h-4 w-4 ${dm ? 'text-green-400' : 'text-green-600'}`} />
              <p className={`text-sm font-medium ${dm ? 'text-green-400' : 'text-green-700'}`}>Rollback successful!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 px-6 py-4 border-t ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || success}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Rolling back...' : 'Yes, Rollback'}
          </button>
        </div>
      </div>
    </div>
  );
};
