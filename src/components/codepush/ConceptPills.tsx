import React from 'react';
import { ConceptConfig, CONCEPT_COLORS } from '../../config/codepushApps';

interface ConceptPillsProps {
  concepts: ConceptConfig[];
  selectedKey: string;           // The appNameKey of the selected concept
  onChange: (concept: ConceptConfig) => void;
  darkMode: boolean;
}

// Map concept display names to icon filenames in public/img/
// Only include concepts that actually have an icon file
const CONCEPT_ICONS: Record<string, string> = {
  Babyshop: '/img/babyshop.png',
  Centrepoint: '/img/centrepoint.png',
  Homebox: '/img/homebox.png',
  Homecentre: '/img/homecentre.png',
  Max: '/img/max.png',
  Mothercare: '/img/mothercare.png',
  Splash: '/img/splash.png',
};

export const ConceptPills: React.FC<ConceptPillsProps> = ({ concepts, selectedKey, onChange, darkMode }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {concepts.map((concept) => {
        const colors = CONCEPT_COLORS[concept.name] || CONCEPT_COLORS['Babyshop'];
        const isActive = selectedKey === concept.appNameKey;
        const iconSrc = CONCEPT_ICONS[concept.name];
        return (
          <button
            key={concept.appNameKey}
            onClick={() => onChange(concept)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${
              isActive
                ? darkMode
                  ? `${colors.darkBg} ${colors.darkText} ring-2 ring-offset-1 ring-offset-gray-900 ring-current`
                  : `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-current`
                : darkMode
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
          >
            {iconSrc && (
              <img
                src={iconSrc}
                alt={concept.name}
                className="w-7 h-7 rounded-full object-contain"
              />
            )}
            {concept.name}
          </button>
        );
      })}
    </div>
  );
};
