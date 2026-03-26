import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ReleaseNote, ReleaseNoteType } from '../../types/releaseNote';
import { releaseNoteConfigs } from '../../config/releaseNoteColumns';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (releaseNote: Omit<ReleaseNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: ReleaseNote | null;
  darkMode: boolean;
}

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  darkMode,
}) => {
  const [type, setType] = useState<ReleaseNoteType>('Hybris Hotfix');
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setFormData(initialData);
    } else {
      setType('Hybris Hotfix');
      setFormData({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const currentConfig = releaseNoteConfigs.find((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      ...formData,
    });
  };

  const handleInputChange = (id: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full bg-[#111827] border border-[#1E293B]">
          <div className="px-6 py-5 border-b border-[#1E293B]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-semibold text-white">
                {initialData ? 'Edit Release Note' : 'Add Release Note'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1E293B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {!initialData && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Release Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as ReleaseNoteType);
                      setFormData({});
                    }}
                    className="block w-full rounded-lg border border-[#2D3B4F] bg-[#1E293B] text-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {releaseNoteConfigs.map((config) => (
                      <option key={config.type} value={config.type}>
                        {config.type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                {currentConfig?.columns.map((column) => (
                  <div key={column.id} className={column.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label
                      htmlFor={column.id}
                      className="block text-sm font-medium mb-2 text-gray-300"
                    >
                      {column.label} {column.required && <span className="text-red-400">*</span>}
                    </label>

                    {column.type === 'textarea' ? (
                      <textarea
                        id={column.id}
                        required={column.required}
                        value={formData[column.id] || ''}
                        onChange={(e) => handleInputChange(column.id, e.target.value)}
                        rows={3}
                        className="block w-full rounded-lg border border-[#2D3B4F] bg-[#1E293B] text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    ) : column.type === 'select' ? (
                      <select
                        id={column.id}
                        required={column.required}
                        value={formData[column.id] || ''}
                        onChange={(e) => handleInputChange(column.id, e.target.value)}
                        className="block w-full rounded-lg border border-[#2D3B4F] bg-[#1E293B] text-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select...</option>
                        {column.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={column.type === 'date' ? 'date' : 'text'}
                        id={column.id}
                        required={column.required}
                        value={formData[column.id] || ''}
                        onChange={(e) => handleInputChange(column.id, e.target.value)}
                        className="block w-full rounded-lg border border-[#2D3B4F] bg-[#1E293B] text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 flex justify-end gap-3 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 rounded-lg hover:bg-[#1E293B] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
