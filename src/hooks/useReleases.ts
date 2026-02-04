import { useState, useEffect } from 'react';
import { Release, ReleaseStats, FilterOptions } from '../types/release';
import { mockReleases } from '../data/mockData';
import { downloadJSON, downloadCSV } from '../utils/fileStorage';
import * as firebaseReleases from '../services/firebaseReleases';

export const useReleases = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReleases = async () => {
      try {
        const loadedReleases = await firebaseReleases.getReleases();
        if (loadedReleases.length === 0) {
          setReleases(mockReleases);
          for (const mockRelease of mockReleases) {
            const { id, ...releaseData } = mockRelease;
            await firebaseReleases.addRelease(releaseData);
          }
        } else {
          setReleases(loadedReleases);
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

  const addRelease = async (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await firebaseReleases.addRelease(release);
      const newRelease: Release = {
        ...release,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setReleases([newRelease, ...releases]);
    } catch (error) {
      console.error('Error adding release:', error);
    }
  };

  const updateRelease = async (id: string, updates: Partial<Release>) => {
    try {
      await firebaseReleases.updateRelease(id, updates as Omit<Release, 'id'>);
      const updatedReleases = releases.map(release =>
        release.id === id
          ? { ...release, ...updates, updatedAt: new Date().toISOString() }
          : release
      );
      setReleases(updatedReleases);
    } catch (error) {
      console.error('Error updating release:', error);
    }
  };

  const deleteRelease = async (id: string) => {
    try {
      await firebaseReleases.deleteRelease(id);
      const updatedReleases = releases.filter(release => release.id !== id);
      setReleases(updatedReleases);
    } catch (error) {
      console.error('Error deleting release:', error);
    }
  };

  const importReleases = async (file: File) => {
    try {
      const importedReleases = await importFromJSON(file);
      for (const release of importedReleases) {
        const { id, ...releaseData } = release;
        await firebaseReleases.addRelease(releaseData);
      }
      setReleases(importedReleases);
      return { success: true, message: `Successfully imported ${importedReleases.length} releases` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Import failed' };
    }
  };

  const exportToJSON = () => {
    downloadJSON(releases);
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
    exportToCSV,
  };
};