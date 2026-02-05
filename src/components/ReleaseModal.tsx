import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Release, PlatformRelease, ConceptRelease } from '../types/release';
import { ENVIRONMENTS, CONCEPTS, PLATFORMS } from '../data/mockData';

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingRelease?: Release;
}

const initialConceptRelease: ConceptRelease = {
  id: '',
  concepts: ['All Concepts'],
  version: '',
  buildId: '',
  rolloutPercentage: 0,
  status: 'In Progress',
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
  });

  useEffect(() => {
    if (editingRelease) {
      // Convert old format to new format if needed
      const convertedPlatforms = editingRelease.platforms.map(p => {
        if ('conceptReleases' in p && p.conceptReleases && Array.isArray(p.conceptReleases)) {
          return p;
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
              status: p.status || 'In Progress',
              notes: p.notes || '',
              buildLink: p.buildLink || '',
              rolloutHistory: p.rolloutHistory || []
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingRelease ? 'Edit Release' : 'Add New Release'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Release Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.releaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.releaseName}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., July-9 Release"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.environment}
                onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Details</h3>
            <div className="space-y-6">
              {formData.platforms.map((platform, platformIndex) => (
                <div key={platformIndex} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getPlatformIcon(platform.platform)}</span>
                      <h4 className="font-semibold text-gray-900 text-lg">{platform.platform}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => addConceptRelease(platformIndex)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-150"
                    >
                      <Plus className="h-4 w-4" />
                      Add Release Version
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(platform.conceptReleases || []).map((conceptRelease, conceptIndex) => (
                      <div key={conceptIndex} className="bg-white rounded-lg p-4 border border-gray-300 relative">
                        {platform.conceptReleases && platform.conceptReleases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeConceptRelease(platformIndex, conceptIndex)}
                            className="absolute top-2 right-2 text-red-600 hover:text-red-800 transition-colors duration-150"
                            title="Remove this release version"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                        
                        <div className="mb-3">
                          <span className="text-xs font-medium text-gray-500">
                            Release Version #{conceptIndex + 1}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Version <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={conceptRelease.version}
                              onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'version', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 10.34.2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Build ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={conceptRelease.buildId}
                              onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'buildId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 7055"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rollout % <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              max="100"
                              value={conceptRelease.rolloutPercentage}
                              onChange={(e) => {
                                const percentage = Number(e.target.value);
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
                                                        percentage === 0 ? 'Paused' : 'In Progress';
                                  updateConceptRelease(platformIndex, conceptIndex, 'status', suggestedStatus);
                                }
                                
                                updateConceptRelease(platformIndex, conceptIndex, 'rolloutPercentage', percentage);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status <span className="text-red-500">*</span>
                            </label>
                            <select
                              required
                              value={conceptRelease.status}
                              onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'status', e.target.value as 'In Progress' | 'Complete' | 'Paused' | 'On Hold')}
                              className={`w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                conceptRelease.status === 'Complete' 
                                  ? 'bg-green-50 border-green-200 text-green-700'
                                  : conceptRelease.status === 'Paused'
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : conceptRelease.status === 'On Hold'
                                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                              }`}
                            >
                              <option value="In Progress">⏳ In Progress</option>
                              <option value="Complete">✓ Complete</option>
                              <option value="Paused">⏸ Paused</option>
                              <option value="On Hold">🛑 On Hold</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Manual override enabled. Auto-suggests based on rollout %.
                            </p>
                          </div>
                        </div>

                        {/* Concept Selection */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {concept}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Selected: <span className="font-medium">{(conceptRelease.concepts || ['All Concepts']).join(', ')}</span>
                          </p>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Release Notes
                          </label>
                          <textarea
                            rows={2}
                            value={conceptRelease.notes || ''}
                            onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Release-specific notes, environment details..."
                          />
                        </div>

                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Build Link (Optional)
                          </label>
                          <input
                            type="url"
                            value={conceptRelease.buildLink || ''}
                            onChange={(e) => updateConceptRelease(platformIndex, conceptIndex, 'buildLink', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the change..."
                  />
                  {formData.changes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChange(index)}
                      className="text-red-600 hover:text-red-800 transition-colors duration-150"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addChange}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-150"
              >
                <Plus className="h-4 w-4" />
                Add Change
              </button>
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Overall release notes or comments..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
            >
              {editingRelease ? 'Update Release' : 'Add Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};