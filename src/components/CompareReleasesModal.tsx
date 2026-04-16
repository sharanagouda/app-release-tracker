import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, FileText, Package, ListChecks } from 'lucide-react';
import { Release, PlatformRelease } from '../types/release';
import { getConceptReleases, ConceptReleaseData } from '../utils/conceptReleases';
import { TagBadge } from './TagInput';
import { LinkifyText } from './LinkifyText';

interface CompareReleasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  releases: Release[];
  darkMode?: boolean;
}

const getStatusColor = (status: string, darkMode: boolean = false) => {
  switch (status) {
    case 'Complete':
      return darkMode
        ? 'bg-green-900/30 text-green-300 border-green-700'
        : 'bg-green-100 text-green-800 border-green-200';
    case 'In Progress':
      return darkMode
        ? 'bg-blue-900/30 text-blue-300 border-blue-700'
        : 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Paused':
      return darkMode
        ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
        : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Not Started':
      return darkMode
        ? 'bg-gray-700 text-gray-300 border-gray-600'
        : 'bg-gray-100 text-gray-800 border-gray-200';
    case 'On Hold':
      return darkMode
        ? 'bg-orange-900/30 text-orange-300 border-orange-700'
        : 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return darkMode
        ? 'bg-gray-700 text-gray-300 border-gray-600'
        : 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRolloutColor = (percentage: number) => {
  if (percentage === 0) return 'bg-gray-400';
  if (percentage < 25) return 'bg-red-400';
  if (percentage < 50) return 'bg-yellow-400';
  if (percentage < 75) return 'bg-blue-400';
  return 'bg-green-400';
};

interface PlatformCardProps {
  platform: PlatformRelease;
  releaseIndex: 1 | 2;
  isDifferent: boolean;
  darkMode: boolean;
  otherPlatform?: PlatformRelease;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  releaseIndex,
  isDifferent,
  darkMode,
  otherPlatform
}) => {
  const conceptReleases = getConceptReleases(platform);
  const otherConceptReleases = otherPlatform ? getConceptReleases(otherPlatform) : [];
  
  const textColor = releaseIndex === 1 
    ? (isDifferent ? (darkMode ? 'text-red-300' : 'text-red-600') : '')
    : (isDifferent ? (darkMode ? 'text-green-300' : 'text-green-600') : '');
  
  const bgColor = releaseIndex === 1 
    ? (isDifferent ? (darkMode ? 'bg-red-900/20' : 'bg-red-50') : (darkMode ? 'bg-gray-700/50' : 'bg-gray-50'))
    : (isDifferent ? (darkMode ? 'bg-green-900/20' : 'bg-green-50') : (darkMode ? 'bg-gray-700/50' : 'bg-gray-50'));

  return (
    <div className={`border-2 rounded-lg p-3 ${bgColor} ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
      <div className={`font-semibold text-sm sm:text-base mb-2 sm:mb-3 ${textColor}`}>
        {platform.platform}
        {isDifferent && <span className="ml-2 text-xs font-normal">{releaseIndex === 1 ? '(Release 1)' : '(Release 2)'}</span>}
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {conceptReleases.map((cr, crIndex) => {
          const otherCr = otherConceptReleases[crIndex];
          const isCrDifferent = otherCr && (
            cr.version !== otherCr.version ||
            cr.buildId !== otherCr.buildId ||
            cr.status !== otherCr.status ||
            cr.rolloutPercentage !== otherCr.rolloutPercentage
          );
          
          return (
            <div key={cr.id || crIndex} className={`flex items-start justify-between gap-2 ${isCrDifferent ? 'p-2 rounded' : ''}`}>
              {conceptReleases.length > 1 && (
                <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  #{crIndex + 1}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-xs sm:text-sm font-medium ${textColor}`}>
                  {cr.version} - {cr.buildId}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {cr.concepts?.join(', ') || 'All Concepts'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(cr.status, darkMode)}`}>
                    {cr.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className={`w-16 h-1.5 rounded-full ${getRolloutColor(cr.rolloutPercentage)}`} />
                    <span className={`text-xs font-medium ${textColor}`}>{cr.rolloutPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {conceptReleases.length === 0 && (
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No concept releases
          </div>
        )}
      </div>
    </div>
  );
};

export const CompareReleasesModal: React.FC<CompareReleasesModalProps> = ({
  isOpen,
  onClose,
  releases,
  darkMode = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const toggleRelease = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
    setShowComparison(false);
  };

  if (!isOpen) return null;

  const r1 = releases.find((r) => r.id === selectedIds[0]);
  const r2 = releases.find((r) => r.id === selectedIds[1]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-6xl my-4 max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h2 className="text-lg font-semibold">Compare Releases</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {!showComparison ? (
            <>
              <p className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select exactly 2 releases to compare:
              </p>
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                {releases.map((release) => {
                  const isSelected = selectedIds.includes(release.id);
                  const isDisabled = !isSelected && selectedIds.length >= 2;
                  return (
                    <button
                      key={release.id}
                      onClick={() => toggleRelease(release.id)}
                      disabled={isDisabled}
                      className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                        isSelected
                          ? darkMode
                            ? 'bg-purple-900/30 border-purple-500'
                            : 'bg-purple-50 border-purple-500'
                          : isDisabled
                          ? darkMode
                            ? 'bg-gray-800/50 border-gray-700 opacity-50'
                            : 'bg-gray-50 border-gray-200 opacity-50'
                          : darkMode
                          ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-400'
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{release.releaseName}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {release.environment} • {release.releaseDate}
                        </div>
                      </div>
                      {release.tags && release.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {release.tags.slice(0, 2).map(tag => (
                            <TagBadge key={tag} tag={tag} darkMode={darkMode} size="xs" />
                          ))}
                          {release.tags.length > 2 && (
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>+{release.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowComparison(false)}
                  className={`text-sm hover:underline ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  ← Back to selection
                </button>
              </div>

              {/* Comparison View - Same layout as ReleaseDetailsModal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Release 1 Column */}
                <div className="space-y-6">
                  {/* Release Information - Release 1 */}
                  <div className={`rounded-lg p-4 sm:p-6 ${
                    darkMode 
                      ? 'bg-blue-900/20 border border-blue-800/50' 
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {r1?.releaseName}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Release Date:
                        </span>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {r1 ? new Date(r1.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Environment:
                        </span>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {r1?.environment}
                        </span>
                      </div>
                      {r1?.tags && r1.tags.length > 0 && (
                        <div className="flex items-start gap-2 mt-2">
                          <span className={`text-xs sm:text-sm font-medium flex-shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Tags:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {r1.tags.map(tag => (
                              <TagBadge key={tag} tag={tag} darkMode={darkMode} size="xs" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Platform Summary - Release 1 */}
                  <div className={`rounded-lg p-4 sm:p-6 ${
                    darkMode 
                      ? 'bg-purple-900/20 border border-purple-800/50' 
                      : 'bg-gradient-to-r from-purple-50 to-pink-50'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Platform Summary
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {r1?.platforms.map((platform, idx) => {
                        const r2Platform = r2?.platforms.find(p => p.platform === platform.platform);
                        const isDifferent = !r2Platform || 
                          JSON.stringify(platform.conceptReleases) !== JSON.stringify(r2Platform.conceptReleases);
                        
                        return (
                          <PlatformCard
                            key={idx}
                            platform={platform}
                            releaseIndex={1}
                            isDifferent={isDifferent}
                            darkMode={darkMode}
                            otherPlatform={r2Platform}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Changes - Release 1 */}
                  {r1 && (r1.changes?.length > 0 || r1.notes) && (
                    <div className={`rounded-lg p-4 sm:p-6 ${
                      darkMode 
                        ? 'bg-green-900/20 border border-green-800/50' 
                        : 'bg-gradient-to-r from-green-50 to-emerald-50'
                    }`}>
                      <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Changes & Updates
                      </h3>
                      {r1.changes && r1.changes.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 mb-3">
                          {r1.changes.map((change, idx) => (
                            <li key={idx} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <LinkifyText text={change} darkMode={darkMode} />
                            </li>
                          ))}
                        </ul>
                      )}
                      {r1.notes && (
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className="font-medium">Notes:</span> {r1.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Release 2 Column */}
                <div className="space-y-6">
                  {/* Release Information - Release 2 */}
                  <div className={`rounded-lg p-4 sm:p-6 ${
                    darkMode 
                      ? 'bg-blue-900/20 border border-blue-800/50' 
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {r2?.releaseName}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Release Date:
                        </span>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {r2 ? new Date(r2.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Environment:
                        </span>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {r2?.environment}
                        </span>
                      </div>
                      {r2?.tags && r2.tags.length > 0 && (
                        <div className="flex items-start gap-2 mt-2">
                          <span className={`text-xs sm:text-sm font-medium flex-shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Tags:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {r2.tags.map(tag => (
                              <TagBadge key={tag} tag={tag} darkMode={darkMode} size="xs" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Platform Summary - Release 2 */}
                  <div className={`rounded-lg p-4 sm:p-6 ${
                    darkMode 
                      ? 'bg-purple-900/20 border border-purple-800/50' 
                      : 'bg-gradient-to-r from-purple-50 to-pink-50'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Platform Summary
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {r2?.platforms.map((platform, idx) => {
                        const r1Platform = r1?.platforms.find(p => p.platform === platform.platform);
                        const isDifferent = !r1Platform || 
                          JSON.stringify(platform.conceptReleases) !== JSON.stringify(r1Platform.conceptReleases);
                        
                        return (
                          <PlatformCard
                            key={idx}
                            platform={platform}
                            releaseIndex={2}
                            isDifferent={isDifferent}
                            darkMode={darkMode}
                            otherPlatform={r1Platform}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Changes - Release 2 */}
                  {r2 && (r2.changes?.length > 0 || r2.notes) && (
                    <div className={`rounded-lg p-4 sm:p-6 ${
                      darkMode 
                        ? 'bg-green-900/20 border border-green-800/50' 
                        : 'bg-gradient-to-r from-green-50 to-emerald-50'
                    }`}>
                      <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Changes & Updates
                      </h3>
                      {r2.changes && r2.changes.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 mb-3">
                          {r2.changes.map((change, idx) => (
                            <li key={idx} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <LinkifyText text={change} darkMode={darkMode} />
                            </li>
                          ))}
                        </ul>
                      )}
                      {r2.notes && (
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className="font-medium">Notes:</span> {r2.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`flex justify-end gap-3 px-5 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              darkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Close
          </button>
          {selectedIds.length === 2 && !showComparison && (
            <button
              onClick={() => setShowComparison(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Compare Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};