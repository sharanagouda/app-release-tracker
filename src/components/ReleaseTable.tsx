import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Release, PlatformRelease, ConceptRelease } from '../types/release';

interface ReleaseTableProps {
  releases: Release[];
  onEdit: (release: Release) => void;
  onDelete: (release: Release) => void; // Change from (id: string) => void
  onViewDetails: (release: Release) => void;
  isAdmin: boolean;
  onAuthRequired: (action: string) => void;
  darkMode?: boolean;
}


const getProgressColor = (percentage: number) => {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-blue-500';
  if (percentage >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getStatusBadge = (status: string, darkMode: boolean = false) => {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  const normalizedStatus = status.toLowerCase();
  
  if (darkMode) {
    switch (normalizedStatus) {
      case 'complete':
        return `${baseClasses} bg-green-900/30 text-green-300`;
      case 'in progress':
      case 'progress':
        return `${baseClasses} bg-blue-900/30 text-blue-300`;
      case 'paused':
        return `${baseClasses} bg-yellow-900/30 text-yellow-300`;
      case 'failed':
        return `${baseClasses} bg-red-900/30 text-red-300`;
      case 'not started':
        return `${baseClasses} bg-gray-700/50 text-gray-300`;
      default:
        return `${baseClasses} bg-gray-700/50 text-gray-300`;
    }
  }
  
  switch (normalizedStatus) {
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
  onAuthRequired,
  darkMode = false
}) => {
const handleEdit = (release: Release) => {
  if (isAdmin) {
    onEdit(release);
  } else {
    onAuthRequired('edit this release');
  }
};

const handleDelete = (release: Release) => {
  if (isAdmin) {
    onDelete(release);
  } else {
    onAuthRequired('delete this release');
  }
};

  if (releases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No releases found
        </p>
        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Try adjusting your filters or add a new release
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full border rounded-lg shadow-sm ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}>
          <tr>
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Release Info
            </th>
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Platform Details
            </th>
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Platform Progress
            </th>
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Overall Status
            </th>
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${
          darkMode 
            ? 'bg-gray-800 divide-gray-700' 
            : 'bg-white divide-gray-200'
        }`}>
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
                className={`transition-colors cursor-pointer ${
                  darkMode 
                    ? 'hover:bg-gray-700/50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onViewDetails(release)}
              >
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <div className={`text-sm font-medium ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {release.releaseName}
                    </div>
                    <div className={`text-xs mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {release.environment || release.concept}
                    </div>
                    <div className={`text-xs mt-1 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-4">
                  <div className="space-y-2 min-w-0">
                    {platforms.map((platform, platformIndex) => {
                      const conceptReleases = getConceptReleases(platform);
                      const hasMultipleReleases = conceptReleases.length > 1;
                      
                      return (
                        <div 
                          key={platformIndex} 
                          className={`rounded-lg px-3 py-2.5 ${
                            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {conceptReleases.map((conceptRelease, crIndex) => (
                                <div key={conceptRelease.id}>
                                  <div className={`text-sm font-medium ${
                                    darkMode ? 'text-gray-200' : 'text-gray-900'
                                  }`}>
                                    {platform.platform}
                                    {hasMultipleReleases && (
                                      <span className={`ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        #{crIndex + 1}
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-xs ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    v{conceptRelease.version || 'N/A'} - Build {conceptRelease.buildId || 'N/A'}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {conceptRelease.concepts.map((concept, idx) => (
                                      <span 
                                        key={idx}
                                        className={`inline-block px-1.5 py-0.5 text-xs rounded ${
                                          darkMode 
                                            ? 'bg-blue-900/40 text-blue-300' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}
                                      >
                                        {concept}
                                      </span>
                                    ))}
                                  </div>
                                  {hasMultipleReleases && crIndex < conceptReleases.length - 1 && (
                                    <div className={`my-2 border-t ${
                                      darkMode ? 'border-gray-600' : 'border-gray-200'
                                    }`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-3 min-w-0">
                    {platforms.map((platform, platformIndex) => {
                      const conceptReleases = getConceptReleases(platform);
                      const hasMultipleReleases = conceptReleases.length > 1;
                      
                      return (
                        <div key={platformIndex} className="space-y-2">
                          {conceptReleases.map((conceptRelease, crIndex) => (
                            <div key={conceptRelease.id} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm font-medium ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    {platform.platform}
                                    {hasMultipleReleases && (
                                      <span className={`ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        #{crIndex + 1}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <span className={getStatusBadge(conceptRelease.status, darkMode)}>
                                  {conceptRelease.status === 'In Progress' ? 'Progress' : conceptRelease.status}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className={`flex-1 rounded-full h-2 ${
                                  darkMode ? 'bg-gray-600' : 'bg-gray-200'
                                }`}>
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(conceptRelease.rolloutPercentage)}`}
                                    style={{ width: `${conceptRelease.rolloutPercentage}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-medium min-w-[35px] text-right ${
                                  darkMode ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                  {conceptRelease.rolloutPercentage}%
                                </span>
                              </div>
                              
                              {hasMultipleReleases && (
                                <div className={`text-xs ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
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
                  <span className={getStatusBadge(overallStatus, darkMode)}>
                    {overallStatus}
                  </span>
                </td>

                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails(release)}
                      className={`p-1 rounded transition-colors ${
                        darkMode
                          ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                      }`}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(release)}
                      className={`p-1 rounded transition-colors ${
                        isAdmin 
                          ? darkMode
                            ? 'text-green-400 hover:text-green-300 hover:bg-green-900/30'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          : darkMode
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={isAdmin ? "Edit Release" : "Admin access required"}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(release)}
                      className={`p-1 rounded transition-colors ${
                        isAdmin 
                          ? darkMode
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                            : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                          : darkMode
                            ? 'text-gray-600 cursor-not-allowed'
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