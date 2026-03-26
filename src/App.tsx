import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Release, FilterOptions } from './types/release';
import { exportToCSVFunction, exportToJSONFunction } from './utils/export';
import { useReleases } from './hooks/useReleases';
import { ReleaseModal } from './components/ReleaseModal';
import { ReleaseDetailsModal } from './components/ReleaseDetailsModal';
import { AuthModal } from './components/AuthModal';
import { ExportConfirmationModal } from './components/Exportconfirmationmodal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { onAuthChange, logout } from './services/firebaseAuth';
import { User } from 'firebase/auth';
import { Layout } from './components/Layout';
import { ReleaseNotes } from './components/ReleaseNotes/ReleaseNotes';
import { Wiki } from './components/Wiki/Wiki';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';

function App() {
  const { releases, addRelease, updateRelease, deleteRelease } = useReleases();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'CSV' | 'JSON'>('CSV');
  const [authAction, setAuthAction] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSimulatedAdmin, setIsSimulatedAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Partial<FilterOptions>>({});
  const [user, setUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null);

  const [sidebarSettings, setSidebarSettings] = useState({
    showAppRelease: true,
    showReleaseNotes: true,
    showWiki: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setIsAdmin(!!authUser);
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    const savedSidebarSettings = localStorage.getItem('sidebarSettings');
    if (savedSidebarSettings) {
      setSidebarSettings(JSON.parse(savedSidebarSettings));
    }

    const savedAdminMode = localStorage.getItem('isSimulatedAdmin');
    if (savedAdminMode) {
      setIsSimulatedAdmin(JSON.parse(savedAdminMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleUpdateSettings = (key: string, value: boolean) => {
    const newSettings = { ...sidebarSettings, [key]: value };
    setSidebarSettings(newSettings);
    localStorage.setItem('sidebarSettings', JSON.stringify(newSettings));
  };

  const handleToggleAdminMode = () => {
    if (!user) {
      setAuthAction('enable admin mode');
      setIsAuthModalOpen(true);
      return;
    }
    const newValue = !isSimulatedAdmin;
    setIsSimulatedAdmin(newValue);
    localStorage.setItem('isSimulatedAdmin', JSON.stringify(newValue));
  };

  const handleLogout = async () => {
    await logout();
    setIsAdmin(false);
    setUser(null);
    setIsSimulatedAdmin(false);
    localStorage.removeItem('isSimulatedAdmin');
  };

  const getDisplayName = (user: User | null) => {
    if (!user) return '';
    const email = user.email || '';
    const username = email.split('@')[0];
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
    switch (filters.sortBy) {
      case 'releaseDate':
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      case 'lastUpdate':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'completed': {
        const aComplete = getOverallStatus(a) === 'Complete' ? 1 : 0;
        const bComplete = getOverallStatus(b) === 'Complete' ? 1 : 0;
        return bComplete - aComplete;
      }
      case 'inProgress': {
        const aProgress = getOverallStatus(a) === 'In Progress' ? 1 : 0;
        const bProgress = getOverallStatus(b) === 'In Progress' ? 1 : 0;
        return bProgress - aProgress;
      }
      case 'paused': {
        const aPaused = getOverallStatus(a) === 'Paused' ? 1 : 0;
        const bPaused = getOverallStatus(b) === 'Paused' ? 1 : 0;
        return bPaused - aPaused;
      }
      default:
        return 0;
    }
  });

  const effectiveAdmin = isAdmin || isSimulatedAdmin;

  const handleAddRelease = () => {
    if (!user) {
      setAuthAction('add a new release');
      setIsAuthModalOpen(true);
      return;
    }
    if (effectiveAdmin) {
      setEditingRelease(null);
      setIsModalOpen(true);
    } else {
      setAuthAction('add a new release');
      setIsAuthModalOpen(true);
    }
  };

  const handleEditRelease = (release: Release) => {
    if (effectiveAdmin) {
      setEditingRelease(release);
      setIsModalOpen(true);
    } else {
      setAuthAction('edit this release');
      setIsAuthModalOpen(true);
    }
  };

  const handleDeleteRelease = (release: Release) => {
    if (effectiveAdmin) {
      setReleaseToDelete(release);
      setIsDeleteModalOpen(true);
    } else {
      setAuthAction('delete this release');
      setIsAuthModalOpen(true);
    }
  };

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

  const handleAuthRequired = (action: string) => {
    setAuthAction(action);
    setIsAuthModalOpen(true);
  };

  const handleAuthenticate = () => {
    setIsAuthModalOpen(false);
  };

  const exportToCSV = () => {
    if (!filters.dateRange?.start || !filters.dateRange?.end) {
      setExportType('CSV');
      setIsExportModalOpen(true);
      return;
    }
    exportToCSVFunction(filteredReleases);
  };

  const exportToJSON = () => {
    if (!filters.dateRange?.start || !filters.dateRange?.end) {
      setExportType('JSON');
      setIsExportModalOpen(true);
      return;
    }
    exportToJSONFunction(filteredReleases);
  };

  const handleConfirmExport = () => {
    if (exportType === 'CSV') {
      exportToCSVFunction(releases);
    } else {
      exportToJSONFunction(releases);
    }
  };

  const stats = {
    total: releases.length,
    inProgress: releases.filter(r => getOverallStatus(r) === 'In Progress').length,
    completed: releases.filter(r => getOverallStatus(r) === 'Complete').length,
    paused: releases.filter(r => getOverallStatus(r) === 'Paused').length,
  };

  return (
    <Router>
      <Layout
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        user={user}
        isAdmin={effectiveAdmin}
        handleLogout={handleLogout}
        getDisplayName={getDisplayName}
        onCreateRelease={handleAddRelease}
        sidebarSettings={sidebarSettings}
      >
        <Routes>
          <Route path="/" element={
            <Dashboard
              stats={stats}
              filters={filters}
              setFilters={setFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              exportToCSV={exportToCSV}
              exportToJSON={exportToJSON}
              darkMode={darkMode}
              handleAddRelease={handleAddRelease}
              filteredReleases={filteredReleases}
              handleEditRelease={handleEditRelease}
              handleDeleteRelease={handleDeleteRelease}
              handleViewDetails={handleViewDetails}
              isAdmin={effectiveAdmin}
              handleAuthRequired={handleAuthRequired}
            />
          } />
          <Route path="/releases" element={
            <Dashboard
              stats={stats}
              filters={filters}
              setFilters={setFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              exportToCSV={exportToCSV}
              exportToJSON={exportToJSON}
              darkMode={darkMode}
              handleAddRelease={handleAddRelease}
              filteredReleases={filteredReleases}
              handleEditRelease={handleEditRelease}
              handleDeleteRelease={handleDeleteRelease}
              handleViewDetails={handleViewDetails}
              isAdmin={effectiveAdmin}
              handleAuthRequired={handleAuthRequired}
            />
          } />
          <Route
            path="/release-notes"
            element={
              <ReleaseNotes
                isAdmin={effectiveAdmin}
                onAuthRequired={handleAuthRequired}
                darkMode={darkMode}
              />
            }
          />
          <Route
            path="/wiki"
            element={
              <Wiki
                isAdmin={effectiveAdmin}
                onAuthRequired={handleAuthRequired}
                darkMode={darkMode}
                user={user}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <Settings
                sidebarSettings={sidebarSettings}
                onUpdateSettings={handleUpdateSettings}
                darkMode={darkMode}
                isAdminMode={isSimulatedAdmin}
                onToggleAdminMode={handleToggleAdminMode}
              />
            }
          />
        </Routes>

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
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          release={releaseToDelete}
          darkMode={darkMode}
        />
      </Layout>
    </Router>
  );
}

export default App;
