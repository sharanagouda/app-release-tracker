import React, { useState } from 'react';
import { Plus, Filter, Search, Download, ExternalLink } from 'lucide-react';
import { Release, FilterOptions } from './types/release';
import { useReleases } from './hooks/useReleases';
import { ReleaseTable } from './components/ReleaseTable';
import { ReleaseModal } from './components/ReleaseModal';
import { ReleaseDetailsModal } from './components/ReleaseDetailsModal';
import { AuthModal } from './components/AuthModal';
import { FilterBar } from './components/FilterBar';
import { StatCard } from './components/StatCard';

function App() {
  const { releases, addRelease, updateRelease, deleteRelease } = useReleases();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Partial<FilterOptions>>({});

  const getOverallStatus = (release: Release) => {
    const platforms = release.platforms || [];
    if (platforms.length === 0) return 'In Progress';
    
    const allComplete = platforms.every(p => p?.status === 'Complete');
    const allPaused = platforms.every(p => p?.status === 'Paused');
    
    if (allComplete) return 'Complete';
    if (allPaused) return 'Paused';
    return 'In Progress';
  };

  const filteredReleases = releases.filter(release => {
    const matchesSearch = release.releaseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         release.concept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || filters.status === 'All' || getOverallStatus(release) === filters.status;
    const matchesConcept = !filters.concept || filters.concept === 'All' || release.concept === filters.concept;
    
    return matchesSearch && matchesStatus && matchesConcept;
  });

  const handleAddRelease = () => {
    if (isAdmin) {
      setEditingRelease(null);
      setIsModalOpen(true);
    } else {
      setAuthAction('add a new release');
      setIsAuthModalOpen(true);
    }
  };

  const handleEditRelease = (release: Release) => {
    if (isAdmin) {
      setEditingRelease(release);
      setIsModalOpen(true);
    } else {
      setAuthAction('edit this release');
      setIsAuthModalOpen(true);
    }
  };

  const handleDeleteRelease = (id: string) => {
    if (isAdmin) {
      deleteRelease(id);
    } else {
      setAuthAction('delete this release');
      setIsAuthModalOpen(true);
    }
  };

  const handleViewDetails = (release: Release) => {
    setSelectedRelease(release);
    setIsDetailsModalOpen(true);
  };

  const handleSaveRelease = (releaseData: Omit<Release, 'id'>) => {
    if (editingRelease) {
      updateRelease(editingRelease.id, releaseData);
    } else {
      addRelease(releaseData);
    }
    setIsModalOpen(false);
    setEditingRelease(null);
  };

  const handleAuthRequired = () => {
    setAuthAction('edit or delete a release');
    setIsAuthModalOpen(true);
  };

  const handleAuthenticate = () => {
    setIsAdmin(true);
    setIsAuthModalOpen(false);
  };

  const exportToCSV = () => {
    // CSV export functionality
    console.log('Exporting to CSV...');
  };

  const exportToJSON = () => {
    // JSON export functionality
    console.log('Exporting to JSON...');
  };
  const stats = {
    total: releases.length,
    inProgress: releases.filter(r => getOverallStatus(r) === 'In Progress').length,
    completed: releases.filter(r => getOverallStatus(r) === 'Complete').length,
    paused: releases.filter(r => getOverallStatus(r) === 'Paused').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Release Tracker</h1>
          <p className="text-gray-600">Track and manage your application releases across all platforms</p>
        </div>

        {/* Current Release Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Releases"
            value={stats.total}
            icon={ExternalLink}
            color="blue"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Download}
            color="yellow"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={Download}
            color="green"
          />
          <StatCard
            title="Paused"
            value={stats.paused}
            icon={Download}
            color="red"
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
        />
        
        <div className="flex justify-end mb-6">
          <button
            onClick={handleAddRelease}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Release
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <ReleaseTable
            releases={filteredReleases}
            onEdit={handleEditRelease}
            onDelete={handleDeleteRelease}
            onViewDetails={handleViewDetails}
            isAdmin={isAdmin}
            onAuthRequired={handleAuthRequired}
          />
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredReleases.map((release) => {
            const overallStatus = getOverallStatus(release);
            const statusColors = {
              'Complete': 'bg-green-100 text-green-800',
              'In Progress': 'bg-blue-100 text-blue-800',
              'Paused': 'bg-red-100 text-red-800'
            };

            return (
              <div key={release.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{release.releaseName}</h3>
                    <p className="text-sm text-gray-600">{release.concept}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[overallStatus as keyof typeof statusColors]}`}>
                    {overallStatus}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {release.platforms?.map((platform) => (
                    <div key={platform.name} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{platform.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{platform.version}</span>
                        <span className="text-xs text-gray-500">{platform.rolloutPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(release)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditRelease(release)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRelease(release.id)}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredReleases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No releases found</h3>
            <p className="text-gray-600">Try adjusting your search or filters, or add a new release.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReleaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRelease(null);
        }}
        onSave={handleSaveRelease}
        editingRelease={editingRelease}
      />

      <ReleaseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRelease(null);
        }}
        release={selectedRelease}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={handleAuthenticate}
        action={authAction}
      />
    </div>
  );
}

export default App;