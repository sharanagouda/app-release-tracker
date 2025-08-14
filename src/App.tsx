import React, { useState } from 'react';
import { Plus, Filter, Search, Download, ExternalLink } from 'lucide-react';
import { Release } from './types/release';
import { useReleases } from './hooks/useReleases';
import { ReleaseTable } from './components/ReleaseTable';
import { ReleaseModal } from './components/ReleaseModal';
import { ReleaseDetailsModal } from './components/ReleaseDetailsModal';
import { FilterBar } from './components/FilterBar';
import { StatCard } from './components/StatCard';

function App() {
  const { releases, addRelease, updateRelease, deleteRelease } = useReleases();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conceptFilter, setConceptFilter] = useState('all');

  const getOverallStatus = (release: Release) => {
    const platforms = [release.ios, release.android, release.web].filter(Boolean);
    if (platforms.length === 0) return 'In Progress';
    
    const allComplete = platforms.every(p => p?.status === 'Complete');
    const allPaused = platforms.every(p => p?.status === 'Paused');
    
    if (allComplete) return 'Complete';
    if (allPaused) return 'Paused';
    return 'In Progress';
  };

  const filteredReleases = releases.filter(release => {
    const matchesSearch = release.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         release.concept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getOverallStatus(release).toLowerCase() === statusFilter;
    const matchesConcept = conceptFilter === 'all' || release.concept === conceptFilter;
    
    return matchesSearch && matchesStatus && matchesConcept;
  });

  const handleAddRelease = () => {
    setEditingRelease(null);
    setIsModalOpen(true);
  };

  const handleEditRelease = (release: Release) => {
    setEditingRelease(release);
    setIsModalOpen(true);
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Releases"
            value={stats.total}
            icon={<ExternalLink className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<Download className="w-6 h-6" />}
            color="yellow"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<Download className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Paused"
            value={stats.paused}
            icon={<Download className="w-6 h-6" />}
            color="red"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search releases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <FilterBar
            statusFilter={statusFilter}
            conceptFilter={conceptFilter}
            onStatusFilterChange={setStatusFilter}
            onConceptFilterChange={setConceptFilter}
          />
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
            onDelete={deleteRelease}
            onViewDetails={handleViewDetails}
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
                    <h3 className="font-semibold text-gray-900">{release.name}</h3>
                    <p className="text-sm text-gray-600">{release.concept}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[overallStatus as keyof typeof statusColors]}`}>
                    {overallStatus}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {release.ios && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">iOS</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{release.ios.version}</span>
                        <span className="text-xs text-gray-500">{release.ios.rolloutPercentage}%</span>
                      </div>
                    </div>
                  )}
                  {release.android && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Android</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{release.android.version}</span>
                        <span className="text-xs text-gray-500">{release.android.rolloutPercentage}%</span>
                      </div>
                    </div>
                  )}
                  {release.web && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Web</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{release.web.version}</span>
                        <span className="text-xs text-gray-500">{release.web.rolloutPercentage}%</span>
                      </div>
                    </div>
                  )}
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
                    onClick={() => deleteRelease(release.id)}
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
    </div>
  );
}

export default App;