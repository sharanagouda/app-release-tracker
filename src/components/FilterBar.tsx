import React from 'react';
import { Search, Filter, Calendar, Download } from 'lucide-react';
import { FilterOptions } from '../types/release';
import { CONCEPTS, PLATFORMS } from '../data/mockData';

interface FilterBarProps {
  filters: Partial<FilterOptions>;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  searchTerm,
  onSearchChange,
  onExportCSV,
  onExportJSON,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search releases..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filters.status || 'All'}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value === 'All' ? undefined : e.target.value })}
             className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="All">All Status</option>
              <option value="Complete">Complete</option>
              <option value="In Progress">In Progress</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 text-sm"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          
          <button
            onClick={onExportJSON}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150 text-sm"
          >
            <Download className="h-4 w-4" />
            JSON
          </button>
        </div>
      </div>
    </div>
  );
};