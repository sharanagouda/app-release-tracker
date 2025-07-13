import React, { useState } from 'react';
import { Activity, Smartphone, Package, AlertCircle, Plus, Search } from 'lucide-react';
import { useReleases } from './hooks/useReleases';
import { StatCard } from './components/StatCard';
import { ReleaseTable } from './components/ReleaseTable';
import { FilterBar } from './components/FilterBar';
import { ReleaseModal } from './components/ReleaseModal';
import { ReleaseDetailsModal } from './components/ReleaseDetailsModal';
import { AuthModal } from './components/AuthModal';
import { Release, FilterOptions } from './types/release';

function App() {
  const { 
    releases, 
    loading, 
    addRelease, 
    updateRelease, 
    deleteRelease, 
    getStats, 
    filterReleases,
    importReleases,
    exportToJSON,
    exportToMockData,
    exportToCSV
  } = useReleases();
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | undefined>();
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [filters, setFilters] = useState<Partial<FilterOptions>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'edit' | 'delete', data?: any }>({ type: 'add' });

  // Request notification permission on component mount
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const stats = getStats();
  const filteredReleases = filterReleases(filters)
    .filter(release => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        release.releaseName.toLowerCase().includes(searchLower) ||
        release.platforms.some(p => 
          p.platform.toLowerCase().includes(searchLower) ||
          p.version.toLowerCase().includes(searchLower) ||
          p.buildId.toLowerCase().includes(searchLower)
        ) ||
        release.changes.some(change => change.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  const handleAddRelease = (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRelease) {
      updateRelease(editingRelease.id, release);
    } else {
      addRelease(release);
      // Show desktop notification for new release
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Release Added', {
          body: `${release.releaseName} has been added to the release tracker`,
          icon: '/vite.svg'
        });
      }
    }
  };

  const handleEdit = (release: Release) => {
    setPendingAction({ type: 'edit', data: release });
    setShowAuthModal(true);
  };

  const handleViewDetails = (release: Release) => {
    setSelectedRelease(release);
    setShowDetailsModal(true);
  };

  const handleDelete = (id: string) => {
    setPendingAction({ type: 'delete', data: id });
    setShowAuthModal(true);
  };

  const handleAuthenticated = () => {
    setIsAdmin(true);
    switch (pendingAction.type) {
      case 'add':
        setEditingRelease(undefined);
        setShowModal(true);
        break;
      case 'edit':
        setEditingRelease(pendingAction.data);
        setShowModal(true);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this release? This action cannot be undone.')) {
          deleteRelease(pendingAction.data);
        }
        break;
    }
  };

  const getActionText = () => {
    switch (pendingAction.type) {
      case 'add':
        return 'add a new release';
      case 'edit':
        return 'edit this release';
      case 'delete':
        return 'delete this release';
      default:
        return 'perform this action';
    }
  };

  // Get current active releases for the status cards
  const getCurrentActiveReleases = () => {
    return filteredReleases
      .filter(release => release.platforms.some(p => p.status !== 'Complete'))
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading release data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Release History Tracker</h1>
              <p className="mt-2 text-gray-600">
                Track and manage multi-concept app releases across all platforms
              </p>
            </div>
            <button
              onClick={() => {
                setPendingAction({ type: 'add' });
                setShowAuthModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Release
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Releases"
            value={stats.totalReleases}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Active Releases"
            value={stats.activeReleases}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Completed"
            value={stats.completedReleases}
            icon={Smartphone}
            color="green"
          />
          <StatCard
            title="Paused"
            value={stats.pausedReleases}
            icon={AlertCircle}
            color="red"
          />
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onExportCSV={exportToCSV}
          onExportJSON={exportToJSON}
        />

        {/* Current Release Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Release Status</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {getCurrentActiveReleases().map((release) => (
              <div
                key={release.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{release.releaseName}</h3>
                  <span className="text-xs text-gray-500">{release.concept}</span>
                </div>
                <div className="space-y-2">
                  {release.platforms.map((platform, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">
                          {platform.platform === 'iOS' ? '🍎' : 
                           platform.platform === 'Android GMS' ? '🤖' : '📱'}
                        </span>
                        <span className="text-gray-600">{platform.platform}</span>
                        <span className="text-gray-500">•</span>
                        <span className="font-mono text-gray-700">{platform.version}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              platform.rolloutPercentage < 25 ? 'bg-red-400' :
                              platform.rolloutPercentage < 50 ? 'bg-yellow-400' :
                              platform.rolloutPercentage < 75 ? 'bg-blue-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${platform.rolloutPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 w-8 text-right">
                          {platform.rolloutPercentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Release Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Release History</h2>
            <p className="text-sm text-gray-600">
              Showing {filteredReleases.length} of {releases.length} releases
            </p>
          </div>
          <ReleaseTable
            releases={filteredReleases}
            isAdmin={isAdmin}
            onAuthRequired={() => setShowAuthModal(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
          />
        </div>

        {/* Modals */}
        <ReleaseModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingRelease(undefined);
          }}
          onSave={handleAddRelease}
          editingRelease={editingRelease}
        />

        <ReleaseDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRelease(null);
          }}
          release={selectedRelease}
        />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthenticate={handleAuthenticated}
          action={getActionText()}
        />
      </div>
    </div>
  );
}

export default App;