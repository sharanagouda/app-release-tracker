import React from 'react';
import { Search, Filter, Calendar, Download } from 'lucide-react';
import { FilterOptions } from '../types/release';
import { ENVIRONMENTS, PLATFORMS } from '../data/mockData';

interface FilterBarProps {
  filters: Partial<FilterOptions>;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  darkMode?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  searchTerm,
  onSearchChange,
  onExportCSV,
  onExportJSON,
  darkMode = false,
}) => {
  return (
    <div className={`rounded-lg shadow-sm border p-4 mb-6 space-y-4 ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search and Sort Section */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search by name, environment, version, or build ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.sortBy || 'releaseDate'}
              onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
              className={`px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              style={{ 
                backgroundImage: darkMode 
                  ? 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")'
                  : 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', 
                backgroundPosition: 'right 0.5rem center', 
                backgroundRepeat: 'no-repeat', 
                backgroundSize: '1.5em 1.5em' 
              }}
            >
              <option value="releaseDate">Release Date</option>
              <option value="lastUpdate">Last Update</option>
              <option value="completed">Completed</option>
              <option value="inProgress">In Progress</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
        
        {/* Date Range and Export Section */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Calendar className={`h-4 w-4 hidden sm:block ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                dateRange: { 
                  ...filters.dateRange, 
                  start: e.target.value,
                  end: filters.dateRange?.end || ''
                }
              })}
              className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>to</span>
            <input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                dateRange: { 
                  ...filters.dateRange, 
                  start: filters.dateRange?.start || '',
                  end: e.target.value
                }
              })}
              className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onExportCSV}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 text-sm flex-1 sm:flex-initial"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
            
            <button
              onClick={onExportJSON}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150 text-sm flex-1 sm:flex-initial"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">JSON</span>
              <span className="sm:hidden">JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};