import React, { useState, useEffect } from 'react';
import { Globe, Truck, Plus, Settings, FileText, Search, Calendar, X, Download, Upload } from 'lucide-react';
import { ReleaseNote, ReleaseNoteType, ColumnDefinition } from '../../types/releaseNote';
import { getReleaseNotes, addReleaseNote, updateReleaseNote, deleteReleaseNote } from '../../services/firebaseReleaseNotes';
import { ReleaseNotesGrid, ReleaseGroup } from './ReleaseNotesGrid';
import { releaseNoteConfigs } from '../../config/releaseNoteColumns';
import { exportReleaseNotesToCSV } from '../../utils/export';
import { getSheetConfig, saveSheetConfig, SheetConfig, getSheets, saveSheets } from '../../services/firebaseConfigs';

interface ReleaseNotesProps {
  isAdmin: boolean;
  onAuthRequired: (action: string) => void;
  darkMode: boolean;
}

interface ReleaseVersion {
  type: ReleaseNoteType;
  version: string;
  icon: React.ReactNode;
}

export const ReleaseNotes: React.FC<ReleaseNotesProps> = ({
  isAdmin,
  onAuthRequired,
  darkMode,
}) => {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [selectedType, setSelectedType] = useState<ReleaseNoteType>('Hybris Hotfix');
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumn, setNewColumn] = useState<{ name: string; type: 'text' | 'boolean' | 'date' | 'textarea' | 'select' }>({ name: '', type: 'text' });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // History Modal
  const [historyNote, setHistoryNote] = useState<ReleaseNote | null>(null);

  // Locked Dates
  const [lockedDates, setLockedDates] = useState<string[]>([]);

  // Dynamic sheets state
  const [sheets, setSheets] = useState<ReleaseVersion[]>([
    {
      type: 'Hybris Hotfix',
      version: 'v24.04',
      icon: <Globe className="w-4 h-4" />
    },
    {
      type: 'BLC Hotfix',
      version: 'v12.1.0',
      icon: <Globe className="w-4 h-4" />
    },
    {
      type: 'LMD Theme Release',
      version: 'v8.4.2',
      icon: <Truck className="w-4 h-4" />
    },
  ]);
  const [isAddSheetModalOpen, setIsAddSheetModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');

  useEffect(() => {
    const loadSheets = async () => {
      const savedSheets = await getSheets();
      if (savedSheets) {
        const reconstructedSheets = savedSheets.map((s: any) => ({
          ...s,
          icon: s.type.includes('Hybris') || s.type.includes('BLC') ? <Globe className="w-4 h-4" /> : <Truck className="w-4 h-4" />
        }));
        setSheets(reconstructedSheets);
      } else {
        // Fallback to local storage if Firestore fails or is empty
        const localSheets = localStorage.getItem('release_sheets');
        if (localSheets) {
          const parsedSheets = JSON.parse(localSheets);
          const reconstructedSheets = parsedSheets.map((s: any) => ({
            ...s,
            icon: s.type.includes('Hybris') || s.type.includes('BLC') ? <Globe className="w-4 h-4" /> : <Truck className="w-4 h-4" />
          }));
          setSheets(reconstructedSheets);
        }
      }
    };
    loadSheets();
  }, []);

  useEffect(() => {
    fetchReleaseNotes();
    loadConfig();
  }, [selectedType]);

  const loadConfig = async () => {
    const config = await getSheetConfig(selectedType);

    if (config) {
      setColumns(config.columns);
      setLockedDates(config.lockedDates || []);
    } else {
      const defaultConfig = releaseNoteConfigs.find(c => c.type === selectedType);
      const savedColumns = localStorage.getItem(`columns_${selectedType}`);
      const savedLockedDates = localStorage.getItem(`lockedDates_${selectedType}`);

      if (savedColumns) {
        setColumns(JSON.parse(savedColumns));
      } else if (defaultConfig) {
        setColumns(defaultConfig.columns);
      } else {
        setColumns([
          { id: 'date', label: 'Date', type: 'date', width: '120px' },
          { id: 'description', label: 'Description', type: 'textarea', width: '300px' }
        ]);
      }

      if (savedLockedDates) {
        setLockedDates(JSON.parse(savedLockedDates));
      } else {
        setLockedDates([]);
      }
    }
  };

  const saveConfig = async (newColumns: ColumnDefinition[], newLockedDates: string[]) => {
    const config: SheetConfig = {
      type: selectedType,
      columns: newColumns,
      lockedDates: newLockedDates
    };
    await saveSheetConfig(config);

    localStorage.setItem(`columns_${selectedType}`, JSON.stringify(newColumns));
    localStorage.setItem(`lockedDates_${selectedType}`, JSON.stringify(newLockedDates));
  };

  const fetchReleaseNotes = async () => {
    setLoading(true);
    try {
      const notes = await getReleaseNotes(selectedType);
      // Sort by createdAt DESC (newest first)
      notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReleaseNotes(notes);
    } catch (error) {
      console.error('Error fetching release notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = async () => {
    if (isAdmin) {
      try {
        const newNote: Omit<ReleaseNote, 'id' | 'createdAt' | 'updatedAt'> = {
          type: selectedType,
        };
        await addReleaseNote(newNote);
        fetchReleaseNotes();
      } catch (error) {
        console.error('Error adding release note:', error);
      }
    } else {
      onAuthRequired('add a new release note');
    }
  };

  const handleUpdateCell = async (id: string, field: string, value: any) => {
    if (isAdmin) {
      const oldNote = releaseNotes.find(n => n.id === id);
      const oldValue = oldNote ? oldNote[field] : undefined;

      setReleaseNotes(prev => prev.map(note =>
        note.id === id ? { ...note, [field]: value } : note
      ));

      try {
        const historyEntry = {
          field,
          oldValue,
          newValue: value,
          updatedBy: 'User', // Will be overwritten by backend
          updatedAt: new Date().toISOString()
        };
        await updateReleaseNote(id, { [field]: value }, historyEntry);
      } catch (error) {
        console.error('Error updating release note:', error);
        fetchReleaseNotes();
      }
    } else {
      onAuthRequired('edit this release note');
    }
  };

  const handleRowReorder = async (noteId: string, newIndex: number, groupDate: string) => {
    if (!isAdmin) {
      onAuthRequired('reorder rows');
      return;
    }

    // Find notes in the same group
    const groupNotes = releaseNotes.filter(n => {
      const date = n.hotfixDate || n.releaseDate;
      return date === groupDate || (!date && groupDate === 'No Date');
    });

    // Sort them by current order (createdAt desc by default)
    groupNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const currentIndex = groupNotes.findIndex(n => n.id === noteId);
    if (currentIndex === -1 || currentIndex === newIndex) return;

    // Calculate new createdAt for the moved note to fit in the new position
    // We'll swap the createdAt timestamps to reorder
    const targetNote = groupNotes[newIndex];
    const movedNote = groupNotes[currentIndex];

    if (!targetNote || !movedNote) return;

    // Optimistic update
    const newNotes = [...releaseNotes];
    const movedNoteIndex = newNotes.findIndex(n => n.id === noteId);
    const targetNoteIndex = newNotes.findIndex(n => n.id === targetNote.id);

    if (movedNoteIndex !== -1 && targetNoteIndex !== -1) {
      // Swap createdAt values
      const tempCreatedAt = newNotes[movedNoteIndex].createdAt;
      newNotes[movedNoteIndex].createdAt = newNotes[targetNoteIndex].createdAt;
      newNotes[targetNoteIndex].createdAt = tempCreatedAt;

      setReleaseNotes(newNotes);

      try {
        // Update both notes in Firestore
        await updateReleaseNote(movedNote.id, { createdAt: newNotes[movedNoteIndex].createdAt });
        await updateReleaseNote(targetNote.id, { createdAt: newNotes[targetNoteIndex].createdAt });
      } catch (error) {
        console.error('Error reordering rows:', error);
        fetchReleaseNotes();
      }
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (isAdmin) {
      if (window.confirm('Are you sure you want to delete this row?')) {
        try {
          await deleteReleaseNote(id);
          fetchReleaseNotes();
        } catch (error) {
          console.error('Error deleting release note:', error);
        }
      }
    } else {
      onAuthRequired('delete this release note');
    }
  };

  const handleLockGroup = (date: string) => {
    if (isAdmin) {
      const newLockedDates = lockedDates.includes(date)
        ? lockedDates.filter(d => d !== date)
        : [...lockedDates, date];

      setLockedDates(newLockedDates);
      saveConfig(columns, newLockedDates);
    } else {
      onAuthRequired('lock/unlock this release group');
    }
  };

  const handleAddColumn = () => {
    if (!newColumn.name) return;

    const id = newColumn.name.toLowerCase().replace(/\s+/g, '_');
    const newCol: ColumnDefinition = {
      id,
      label: newColumn.name,
      type: newColumn.type,
      width: '150px',
      options: newColumn.type === 'boolean' ? ['Yes', 'No'] : undefined
    };

    if (newColumn.type === 'boolean') {
      newCol.type = 'select';
      newCol.options = ['Yes', 'No'];
    }

    const updatedColumns = [...columns, newCol];
    setColumns(updatedColumns);
    saveConfig(updatedColumns, lockedDates);
    setIsAddColumnModalOpen(false);
    setNewColumn({ name: '', type: 'text' });
  };

  const handleColumnReorder = (newColumns: ColumnDefinition[]) => {
    setColumns(newColumns);
    saveConfig(newColumns, lockedDates);
  };

  const handleColumnRename = (columnId: string, newLabel: string) => {
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, label: newLabel } : col
    );
    setColumns(updatedColumns);
    saveConfig(updatedColumns, lockedDates);
  };

  const handleAddSheet = async () => {
    if (!newSheetName) return;

    const newSheet: ReleaseVersion = {
      type: newSheetName as ReleaseNoteType,
      version: 'v1.0',
      icon: <FileText className="w-4 h-4" />
    };

    const newSheets = [...sheets, newSheet];
    setSheets(newSheets);
    await saveSheets(newSheets);
    localStorage.setItem('release_sheets', JSON.stringify(newSheets));

    setSelectedType(newSheet.type);
    setIsAddSheetModalOpen(false);
    setNewSheetName('');
  };

  const handleExportCSV = () => {
    exportReleaseNotesToCSV(releaseNotes, columns);
  };

  // Grouping Logic
  const filteredNotes = releaseNotes.filter(note => {
    const matchesSearch = Object.values(note).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesDate = !dateFilter || (note.hotfixDate && note.hotfixDate === dateFilter) || (note.releaseDate && note.releaseDate === dateFilter);
    return matchesSearch && matchesDate;
  });

  const groupedNotes: ReleaseGroup[] = [];
  const notesByDate: Record<string, ReleaseNote[]> = {};
  const noDateNotes: ReleaseNote[] = [];

  filteredNotes.forEach(note => {
    const date = note.hotfixDate || note.releaseDate;
    if (date) {
      if (!notesByDate[date]) {
        notesByDate[date] = [];
      }
      notesByDate[date].push(note);
    } else {
      noDateNotes.push(note);
    }
  });

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(notesByDate).sort((a, b) => {
    // Parse dates in DD/MM/YYYY format
    const parseDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day).getTime();
    };

    // Try parsing as standard date first, then fallback to DD/MM/YYYY
    let timeA = new Date(a).getTime();
    let timeB = new Date(b).getTime();

    if (isNaN(timeA)) timeA = parseDate(a);
    if (isNaN(timeB)) timeB = parseDate(b);

    // If both are invalid dates (e.g. "No Date"), treat them as equal or handle specifically
    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1; // Invalid dates go to bottom
    if (isNaN(timeB)) return -1;

    // Sort Ascending (Earliest/Nearest Future Date first) as requested
    return timeA - timeB;
  });

  sortedDates.forEach(date => {
    groupedNotes.push({
      date,
      notes: notesByDate[date], // Already sorted by createdAt DESC
      isLocked: lockedDates.includes(date)
    });
  });

  if (noDateNotes.length > 0) {
    groupedNotes.push({
      date: 'No Date',
      notes: noDateNotes,
      isLocked: lockedDates.includes('No Date')
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters Bar */}
      <div className={`flex items-center gap-4 mb-4 p-2 rounded-lg ${darkMode ? 'bg-[#1E293B]' : 'bg-white border border-gray-200'
        }`}>
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          <input
            type="text"
            placeholder="Search release notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-1.5 text-sm rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode
              ? 'bg-[#111827] border-gray-600 text-white placeholder-gray-500'
              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-3 py-1.5 text-sm rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode
              ? 'bg-[#111827] border-gray-600 text-white'
              : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${darkMode
              ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {loading ? (
          <div className="text-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${darkMode ? 'border-blue-400' : 'border-blue-600'
              }`}></div>
          </div>
        ) : (
          <ReleaseNotesGrid
            groups={groupedNotes}
            columns={columns}
            onUpdate={handleUpdateCell}
            onDelete={handleDeleteRow}
            onAdd={handleAddRow}
            onAddColumn={() => setIsAddColumnModalOpen(true)}
            onColumnReorder={handleColumnReorder}
            onColumnRename={handleColumnRename}
            onLockGroup={handleLockGroup}
            onHistory={setHistoryNote}
            onRowReorder={handleRowReorder}
            isAdmin={isAdmin}
            darkMode={darkMode}
          />
        )}
      </div>

      {/* Bottom Tabs (Sticky) */}
      <div className={`mt-auto pt-2 border-t overflow-x-auto flex items-center gap-1 flex-shrink-0 ${darkMode ? 'border-gray-700 bg-[#0F1629]' : 'border-gray-200 bg-gray-100'
        }`}>
        {sheets.map((rv) => (
          <button
            key={rv.type}
            onClick={() => setSelectedType(rv.type)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-t-lg ${selectedType === rv.type
              ? darkMode
                ? 'bg-[#1E293B] text-blue-400 border-t border-x border-gray-700'
                : 'bg-white text-blue-600 border-t border-x border-gray-200 shadow-sm'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-[#1E293B]/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
          >
            {rv.icon}
            <span>
              {rv.type} {rv.version && <span className="text-xs opacity-70">({rv.version})</span>}
            </span>
          </button>
        ))}

        <button
          onClick={() => setIsAddSheetModalOpen(true)}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${darkMode
            ? 'text-gray-400 hover:text-white hover:bg-[#1E293B]'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          title="Add new sheet"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Column Modal */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-xl ${darkMode ? 'bg-[#111827] border border-[#1E293B]' : 'bg-white'
            }`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add New Column
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Column Name
                </label>
                <input
                  type="text"
                  value={newColumn.name}
                  onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode
                    ? 'bg-[#1E293B] border-[#2D3B4F] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  placeholder="e.g. Verified By"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Column Type
                </label>
                <select
                  value={newColumn.type}
                  onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value as any })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode
                    ? 'bg-[#1E293B] border-[#2D3B4F] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="text">Text</option>
                  <option value="boolean">Boolean (Yes/No)</option>
                  <option value="date">Date</option>
                  <option value="textarea">Long Text</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddColumnModalOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddColumn}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sheet Modal */}
      {isAddSheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-xl ${darkMode ? 'bg-[#111827] border border-[#1E293B]' : 'bg-white'
            }`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Create New Sheet
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sheet Name
                </label>
                <input
                  type="text"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode
                    ? 'bg-[#1E293B] border-[#2D3B4F] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  placeholder="e.g. Q3 Release Tracker"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddSheetModalOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSheet}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Create Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-xl ${darkMode ? 'bg-[#111827] border border-[#1E293B]' : 'bg-white'
            }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Row History
              </h3>
              <button onClick={() => setHistoryNote(null)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {historyNote.history && historyNote.history.length > 0 ? (
                historyNote.history.map((entry, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-[#1E293B]' : 'bg-gray-50'}`}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{new Date(entry.updatedAt).toLocaleString()}</span>
                      <span>{entry.updatedBy}</span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Changed <strong>{entry.field}</strong> from "{String(entry.oldValue)}" to "{String(entry.newValue)}"
                    </p>
                  </div>
                ))
              ) : (
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-[#1E293B]' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No history available.
                  </p>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Created: {new Date(historyNote.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setHistoryNote(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
