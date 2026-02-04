import React from 'react';
import { Edit, Trash2, Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Release, PlatformRelease, ConceptRelease } from '../types/release';

interface ReleaseTableProps {
  releases: Release[];
  onEdit: (release: Release) => void;
  onDelete: (id: string) => void;
  onViewDetails: (release: Release) => void;
  isAdmin: boolean;
  onAuthRequired: () => void;
}

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

const getProgressColor = (percentage: number) => {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-blue-500';
  if (percentage >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getStatusBadge = (status: string) => {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  switch (status.toLowerCase()) {
    case 'complete':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'in progress':
    case 'progress':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'paused':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'failed':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'not started':
      return `${baseClasses} bg-gray-100 text-gray-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

// Helper to get concept releases from platform (handles both old and new format)
const getConceptReleases = (platform: PlatformRelease): ConceptRelease[] => {
  // New format - has conceptReleases array
  if (platform.conceptReleases && platform.conceptReleases.length > 0) {
    return platform.conceptReleases;
  }
  
  // Old format - migrate to new format on the fly
  return [{
    id: `${platform.platform}-legacy`,
    concepts: platform.concepts || ['All Concepts'],
    version: platform.version || '',
    buildId: platform.buildId || '',
    rolloutPercentage: platform.rolloutPercentage || 0,
    status: platform.status || 'Not Started',
    notes: platform.notes || '',
    buildLink: platform.buildLink || ''
  }];
};

export const ReleaseTable: React.FC<ReleaseTableProps> = ({
  releases,
  onEdit,
  onDelete,
  onViewDetails,
  isAdmin,
  onAuthRequired
}) => {
  const handleEdit = (release: Release) => {
    if (isAdmin) {
      onEdit(release);
    } else {
      onAuthRequired();
    }
  };

  const handleDelete = (id: string) => {
    if (isAdmin) {
      onDelete(id);
    } else {
      onAuthRequired();
    }
  };

  if (releases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No releases found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or add a new release</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Release Info
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Platform Details
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Platform Progress
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Overall Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {releases.map((release) => {
            const platforms = Array.isArray(release.platforms) ? release.platforms : [];
            
            // Calculate overall status from all concept releases
            let allComplete = true;
            let allPaused = true;
            let hasAnyRelease = false;
            
            platforms.forEach(platform => {
              const conceptReleases = getConceptReleases(platform);
              conceptReleases.forEach(cr => {
                hasAnyRelease = true;
                if (cr.status !== 'Complete') allComplete = false;
                if (cr.status !== 'Paused') allPaused = false;
              });
            });
            
            const overallStatus = !hasAnyRelease ? 'Not Started' : 
                                 allComplete ? 'Complete' : 
                                 allPaused ? 'Paused' : 
                                 'In Progress';

            return (
              <tr 
                key={release.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewDetails(release)}
              >
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {release.releaseName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {release.environment || release.concept}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-4">
                  <div className="space-y-2 min-w-0">
                    {platforms.map((platform, platformIndex) => {
                      const conceptReleases = getConceptReleases(platform);
                      
                      return (
                        <div key={platformIndex} className="space-y-1">
                          {conceptReleases.map((conceptRelease, crIndex) => (
                            <div 
                              key={conceptRelease.id} 
                              className="bg-gray-50 rounded-lg px-2 py-2 flex items-center space-x-2 min-w-0"
                            >
                              <span className="text-lg">{getPlatformIcon(platform.platform)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  {platform.platform}
                                  {conceptReleases.length > 1 && (
                                    <span className="ml-1 text-gray-400">#{crIndex + 1}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  v{conceptRelease.version || 'N/A'} • Build {conceptRelease.buildId || 'N/A'}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {conceptRelease.concepts.map((concept, idx) => (
                                    <span 
                                      key={idx}
                                      className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                                    >
                                      {concept}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-3 min-w-0">
                    {platforms.map((platform, platformIndex) => {
                      const conceptReleases = getConceptReleases(platform);
                      
                      return (
                        <div key={platformIndex} className="space-y-2">
                          {conceptReleases.map((conceptRelease, crIndex) => (
                            <div key={conceptRelease.id} className="flex flex-col space-y-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">{getPlatformIcon(platform.platform)}</span>
                                  <span className="text-xs font-medium text-gray-700 truncate min-w-0">
                                    {platform.platform}
                                    {conceptReleases.length > 1 && (
                                      <span className="ml-1 text-gray-400">#{crIndex + 1}</span>
                                    )}
                                  </span>
                                </div>
                                <span className={getStatusBadge(conceptRelease.status)}>
                                  {conceptRelease.status === 'In Progress' ? 'Progress' : conceptRelease.status}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(conceptRelease.rolloutPercentage)}`}
                                    style={{ width: `${conceptRelease.rolloutPercentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-900 min-w-[30px] text-right flex-shrink-0">
                                  {conceptRelease.rolloutPercentage}%
                                </span>
                              </div>
                              {/* Show concepts for this release */}
                              {conceptReleases.length > 1 && (
                                <div className="text-xs text-gray-500 truncate ml-6">
                                  {conceptRelease.concepts.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className={getStatusBadge(overallStatus)}>
                    {overallStatus}
                  </span>
                </td>

                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails(release)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(release)}
                      className={`p-1 rounded transition-colors ${
                        isAdmin 
                          ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={isAdmin ? "Edit Release" : "Admin access required"}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(release.id)}
                      className={`p-1 rounded transition-colors ${
                        isAdmin 
                          ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={isAdmin ? "Delete Release" : "Admin access required"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};