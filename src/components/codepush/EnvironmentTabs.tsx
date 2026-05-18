import React from 'react';
import { CodePushEnvironment } from '../../config/codepushApps';

interface EnvironmentTabsProps {
  environments: CodePushEnvironment[];
  selected: CodePushEnvironment;
  onChange: (env: CodePushEnvironment) => void;
  darkMode: boolean;
}

const ENV_LABELS: Record<CodePushEnvironment, string> = {
  Production: 'Production',
  ProductionStaging: 'Prod Staging',
  Staging: 'Staging',
};

export const EnvironmentTabs: React.FC<EnvironmentTabsProps> = ({ environments, selected, onChange, darkMode }) => {
  return (
    <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {environments.map((env) => {
        const isActive = selected === env;
        return (
          <button
            key={env}
            onClick={() => onChange(env)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? darkMode
                  ? 'border-green-400 text-green-400'
                  : 'border-green-600 text-green-700'
                : darkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {ENV_LABELS[env]}
          </button>
        );
      })}
    </div>
  );
};
