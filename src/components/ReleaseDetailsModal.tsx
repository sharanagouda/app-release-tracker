import React, { useState } from 'react';
import { X, Calendar, Package, FileText, Clock, ListChecks, Mail, Share2, Copy, Check } from 'lucide-react';
import { Release, PlatformRelease, ConceptRelease } from '../types/release';
import { TagBadge } from './TagInput';

interface ReleaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: Release | null;
  darkMode?: boolean;
  currentUserEmail?: string;
}

const getStatusColor = (status: ConceptRelease['status'], darkMode: boolean = false) => {
  switch (status) {
    case 'Complete':
      return darkMode
        ? 'bg-green-900/30 text-green-300 border-green-700'
        : 'bg-green-100 text-green-800 border-green-200';
    case 'In Progress':
      return darkMode
        ? 'bg-blue-900/30 text-blue-300 border-blue-700'
        : 'bg-blue-100 text-blue-800 border-blue-200';
    case 'On Hold':
      return darkMode
        ? 'bg-orange-900/30 text-orange-300 border-orange-700'
        : 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Not Started':
      return darkMode
        ? 'bg-gray-700 text-gray-300 border-gray-600'
        : 'bg-gray-100 text-gray-800 border-gray-200';
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

// Generate a plain-text email body from a release
const generateEmailContent = (release: Release): { subject: string; body: string } => {
  const releaseDate = new Date(release.releaseDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Release Update: ${release.releaseName} — ${releaseDate}`;

  let body = `Release: ${release.releaseName}\n`;
  body += `Date: ${releaseDate}\n`;
  body += `Environment: ${release.environment || release.concept || 'N/A'}\n`;
  body += `\n${'─'.repeat(50)}\n\n`;

  // Platform details
  body += `PLATFORM DETAILS\n${'─'.repeat(50)}\n\n`;
  release.platforms.forEach((platform) => {
    const conceptReleases = getConceptReleases(platform);
    body += `▸ ${platform.platform}\n`;
    conceptReleases.forEach((cr) => {
      const concepts = cr.concepts?.join(', ') || 'All Concepts';
      body += `  Concepts: ${concepts}\n`;
      body += `  Version: ${cr.version || 'N/A'}  |  Build: ${cr.buildId || 'N/A'}\n`;
      body += `  Rollout: ${cr.rolloutPercentage}%  |  Status: ${cr.status}\n`;
      if (cr.buildLink) body += `  Build Link: ${cr.buildLink}\n`;
      if (cr.notes) body += `  Notes: ${cr.notes}\n`;
      if (cr.versionChanges && cr.versionChanges.length > 0) {
        body += `  What's New:\n`;
        cr.versionChanges.forEach((vc) => {
          body += `    • ${vc}\n`;
        });
      }
      body += `\n`;
    });
  });

  // Changes
  if (release.changes && release.changes.length > 0) {
    body += `CHANGES & UPDATES\n${'─'.repeat(50)}\n`;
    release.changes.forEach((change) => {
      body += `  • ${change}\n`;
    });
    body += `\n`;
  }

  // Notes
  if (release.notes) {
    body += `RELEASE NOTES\n${'─'.repeat(50)}\n`;
    body += `${release.notes}\n\n`;
  }

  body += `${'─'.repeat(50)}\n`;
  body += `This release update was generated from the App Release Tracker.`;

  return { subject, body };
};

export const ReleaseDetailsModal: React.FC<ReleaseDetailsModalProps> = ({
  isOpen,
  onClose,
  release,
  darkMode = false,
  currentUserEmail = 'user@example.com',
}) => {
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showTeamsShare, setShowTeamsShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [teamsShared, setTeamsShared] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [teamsMessage, setTeamsMessage] = useState('');

  // Teams groups configuration — add more groups here as needed
  const teamsGroups = [
    {
      id: 'mobile-releases',
      name: 'Mobile Releases',
      url: 'https://teams.microsoft.com/l/chat/19:e74fc43b44cc490f9c79707b3a73cbc4@thread.v2/conversations?context=%7B%22contextType%22%3A%22chat%22%7D',
    },
     {
      id: 'Release-group-for-BLC',
      name: 'Release-group-for-BLC',
      url: 'https://teams.microsoft.com/l/chat/19:00c1e6a443f4473a9c928734dc53f4e4@thread.v2/conversations?context=%7B%22contextType%22%3A%22chat%22%7D',
    },
  ];

  if (!isOpen || !release) return null;

  const { subject: emailSubject, body: emailBody } = generateEmailContent(release);

  const generateTeamsMessage = (): string => {
    const releaseDate = new Date(release.releaseDate).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
    }).toUpperCase();

    const env = (release.environment || release.concept || 'Production').toUpperCase();

    let message = `========= ${release.releaseName.toUpperCase()} ${releaseDate} - NATIVE RELEASE STATUS ==========\n\n`;
    message += `All apps are submitted for review with below details.\n`;
    message += `Environment: ${env}\n\n`;

    // Group concept releases by concepts for a cleaner format
    release.platforms.forEach((platform) => {
      const conceptReleases = getConceptReleases(platform);
      conceptReleases.forEach((cr) => {
        const concepts = cr.concepts?.join(', ') || 'All Concepts';
        message += `${concepts} - ${env}\n`;
        message += `${platform.platform} - ${cr.version || 'N/A'}${cr.buildId ? ` (${cr.buildId})` : ''}\n`;
        if (cr.buildLink) {
          message += `Build Link: ${cr.buildLink}\n`;
        }
        message += `\n`;
      });
    });

    // Rollout info
    const rolloutLines: string[] = [];
    release.platforms.forEach((platform) => {
      const conceptReleases = getConceptReleases(platform);
      conceptReleases.forEach((cr) => {
        if (cr.rolloutPercentage > 0) {
          rolloutLines.push(`${cr.rolloutPercentage}%(${platform.platform})`);
        }
      });
    });
    if (rolloutLines.length > 0) {
      message += `Rollout will start at ${rolloutLines.join(' and ')} after successful review.\n\n`;
    }

    // Changes
    if (release.changes && release.changes.length > 0) {
      message += `Changes:\n`;
      release.changes.forEach((change) => {
        message += `• ${change}\n`;
      });
      message += `\n`;
    }

    // Notes
    if (release.notes) {
      message += `Notes: ${release.notes}\n`;
    }

    return message;
  };

  const handleOpenTeamsShare = () => {
    setTeamsMessage(generateTeamsMessage());
    setShowTeamsShare(true);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `Subject: ${emailSubject}\n\n${emailBody}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleShareToSelectedGroups = async () => {
    if (selectedGroups.length === 0) return;

    // Copy the editable message to clipboard
    try {
      await navigator.clipboard.writeText(teamsMessage);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = teamsMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    // Open each selected group in a new tab
    const groupsToOpen = teamsGroups.filter(g => selectedGroups.includes(g.id));
    groupsToOpen.forEach((group, index) => {
      // Stagger opening to avoid popup blockers
      setTimeout(() => {
        window.open(group.url, '_blank');
      }, index * 500);
    });

    // Show toast and close modal
    setShowTeamsShare(false);
    setSelectedGroups([]);
    setTeamsShared(true);
    setTimeout(() => setTeamsShared(false), 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className={`rounded-lg shadow-xl w-full max-w-6xl my-4 max-h-[95vh] overflow-hidden flex flex-col ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header - Sticky */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 z-10 ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <h2 className={`text-lg sm:text-2xl font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Release Details
          </h2>
          <div className="flex items-center gap-2">
            {/* Email Preview Button */}
            <button
              onClick={() => setShowEmailPreview(true)}
              title="Email preview"
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-blue-300 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Mail className="h-5 w-5" />
            </button>
            {/* Share to Teams Button */}
            <button
              onClick={handleOpenTeamsShare}
              title="Share to Microsoft Teams"
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-purple-300 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <Share2 className="h-5 w-5" />
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {/* Release Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-4 sm:space-y-6">
              <div className={`rounded-lg p-4 sm:p-6 ${
                darkMode 
                  ? 'bg-blue-900/20 border border-blue-800/50' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50'
              }`}>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Release Information
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs sm:text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Release Date:
                      </span>
                      <span className={`ml-2 text-xs sm:text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {new Date(release.releaseDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs sm:text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Release Name:
                      </span>
                      <span className={`ml-2 text-xs sm:text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {release.releaseName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Package className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs sm:text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Environment:
                      </span>
                      <span className={`ml-2 text-xs sm:text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {release.environment || release.concept}
                      </span>
                    </div>
                    {release.tags && release.tags.length > 0 && (
                      <div className="flex items-start gap-2 mt-2">
                        <span className={`text-xs sm:text-sm font-medium flex-shrink-0 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Tags:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {release.tags.map(tag => (
                            <TagBadge key={tag} tag={tag} darkMode={darkMode} size="xs" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`rounded-lg p-4 sm:p-6 ${
                darkMode 
                  ? 'bg-yellow-900/20 border border-yellow-800/50' 
                  : 'bg-gradient-to-r from-yellow-50 to-orange-50'
              }`}>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Timeline
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                      darkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs sm:text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Created:
                      </span>
                      <span className={`ml-2 text-xs sm:text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {release.createdAt && !isNaN(new Date(release.createdAt).getTime()) 
                          ? new Date(release.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                      darkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs sm:text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Last Updated:
                      </span>
                      <span className={`ml-2 text-xs sm:text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
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
            <div className={`rounded-lg p-4 sm:p-6 ${
              darkMode 
                ? 'bg-purple-900/20 border border-purple-800/50' 
                : 'bg-gradient-to-r from-purple-50 to-pink-50'
            }`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Platform Summary
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {release.platforms.map((platform, platformIndex) => {
                  const conceptReleases = getConceptReleases(platform);
                  
                  return (
                    <div key={platformIndex} className={`border-2 rounded-lg p-3 ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700' 
                        : 'border-gray-200 bg-white'
                    }`}>
                      <div className={`font-semibold text-sm sm:text-base mb-2 sm:mb-3 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {platform.platform}
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {conceptReleases.map((conceptRelease, crIndex) => (
                          <div key={conceptRelease.id} className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {conceptReleases.length > 1 && (
                                <div className={`text-xs font-medium mb-1 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  #{crIndex + 1}
                                </div>
                              )}
                              <div className={`text-xs sm:text-sm font-medium mb-1 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {conceptRelease.version} - {conceptRelease.buildId}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {conceptRelease.concepts.map((concept, idx) => (
                                  <span key={idx} className={`inline-block px-1.5 sm:px-2 py-0.5 text-xs rounded ${
                                    darkMode 
                                      ? 'bg-blue-900/50 text-blue-300' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className={`text-xs sm:text-sm font-bold mb-1 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {conceptRelease.rolloutPercentage}%
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${
                                getStatusColor(conceptRelease.status, darkMode)
                              }`}>
                                {conceptRelease.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Platform Details - Side by Side */}
          <div className="mb-6 sm:mb-8">
            <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Platform Details
            </h3>
            <div className="space-y-4 sm:space-y-6">
              {release.platforms.map((platform, platformIndex) => {
                const conceptReleases = getConceptReleases(platform);
                
                return (
                  <div key={platformIndex} className={`border rounded-lg p-3 sm:p-4 ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-semibold text-base sm:text-lg mb-3 sm:mb-4 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {platform.platform}
                    </h4>
                    
                    <div className="space-y-4 sm:space-y-6">
                      {conceptReleases.map((conceptRelease, crIndex) => (
                        <div key={conceptRelease.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Left: Platform Details */}
                          <div className={`rounded-lg p-3 sm:p-4 border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                          }`}>
                            {conceptReleases.length > 1 && (
                              <div className={`text-xs font-medium mb-2 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Release #{crIndex + 1}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mb-3">
                              <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                getStatusColor(conceptRelease.status, darkMode)
                              }`}>
                                {conceptRelease.status}
                              </span>
                            </div>
                            
                            <div className="space-y-2 sm:space-y-3">
                              <div>
                                <span className={`text-xs sm:text-sm font-medium ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Version:
                                </span>
                                <span className={`ml-2 text-xs sm:text-sm font-mono ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {conceptRelease.version}
                                </span>
                              </div>
                              
                              <div>
                                <span className={`text-xs sm:text-sm font-medium ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Build ID:
                                </span>
                                <span className={`ml-2 text-xs sm:text-sm font-mono ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {conceptRelease.buildId}
                                </span>
                              </div>
                              
                              <div>
                                <span className={`text-xs sm:text-sm font-medium ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Concepts:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {conceptRelease.concepts.map((concept, idx) => (
                                    <span key={idx} className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${
                                      darkMode 
                                        ? 'bg-blue-900/50 text-blue-300' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {concept}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs sm:text-sm font-medium ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    Rollout Progress:
                                  </span>
                                  <span className={`text-xs sm:text-sm font-bold ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {conceptRelease.rolloutPercentage}%
                                  </span>
                                </div>
                                <div className={`w-full rounded-full h-2 ${
                                  darkMode ? 'bg-gray-600' : 'bg-gray-200'
                                }`}>
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${getRolloutColor(conceptRelease.rolloutPercentage)}`}
                                    style={{ width: `${conceptRelease.rolloutPercentage}%` }}
                                  />
                                </div>
                              </div>
                              
                              {conceptRelease.notes && (
                                <div className={`mt-2 sm:mt-3 p-2 rounded text-xs sm:text-sm ${
                                  darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
                                }`}>
                                  {conceptRelease.notes}
                                </div>
                              )}
                              
                              {conceptRelease.buildLink && (
                                <div className="mt-2 sm:mt-3">
                                  <a 
                                    href={conceptRelease.buildLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Download Build
                                  </a>
                                </div>
                              )}

                              {/* Version-specific Changes */}
                              {conceptRelease.versionChanges && conceptRelease.versionChanges.length > 0 && (
                                <div className="mt-3 sm:mt-4">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <ListChecks className={`h-3.5 w-3.5 ${
                                      darkMode ? 'text-emerald-400' : 'text-emerald-600'
                                    }`} />
                                    <span className={`text-xs sm:text-sm font-medium ${
                                      darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      Version Changes
                                    </span>
                                  </div>
                                  <div className={`rounded-lg p-2.5 ${
                                    darkMode ? 'bg-emerald-900/20 border border-emerald-800/40' : 'bg-emerald-50 border border-emerald-200'
                                  }`}>
                                    <ul className="space-y-1.5">
                                      {conceptRelease.versionChanges.map((vc, vcIdx) => (
                                        <li key={vcIdx} className="flex items-start gap-2">
                                          <div className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                            darkMode ? 'bg-emerald-400' : 'bg-emerald-500'
                                          }`} />
                                          <span className={`text-xs sm:text-sm ${
                                            darkMode ? 'text-emerald-200' : 'text-emerald-800'
                                          }`}>
                                            {vc}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Rollout History */}
                        <div className={`rounded-lg p-3 sm:p-4 border ${
                          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <h5 className={`text-xs sm:text-sm font-semibold mb-3 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Rollout History
                          </h5>
                          
                          {conceptRelease.rolloutHistory && conceptRelease.rolloutHistory.length > 0 ? (
                            <div className={`space-y-2 ${conceptRelease.rolloutHistory.length > 5 ? 'max-h-[280px] overflow-y-auto pr-1' : ''}`}>
                              {conceptRelease.rolloutHistory.map((entry, historyIndex) => (
                                <div key={historyIndex} className={`rounded px-2 sm:px-3 py-2 ${
                                  darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <span className={`text-xs sm:text-sm font-bold ${
                                      darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      {entry.percentage}%
                                    </span>
                                    <span className={`text-xs ${
                                      darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      {new Date(entry.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  {entry.notes && (
                                    <div className={`text-xs ${
                                      darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {entry.notes}
                                    </div>
                                  )}
                                  {(entry.updatedByName || entry.updatedBy) && (
                                    <div className={`text-xs mt-1 ${
                                      darkMode ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
                                      Updated by {entry.updatedByName || entry.updatedBy}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={`text-xs sm:text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              No rollout history available
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
          {release.changes && release.changes.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Changes & Updates
              </h3>
              <div className={`rounded-lg p-4 sm:p-6 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <ul className="space-y-2 sm:space-y-3">
                  {release.changes.map((change, index) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                      <span className={`text-xs sm:text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {change}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Notes Section */}
          {release.notes && (
            <div>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Release Notes
              </h3>
              <div className={`border rounded-lg p-3 sm:p-4 ${
                darkMode 
                  ? 'bg-blue-900/20 border-blue-800' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  darkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  {release.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teams Share Modal */}
      {showTeamsShare && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className={`rounded-lg shadow-2xl w-full max-w-3xl flex flex-col ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Share2 className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Share to Teams
                </h3>
              </div>
              <button
                onClick={() => { setShowTeamsShare(false); setSelectedGroups([]); }}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Group Selection */}
            <div className="p-4 space-y-3">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select the Teams group(s) to share this release update:
              </p>
              <div className="space-y-2">
                {teamsGroups.map((group) => (
                  <label
                    key={group.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGroups.includes(group.id)
                        ? darkMode
                          ? 'bg-purple-900/30 border-purple-700 text-purple-300'
                          : 'bg-purple-50 border-purple-300 text-purple-800'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-650'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => handleToggleGroup(group.id)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium">{group.name}</span>
                  </label>
                ))}
              </div>

              {/* Editable Message */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-xs font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Message (editable):</p>
                  <button
                    onClick={() => setTeamsMessage(generateTeamsMessage())}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      darkMode
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Reset to default
                  </button>
                </div>
                <textarea
                  value={teamsMessage}
                  onChange={(e) => setTeamsMessage(e.target.value)}
                  rows={12}
                  className={`w-full rounded-lg border p-3 text-xs font-mono leading-relaxed resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-2 p-4 border-t ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => { setShowTeamsShare(false); setSelectedGroups([]); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleShareToSelectedGroups}
                disabled={selectedGroups.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedGroups.length === 0
                    ? darkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : darkMode
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <Share2 className="h-4 w-4" />
                Copy & Open in Teams ({selectedGroups.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams Share Toast Notification */}
      {teamsShared && (
        <div className="fixed bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-gray-200'
              : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
              darkMode ? 'bg-green-900/40' : 'bg-green-100'
            }`}>
              <Check className={`h-4 w-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">Message copied to clipboard!</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Paste it in the Teams chat that just opened.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className={`rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Email Preview Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Mail className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Email Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEmail}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? darkMode
                        ? 'bg-green-900/30 text-green-300 border border-green-700'
                        : 'bg-green-50 text-green-700 border border-green-200'
                      : darkMode
                        ? 'bg-blue-900/30 text-blue-300 border border-blue-700 hover:bg-blue-900/50'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEmailPreview(false)}
                  className={`p-1 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Email Subject */}
            <div className={`px-4 py-3 border-b ${
              darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Subject:</span>
                <span className={`text-sm ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{emailSubject}</span>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <pre className={`whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {emailBody}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};