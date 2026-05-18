import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  ExternalLink,
  LogOut,
  Keyboard,
  LogIn,
  Shield,
  GitCompare,
  Settings,
  Bell,
} from 'lucide-react';
import { FilterOptions, Release } from '../types/release';
import { getConceptReleases } from '../utils/conceptReleases';
import { exportToCSVFunction } from '../utils/export';
import { usePagination } from '../hooks/usePagination';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ReleaseTable } from '../components/ReleaseTable';
import { ReleaseModal } from '../components/ReleaseModal';

import { AuthModal } from '../components/AuthModal';
import { ExportConfirmationModal } from '../components/Exportconfirmationmodal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { FilterBar } from '../components/FilterBar';
import { StatCard } from '../components/StatCard';
import { Pagination } from '../components/Pagination';
import { KeyboardShortcutsHelp } from '../components/KeyboardShortcutsHelp';
import { TagBadge } from '../components/TagInput';
import { AdminPanel } from '../components/AdminPanel';
import { PermissionDeniedModal } from '../components/PermissionDeniedModal';
import { CompareReleasesModal } from '../components/CompareReleasesModal';
import { TeamsGroupsConfigModal } from '../components/TeamsGroupsConfigModal';
import { useAppContext } from '../contexts/AppContext';

export const ReleasesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    userRole,
    isAdmin,
    canEdit,
    handleLogout,
    getDisplayName,
    darkMode,
    releases,
    releasesLoading: loading,
    addRelease,
    updateRelease,
    deleteRelease,
    teamsGroups,
    handleAddTeamsGroup,
    handleUpdateTeamsGroup,
    handleDeleteTeamsGroup,
    notifications,
    handleDismissNotifications,
    accessRequestCount,
    setToastMessage,
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'CSV' | 'JSON'>('CSV');
  const [authAction, setAuthAction] = useState('');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isPermissionDeniedOpen, setIsPermissionDeniedOpen] = useState(false);
  const [permissionDeniedAction, setPermissionDeniedAction] = useState('');
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Partial<FilterOptions>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isTeamsGroupsConfigOpen, setIsTeamsGroupsConfigOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getOverallStatus = (release: Release) => {
    const platforms = release.platforms || [];
    if (platforms.length === 0) return 'In Progress';

    let allComplete = true;
    let allPaused = true;
    let hasAnyRelease = false;

    platforms.forEach((platform) => {
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

  const filteredReleases = releases
    .filter((release) => {
      const environment = release.environment || release.concept || '';
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        release.releaseName?.toLowerCase().includes(searchLower) ||
        environment.toLowerCase().includes(searchLower) ||
        (release.platforms || []).some((p) => {
          const conceptReleases = getConceptReleases(p);
          return conceptReleases.some(
            (cr: any) =>
              (cr.version || '').toLowerCase().includes(searchLower) ||
              (cr.buildId || '').toLowerCase().includes(searchLower)
          );
        }) ||
        (release.tags || []).some((t) => t.toLowerCase().includes(searchLower)) ||
        (release.isNative && 'native'.includes(searchLower));

      const matchesStatus =
        !filters.status || filters.status === 'All' || getOverallStatus(release) === filters.status;
      const matchesEnvironment =
        !filters.environment ||
        filters.environment === 'All' ||
        environment === filters.environment;

      const releaseDate = release.releaseDate ? release.releaseDate.substring(0, 10) : '';
      const matchesDateStart = !filters.dateRange?.start || releaseDate >= filters.dateRange.start;
      const matchesDateEnd = !filters.dateRange?.end || releaseDate <= filters.dateRange.end;

      return matchesSearch && matchesStatus && matchesEnvironment && matchesDateStart && matchesDateEnd;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'releaseDate':
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        case 'lastUpdate':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'completed': {
          const ac = getOverallStatus(a) === 'Complete' ? 1 : 0;
          const bc = getOverallStatus(b) === 'Complete' ? 1 : 0;
          return bc - ac;
        }
        case 'inProgress': {
          const ap = getOverallStatus(a) === 'In Progress' ? 1 : 0;
          const bp = getOverallStatus(b) === 'In Progress' ? 1 : 0;
          return bp - ap;
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

  const pagination = usePagination(filteredReleases, 10);

  useEffect(() => {
    pagination.goToFirstPage();
  }, [searchTerm, filters]);

  const anyModalOpen =
    isModalOpen ||
    isAuthModalOpen ||
    isExportModalOpen ||
    isDeleteModalOpen ||
    isShortcutsHelpOpen;

  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'Add new release',
      action: () => {
        if (!anyModalOpen) handleAddRelease();
      },
    },
    {
      key: '/',
      description: 'Focus search',
      action: () => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      },
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setIsShortcutsHelpOpen((prev) => !prev),
    },
    {
      key: 'Escape',
      description: 'Close modal / clear search',
      allowInInput: true,
      action: () => {
        if (isShortcutsHelpOpen) { setIsShortcutsHelpOpen(false); return; }
        if (isModalOpen) { setIsModalOpen(false); setEditingRelease(null); return; }
        if (isAuthModalOpen) { setIsAuthModalOpen(false); return; }
        if (isExportModalOpen) { setIsExportModalOpen(false); return; }
        if (isDeleteModalOpen) { setIsDeleteModalOpen(false); setReleaseToDelete(null); return; }
        if (searchTerm) { setSearchTerm(''); searchInputRef.current?.blur(); }
      },
    },
    {
      key: 'ArrowLeft',
      description: 'Previous page',
      action: () => { if (!anyModalOpen) pagination.goToPrevPage(); },
    },
    {
      key: 'ArrowRight',
      description: 'Next page',
      action: () => { if (!anyModalOpen) pagination.goToNextPage(); },
    },
  ]);

  const handleAddRelease = () => {
    if (canEdit) {
      setEditingRelease(null);
      setIsModalOpen(true);
    } else if (user) {
      setPermissionDeniedAction('add releases');
      setIsPermissionDeniedOpen(true);
    } else {
      setAuthAction('add a new release');
      setIsAuthModalOpen(true);
    }
  };

  const handleEditRelease = (release: Release) => {
    if (canEdit) {
      setEditingRelease(release);
      setIsModalOpen(true);
    } else if (user) {
      setPermissionDeniedAction('edit releases');
      setIsPermissionDeniedOpen(true);
    } else {
      setAuthAction('edit this release');
      setIsAuthModalOpen(true);
    }
  };

  const handleDeleteRelease = (release: Release) => {
    if (isAdmin) {
      setReleaseToDelete(release);
      setIsDeleteModalOpen(true);
    } else if (user) {
      setPermissionDeniedAction('delete releases');
      setIsPermissionDeniedOpen(true);
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
    navigate(`/releases/${release.id}`);
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
      const message = error instanceof Error ? error.message : 'Error saving release';
      alert(message);
    }
  };

  const handleAuthRequired = (action?: string) => {
    if (user?.email) {
      setPermissionDeniedAction(action ?? 'edit or delete a release');
      setIsPermissionDeniedOpen(true);
      return;
    }
    setAuthAction(action ?? 'edit or delete a release');
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

  const handleConfirmExport = () => {
    if (exportType === 'CSV') {
      exportToCSVFunction(releases);
    }
  };

  const stats = {
    total: releases.length,
    inProgress: releases.filter((r) => getOverallStatus(r) === 'In Progress').length,
    completed: releases.filter((r) => getOverallStatus(r) === 'Complete').length,
    paused: releases.filter((r) => getOverallStatus(r) === 'Paused').length,
  };

  return (
    <>
      {/* Release toolbar */}
      <div className="mb-6 flex items-center justify-end gap-2">
        {user && (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Hi {getDisplayName(user)}
          </p>
        )}
        <button
          onClick={() => setIsShortcutsHelpOpen(true)}
          className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
            darkMode
              ? 'text-gray-300 bg-gray-800 hover:bg-gray-700'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>
        {user && (
          <button
            onClick={async () => {
              const msg = await handleDismissNotifications();
              setToastMessage(msg);
            }}
            className={`relative flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              darkMode
                ? 'text-yellow-300 bg-yellow-900/30 hover:bg-yellow-900/50'
                : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
            }`}
            title={
              notifications.length > 0
                ? `${notifications.length} notification(s)`
                : 'No notifications'
            }
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>
        )}
        {user ? (
          <>
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsAdminPanelOpen(true)}
                  className={`relative flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    darkMode
                      ? 'text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700'
                      : 'text-purple-700 bg-purple-100 hover:bg-purple-200 border border-purple-200'
                  }`}
                  title="Admin Panel"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                  {accessRequestCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {accessRequestCount > 9 ? '9+' : accessRequestCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsTeamsGroupsConfigOpen(true)}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    darkMode
                      ? 'text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700'
                      : 'text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200'
                  }`}
                  title="Configure Teams Groups"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </>
            )}
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
          </>
        ) : (
          <button
            onClick={() => {
              setAuthAction('sign in');
              setIsAuthModalOpen(true);
            }}
            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </button>
        )}
      </div>

      {/* Current Release Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Releases"
          value={stats.total}
          icon={ExternalLink}
          color="blue"
          darkMode={darkMode}
          loading={loading}
          isActive={!filters.status || filters.status === 'All'}
          onClick={() =>
            setFilters((prev) => ({ ...prev, status: 'All', dateRange: { start: '', end: '' } }))
          }
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Download}
          color="yellow"
          darkMode={darkMode}
          loading={loading}
          isActive={filters.status === 'In Progress'}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              status: prev.status === 'In Progress' ? 'All' : 'In Progress',
              dateRange: { start: '', end: '' },
            }))
          }
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={Download}
          color="green"
          darkMode={darkMode}
          loading={loading}
          isActive={filters.status === 'Complete'}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              status: prev.status === 'Complete' ? 'All' : 'Complete',
              dateRange: { start: '', end: '' },
            }))
          }
        />
        <StatCard
          title="Paused"
          value={stats.paused}
          icon={Download}
          color="red"
          darkMode={darkMode}
          loading={loading}
          isActive={filters.status === 'Paused'}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              status: prev.status === 'Paused' ? 'All' : 'Paused',
              dateRange: { start: '', end: '' },
            }))
          }
        />
      </div>

      {/* Controls */}
      <FilterBar
        filters={filters}
        onFiltersChange={(newFilters) => {
          const dateChanged =
            newFilters.dateRange?.start !== filters.dateRange?.start ||
            newFilters.dateRange?.end !== filters.dateRange?.end;
          const sortByChanged = newFilters.sortBy !== filters.sortBy;
          const sortStatusMap: Record<string, string> = {
            completed: 'Complete',
            inProgress: 'In Progress',
            paused: 'Paused',
          };

          if (dateChanged) {
            setFilters({ ...newFilters, status: 'All' });
          } else if (sortByChanged && newFilters.sortBy && sortStatusMap[newFilters.sortBy]) {
            setFilters({
              ...newFilters,
              status: sortStatusMap[newFilters.sortBy],
              dateRange: { start: '', end: '' },
            });
          } else if (sortByChanged) {
            setFilters({
              ...newFilters,
              status: 'All',
              dateRange: { start: '', end: '' },
            });
          } else {
            setFilters(newFilters);
          }
        }}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          if (term && (filters.dateRange?.start || filters.dateRange?.end)) {
            setFilters((prev) => ({
              ...prev,
              dateRange: { start: '', end: '' },
              status: 'All',
            }));
          }
          setSearchTerm(term);
        }}
        onExportCSV={exportToCSV}
        darkMode={darkMode}
        searchRef={searchInputRef}
      />

      <div className="flex justify-end mb-6 gap-3">
        <button
          onClick={() => setIsCompareModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <GitCompare className="w-5 h-5 mr-2" />
          Compare Releases
        </button>
        <button
          onClick={handleAddRelease}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Release
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <>
          <div className="hidden lg:block">
            <div
              className={`rounded-lg border shadow-sm overflow-hidden ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`px-4 py-3 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                <div className="flex gap-6">
                  {[80, 120, 100, 80, 60, 80].map((w, i) => (
                    <div
                      key={i}
                      className={`h-3 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                      style={{ width: w }}
                    />
                  ))}
                </div>
              </div>
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className={`px-4 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-6 animate-pulse">
                    <div className={`h-4 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-4 w-32 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-4 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-4 w-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-6 w-16 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-4 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:hidden space-y-4">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className={`rounded-lg border p-4 animate-pulse ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className={`h-5 w-40 rounded mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-3 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  </div>
                  <div className={`h-6 w-20 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                </div>
                <div className="flex gap-3 mt-3">
                  <div className={`h-4 w-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-4 w-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-4 w-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Desktop Table View */}
      {!loading && (
        <div className="hidden lg:block">
          <div
            className={`rounded-lg border shadow-sm overflow-hidden ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <ReleaseTable
              releases={pagination.paginatedItems}
              onEdit={handleEditRelease}
              onDelete={handleDeleteRelease}
              onViewDetails={handleViewDetails}
              isAdmin={isAdmin}
              canEdit={canEdit}
              onAuthRequired={handleAuthRequired}
              darkMode={darkMode}
            />
            <Pagination {...pagination} darkMode={darkMode} />
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      {!loading && (
        <div className="lg:hidden space-y-4">
          {pagination.paginatedItems.map((release) => {
            const overallStatus = getOverallStatus(release);
            const statusColors = darkMode
              ? {
                  Complete: 'bg-green-900/30 text-green-300',
                  'In Progress': 'bg-blue-900/30 text-blue-300',
                  Paused: 'bg-red-900/30 text-red-300',
                }
              : {
                  Complete: 'bg-green-100 text-green-800',
                  'In Progress': 'bg-blue-100 text-blue-800',
                  Paused: 'bg-red-100 text-red-800',
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
                    <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {release.releaseName}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {release.environment || release.concept}
                    </p>
                    {release.tags && release.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {release.tags.map((tag) => (
                          <TagBadge key={tag} tag={tag} darkMode={darkMode} size="xs" />
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[overallStatus as keyof typeof statusColors]
                    }`}
                  >
                    {overallStatus}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {release.platforms?.map((platform, idx) => {
                    const conceptReleases = getConceptReleases(platform);
                    const firstRelease = conceptReleases[0];
                    return (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {platform.platform}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-sm font-medium ${
                              darkMode ? 'text-gray-300' : 'text-gray-900'
                            }`}
                          >
                            {firstRelease?.version || 'N/A'}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
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
          {pagination.totalPages > 1 && <Pagination {...pagination} darkMode={darkMode} />}
        </div>
      )}

      {!loading && filteredReleases.length === 0 && (
        <div className="text-center py-12">
          <div className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
            <Filter className="w-12 h-12 mx-auto mb-4" />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            No releases found
          </h3>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Try adjusting your search or filters, or add a new release.
          </p>
        </div>
      )}

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
        releases={releases}
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

      <KeyboardShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        darkMode={darkMode}
      />

      <CompareReleasesModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        releases={releases}
        darkMode={darkMode}
      />

      <TeamsGroupsConfigModal
        isOpen={isTeamsGroupsConfigOpen}
        onClose={() => setIsTeamsGroupsConfigOpen(false)}
        teamsGroups={teamsGroups}
        onAddGroup={handleAddTeamsGroup}
        onUpdateGroup={handleUpdateTeamsGroup}
        onDeleteGroup={handleDeleteTeamsGroup}
        darkMode={darkMode}
      />

      {permissionDeniedAction && (
        <PermissionDeniedModal
          isOpen={isPermissionDeniedOpen}
          onClose={() => setIsPermissionDeniedOpen(false)}
          user={
            user
              ? { uid: user.uid, email: user.email, displayName: getDisplayName(user) }
              : null
          }
          darkMode={darkMode}
          action={permissionDeniedAction}
        />
      )}

      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        darkMode={darkMode}
      />
    </>
  );
};
