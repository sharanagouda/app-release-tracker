import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Save, Link, AlertCircle } from 'lucide-react';
import { TeamsGroup } from '../services/firebaseConfig';

interface TeamsGroupsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamsGroups: TeamsGroup[];
  onAddGroup: (name: string, url: string) => Promise<void>;
  onUpdateGroup: (id: string, name: string, url: string) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  darkMode?: boolean;
}

export const TeamsGroupsConfigModal: React.FC<TeamsGroupsConfigModalProps> = ({
  isOpen,
  onClose,
  teamsGroups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  darkMode = false,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupUrl, setNewGroupUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newGroupName.trim() || !newGroupUrl.trim()) {
      setError('Please enter both name and URL');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onAddGroup(newGroupName.trim(), newGroupUrl.trim());
      setNewGroupName('');
      setNewGroupUrl('');
      setIsAdding(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to add group');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (group: TeamsGroup) => {
    setEditingId(group.id);
    setEditName(group.name);
    setEditUrl(group.url);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editUrl.trim() || !editingId) {
      setError('Please enter both name and URL');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onUpdateGroup(editingId, editName.trim(), editUrl.trim());
      setEditingId(null);
      setEditName('');
      setEditUrl('');
    } catch (err) {
      setError('Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      try {
        setSaving(true);
        setError(null);
        await onDeleteGroup(id);
      } catch (err) {
        setError('Failed to delete group');
      } finally {
        setSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-2xl my-4 max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Link className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className="text-lg font-semibold">Manage Teams Groups</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure the Teams groups that appear in the "Share to Teams" modal. These groups will be available for all users when sharing release updates.
          </p>

          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Add new group form */}
          {isAdding && (
            <div className={`rounded-lg p-4 mb-4 ${
              darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Add New Teams Group
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Mobile Releases"
                    className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Teams Chat URL
                  </label>
                  <input
                    type="text"
                    value={newGroupUrl}
                    onChange={(e) => setNewGroupUrl(e.target.value)}
                    placeholder="https://teams.microsoft.com/l/chat/..."
                    className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setIsAdding(false); setNewGroupName(''); setNewGroupUrl(''); setError(null); }}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      darkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing groups list */}
          <div className="space-y-3">
            {teamsGroups.map((group) => (
              <div
                key={group.id}
                className={`rounded-lg p-4 ${
                  darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {editingId === group.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Teams Chat URL
                      </label>
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditName(''); setEditUrl(''); setError(null); }}
                        className={`px-3 py-1.5 rounded-lg border text-sm ${
                          darkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {group.name}
                      </div>
                      <div className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {group.url}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(group)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          darkMode
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        disabled={saving}
                        className={`p-1.5 rounded-lg transition-colors ${
                          darkMode
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                        }`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {teamsGroups.length === 0 && !isAdding && (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No Teams groups configured. Click "Add Group" to create one.
            </div>
          )}
        </div>

        <div className={`flex justify-between gap-3 px-5 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Group
          </button>
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
        </div>
      </div>
    </div>
  );
};