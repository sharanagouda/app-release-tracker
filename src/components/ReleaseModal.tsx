import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Release, PlatformRelease } from '../types/release';
import { CONCEPTS, PLATFORMS } from '../data/mockData';

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingRelease?: Release;
}

const initialPlatformData: PlatformRelease = {
  platform: 'iOS',
  version: '',
  buildId: '',
  rolloutPercentage: 0,
  status: 'In Progress',
  notes: ''
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
    concept: '',
    platforms: [
      { ...initialPlatformData, platform: 'iOS' as const },
      { ...initialPlatformData, platform: 'Android GMS' as const },
      { ...initialPlatformData, platform: 'Android HMS' as const }
    ] as PlatformRelease[],
    changes: [''],
    notes: '',
  });

  useEffect(() => {
    if (editingRelease) {
      setFormData({
        releaseDate: editingRelease.releaseDate,
        releaseName: editingRelease.releaseName,
        concept: editingRelease.concept,
        platforms: editingRelease.platforms,
        changes: editingRelease.changes,
        notes: editingRelease.notes || '',
      });
    } else {
      setFormData({
        releaseDate: '',
        releaseName: '',
        concept: '',
        platforms: [
          { ...initialPlatformData, platform: 'iOS' },
          { ...initialPlatformData, platform: 'Android GMS' },
          { ...initialPlatformData, platform: 'Android HMS' }
        ],
        changes: [''],
        notes: '',
      });
    }
  }, [editingRelease, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredChanges = formData.changes.filter(change => change.trim() !== '');
    const validPlatforms = formData.platforms.filter(p => p.version && p.buildId);
    
    onSave({
      ...formData,
      platforms: validPlatforms,
      changes: filteredChanges,
    });
    onClose();
  };

  const updatePlatform = (index: number, field: keyof PlatformRelease, value: any) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.map((platform, i) => 
        i === index ? { ...platform, [field]: value } : platform
      )
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
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
                Release Date
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
                Release Name
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
                Concept
              </label>
              <select
                required
                value={formData.concept}
                onChange={(e) => setFormData(prev => ({ ...prev, concept: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Concept</option>
                {CONCEPTS.map(concept => (
                  <option key={concept} value={concept}>{concept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Details</h3>
            <div className="space-y-4">
              {formData.platforms.map((platform, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">{getPlatformIcon(platform.platform)}</span>
                    <h4 className="font-medium text-gray-900">{platform.platform}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Version
                      </label>
                      <input
                        type="text"
                        value={platform.version}
                        onChange={(e) => updatePlatform(index, 'version', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 10.34.2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Build ID
                      </label>
                      <input
                        type="text"
                        value={platform.buildId}
                        onChange={(e) => updatePlatform(index, 'buildId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 7055"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rollout %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={platform.rolloutPercentage}
                        onChange={(e) => {
                          const percentage = Number(e.target.value);
                          updatePlatform(index, 'rolloutPercentage', percentage);
                          // Auto-update status based on percentage
                          const newStatus = percentage === 100 ? 'Complete' : 
                                          percentage === 0 ? 'Paused' : 'In Progress';
                          updatePlatform(index, 'status', newStatus);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status (Auto-updated)
                      </label>
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {platform.rolloutPercentage === 100 ? 'Complete' : 
                         platform.rolloutPercentage === 0 ? 'Paused' : 'In Progress'}
                      </div>
                      {/* Hidden select for form compatibility */}
                      <select
                        value={platform.status}
                        onChange={(e) => updatePlatform(index, 'status', e.target.value)}
                        className="hidden"
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Complete">Complete</option>
                        <option value="Paused">Paused</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Notes
                    </label>
                    <textarea
                      rows={2}
                      type="text"
                      value={platform.notes || ''}
                      onChange={(e) => updatePlatform(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Platform-specific notes, build links, environment details..."
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Build Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={platform.buildLink || ''}
                      onChange={(e) => updatePlatform(index, 'buildLink', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://sharepoint.com/builds/..."
                    />
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

          <div className="flex justify-end space-x-3 pt-6 border-t">
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