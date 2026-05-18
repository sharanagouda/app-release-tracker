import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;        // SVG width/height in px
  strokeWidth?: number;
  label: string;        // e.g., "Rollout", "Active Installs"
  color?: string;       // Tailwind stroke class e.g., "stroke-blue-500"
  darkMode: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  color = 'stroke-blue-500',
  darkMode,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={darkMode ? 'stroke-gray-700' : 'stroke-gray-200'}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${color} transition-all duration-500 ease-out`}
          />
        </svg>
        {/* Percentage text in the center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );
};
