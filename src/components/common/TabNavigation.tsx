import React from 'react';
import { NavLink } from 'react-router-dom';
import { Package, Zap } from 'lucide-react';

export type MainTab = 'releases' | 'codepush';

interface TabNavigationProps {
  darkMode: boolean;
}

const tabs: { id: MainTab; label: string; icon: React.ElementType; to: string }[] = [
  { id: 'releases', label: 'Releases', icon: Package, to: '/releases' },
  { id: 'codepush', label: 'CodePush', icon: Zap, to: '/codepush' },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ darkMode }) => {
  return (
    <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.id}
            to={tab.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? darkMode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-blue-600 shadow-sm'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
};
