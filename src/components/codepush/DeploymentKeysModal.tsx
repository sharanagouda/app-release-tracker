import React from 'react';
import { X, Copy, Key } from 'lucide-react';

interface DeploymentKeyEntry {
  name: string;
  key: string;
}

interface DeploymentKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  deploymentKeys: DeploymentKeyEntry[];
  darkMode: boolean;
}

export const DeploymentKeysModal: React.FC<DeploymentKeysModalProps> = ({
  isOpen,
  onClose,
  appName,
  deploymentKeys,
  darkMode,
}) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative z-50 w-full max-w-lg mx-4 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Key className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Deployment Keys
            </h2>
          </div>
          <button onClick={onClose} className={`p-1 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{appName}</p>
          {deploymentKeys.length === 0 ? (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No deployment keys available.
            </p>
          ) : (
            <div className="space-y-3">
              {deploymentKeys.map((dk) => (
                <div
                  key={dk.name}
                  className={`rounded-md border p-3 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{dk.name}</span>
                    <button
                      onClick={() => copyToClipboard(dk.key)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <code className={`text-xs break-all ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{dk.key}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
