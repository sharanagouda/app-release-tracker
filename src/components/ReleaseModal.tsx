import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Release, PlatformRelease, ConceptRelease } from '../types/release';
import { ENVIRONMENTS, CONCEPTS, PLATFORMS } from '../data/mockData';
import { TagInput } from './TagInput';

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (release: Omit<Release, 'id'>) => void;
  editingRelease?: Release | null;
  darkMode?: boolean;
  releases?: Release[];
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
  releases = [],
}) => {
  const [loadedFromRelease, setLoadedFromRelease] = useState<Release | null>(null);
  const [loadError, setLoadError] = useState('');
  // Map of "platformIndex-conceptIndex" → error message for rollout % decrease attempts
  const [rolloutErrors, setRolloutErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    releaseDate: '',
    releaseName: '',
    environment: '',
    isNative: false,
    platforms: [
      { platform: 'iOS' as const, conceptReleases: [{ ...initialConceptRelease }] },
      { platform: 'Android GMS' as const, conceptReleases: [{ ...initialConceptRelease }] },
      { platform: 'Android HMS' as const, conceptReleases: [{ ...initialConceptRelease }] }
    ] as PlatformRelease[],
    changes: [''],
    notes: '',
    tags: [] as string[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

useEffect(() => {
  // Reset load state when modal opens/closes
  setLoadedFromRelease(null);
  setLoadError('');
  setRolloutErrors({});
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
            ...(cr.versionChanges && cr.versionChanges.length > 0 ? { versionChanges: cr.versionChanges } : {}),
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
      isNative: editingRelease.isNative || false,
      platforms: convertedPlatforms,
      changes: editingRelease.changes,
      notes: editingRelease.notes || '',
      tags: editingRelease.tags || [],
      createdAt: editingRelease.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } else {
      setFormData({
        releaseDate: '',
        releaseName: '',
        environment: '',
        isNative: false,
        platforms: [
          { platform: 'iOS', conceptReleases: [{ ...initialConceptRelease }] },
          { platform: 'Android GMS', conceptReleases: [{ ...initialConceptRelease }] },
          { platform: 'Android HMS', conceptReleases: [{ ...initialConceptRelease }] }
        ],
        changes: [''],
        notes: '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [editingRelease, isOpen]);

  const handleLoadPreviousRelease = (releaseId: string) => {
    if (!releaseId) {
      setLoadedFromRelease(null);
      setLoadError('');
      return;
    }
    const selected = releases.find(r => r.id === releaseId);
    if (!selected) return;

    // Convert platforms to form-compatible format (strip rolloutHistory)
    const convertedPlatforms = selected.platforms.map(p => {
      if (p.conceptReleases && Array.isArray(p.conceptReleases)) {
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
            ...(cr.versionChanges && cr.versionChanges.length > 0 ? { versionChanges: cr.versionChanges } : {}),
          }))
        };
      }
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
        }]
      };
    });

    setFormData({
      releaseDate: selected.releaseDate,
      releaseName: selected.releaseName,
      environment: selected.environment || selected.concept || '',
      isNative: selected.isNative || false,
      platforms: convertedPlatforms,
      changes: selected.changes && selected.changes.length > 0 ? selected.changes : [''],
      notes: selected.notes || '',
      tags: selected.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setLoadedFromRelease(selected);
    setLoadError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadError('');

    // Block save if any rollout decrease errors are present
    if (Object.keys(rolloutErrors).length > 0) {
      setLoadError('Please fix the rollout percentage errors before saving.');
      return;
    }

    // If form was loaded from a previous release, check that at least one field has changed
    if (loadedFromRelease && !editingRelease) {
      const source = loadedFromRelease;
      const sourcePlatformData = JSON.stringify(
        source.platforms.map(p => ({
          platform: p.platform,
          conceptReleases: (p.conceptReleases || []).map(cr => ({
            version: cr.version,
            buildId: cr.buildId,
            rolloutPercentage: cr.rolloutPercentage,
            status: cr.status,
            concepts: [...(cr.concepts || [])].sort(),
          }))
        }))
      );
      const currentPlatformData = JSON.stringify(
        formData.platforms.map(p => ({
          platform: p.platform,
          conceptReleases: (p.conceptReleases || []).map(cr => ({
            version: cr.version,
            buildId: cr.buildId,
            rolloutPercentage: cr.rolloutPercentage,
            status: cr.status,
            concepts: [...(cr.concepts || [])].sort(),
          }))
        }))
      );

      const unchanged =
        formData.releaseName === source.releaseName &&
        formData.releaseDate === source.releaseDate &&
        formData.environment === (source.environment || source.concept || '') &&
        formData.notes === (source.notes || '') &&
        sourcePlatformData === currentPlatformData;

      if (unchanged) {
        setLoadError('Please modify at least one field before saving. The form data is identical to the loaded release.');
        return;
      }
    }

    const filteredChanges = formData.changes.filter(change => change.trim() !== '');
    
    // Filter out platforms with no valid concept releases, and clean up versionChanges
    const validPlatforms = formData.platforms.map(p => ({
      ...p,
      conceptReleases: (p.conceptReleases || []).filter(cr => cr.version && cr.buildId).map(cr => ({
        ...cr,
        versionChanges: (cr.versionChanges || []).filter(vc => vc.trim() !== '')
      }))
    })).filter(p => p.conceptReleases && p.conceptReleases.length > 0);
    
    onSave({
      ...formData,
      platforms: validPlatforms,
      changes: filteredChanges,
      updatedAt: new Date().toISOString(),
    });
    // Note: Modal closing is handled by the parent (App.tsx) after successful save
  };

  const addConceptRelease = (platformIndex: number) => {
    setFormData(prev => {
      const updatedPlatforms = [...prev.platforms];
      const platform = updatedPlatforms[platformIndex];
      
      if (!platform || !platform.conceptReleases) {
        return prev;
      }
      
      const newId = `${platform.platform.toLowerCase().replace(/\s+/g, '-')}-${platform.conceptReleases.length + 1}`;
      
      // When adding a new version, ensure all existing versions also get versionChanges field
      const existingWithChanges = platform.conceptReleases.map(cr => ({
        ...cr,
        versionChanges: cr.versionChanges && cr.versionChanges.length > 0 ? cr.versionChanges : ['']
      }));
      
      updatedPlatforms[platformIndex] = {
        ...platform,
        conceptReleases: [
          ...existingWithChanges,
          { ...initialConceptRelease, id: newId, versionChanges: [''] }
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

  const removePlatform = (platformIndex: number) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.filter((_, i) => i !== platformIndex),
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

  /**
   * Update versionChanges from a textarea value.
   * Splits the raw text by newlines and stores as string[].
   * Empty lines are kept during editing so the cursor position is preserved;
   * they are filtered out on save (in handleSubmit).
   */
  const updateVersionChangesText = (platformIndex: number, conceptIndex: number, text: string) => {
    const lines = text.split('\n');
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.map((platform, pIdx) => {
        if (pIdx !== platformIndex || !platform.conceptReleases) return platform;
        return {
          ...platform,
          conceptReleases: platform.conceptReleases.map((cr, cIdx) => {
            if (cIdx !== conceptIndex) return cr;
            return { ...cr, versionChanges: lines };
          })
        };
      })
    }));
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
        <div className={`sticky top-0 z-10 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          {/* Row 1: Title, Load Previous Release dropdown, Close button */}
          <div className="flex items-center justify-between p-4 sm:p-6 gap-3">
            <h2 className={`text-lg sm:text-xl font-semibold flex-shrink-0 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {editingRelease ? 'Edit Release' : 'Add New Release'}
            </h2>

            <div className="flex items-center gap-3">
              {!editingRelease && releases.length > 0 && (
                <div className="relative">
                  <select
                    defaultValue=""
                    onChange={(e) => handleLoadPreviousRelease(e.target.value)}
                    className={`w-full sm:w-64 pl-3 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                    style={{
                      backgroundImage: darkMode
                        ? 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")'
                        : 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="">Load previous release...</option>
                    {releases.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.releaseName} — {r.releaseDate} ({r.environment || r.concept || ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={onClose}
                className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Row 2: Banners (Pre-filled info & error messages) */}
          {(loadedFromRelease && !editingRelease || loadError) && (
            <div className={`px-4 sm:px-6 pb-3 space-y-2 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Loaded-from banner */}
              {loadedFromRelease && !editingRelease && (
                <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                  darkMode ? 'bg-blue-900/30 text-blue-300 border border-blue-700' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <span className="mt-0.5">📋</span>
                  <span>
                    Pre-filled from <strong>{loadedFromRelease.releaseName}</strong>. Modify the fields as needed before saving.
                  </span>
                </div>
              )}

              {/* Duplicate-data error */}
              {loadError && (
                <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                  darkMode ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span className="mt-0.5">⚠️</span>
                  <span>{loadError}</span>
                </div>
              )}
            </div>
          )}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-base sm:text-lg font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Platform Details
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isNative"
                    checked={formData.isNative}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (editingRelease && !editingRelease.isNative && checked) {
                        if (!window.confirm("Are you sure you want to mark this as a Native Release?")) {
                          return;
                        }
                      }
                      setFormData(prev => ({ ...prev, isNative: checked }));
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isNative" className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Native Release
                  </label>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {formData.platforms.map((platform, platformIndex) => (
                  <div key={platformIndex} className={`rounded-lg p-3 sm:p-4 border-2 ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold text-base sm:text-lg ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {platform.platform}
                        </h4>
                        {/* Delete platform — only shown when more than 1 platform exists */}
                        {formData.platforms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlatform(platformIndex)}
                            className={`p-1 rounded transition-colors ${
                              darkMode
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                                : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={`Remove ${platform.platform} platform`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
                                   const errorKey = `${platformIndex}-${conceptIndex}`;

                                   // Prevent decreasing rollout when editing an existing release
                                   if (editingRelease) {
                                     const originalPlatform = editingRelease.platforms[platformIndex];
                                     const originalCr = originalPlatform?.conceptReleases?.[conceptIndex];
                                     const originalPct = originalCr?.rolloutPercentage ?? 0;
                                     if (percentage < originalPct) {
                                       setRolloutErrors(prev => ({
                                         ...prev,
                                         [errorKey]: `Rollout cannot be decreased below ${originalPct}%`,
                                       }));
                                       return; // Don't update form state
                                     }
                                   }

                                   // Clear any previous error for this field
                                   setRolloutErrors(prev => {
                                     const next = { ...prev };
                                     delete next[errorKey];
                                     return next;
                                   });

                                   const currentPercentage = conceptRelease.rolloutPercentage;
                                   
                                   // Update percentage value
                                   updateConceptRelease(platformIndex, conceptIndex, 'rolloutPercentage', percentage);
                                   
                                   // Auto-suggest status based on percentage (user can still override)
                                   if (percentage !== currentPercentage) {
                                     const suggestedStatus = percentage === 100 ? 'Complete' :
                                                           percentage === 0 ? 'Not Started' : 'In Progress';
                                     updateConceptRelease(platformIndex, conceptIndex, 'status', suggestedStatus);
                                   }
                                   // Note: Rollout history is tracked server-side in firebaseReleases.updateRelease()
                                   // when the form is saved, not on every keystroke
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
                                  rolloutErrors[`${platformIndex}-${conceptIndex}`]
                                    ? 'border-red-500 focus:ring-red-500'
                                    : darkMode
                                    ? 'border-gray-600'
                                    : 'border-gray-300'
                                } ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                              />
                              {rolloutErrors[`${platformIndex}-${conceptIndex}`] && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                  <span>⚠</span>
                                  {rolloutErrors[`${platformIndex}-${conceptIndex}`]}
                                </p>
                              )}
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

                           {/* Per-Concept Statuses */}
                           {(conceptRelease.concepts && conceptRelease.concepts.length > 0 && !conceptRelease.concepts.includes('All Concepts')) && (
                             <div className="mt-4">
                               <label className={`block text-sm font-medium mb-2 ${
                                 darkMode ? 'text-gray-300' : 'text-gray-700'
                               }`}>
                                 Concept Statuses
                                 <span className={`ml-1 text-xs font-normal ${
                                   darkMode ? 'text-gray-400' : 'text-gray-500'
                                 }`}>
                                   (per-concept approval status)
                                 </span>
                               </label>
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pr-1">
                                  {conceptRelease.concepts.map(concept => {
                                    const currentStatus = (conceptRelease.conceptStatuses || {})[concept] || '';
                                    return (
                                      <div key={concept} className="flex flex-col">
                                        <span className={`text-xs font-medium mb-1 ${
                                          darkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                          {concept}
                                        </span>
                                        <select
                                          value={currentStatus}
                                          onChange={(e) => {
                                            const newStatuses = { ...(conceptRelease.conceptStatuses || {}) };
                                            if (e.target.value) {
                                              newStatuses[concept] = e.target.value;
                                            } else {
                                              delete newStatuses[concept];
                                            }
                                            updateConceptRelease(platformIndex, conceptIndex, 'conceptStatuses', newStatuses);
                                          }}
                                          className={`w-full px-2 py-1.5 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                                       >
                                         <option value="">Select status</option>
                                         <option value="approved">Approved</option>
                                         <option value="in review">In Review</option>
                                         <option value="pending">Pending</option>
                                         <option value="rejected">Rejected</option>
                                         <option value="rolled out">Rolled Out</option>
                                       </select>
                                     </div>
                                   );
                                 })}
                               </div>
                               {Object.keys(conceptRelease.conceptStatuses || {}).length > 0 && (
                                 <p className={`text-xs mt-2 ${
                                   darkMode ? 'text-gray-400' : 'text-gray-500'
                                 }`}>
                                   Active statuses: {Object.entries(conceptRelease.conceptStatuses || {})
                                     .filter(([_, v]) => v)
                                     .map(([k, v]) => `${k}: ${v}`)
                                     .join(', ')}
                                 </p>
                               )}
                             </div>
                           )}

                          {/* Version-specific Changes — only shown when multiple release versions exist */}
                          {platform.conceptReleases && platform.conceptReleases.length > 1 && (
                          <div className="mt-3">
                            <label className={`block text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Version Changes
                              <span className={`ml-1 text-xs font-normal ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                (What's new in this version — one point per line)
                              </span>
                            </label>
                            <textarea
                              rows={4}
                              value={(conceptRelease.versionChanges || []).join('\n')}
                              onChange={(e) => updateVersionChangesText(platformIndex, conceptIndex, e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
                                darkMode
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                              placeholder={"Fixed checkout crash on iOS 17\nAdded dark mode support\nImproved performance on low-end devices"}
                            />
                          </div>
                          )}
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

            {/* Tags / Labels */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Tags / Labels
                <span className={`ml-2 text-xs font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  (optional — press Enter or comma to add)
                </span>
              </label>
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                darkMode={darkMode}
              />
            </div>

            <div className={`flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 pb-4 border-t sticky bottom-0 ${
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