import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Release, PlatformRelease, ConceptRelease } from '../types/release';
import { ENVIRONMENTS, CONCEPTS, PLATFORMS } from '../data/mockData';

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (release: Omit<Release, 'id'>) => void;
  editingRelease?: Release | null;
  darkMode?: boolean;
}

const initialConceptRelease: ConceptRelease = {
  id: '',
  concepts: ['All Concepts'],
  version: '',
  buildId: '',
  rolloutPercentage: 0,
  status: 'Not Started',
  notes: '',
  buildLink: ''
};

const initialPlatformData: PlatformRelease = {
  platform: 'iOS',
  conceptReleases: [{ ...initialConceptRelease }]
};

export const ReleaseModal: React.FC<ReleaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRelease,
  darkMode = false,
}) => {
  const [formData, setFormData] = useState({
    releaseDate: '',
    releaseName: '',
    environment: '',
    platforms: [
      { platform: 'iOS' as const, conceptReleases: [{ ...initialConceptRelease }] },
      { platform: 'Android GMS' as const, conceptReleases: [{ ...initialConceptRelease }] },
      { platform: 'Android HMS' as const, conceptReleases: [{ ...initialConceptRelease }] }
    ] as PlatformRelease[],
    changes: [''],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

useEffect(() => {
  if (editingRelease) {
    // Convert old format to new format if needed
    const convertedPlatforms = editingRelease.platforms.map(p => {
      if ('conceptReleases' in p && p.conceptReleases && Array.isArray(p.conceptReleases)) {
        // Remove rolloutHistory from each concept release in the form
        return {
          ...p,
          conceptReleases: p.conceptReleases.map(cr => ({
            id: cr.id,
            concepts: cr.concepts,
            version: cr.version,
            buildId: cr.buildId,
            rolloutPercentage: cr.rolloutPercentage,
            status: cr.status,
            notes: cr.notes || '',
            buildLink: cr.buildLink || '',
            // Don't include rolloutHistory here - it will be managed by updateRelease
          }))
        };
      } else {
        // Convert old single-release format to conceptReleases format
        return {
          platform: p.platform,
          conceptReleases: [{
            id: `${p.platform.toLowerCase().replace(/\s+/g, '-')}-1`,
            concepts: p.concepts || ['All Concepts'],
            version: p.version || '',
            buildId: p.buildId || '',
            rolloutPercentage: p.rolloutPercentage || 0,
            status: p.status || 'Not Started',
            notes: p.notes || '',
            buildLink: p.buildLink || '',
            // Don't include rolloutHistory
          }]
        };
      }
    });

    setFormData({
      releaseDate: editingRelease.releaseDate,
      releaseName: editingRelease.releaseName,
      environment: editingRelease.environment || editingRelease.concept || '',
      platforms: convertedPlatforms,
      changes: editingRelease.changes,
      notes: editingRelease.notes || '',
      createdAt: editingRelease.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } else {
      setFormData({
        releaseDate: '',
        releaseName: '',
        environment: '',
        platforms: [
          { platform: 'iOS', conceptReleases: [{ ...initialConceptRelease }] },
          { platform: 'Android GMS', conceptReleases: [{ ...initialConceptRelease }] },
          { platform: 'Android HMS', conceptReleases: [{ ...initialConceptRelease }] }
        ],
        changes: [''],
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [editingRelease, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredChanges = formData.changes.filter(change => change.trim() !== '');
    
    // Filter out platforms with no valid concept releases
    const validPlatforms = formData.platforms.map(p => ({
      ...p,
      conceptReleases: (p.conceptReleases || []).filter(cr => cr.version && cr.buildId)
    })).filter(p => p.conceptReleases && p.conceptReleases.length > 0);
    
    onSave({
      ...formData,
      platforms: validPlatforms,
      changes: filteredChanges,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const addConceptRelease = (platformIndex: number) => {
    setFormData(prev => {
      const updatedPlatforms = [...prev.platforms];
      const platform = updatedPlatforms[platformIndex];
      
      if (!platform || !platform.conceptReleases) {
        return prev;
      }
      
      const newId = `${platform.platform.toLowerCase().replace(/\s+/g, '-')}-${platform.conceptReleases.length + 1}`;
      
      updatedPlatforms[platformIndex] = {
        ...platform,
        conceptReleases: [
          ...platform.conceptReleases,
          { ...initialConceptRelease, id: newId }
        ]
      };
      
      return {
        ...prev,
        platforms: updatedPlatforms
      };
    });
  };

  const removeConceptRelease = (platformIndex: number, conceptIndex: number) => {
    setFormData(prev => {
      const updatedPlatforms = [...prev.platforms];
      const platform = updatedPlatforms[platformIndex];
      
      if (!platform || !platform.conceptReleases) {
        return prev;
      }
      
      updatedPlatforms[platformIndex] = {
        ...platform,
        conceptReleases: platform.conceptReleases.filter((_, i) => i !== conceptIndex)
      };
      
      return {
        ...prev,
        platforms: updatedPlatforms
      };
    });
  };

  const updateConceptRelease = (
    platformIndex: number, 
    conceptIndex: number, 
    field: keyof ConceptRelease, 
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.map((platform, pIdx) => {
        if (pIdx !== platformIndex || !platform.conceptReleases) {
          return platform;
        }
        
        return {
          ...platform,
          conceptReleases: platform.conceptReleases.map((cr, cIdx) => 
            cIdx === conceptIndex ? { ...cr, [field]: value } : cr
          )
        };
      })
    }));
  };

  const addChange = () => {
    setFormData(prev => ({
      ...prev,
      changes: [...prev.changes, ''],
    }));
  };

  const removeChange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index),
    }));
  };

  const updateChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.map((change, i) => i === index ? value : change),
    }));
  };

  const handleChangeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (formData.changes[index].trim() !== '') {
        addChange();
        setTimeout(() => {
          const inputs = document.querySelectorAll('input[placeholder="Describe the change..."]');
          const nextInput = inputs[index + 1] as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
          }
        }, 50);
      }
    }
  };

  const toggleConcept = (platformIndex: number, conceptIndex: number, concept: string) => {
    setFormData(prev => {
      const updatedPlatforms = [...prev.platforms];
      const platform = updatedPlatforms[platformIndex];
      
      if (!platform || !platform.conceptReleases || !platform.conceptReleases[conceptIndex]) {
        return prev;
      }
      
      const conceptRelease = platform.conceptReleases[conceptIndex];
      const currentConcepts = conceptRelease.concepts || [];
      
      let newConcepts: string[];
      
      if (concept === 'All Concepts') {
        newConcepts = ['All Concepts'];
      } else {
        // Remove "All Concepts" if present and toggle the specific concept
        let filtered = currentConcepts.filter(c => c !== 'All Concepts');
        
        if (filtered.includes(concept)) {
          filtered = filtered.filter(c => c !== concept);
        } else {
          filtered.push(concept);
        }
        
        // If no concepts are selected, default to "All Concepts"
        newConcepts = filtered.length === 0 ? ['All Concepts'] : filtered;
      }
      
      updatedPlatforms[platformIndex] = {
        ...platform,
        conceptReleases: platform.conceptReleases.map((cr, idx) =>
          idx === conceptIndex ? { ...cr, concepts: newConcepts } : cr
        )
      };
      
      return {
        ...prev,
        platforms: updatedPlatforms
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className={`rounded-lg shadow-xl w-full max-w-6xl my-4 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 z-10 ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <h2 className={`text-lg sm:text-xl font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {editingRelease ? 'Edit Release' : 'Add New Release'}
          </h2>
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

        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {/* Basic Release Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Release Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.releaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Release Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.releaseName}
                  onChange={(e) => setFormData(prev => ({ ...prev, releaseName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="e.g., July-9 Release"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Environment <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.environment}
                  onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  style={{ 
                    backgroundImage: darkMode 
                      ? 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")'
                      : 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', 
                    backgroundPosition: 'right 0.5rem center', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundSize: '1.5em 1.5em' 
                  }}
                >
                  <option value="">Select Environment</option>
                  {ENVIRONMENTS.map(env => (
                    <option key={env} value={env}>{env}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Platform Details */}
            <div>
              <h3 className={`text-base sm:text-lg font-medium mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Platform Details
              </h3>
              <div className="space-y-4 sm:space-y-6">
                {formData.platforms.map((platform, platformIndex) => (
                  <div key={platformIndex} className={`rounded-lg p-3 sm:p-4 border-2 ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <h4 className={`font-semibold text-base sm:text-lg ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {platform.platform}
                      </h4>
                      <button
                        type="button"
                        onClick={() => addConceptRelease(platformIndex)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                      >
                        <Plus className="h-4 w-4" />
                        Add Release Version
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {(platform.conceptReleases || []).map((conceptRelease, conceptIndex) => (
                        <div key={conceptIndex} className={`rounded-lg p-3 sm:p-4 border relative ${
                          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                        }`}>
                          {platform.conceptReleases && platform.conceptReleases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeConceptRelease(platformIndex, conceptIndex)}
                              className={`absolute top-2 right-2 transition-colors ${
                                darkMode 
                                  ? 'text-red-400 hover:text-red-300' 
                                  : 'text-red-600 hover:text-red-800'
                              }`}
                              title="Remove this release version"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          )}
                          
                          <div className="mb-3">
                            <span className={`text-xs font-medium ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Release Version #{conceptIndex + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                              <label className={`block text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Version 
                              </label>
                              <input
                                type="text"
                                value={conceptRelease.version}
                                onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'version', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  darkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                                placeholder="e.g., 10.34.2"
                              />
                            </div>

                            <div>
                              <label className={`block text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Build ID
                              </label>
                              <input
                                type="text"
                                value={conceptRelease.buildId}
                                onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'buildId', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  darkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                                placeholder="e.g., 7055"
                              />
                            </div>

                            <div>
                              <label className={`block text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Rollout %
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={conceptRelease.rolloutPercentage}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const percentage = value === '' ? 0 : Number(value);
                                  const currentPercentage = conceptRelease.rolloutPercentage;
                                  
                                  // Add to rollout history if percentage changed
                                  if (percentage !== currentPercentage) {
                                    const newHistoryEntry = {
                                      percentage: percentage,
                                      date: new Date().toISOString(),
                                      notes: `Updated from ${currentPercentage}% to ${percentage}%`
                                    };
                                    
                                    const updatedHistory = [...(conceptRelease.rolloutHistory || []), newHistoryEntry];
                                    updateConceptRelease(platformIndex, conceptIndex, 'rolloutHistory', updatedHistory);
                                    
                                    // Auto-suggest status based on percentage (user can still override)
                                    const suggestedStatus = percentage === 100 ? 'Complete' : 
                                                          percentage === 0 ? 'Not Started' : 'In Progress';
                                    updateConceptRelease(platformIndex, conceptIndex, 'status', suggestedStatus);
                                  }
                                  
                                  updateConceptRelease(platformIndex, conceptIndex, 'rolloutPercentage', percentage);
                                }}
                                onKeyDown={(e) => {
                                  // Allow backspace/delete to clear the field
                                  if (e.key === 'Backspace' || e.key === 'Delete') {
                                    if ((e.target as HTMLInputElement).value === '0') {
                                      e.preventDefault();
                                      updateConceptRelease(platformIndex, conceptIndex, 'rolloutPercentage', 0);
                                      updateConceptRelease(platformIndex, conceptIndex, 'status', 'Not Started');
                                    }
                                  }
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  darkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`block text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Status <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={conceptRelease.status}
                                onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'status', e.target.value as 'Not Started' | 'In Progress' | 'Complete' | 'Paused')}
                                className={`w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  conceptRelease.status === 'Complete' 
                                    ? darkMode 
                                      ? 'bg-green-900/30 border-green-700 text-green-300'
                                      : 'bg-green-50 border-green-200 text-green-700'
                                    : conceptRelease.status === 'Not Started'
                                    ? darkMode
                                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                                      : 'bg-gray-50 border-gray-200 text-gray-700'
                                    : conceptRelease.status === 'Paused'
                                    ? darkMode
                                      ? 'bg-orange-900/30 border-orange-700 text-orange-300'
                                      : 'bg-orange-50 border-orange-200 text-orange-700'
                                    : darkMode
                                      ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300'
                                      : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                }`}
                              >
                                <option value="Not Started">⏹ Not Started</option>
                                <option value="In Progress">⏳ In Progress</option>
                                <option value="Complete">✓ Complete</option>
                                <option value="Paused">⏸ Paused</option>
                              </select>
                              <p className={`text-xs mt-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Manual override enabled. Auto-suggests based on rollout %.
                              </p>
                            </div>
                          </div>

                          {/* Concept Selection */}
                          <div className="mt-4">
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Concepts <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {CONCEPTS.map(concept => (
                                <button
                                  key={concept}
                                  type="button"
                                  onClick={() => toggleConcept(platformIndex, conceptIndex, concept)}
                                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                    (conceptRelease.concepts || ['All Concepts']).includes(concept)
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : darkMode
                                        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {concept}
                                </button>
                              ))}
                            </div>
                            <p className={`text-xs mt-2 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Selected: <span className="font-medium">{(conceptRelease.concepts || ['All Concepts']).join(', ')}</span>
                            </p>
                          </div>

                          <div className="mt-3">
                            <label className={`block text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Build Link (Optional)
                            </label>
                            <input
                              type="url"
                              value={conceptRelease.buildLink || ''}
                              onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'buildLink', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                              placeholder="https://sharepoint.com/builds/..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Changes */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Changes
              </label>
              <div className="space-y-2">
                {formData.changes.map((change, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={change}
                      onChange={(e) => updateChange(index, e.target.value)}
                      onKeyPress={(e) => handleChangeKeyPress(e, index)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Describe the change..."
                    />
                    {formData.changes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChange(index)}
                        className={`transition-colors flex-shrink-0 ${
                          darkMode 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-red-600 hover:text-red-800'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChange}
                  className={`flex items-center gap-2 transition-colors ${
                    darkMode 
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Add Change
                </button>
              </div>
            </div>

            {/* Release Notes */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Release Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Overall release notes or comments..."
              />
            </div>

            <div className={`flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t sticky bottom-0 ${
              darkMode 
                ? 'border-gray-700 bg-gray-800' 
                : 'border-gray-200 bg-white'
            }`}>
              <button
                type="button"
                onClick={onClose}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRelease ? 'Update Release' : 'Add Release'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};