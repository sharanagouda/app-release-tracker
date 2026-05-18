import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { Release } from '../types/release';
import { getRelease } from '../services/firebaseReleases';
import { ReleaseDetailsModal } from '../components/ReleaseDetailsModal';
import { ActivityLogModal } from '../components/ActivityLogModal';
import { useAppContext } from '../contexts/AppContext';

export const ReleaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { darkMode, user, isAdmin, teamsGroups, releases } = useAppContext();

  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  // First try to find release from the already-loaded releases (real-time),
  // then fall back to a one-shot fetch by ID.
  useEffect(() => {
    if (!id) {
      setError('No release ID provided');
      setLoading(false);
      return;
    }

    const fromCache = releases.find((r) => r.id === id);
    if (fromCache) {
      setRelease(fromCache);
      setLoading(false);
      return;
    }

    // Fallback: fetch from Firestore directly
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getRelease(id);
        if (data) {
          setRelease(data);
        } else {
          setError('Release not found');
        }
      } catch (err) {
        setError('Failed to load release');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, releases]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <svg
            className={`animate-spin h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
            viewBox="0 0 24 24"
          >
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
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading release...
          </span>
        </div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="text-center py-20">
        <h2
          className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
        >
          {error || 'Release not found'}
        </h2>
        <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          The release you're looking for doesn't exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/releases')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Releases
        </button>
      </div>
    );
  }

  // Build a CodePush deep link from the release version (for "View in CodePush" button)
  // We try to match version to codepush by looking at the first concept release version
  const firstPlatform = release.platforms?.[0];
  const firstCr = firstPlatform?.conceptReleases?.[0];
  const codePushVersion = firstCr?.version;
  const codePushLink = codePushVersion
    ? `/codepush?version=${encodeURIComponent(codePushVersion)}`
    : null;

  return (
    <div>
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/releases')}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            darkMode
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Releases
        </button>

        {codePushLink && (
          <Link
            to={codePushLink}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode
                ? 'text-yellow-300 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-800'
                : 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            View CodePush for v{codePushVersion}
          </Link>
        )}
      </div>

      {/* Render the existing ReleaseDetailsModal as an inline panel (always open) */}
      <ReleaseDetailsModal
        isOpen={true}
        onClose={() => navigate('/releases')}
        release={release}
        darkMode={darkMode}
        currentUserEmail={user?.email || undefined}
        isAdmin={isAdmin}
        teamsGroups={teamsGroups}
        onViewActivityLog={() => setIsActivityLogOpen(true)}
        onRequestPermission={() => {}}
      />

      <ActivityLogModal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        releaseId={release.id}
        releaseName={release.releaseName}
        darkMode={darkMode}
      />
    </div>
  );
};
