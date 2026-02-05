import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Download, ExternalLink, LogOut, Moon, Sun } from 'lucide-react';
import { Release, FilterOptions } from './types/release';
import { exportToCSVFunction, exportToJSONFunction } from './utils/export';
import { useReleases } from './hooks/useReleases';
import { ReleaseTable } from './components/ReleaseTable';
import { ReleaseModal } from './components/ReleaseModal';
import { ReleaseDetailsModal } from './components/ReleaseDetailsModal';
import { AuthModal } from './components/AuthModal';
import { ExportConfirmationModal } from './components/Exportconfirmationmodal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { FilterBar } from './components/FilterBar';
import { StatCard } from './components/StatCard';
import { onAuthChange, logout } from './services/firebaseAuth';
import { User } from 'firebase/auth';

function App() {
  const { releases, addRelease, updateRelease, deleteRelease } = useReleases();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'CSV' | 'JSON'>('CSV');
  const [authAction, setAuthAction] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Partial<FilterOptions>>({});
  const [user, setUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setIsAdmin(!!authUser);
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);
  

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    setIsAdmin(false);
    setUser(null);
  };

  // Helper function to get display name
  const getDisplayName = (user: User | null) => {
    if (!user) return '';
    const email = user.email || '';
    const username = email.split('@')[0];
    // Capitalize first letter of username
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const getConceptReleases = (platform: any) => {
    if (platform.conceptReleases && platform.conceptReleases.length > 0) {
      return platform.conceptReleases;
    }
    
    return [{
      id: `${platform.platform}-legacy`,
      concepts: platform.concepts || ['All Concepts'],
      version: platform.version || '',
      buildId: platform.buildId || '',
      rolloutPercentage: platform.rolloutPercentage || 0,
      status: platform.status || 'Not Started',
      notes: platform.notes || '',
      buildLink: platform.buildLink || ''
    }];
  };

  const getOverallStatus = (release: Release) => {
    const platforms = release.platforms || [];
    if (platforms.length === 0) return 'In Progress';
    
    let allComplete = true;
    let allPaused = true;
    let hasAnyRelease = false;
    
    platforms.forEach(platform => {
      const conceptReleases = getConceptReleases(platform);
      conceptReleases.forEach((cr: any) => {
        hasAnyRelease = true;
        if (cr.status !== 'Complete') allComplete = false;
        if (cr.status !== 'Paused') allPaused = false;
      });
    });
    
    if (!hasAnyRelease) return 'Not Started';
    if (allComplete) return 'Complete';
    if (allPaused) return 'Paused';
    return 'In Progress';
  };

  const filteredReleases = releases.filter(release => {
    const environment = release.environment || release.concept || '';
    const searchLower = searchTerm.toLowerCase();
    
    // Fixed search - safely check for undefined values
    const matchesSearch = release.releaseName?.toLowerCase().includes(searchLower) ||
                         environment.toLowerCase().includes(searchLower) ||
                         (release.platforms || []).some(p => {
                           const conceptReleases = getConceptReleases(p);
                           return conceptReleases.some((cr: any) => 
                             (cr.version || '').toLowerCase().includes(searchLower) ||
                             (cr.buildId || '').toLowerCase().includes(searchLower)
                           );
                         });
    
    const matchesStatus = !filters.status || filters.status === 'All' || getOverallStatus(release) === filters.status;
    const matchesEnvironment = !filters.environment || filters.environment === 'All' || environment === filters.environment;
    
    return matchesSearch && matchesStatus && matchesEnvironment;
  }).sort((a, b) => {
    // Apply sorting
    switch (filters.sortBy) {
      case 'releaseDate':
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      case 'lastUpdate':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'completed':
        const aComplete = getOverallStatus(a) === 'Complete' ? 1 : 0;
        const bComplete = getOverallStatus(b) === 'Complete' ? 1 : 0;
        return bComplete - aComplete;
      case 'inProgress':
        const aProgress = getOverallStatus(a) === 'In Progress' ? 1 : 0;
        const bProgress = getOverallStatus(b) === 'In Progress' ? 1 : 0;
        return bProgress - aProgress;
      case 'paused':
        const aPaused = getOverallStatus(a) === 'Paused' ? 1 : 0;
        const bPaused = getOverallStatus(b) === 'Paused' ? 1 : 0;
        return bPaused - aPaused;
      default:
        return 0;
    }
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

  const handleDeleteRelease = (release: Release) => {
    if (isAdmin) {
      console.log("----", release)
      setReleaseToDelete(release);
      setIsDeleteModalOpen(true);
    } else {
      setAuthAction('delete this release');
      setIsAuthModalOpen(true);
    }
  };

  // Add the confirm delete handler
  const handleConfirmDelete = () => {
    if (releaseToDelete) {
      deleteRelease(releaseToDelete.id);
      setReleaseToDelete(null);
    }
  };

  const handleViewDetails = (release: Release) => {
    setSelectedRelease(release);
    setIsDetailsModalOpen(true);
  };

  const handleSaveRelease = async (releaseData: Omit<Release, 'id'>) => {
    try {
      if (editingRelease) {
        await updateRelease(editingRelease.id, releaseData);
      } else {
        await addRelease(releaseData);
      }
      setIsModalOpen(false);
      setEditingRelease(null);
    } catch (error) {
      console.error('Error saving release:', error);
    }
  };

  const handleAuthRequired = () => {
    setAuthAction('edit or delete a release');
    setIsAuthModalOpen(true);
  };

  const handleAuthenticate = () => {
    setIsAuthModalOpen(false);
  };

  const exportToCSV = () => {
    // Check if date range is selected
    if (!filters.dateRange?.start || !filters.dateRange?.end) {
      setExportType('CSV');
      setIsExportModalOpen(true);
      return;
    }
    
    exportToCSVFunction(filteredReleases);
    console.log('Exporting to CSV...');
  };

  const exportToJSON = () => {
    // Check if date range is selected
    if (!filters.dateRange?.start || !filters.dateRange?.end) {
      setExportType('JSON');
      setIsExportModalOpen(true);
      return;
    }
    
    exportToJSONFunction(filteredReleases);
    console.log('Exporting to JSON...');
  };

  const handleConfirmExport = () => {
    if (exportType === 'CSV') {
      exportToCSVFunction(releases);
      console.log('Exporting all data to CSV...');
    } else {
      exportToJSONFunction(releases);
      console.log('Exporting all data to JSON...');
    }
  };

  const stats = {
    total: releases.length,
    inProgress: releases.filter(r => getOverallStatus(r) === 'In Progress').length,
    completed: releases.filter(r => getOverallStatus(r) === 'Complete').length,
    paused: releases.filter(r => getOverallStatus(r) === 'Paused').length,
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Release Tracker
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Track and manage your application releases across all platforms
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Hi {getDisplayName(user)}
              </p>
            )}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAdmin && (
              <button
                onClick={handleLogout}
                className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            )}
          </div>
        </div>

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
            darkMode={darkMode}
          />
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredReleases.map((release) => {
            const overallStatus = getOverallStatus(release);
            const statusColors = darkMode ? {
              'Complete': 'bg-green-900/30 text-green-300',
              'In Progress': 'bg-blue-900/30 text-blue-300',
              'Paused': 'bg-red-900/30 text-red-300'
            } : {
              'Complete': 'bg-green-100 text-green-800',
              'In Progress': 'bg-blue-100 text-blue-800',
              'Paused': 'bg-red-100 text-red-800'
            };

            return (
              <div 
                key={release.id} 
                className={`rounded-lg shadow-sm border p-4 cursor-pointer transition-shadow ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 hover:shadow-md' 
                    : 'bg-white border-gray-200 hover:shadow-md'
                }`}
                onClick={() => handleViewDetails(release)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`font-semibold ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {release.releaseName}
                    </h3>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {release.environment || release.concept}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[overallStatus as keyof typeof statusColors]}`}>
                    {overallStatus}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {release.platforms?.map((platform, idx) => {
                    const conceptReleases = getConceptReleases(platform);
                    const firstRelease = conceptReleases[0];
                    
                    return (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {platform.platform}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            {firstRelease?.version || 'N/A'}
                          </span>
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {firstRelease?.rolloutPercentage || 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleViewDetails(release)}
                    className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditRelease(release)}
                    className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      darkMode 
                        ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRelease(release)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      darkMode 
                        ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
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
            <div className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
              <Filter className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-900'
            }`}>
              No releases found
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Try adjusting your search or filters, or add a new release.
            </p>
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
        darkMode={darkMode}
      />

      <ReleaseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRelease(null);
        }}
        release={selectedRelease}
        darkMode={darkMode}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={handleAuthenticate}
        action={authAction}
        darkMode={darkMode}
      />

      <ExportConfirmationModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleConfirmExport}
        exportType={exportType}
        darkMode={darkMode}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setReleaseToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        release={releaseToDelete}
        darkMode={darkMode}
      />
    </div>
  );
}

export default App;