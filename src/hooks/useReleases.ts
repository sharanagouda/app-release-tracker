import { useState, useEffect } from 'react';
import { Release, ReleaseStats, FilterOptions } from '../types/release';
import { mockReleases } from '../data/mockData';
import { downloadJSON, downloadMockData, downloadCSV, importFromJSON } from '../utils/fileStorage';

export const useReleases = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadReleases = async () => {
      try {
        // In a real app, this would be an API call
        const savedReleases = localStorage.getItem('releases');
        if (savedReleases) {
          const parsedReleases = JSON.parse(savedReleases);
          // Validate and ensure platforms is always an array
          const validatedReleases = parsedReleases.map((release: any) => ({
            ...release,
            platforms: Array.isArray(release.platforms) ? release.platforms : []
          }));
          setReleases(validatedReleases);
        } else {
          setReleases(mockReleases);
          localStorage.setItem('releases', JSON.stringify(mockReleases));
        }
      } catch (error) {
        console.error('Error loading releases:', error);
        setReleases(mockReleases);
      } finally {
        setLoading(false);
      }
    };

    loadReleases();
  }, []);

  const addRelease = (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRelease: Release = {
      ...release,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedReleases = [...releases, newRelease];
    setReleases(updatedReleases);
    localStorage.setItem('releases', JSON.stringify(updatedReleases));
  };

  const updateRelease = (id: string, updates: Partial<Release>) => {
    const updatedReleases = releases.map(release =>
      release.id === id
        ? { ...release, ...updates, updatedAt: new Date().toISOString() }
        : release
    );
    setReleases(updatedReleases);
    localStorage.setItem('releases', JSON.stringify(updatedReleases));
  };

  const deleteRelease = (id: string) => {
    const updatedReleases = releases.filter(release => release.id !== id);
    setReleases(updatedReleases);
    localStorage.setItem('releases', JSON.stringify(updatedReleases));
  };

  const importReleases = async (file: File) => {
    try {
      const importedReleases = await importFromJSON(file);
      setReleases(importedReleases);
      localStorage.setItem('releases', JSON.stringify(importedReleases));
      return { success: true, message: `Successfully imported ${importedReleases.length} releases` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Import failed' };
    }
  };

  const exportToJSON = () => {
    downloadJSON(releases);
  };

  const exportToMockData = () => {
    downloadMockData(releases);
  };

  const exportToCSV = () => {
    downloadCSV(releases);
  };

  const getStats = (): ReleaseStats => {
    const allPlatforms = releases.flatMap(r => Array.isArray(r.platforms) ? r.platforms : []);
    return {
      totalReleases: releases.length,
      activeReleases: allPlatforms.filter(p => p && p.status === 'In Progress').length,
      completedReleases: allPlatforms.filter(p => p && p.status === 'Complete').length,
      pausedReleases: allPlatforms.filter(p => p && p.status === 'Paused').length,
    };
  };

  const filterReleases = (filters: Partial<FilterOptions>) => {
    return releases.filter(release => {
      // Ensure release is valid and has platforms array
      if (!release || !Array.isArray(release.platforms)) {
        return false;
      }
      
      if (filters.status && filters.status !== 'All') {
        const hasStatus = release.platforms.some(p => p.status === filters.status);
        if (!hasStatus) return false;
      }
      if (filters.dateRange?.start && new Date(release.releaseDate) < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange?.end && new Date(release.releaseDate) > new Date(filters.dateRange.end)) {
        return false;
      }
      return true;
    });
  };

  return {
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
    exportToCSV,
  };
};