import React from 'react';
import { Territory, TERRITORIES } from '../../config/codepushApps';

interface TerritoryToggleProps {
  selected: Territory;
  onChange: (territory: Territory) => void;
  darkMode: boolean;
}

export const TerritoryToggle: React.FC<TerritoryToggleProps> = ({ selected, onChange, darkMode }) => {
  return (
    <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      {TERRITORIES.map((t) => {
        const isActive = selected === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? darkMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-indigo-600 shadow-sm'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};
