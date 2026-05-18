import React, { useState, useRef, useEffect } from 'react';
import { Zap, Copy, AlertCircle } from 'lucide-react';
import { apiClient, CODEPUSH_SERVER_URL } from '../../services/api/ApiClient';
import { codePushService } from '../../services/api/CodePushService';

interface CodePushLoginProps {
  darkMode: boolean;
  onAuthenticated: (token: string) => void;
  /** If set, shows this as an error on mount (e.g., expired token message) */
  initialError?: string;
}

export const CodePushLogin: React.FC<CodePushLoginProps> = ({ darkMode, onAuthenticated, initialError }) => {
  const [step, setStep] = useState<'signin' | 'token'>('signin');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when entering the token step
  useEffect(() => {
    if (step === 'token') {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [step]);

  const handleSignIn = () => {
    // Open OAuth in popup window
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `${CODEPUSH_SERVER_URL}/auth/login`,
      'codepush-oauth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Move to the token paste step
    setStep('token');
  };

  const handleSubmitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedToken = token.trim();

    if (!trimmedToken) {
      setError('Please enter your access token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Set the token temporarily to validate it
      apiClient.setAccessToken(trimmedToken);

      console.log('[CodePush] Validating token (first 10 chars):', trimmedToken.substring(0, 10) + '...');
      console.log('[CodePush] Token length:', trimmedToken.length);
      console.log('[CodePush] API base URL:', apiClient.getBaseUrl?.() || 'see ApiClient');

      // Validate by making a real API call (get apps list)
      const response = await codePushService.getApps();
      console.log('[CodePush] Token validation SUCCESS - apps response:', response.data);

      // Token is valid — store and notify parent
      localStorage.setItem('codepush_token', trimmedToken);
      onAuthenticated(trimmedToken);
    } catch (err: any) {
      console.error('[CodePush] Token validation FAILED:', err);
      console.error('[CodePush] Error status:', err.status);
      console.error('[CodePush] Error data:', err.data);
      // Clear the invalid token
      apiClient.clearAccessToken();

      if (err.status === 401) {
        setError(
          'Invalid or expired access token (401). ' +
          'Make sure you copied the full access key from the CodePush login page. ' +
          'Try signing in again to get a fresh token.'
        );
      } else if (err.status === 403) {
        setError('Access denied (403). Your account may not have permission.');
      } else {
        setError(err.message || 'Failed to validate token. Please try again.');
      }
      setLoading(false);
    }
  };

  // ─── Sign In Step ───────────────────────────────────────────────────────────
  if (step === 'signin') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              CodePush Dashboard
            </h2>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign in to manage your deployments
            </p>
          </div>

          {/* Card */}
          <div className={`rounded-xl border p-8 shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Error from expired token */}
            {error && (
              <div className={`mb-6 flex items-start gap-2 p-3 rounded-lg ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
              </div>
            )}

            <button
              onClick={handleSignIn}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Sign in with CodePush
            </button>

            {/* Instructions */}
            <div className="mt-6 space-y-3">
              <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                You'll authenticate with GitHub, Microsoft, or Azure AD.
              </p>
              <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Don't have an account? One will be created automatically on first sign-in.
              </p>
            </div>

            {/* Already have a token */}
            <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => { setStep('token'); setError(''); }}
                className={`w-full text-sm font-medium transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                I already have an access token
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Token Paste Step ───────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Complete Sign In
          </h2>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Copy your access token from the popup window
          </p>
        </div>

        <div className={`rounded-xl border p-8 shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Instructions */}
          <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
              How to get your access token:
            </h3>
            <ol className={`text-sm space-y-1 list-decimal list-inside ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
              <li>Complete authentication in the popup window</li>
              <li>Look for the <strong>access token</strong> displayed on the page</li>
              <li>Click the <Copy className="inline h-3 w-3" /> icon or select and copy the entire token</li>
              <li>Paste it below and click Continue</li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitToken} className="space-y-4">
            <div>
              <label
                htmlFor="codepush-token-input"
                className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Access Token
              </label>
              <textarea
                ref={textareaRef}
                id="codepush-token-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your access token here..."
                rows={4}
                className={`w-full rounded-lg border px-4 py-3 text-sm font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode
                    ? 'bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-600 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500'
                }`}
              />
              <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                The token is a long string of characters (usually 60+ characters)
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className={`flex items-start gap-2 p-3 rounded-lg ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!token.trim() || loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Validating token...
                </span>
              ) : (
                'Continue to Dashboard'
              )}
            </button>
          </form>

          {/* Back link */}
          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => { setStep('signin'); setError(''); setToken(''); }}
              className={`w-full text-sm font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
