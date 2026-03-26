import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { ReleaseNote, ReleaseNoteType } from '../../types/releaseNote';
import { releaseNoteConfigs } from '../../config/releaseNoteColumns';

interface ReleaseNotesTableProps {
  releaseNotes: ReleaseNote[];
  type: ReleaseNoteType;
  onEdit: (releaseNote: ReleaseNote) => void;
  onDelete: (releaseNote: ReleaseNote) => void;
  isAdmin: boolean;
  onAuthRequired: (action: string) => void;
  darkMode: boolean;
}

export const ReleaseNotesTable: React.FC<ReleaseNotesTableProps> = ({
  releaseNotes,
  type,
  onEdit,
  onDelete,
  isAdmin,
  onAuthRequired,
  darkMode,
}) => {
  const config = releaseNoteConfigs.find((c) => c.type === type);

  if (!config) return null;

  // Show only key columns in the table for readability
  const visibleColumns = config.columns.slice(0, 6);

  const handleEdit = (releaseNote: ReleaseNote) => {
    if (isAdmin) {
      onEdit(releaseNote);
    } else {
      onAuthRequired('edit this release note');
    }
  };

  const handleDelete = (releaseNote: ReleaseNote) => {
    if (isAdmin) {
      onDelete(releaseNote);
    } else {
      onAuthRequired('delete this release note');
    }
  };

  if (releaseNotes.length === 0) {
    return (
      <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-300 mb-1">No release notes found</p>
        <p className="text-sm text-gray-500">
          No release notes found for {type}. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#111827] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E293B]">
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {column.label}
                </th>
              ))}
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {releaseNotes.map((note) => (
              <tr
                key={note.id}
                className="hover:bg-[#1E293B]/50 transition-colors"
              >
                {visibleColumns.map((column) => (
                  <td
                    key={column.id}
                    className="px-5 py-4 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                  >
                    {column.type === 'date' && note[column.id]
                      ? new Date(note[column.id]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : note[column.id] || <span className="text-gray-600">—</span>}
                  </td>
                ))}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(note)}
                      className={`p-1.5 rounded-lg transition-colors ${isAdmin
                          ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                          : 'text-gray-600 cursor-not-allowed'
                        }`}
                      title={isAdmin ? 'Edit' : 'Admin access required'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note)}
                      className={`p-1.5 rounded-lg transition-colors ${isAdmin
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                          : 'text-gray-600 cursor-not-allowed'
                        }`}
                      title={isAdmin ? 'Delete' : 'Admin access required'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
