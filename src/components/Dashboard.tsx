import React from 'react';
import { Plus, ExternalLink, Download } from 'lucide-react';
import { Release, FilterOptions } from '../types/release';
import { StatCard } from './StatCard';
import { FilterBar } from './FilterBar';
import { ReleaseTable } from './ReleaseTable';

interface DashboardProps {
    stats: {
        total: number;
        inProgress: number;
        completed: number;
        paused: number;
    };
    filters: Partial<FilterOptions>;
    setFilters: (filters: Partial<FilterOptions>) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    exportToCSV: () => void;
    exportToJSON: () => void;
    darkMode: boolean;
    handleAddRelease: () => void;
    filteredReleases: Release[];
    handleEditRelease: (release: Release) => void;
    handleDeleteRelease: (release: Release) => void;
    handleViewDetails: (release: Release) => void;
    isAdmin: boolean;
    handleAuthRequired: (action: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    stats,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    exportToCSV,
    exportToJSON,
    darkMode,
    handleAddRelease,
    filteredReleases,
    handleEditRelease,
    handleDeleteRelease,
    handleViewDetails,
    isAdmin,
    handleAuthRequired,
}) => {
    return (
        <>
            {/* Current Release Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Releases"
                    value={stats.total}
                    icon={ExternalLink}
                    color="blue"
                    darkMode={darkMode}
                />
                <StatCard
                    title="In Progress"
                    value={stats.inProgress}
                    icon={Download}
                    color="yellow"
                    darkMode={darkMode}
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    icon={Download}
                    color="green"
                    darkMode={darkMode}
                />
                <StatCard
                    title="Paused"
                    value={stats.paused}
                    icon={Download}
                    color="red"
                    darkMode={darkMode}
                />
            </div>

            {/* Controls */}
            <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onExportCSV={exportToCSV}
                onExportJSON={exportToJSON}
                darkMode={darkMode}
                actionButton={
                    <button
                        onClick={handleAddRelease}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 text-sm flex-1 sm:flex-initial whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Release</span>
                    </button>
                }
            />

            {/* Desktop Table View */}
            <div className="hidden lg:block">
                <ReleaseTable
                    releases={filteredReleases}
                    onEdit={handleEditRelease}
                    onDelete={handleDeleteRelease}
                    onViewDetails={handleViewDetails}
                    isAdmin={isAdmin}
                    onAuthRequired={handleAuthRequired}
                    darkMode={darkMode}
                />
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {/* Mobile view implementation would go here if needed */}
            </div>
        </>
    );
};
