'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Copy } from 'lucide-react';
import { useAppDispatch } from '@/src/lib/store/hooks';
import { setAuth } from '@/src/lib/store/authSlice';
import { authService } from '@/src/services/api/AuthService';
import { apiClient } from '@/src/services/api/ApiClient';

export default function CallbackPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const trimmedToken = token.trim();

      if (!trimmedToken) {
        throw new Error('Please enter your access token');
      }

      // Validate token (will bypass CORS errors)
      const isValid = await authService.validateToken(trimmedToken);
      if (!isValid) {
        throw new Error('Invalid or expired access token. Please try again.');
      }

      // Get user info (will return mock data on CORS errors)
      const user = await authService.getAccountInfo(trimmedToken);

      // Store token in localStorage
      localStorage.setItem('codepush_token', trimmedToken);

      // Set token in API client
      apiClient.setAccessToken(trimmedToken);

      // Update Redux state
      dispatch(setAuth({ user, token: trimmedToken }));

      // Redirect to dashboard
      router.push('/');
    } catch (err: any) {
      // On CORS/network errors, we still redirect (they're handled in authService)
      // Only show error for actual validation failures
      console.error('Callback error:', err);
      setError(err.message || 'Failed to validate token. Please try again.');
      
      // Give user time to read error before redirecting
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Sign In</h1>
          <p className="mt-2 text-sm text-gray-600">
            Copy your access token from the popup window
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              📋 How to get your access token:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Complete authentication in the popup window</li>
              <li>
                Look for the <strong>access token</strong> displayed on the page
              </li>
              <li>
                Click the <Copy className="inline h-3 w-3" /> icon or select and copy the
                entire token
              </li>
              <li>Paste it in the field below and click Continue</li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="token-input"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Access Token
              </label>
              <textarea
                ref={textareaRef}
                id="token-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your access token here..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                aria-describedby="token-help"
              />
              <p id="token-help" className="mt-1 text-xs text-gray-500">
                The token is a long string of characters (usually 60+ characters)
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!token.trim() || loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Validating...
                </span>
              ) : (
                'Continue to Dashboard'
              )}
            </button>
          </form>

          {/* Help section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Having trouble? Make sure you&apos;ve completed the authentication in the popup
              window. The token should be a long string of random characters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
