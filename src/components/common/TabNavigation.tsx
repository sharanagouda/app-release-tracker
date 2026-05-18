import React from 'react';
import { Package, Zap } from 'lucide-react';

export type MainTab = 'releases' | 'codepush';

interface TabNavigationProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  darkMode: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, darkMode }) => {
  const tabs: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'releases', label: 'Releases', icon: Package },
    { id: 'codepush', label: 'CodePush', icon: Zap },
  ];

  return (
    <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
