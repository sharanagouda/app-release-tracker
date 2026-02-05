import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Release } from '../types/release';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  release: Release | null;
  darkMode?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  release,
  darkMode = false,
}) => {
  if (!isOpen || !release) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-lg shadow-xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              darkMode ? 'bg-red-900/30' : 'bg-red-100'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                darkMode ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Delete Release?
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`text-sm mb-4 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Are you sure you want to delete this release? This action cannot be undone.
          </p>
          
          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="space-y-2">
              <div>
                <span className={`text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Release Name:
                </span>
                <p className={`text-sm font-semibold ${
                  darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {release.releaseName}
                </p>
              </div>
              <div>
                <span className={`text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Environment:
                </span>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {release.environment || release.concept || 'N/A'}
                </p>
              </div>
              <div>
                <span className={`text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Release Date:
                </span>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {new Date(release.releaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`mt-4 p-3 rounded-lg ${
            darkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-xs ${
              darkMode ? 'text-red-300' : 'text-red-700'
            }`}>
              ⚠️ Warning: All rollout history and platform data will be permanently deleted.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end space-x-3 p-6 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Release</span>
          </button>
        </div>
      </div>
    </div>
  );
};