import { useState, useEffect, useRef, useCallback } from 'react';
import { FilterOptions, Release, ReleaseStats } from '../types/release';
import { mockReleases } from '../data/mockData';
import { downloadJSON, downloadCSV } from '../utils/fileStorage';
import * as firebaseReleases from '../services/firebaseReleases';

export const useReleases = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Guard to prevent seeding mock data more than once
  const seedingRef = useRef(false);

  useEffect(() => {
    const allowMockSeed = import.meta.env.DEV && import.meta.env.VITE_SEED_MOCK_DATA === 'true';

    // Subscribe to real-time updates from Firestore
    const unsubscribe = firebaseReleases.subscribeToReleases(
      async (liveReleases) => {
        if (allowMockSeed && liveReleases.length === 0 && !seedingRef.current) {
          // Empty collection — seed mock data once (DEV only)
          seedingRef.current = true;
          setReleases(mockReleases); // Show mock data immediately
          setLoading(false);
          try {
            for (const mockRelease of mockReleases) {
              const { id, ...releaseData } = mockRelease;
              await firebaseReleases.addRelease(releaseData);
            }
            // After seeding, the onSnapshot listener will fire again with the
            // newly created documents, so we don't need to manually update state.
          } catch {
            // Ignore duplicate errors during seeding
          }
        } else {
          // Deduplicate by Firestore document ID (safety net)
          const uniqueMap = new Map<string, Release>();
          liveReleases.forEach((r) => uniqueMap.set(r.id, r));
          setReleases(Array.from(uniqueMap.values()));
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error subscribing to releases:', error);
        // Fallback to mock data on subscription error
        setReleases(mockReleases);
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe from Firestore listener on unmount
    return () => unsubscribe();
  }, []);

  const addRelease = useCallback(async (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (saving) return; // Prevent double-click submissions
    setSaving(true);
    setSaveError(null);
    try {
      await firebaseReleases.addRelease(release as Omit<Release, 'id'>);
      // No need to manually update local state — the onSnapshot listener
      // will automatically receive the new document and update `releases`.
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error adding release';
      console.error('Error adding release:', message);
      setSaveError(message);
      throw error; // Re-throw so the caller can handle it
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const updateRelease = useCallback(async (id: string, updates: Partial<Release>) => {
    if (saving) return; // Prevent double-click submissions
    setSaving(true);
    setSaveError(null);
    try {
      await firebaseReleases.updateRelease(id, updates as Omit<Release, 'id'>);
      // No need to manually update local state — the onSnapshot listener
      // will automatically receive the updated document and update `releases`.
    } catch (error) {
      console.error('Error updating release:', error);
      setSaveError(error instanceof Error ? error.message : 'Error updating release');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const deleteRelease = useCallback(async (id: string) => {
    try {
      await firebaseReleases.deleteRelease(id);
      // No need to manually update local state — the onSnapshot listener
      // will automatically detect the removed document and update `releases`.
    } catch (error) {
      console.error('Error deleting release:', error);
    }
  }, []);

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

  const importReleases = useCallback(async (file: File) => {
    try {
      const importedReleases = await importFromJSON(file);
      for (const release of importedReleases) {
        const { id, ...releaseData } = release;
        await firebaseReleases.addRelease(releaseData);
      }
      // No need to manually reload — the onSnapshot listener will
      // automatically pick up the newly imported documents.
      return { success: true, message: `Successfully imported ${importedReleases.length} releases` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Import failed' };
    }
  }, []);

  const exportToJSON = useCallback(() => {
    downloadJSON(releases);
  }, [releases]);

  const exportToCSV = useCallback(() => {
    downloadCSV(releases);
  }, [releases]);

  const getStats = useCallback((): ReleaseStats => {
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
  }, [releases]);

  const filterReleases = useCallback((filters: Partial<FilterOptions>) => {
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
  }, [releases]);

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
