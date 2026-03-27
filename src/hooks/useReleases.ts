import { useState, useEffect } from 'react';
import { Release, ReleaseStats, FilterOptions } from '../types/release';
import { mockReleases } from '../data/mockData';
import { downloadJSON, downloadCSV } from '../utils/fileStorage';
import * as firebaseReleases from '../services/firebaseReleases';

export const useReleases = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadReleases = async () => {
    try {
      const loadedReleases = await firebaseReleases.getReleases();
      if (loadedReleases.length === 0) {
        // Seed mock data only once — use a flag to prevent race conditions
        setReleases(mockReleases);
        try {
          for (const mockRelease of mockReleases) {
            const { id, ...releaseData } = mockRelease;
            await firebaseReleases.addRelease(releaseData);
          }
        } catch {
          // Ignore duplicate errors during seeding
        }
      } else {
        // Deduplicate by Firestore document ID (should already be unique, but safety net)
        const uniqueMap = new Map<string, Release>();
        loadedReleases.forEach(r => uniqueMap.set(r.id, r));
        setReleases(Array.from(uniqueMap.values()));
      }
    } catch (error) {
      console.error('Error loading releases:', error);
      setReleases(mockReleases);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const addRelease = async (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (saving) return; // Prevent double-click submissions
    setSaving(true);
    setSaveError(null);
    try {
      const newId = await firebaseReleases.addRelease(release as Omit<Release, 'id'>);
      // Fetch the newly created release from Firebase to get server-generated fields
      const newRelease = await firebaseReleases.getRelease(newId);
      if (newRelease) {
        // Prepend to local state — no full reload needed
        setReleases(prev => {
          // Extra safety: ensure no duplicate ID in local state
          if (prev.some(r => r.id === newRelease.id)) return prev;
          return [newRelease, ...prev];
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error adding release';
      console.error('Error adding release:', message);
      setSaveError(message);
      throw error; // Re-throw so the caller can handle it
    } finally {
      setSaving(false);
    }
  };

  const updateRelease = async (id: string, updates: Partial<Release>) => {
    if (saving) return; // Prevent double-click submissions
    setSaving(true);
    setSaveError(null);
    try {
      await firebaseReleases.updateRelease(id, updates as Omit<Release, 'id'>);
      // Fetch the updated release from Firebase to get the latest rollout history
      const updatedRelease = await firebaseReleases.getRelease(id);
      if (updatedRelease) {
        // Replace the existing item by id — no full reload, no duplicates
        setReleases(prev => prev.map(r => r.id === id ? updatedRelease : r));
      }
    } catch (error) {
      console.error('Error updating release:', error);
      setSaveError(error instanceof Error ? error.message : 'Error updating release');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteRelease = async (id: string) => {
    try {
      await firebaseReleases.deleteRelease(id);
      // Remove the item by id from local state — no full reload needed
      setReleases(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting release:', error);
    }
  };

  // Helper function to import from JSON file
  const importFromJSON = async (file: File): Promise<Release[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          // Validate that it's an array of releases
          if (Array.isArray(data)) {
            resolve(data as Release[]);
          } else {
            reject(new Error('Invalid JSON format: expected an array of releases'));
          }
        } catch (error) {
          reject(new Error('Failed to parse JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const importReleases = async (file: File) => {
    try {
      const importedReleases = await importFromJSON(file);
      for (const release of importedReleases) {
        const { id, ...releaseData } = release;
        await firebaseReleases.addRelease(releaseData);
      }
      // Reload all releases from Firebase
      await loadReleases();
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
    
    // Get all concept releases from all platforms
    const allConceptReleases = allPlatforms.flatMap(p => 
      p.conceptReleases && Array.isArray(p.conceptReleases) ? p.conceptReleases : []
    );
    
    return {
      totalReleases: releases.length,
      activeReleases: allConceptReleases.filter(cr => cr && cr.status === 'In Progress').length,
      completedReleases: allConceptReleases.filter(cr => cr && cr.status === 'Complete').length,
      pausedReleases: allConceptReleases.filter(cr => cr && (cr.status === 'On Hold' || cr.status === 'Paused')).length,
    };
  };

  const filterReleases = (filters: Partial<FilterOptions>) => {
    return releases.filter(release => {
      // Ensure release is valid and has platforms array
      if (!release || !Array.isArray(release.platforms)) {
        return false;
      }
      
      if (filters.status && filters.status !== 'All') {
        // Check both conceptReleases and legacy platform status
        const hasStatus = release.platforms.some(p => {
          // Check concept releases
          if (p.conceptReleases && Array.isArray(p.conceptReleases)) {
            return p.conceptReleases.some(cr => cr.status === filters.status);
          }
          // Fallback to legacy platform status
          return p.status === filters.status;
        });
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
    saving,
    saveError,
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