import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, GripVertical, Lock, Unlock, History, Edit2, Check } from 'lucide-react';
import { ReleaseNote, ColumnDefinition } from '../../types/releaseNote';

export interface ReleaseGroup {
    date: string;
    notes: ReleaseNote[];
    isLocked: boolean;
}

interface ReleaseNotesGridProps {
    groups: ReleaseGroup[];
    columns: ColumnDefinition[];
    onUpdate: (id: string, field: string, value: any) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
    onAddColumn: () => void;
    onColumnReorder: (newColumns: ColumnDefinition[]) => void;
    onColumnRename: (columnId: string, newLabel: string) => void;
    onLockGroup: (date: string) => void;
    onHistory: (note: ReleaseNote) => void;
    onRowReorder?: (noteId: string, newIndex: number, groupDate: string) => void;
    isAdmin: boolean;
    darkMode: boolean;
}

const CellInput: React.FC<{
    value: string;
    onUpdate: (value: string) => void;
    isLocked: boolean;
    darkMode: boolean;
    type?: 'text' | 'textarea';
}> = ({ value, onUpdate, isLocked, darkMode, type = 'text' }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        if (localValue !== value) {
            onUpdate(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && type === 'text') {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    const className = `w-full h-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 px-2 py-1 text-sm outline-none ${darkMode ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'
        } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`;

    if (type === 'textarea') {
        return (
            <textarea
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                className={`${className} resize-none`}
                rows={1}
                style={{ minHeight: '2.5rem' }}
                disabled={isLocked}
                onClick={(e) => e.stopPropagation()}
            />
        );
    }

    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
            disabled={isLocked}
            onClick={(e) => e.stopPropagation()}
        />
    );
};

export const ReleaseNotesGrid: React.FC<ReleaseNotesGridProps> = ({
    groups,
    columns,
    onUpdate,
    onDelete,
    onAdd,
    onAddColumn,
    onColumnReorder,
    onColumnRename,
    onLockGroup,
    onHistory,
    onRowReorder,
    isAdmin,
    darkMode,
}) => {
    const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingColumnLabel, setEditingColumnLabel] = useState('');
    const [draggedRowId, setDraggedRowId] = useState<string | null>(null);

    // Column Drag & Drop
    const handleColDragStart = (index: number) => {
        setDraggedColIndex(index);
    };

    const handleColDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedColIndex === null || draggedColIndex === index) return;

        const newColumns = [...columns];
        const draggedItem = newColumns[draggedColIndex];
        newColumns.splice(draggedColIndex, 1);
        newColumns.splice(index, 0, draggedItem);

        onColumnReorder(newColumns);
        setDraggedColIndex(index);
    };

    const handleColDragEnd = () => {
        setDraggedColIndex(null);
    };

    // Row Drag & Drop
    const handleRowDragStart = (noteId: string) => {
        setDraggedRowId(noteId);
    };

    const handleRowDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleRowDrop = (e: React.DragEvent, targetNoteId: string, groupDate: string, groupNotes: ReleaseNote[]) => {
        e.preventDefault();
        if (!draggedRowId || draggedRowId === targetNoteId || !onRowReorder) return;

        const draggedIndex = groupNotes.findIndex(n => n.id === draggedRowId);
        const targetIndex = groupNotes.findIndex(n => n.id === targetNoteId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            onRowReorder(draggedRowId, targetIndex, groupDate);
        }
        setDraggedRowId(null);
    };

    const handleRowDragEnd = () => {
        setDraggedRowId(null);
    };

    const startColumnEdit = (column: ColumnDefinition) => {
        if (!isAdmin) return;
        setEditingColumnId(column.id);
        setEditingColumnLabel(column.label);
    };

    const saveColumnEdit = () => {
        if (editingColumnId) {
            onColumnRename(editingColumnId, editingColumnLabel);
            setEditingColumnId(null);
        }
    };

    const getInputClass = (isLocked: boolean) => {
        return `w-full h-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 px-2 py-1 text-sm outline-none ${darkMode ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`;
    };

    const renderCell = (note: ReleaseNote, column: ColumnDefinition, isLocked: boolean) => {
        const value = note[column.id] || '';

        if (column.type === 'select' || column.type === 'boolean') {
            return (
                <select
                    value={value}
                    onChange={(e) => onUpdate(note.id, column.id, e.target.value)}
                    className={getInputClass(isLocked)}
                    disabled={!isAdmin || isLocked}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="">Select...</option>
                    {column.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        }

        if (column.type === 'date') {
            return (
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onUpdate(note.id, column.id, e.target.value)}
                    className={getInputClass(isLocked)}
                    disabled={!isAdmin || isLocked}
                    onClick={(e) => e.stopPropagation()}
                />
            );
        }

        if (column.type === 'textarea') {
            return (
                <CellInput
                    value={value}
                    onUpdate={(newValue) => onUpdate(note.id, column.id, newValue)}
                    isLocked={!isAdmin || isLocked}
                    darkMode={darkMode}
                    type="textarea"
                />
            );
        }

        return (
            <CellInput
                value={value}
                onUpdate={(newValue) => onUpdate(note.id, column.id, newValue)}
                isLocked={!isAdmin || isLocked}
                darkMode={darkMode}
                type="text"
            />
        );
    };

    return (
        <div className={`w-full h-full overflow-hidden border rounded-lg flex flex-col ${darkMode ? 'border-[#1E293B] bg-[#111827]' : 'border-gray-200 bg-white'
            }`}>
            <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
                    <thead className={`sticky top-0 z-30 ${darkMode ? 'bg-[#1E293B]' : 'bg-gray-50'}`}>
                        <tr>
                            <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider sticky left-0 z-40 w-12 border-r ${darkMode ? 'bg-[#1E293B] text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'
                                }`}>
                                #
                            </th>
                            {columns.map((column, index) => (
                                <th
                                    key={column.id}
                                    className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[150px] border-r cursor-move group ${darkMode ? 'text-gray-400 border-gray-700 hover:bg-gray-800' : 'text-gray-500 border-gray-200 hover:bg-gray-100'
                                        } ${draggedColIndex === index ? 'opacity-50' : ''}`}
                                    style={{ width: column.width }}
                                    draggable={isAdmin && !editingColumnId}
                                    onDragStart={() => handleColDragStart(index)}
                                    onDragOver={(e) => handleColDragOver(e, index)}
                                    onDragEnd={handleColDragEnd}
                                    onDoubleClick={() => startColumnEdit(column)}
                                >
                                    {editingColumnId === column.id ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={editingColumnLabel}
                                                onChange={(e) => setEditingColumnLabel(e.target.value)}
                                                className={`w-full px-1 py-0.5 text-xs rounded border ${darkMode ? 'bg-[#111827] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                                    }`}
                                                autoFocus
                                                onBlur={saveColumnEdit}
                                                onKeyDown={(e) => e.key === 'Enter' && saveColumnEdit()}
                                            />
                                            <button onClick={saveColumnEdit} className="text-green-500 hover:text-green-600">
                                                <Check className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                {isAdmin && <GripVertical className="w-3 h-3 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                {column.label}
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startColumnEdit(column); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </th>
                            ))}
                            {isAdmin && (
                                <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[100px] border-r ${darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
                                    }`}>
                                    <button
                                        onClick={onAddColumn}
                                        className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Col
                                    </button>
                                </th>
                            )}
                            <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider sticky right-0 z-40 w-24 ${darkMode ? 'bg-[#1E293B] text-gray-400' : 'bg-gray-50 text-gray-500'
                                }`}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'
                        }`}>
                        {groups.map((group) => (
                            <React.Fragment key={group.date}>
                                {/* Group Header */}
                                <tr className={`${darkMode ? 'bg-gray-800/95' : 'bg-gray-100/95'} sticky top-[41px] z-20 shadow-sm`}>
                                    <td colSpan={columns.length + 3} className="px-3 py-2 font-medium text-sm border-y border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                                                {group.date === 'No Date' ? 'Unscheduled' : new Date(group.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => onLockGroup(group.date)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${group.isLocked
                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {group.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                                    {group.isLocked ? 'Locked' : 'Unlocked'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Group Rows */}
                                {group.notes.map((note, index) => (
                                    <tr
                                        key={note.id}
                                        className={`${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} ${draggedRowId === note.id ? 'opacity-50' : ''}`}
                                        draggable={isAdmin && !group.isLocked}
                                        onDragStart={() => handleRowDragStart(note.id)}
                                        onDragOver={handleRowDragOver}
                                        onDrop={(e) => handleRowDrop(e, note.id, group.date, group.notes)}
                                        onDragEnd={handleRowDragEnd}
                                    >
                                        <td className={`px-2 py-2 whitespace-nowrap text-xs sticky left-0 z-20 border-r flex items-center justify-center gap-1 cursor-grab active:cursor-grabbing ${darkMode ? 'bg-[#111827] text-gray-500 border-gray-700' : 'bg-white text-gray-400 border-gray-200'
                                            }`}>
                                            <GripVertical className="w-3 h-3 text-gray-400" />
                                            {index + 1}
                                        </td>
                                        {columns.map((column) => (
                                            <td key={`${note.id}-${column.id}`} className={`p-0 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'
                                                }`}>
                                                {renderCell(note, column, group.isLocked)}
                                            </td>
                                        ))}
                                        {isAdmin && (
                                            <td className={`p-0 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></td>
                                        )}
                                        <td className={`px-2 py-2 whitespace-nowrap text-right sticky right-0 z-20 ${darkMode ? 'bg-[#111827]' : 'bg-white'
                                            }`}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => onHistory(note)}
                                                    className={`p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors`}
                                                    title="View History"
                                                >
                                                    <History className="w-3.5 h-3.5" />
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => onDelete(note.id)}
                                                        className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors ${group.isLocked ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                        disabled={group.isLocked}
                                                        title="Delete row"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}

                        {/* Add Row Button (Last Row) */}
                        {isAdmin && (
                            <tr>
                                <td colSpan={columns.length + 3} className="p-0">
                                    <button
                                        onClick={onAdd}
                                        className={`w-full flex items-center justify-start gap-2 px-4 py-2 text-sm font-medium transition-colors ${darkMode
                                            ? 'text-blue-400 hover:bg-blue-900/20'
                                            : 'text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Row
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
