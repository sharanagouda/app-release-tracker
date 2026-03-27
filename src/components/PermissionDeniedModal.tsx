import React, { useState } from 'react';
import { X, Lock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { requestAccess } from '../services/firebaseUsers';

interface PermissionDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { uid: string; email: string | null; displayName?: string | null } | null;
  darkMode?: boolean;
  action: string; // e.g., "add releases", "edit releases"
}

export const PermissionDeniedModal: React.FC<PermissionDeniedModalProps> = ({
  isOpen,
  onClose,
  user,
  darkMode = false,
  action,
}) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async () => {
    if (!user || !user.email) return;
    setLoading(true);
    setError('');
    try {
      // Use email prefix as display name if not available
      const displayName = user.displayName || user.email.split('@')[0];
      await requestAccess(user.uid, user.email, displayName, action);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl shadow-2xl w-full max-w-md flex flex-col ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`flex items-center justify-between p-5 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Lock className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Access Restricted
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
              }`}>
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Request Sent
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your request has been sent to the administrators. You will be notified when your access is updated.
              </p>
              <button
                onClick={onClose}
                className={`mt-6 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                You do not have permission to {action}.
              </p>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                You are currently a <strong>Viewer</strong>. To perform this action, you need <strong>Editor</strong> or <strong>Admin</strong> access.
              </p>

              {error && (
                <div className={`mb-4 px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                  darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequest}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                    loading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Sending...' : (
                    <>
                      <Send className="w-4 h-4" />
                      Request Access
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
