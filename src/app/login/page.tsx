'use client';

import { Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // Open OAuth in popup window for better UX
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      'https://codepush.landmarkgroup.com/auth/login',
      'codepush-oauth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Navigate to callback page where user will paste token
    router.push('/auth/callback');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header with Logo Placeholder */}
        <div className="text-center mb-8">
          {/* Logo placeholder - replace when logo is ready */}
          <div className="mx-auto w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">CodePush Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your applications
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <button
            onClick={handleLogin}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Sign in with CodePush
          </button>

          {/* Instructions */}
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-600 text-center">
              You&apos;ll authenticate with GitHub, Microsoft, or Azure AD.
            </p>
            <p className="text-xs text-gray-500 text-center">
              Don&apos;t have an account? One will be created automatically on first sign-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
