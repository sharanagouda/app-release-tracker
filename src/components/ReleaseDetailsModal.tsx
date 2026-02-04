import React from 'react';
import { X, Calendar, Smartphone, Package, Activity, FileText, Clock } from 'lucide-react';
import { Release, PlatformRelease, ConceptRelease } from '../types/release';

interface ReleaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: Release | null;
}

const getStatusColor = (status: ConceptRelease['status']) => {
  switch (status) {
    case 'Complete':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Paused':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Not Started':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRolloutColor = (percentage: number) => {
  if (percentage === 0) return 'bg-gray-400';
  if (percentage < 25) return 'bg-red-400';
  if (percentage < 50) return 'bg-yellow-400';
  if (percentage < 75) return 'bg-blue-400';
  return 'bg-green-400';
};

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'iOS':
      return '🍎';
    case 'Android GMS':
      return '🤖';
    case 'Android HMS':
      return '📱';
    default:
      return '📱';
  }
};

// Helper to get concept releases from platform (handles both old and new format)
const getConceptReleases = (platform: PlatformRelease): ConceptRelease[] => {
  if (platform.conceptReleases && platform.conceptReleases.length > 0) {
    return platform.conceptReleases;
  }
  
  // Old format - migrate on the fly
  return [{
    id: `${platform.platform}-legacy`,
    concepts: platform.concepts || ['All Concepts'],
    version: platform.version || '',
    buildId: platform.buildId || '',
    rolloutPercentage: platform.rolloutPercentage || 0,
    status: platform.status || 'Not Started',
    notes: platform.notes || '',
    buildLink: platform.buildLink || '',
    rolloutHistory: platform.rolloutHistory || []
  }];
};

export const ReleaseDetailsModal: React.FC<ReleaseDetailsModalProps> = ({
  isOpen,
  onClose,
  release,
}) => {
  if (!isOpen || !release) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">
            Release Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Release Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Release Date:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {new Date(release.releaseDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Release Name:</span>
                      <span className="ml-2 text-sm text-gray-900">{release.releaseName}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Environment:</span>
                      <span className="ml-2 text-sm text-gray-900">{release.environment || release.concept}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Created:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {new Date(release.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {new Date(release.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Platform Summary */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Platform Summary</h3>
                <div className="space-y-3">
                  {release.platforms.map((platform, platformIndex) => {
                    const conceptReleases = getConceptReleases(platform);
                    
                    return (
                      <div key={platformIndex} className="space-y-2">
                        {conceptReleases.map((conceptRelease, crIndex) => (
                          <div key={conceptRelease.id} className="flex items-center justify-between p-2 lg:p-3 bg-white rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <span className="text-base lg:text-lg">{getPlatformIcon(platform.platform)}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm lg:text-base font-medium text-gray-900">
                                    {platform.platform}
                                    {conceptReleases.length > 1 && (
                                      <span className="ml-1 text-gray-400">#{crIndex + 1}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs lg:text-sm text-gray-500">{conceptRelease.version}</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {conceptRelease.concepts.slice(0, 3).map((concept, idx) => (
                                    <span key={idx} className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                      {concept}
                                    </span>
                                  ))}
                                  {conceptRelease.concepts.length > 3 && (
                                    <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                      +{conceptRelease.concepts.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs lg:text-sm font-medium text-gray-900">{conceptRelease.rolloutPercentage}%</div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conceptRelease.status)}`}>
                                {conceptRelease.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Platform Information</h3>
            <div className="space-y-6">
              {release.platforms.map((platform, platformIndex) => {
                const conceptReleases = getConceptReleases(platform);
                
                return (
                  <div key={platformIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{getPlatformIcon(platform.platform)}</span>
                      <h4 className="font-semibold text-gray-900 text-lg">{platform.platform}</h4>
                      {conceptReleases.length > 1 && (
                        <span className="text-sm text-gray-500">({conceptReleases.length} releases)</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {conceptReleases.map((conceptRelease, crIndex) => (
                        <div key={conceptRelease.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            {conceptReleases.length > 1 && (
                              <span className="text-sm font-medium text-gray-500">Release #{crIndex + 1}</span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conceptRelease.status)}`}>
                              {conceptRelease.status}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs lg:text-sm font-medium text-gray-700">Version:</span>
                              <span className="ml-2 text-xs lg:text-sm font-mono text-gray-900">{conceptRelease.version}</span>
                            </div>
                            <div>
                              <span className="text-xs lg:text-sm font-medium text-gray-700">Build ID:</span>
                              <span className="ml-2 text-xs lg:text-sm font-mono text-gray-900">{conceptRelease.buildId}</span>
                            </div>
                            <div>
                              <span className="text-xs lg:text-sm font-medium text-gray-700">Concepts:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {conceptRelease.concepts.map((concept, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs lg:text-sm font-medium text-gray-700">Rollout Progress:</span>
                                <span className="text-xs lg:text-sm font-bold text-gray-900">{conceptRelease.rolloutPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${getRolloutColor(conceptRelease.rolloutPercentage)}`}
                                  style={{ width: `${conceptRelease.rolloutPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                            {conceptRelease.rolloutHistory && conceptRelease.rolloutHistory.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-xs font-medium text-gray-700 mb-2">Rollout History:</h5>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {conceptRelease.rolloutHistory.slice(-3).map((entry, historyIndex) => (
                                    <div key={historyIndex} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">{entry.percentage}%</span>
                                        <span className="text-gray-500">
                                          {new Date(entry.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      {entry.notes && (
                                        <div className="text-gray-500 mt-1">{entry.notes}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {conceptRelease.notes && (
                              <div className="mt-3 p-2 bg-white rounded text-xs lg:text-sm text-gray-600">
                                {conceptRelease.notes}
                              </div>
                            )}
                            {conceptRelease.buildLink && (
                              <div className="mt-3">
                                <a href={conceptRelease.buildLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-150 w-full justify-center"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Download Build
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Changes Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Changes & Updates</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-3">
                {release.changes.map((change, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Notes Section */}
          {release.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Notes</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">{release.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};