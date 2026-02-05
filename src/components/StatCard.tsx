import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'yellow' | 'green' | 'red';
  darkMode?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  darkMode = false,
  trend 
}) => {
  const colorClasses = {
    blue: darkMode 
      ? 'bg-blue-900/20 border-blue-800/50 text-blue-300' 
      : 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: darkMode 
      ? 'bg-yellow-900/20 border-yellow-800/50 text-yellow-300' 
      : 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: darkMode 
      ? 'bg-green-900/20 border-green-800/50 text-green-300' 
      : 'bg-green-50 border-green-200 text-green-700',
    red: darkMode 
      ? 'bg-red-900/20 border-red-800/50 text-red-300' 
      : 'bg-red-50 border-red-200 text-red-700',
  };

  const iconColorClasses = {
    blue: darkMode ? 'text-blue-400' : 'text-blue-600',
    yellow: darkMode ? 'text-yellow-400' : 'text-yellow-600',
    green: darkMode ? 'text-green-400' : 'text-green-600',
    red: darkMode ? 'text-red-400' : 'text-red-600',
  };

  return (
    <div className={`rounded-lg border-2 p-4 sm:p-6 transition-all duration-200 hover:shadow-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium opacity-75 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <div className="flex flex-wrap items-center mt-1 sm:mt-2 gap-1">
              <span className={`text-xs font-medium ${
                trend.isPositive 
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className={`text-xs ${
                darkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                from last week
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${iconColorClasses[color]}`} />
        </div>
      </div>
    </div>
  );
};