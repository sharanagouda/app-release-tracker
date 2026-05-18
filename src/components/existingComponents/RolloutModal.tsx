'use client';

import { useState } from 'react';
import { X, TrendingUp, AlertCircle } from 'lucide-react';

interface RolloutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (percentage: number) => Promise<void>;
  currentRollout?: number;
  releaseLabel: string;
  appName: string;
  deploymentName: string;
}

export default function RolloutModal({
  isOpen,
  onClose,
  onConfirm,
  currentRollout,
  releaseLabel,
  appName,
  deploymentName,
}: RolloutModalProps) {
  const [percentage, setPercentage] = useState<string>(
    currentRollout ? String(Math.min(currentRollout + 25, 100)) : '100'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPercentage = currentRollout || 0;
  const targetPercentage = parseInt(percentage);
  const isValid = !isNaN(targetPercentage) && targetPercentage > currentPercentage && targetPercentage <= 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError(`Rollout must be greater than ${currentPercentage}% and at most 100%`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(targetPercentage);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rollout');
    } finally {
      setIsLoading(false);
    }
  };

  const quickPercentages = [25, 50, 75, 100].filter(p => p > currentPercentage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Increase Rollout</h2>
              <p className="text-xs text-gray-500">{releaseLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* App Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">App</p>
                  <p className="font-medium text-gray-900 truncate">{appName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Deployment</p>
                  <p className="font-medium text-gray-900">{deploymentName}</p>
                </div>
              </div>
            </div>

            {/* Current Rollout */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <span className="text-sm font-medium text-gray-700">Current Rollout</span>
              <span className="text-lg font-bold text-gray-900">{currentPercentage}%</span>
            </div>

            {/* Target Percentage Input */}
            <div>
              <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-2">
                New Rollout Percentage
              </label>
              <input
                id="percentage"
                type="number"
                min={currentPercentage + 1}
                max={100}
                value={percentage}
                onChange={(e) => {
                  setPercentage(e.target.value);
                  setError(null);
                }}
                className={`w-full rounded-lg border px-4 py-2.5 text-lg font-semibold text-center focus:outline-none focus:ring-2 transition-all ${
                  isValid
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                }`}
                placeholder="Enter percentage"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Must be between {currentPercentage + 1}% and 100%
              </p>
            </div>

            {/* Quick Select Buttons */}
            {quickPercentages.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Quick Select</p>
                <div className="flex gap-2">
                  {quickPercentages.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPercentage(String(p));
                        setError(null);
                      }}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                        percentage === String(p)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Increasing rollout will make this release available to more users. 
                This change cannot be reverted.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : `Update to ${percentage}%`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
