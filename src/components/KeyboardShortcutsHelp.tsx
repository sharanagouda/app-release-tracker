import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutRow {
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: ['N'], description: 'Add new release' },
  { keys: ['/'], description: 'Focus search bar' },
  { keys: ['Esc'], description: 'Close modal / clear search' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['←'], description: 'Previous page' },
  { keys: ['→'], description: 'Next page' },
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

const KeyBadge: React.FC<{ label: string; darkMode: boolean }> = ({ label, darkMode }) => (
  <kbd
    className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded text-xs font-mono font-semibold border shadow-sm ${
      darkMode
        ? 'bg-gray-700 border-gray-500 text-gray-200'
        : 'bg-gray-100 border-gray-300 text-gray-700'
    }`}
  >
    {label}
  </kbd>
);

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
  darkMode = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`rounded-xl shadow-xl w-full max-w-sm border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Keyboard className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-5 py-4 space-y-3">
          {SHORTCUTS.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, kIdx) => (
                  <React.Fragment key={kIdx}>
                    {kIdx > 0 && (
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>+</span>
                    )}
                    <KeyBadge label={key} darkMode={darkMode} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`px-5 py-3 border-t text-xs ${
          darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'
        }`}>
          Shortcuts are disabled when typing in a text field.
        </div>
      </div>
    </div>
  );
};
