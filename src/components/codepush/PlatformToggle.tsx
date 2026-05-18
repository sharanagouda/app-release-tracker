import React from 'react';
import { Smartphone, Tablet } from 'lucide-react';
import { CodePushPlatform, PLATFORMS } from '../../config/codepushApps';

interface PlatformToggleProps {
  selected: CodePushPlatform;
  onChange: (platform: CodePushPlatform) => void;
  darkMode: boolean;
}

const PLATFORM_ICONS: Record<CodePushPlatform, React.ElementType> = {
  iOS: Tablet,
  Android: Smartphone,
};

export const PlatformToggle: React.FC<PlatformToggleProps> = ({ selected, onChange, darkMode }) => {
  return (
    <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      {PLATFORMS.map((platform) => {
        const Icon = PLATFORM_ICONS[platform];
        const isActive = selected === platform;
        return (
          <button
            key={platform}
            onClick={() => onChange(platform)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? darkMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-blue-600 shadow-sm'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {platform}
          </button>
        );
      })}
    </div>
  );
};
