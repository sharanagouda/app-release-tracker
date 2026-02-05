import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Release, RolloutHistoryEntry } from '../types/release';
import { getCurrentUser } from './firebaseAuth';

const RELEASES_COLLECTION = 'releases';

// Helper function to get user info
const getUserInfo = () => {
  const user = getCurrentUser();
  if (!user) return { email: null, displayName: null };
  
  const email = user.email || '';
  const username = email.split('@')[0];
  const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
  
  return {
    email,
    displayName: formattedName
  };
};

export const addRelease = async (release: Omit<Release, 'id'>) => {
  const userInfo = getUserInfo();
  
  const docRef = await addDoc(collection(db, RELEASES_COLLECTION), {
    ...release,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userInfo.email,
    createdByName: userInfo.displayName,
    updatedBy: userInfo.email,
    updatedByName: userInfo.displayName,
  });
  return docRef.id;
};

export const updateRelease = async (id: string, release: Omit<Release, 'id'>) => {
  const userInfo = getUserInfo();
  const docRef = doc(db, RELEASES_COLLECTION, id);
  
  // Get the existing release to compare rollout percentages
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const existingRelease = docSnap.data() as Release;
    
    // Create updated platforms with rollout history
    const updatedPlatforms = release.platforms.map((platform, platformIndex) => {
      const existingPlatform = existingRelease.platforms[platformIndex];
      
      return {
        ...platform,
        conceptReleases: platform.conceptReleases.map((conceptRelease, crIndex) => {
          const existingConceptRelease = existingPlatform?.conceptReleases?.[crIndex];
          
          if (!existingConceptRelease) {
            // New concept release, no history to preserve
            return conceptRelease;
          }
          
          // Always preserve existing rollout history
          const existingHistory = existingConceptRelease.rolloutHistory || [];
          
          // Check if rollout percentage has changed
          if (existingConceptRelease.rolloutPercentage !== conceptRelease.rolloutPercentage) {
            // Create new history entry
            const historyEntry: RolloutHistoryEntry = {
              percentage: conceptRelease.rolloutPercentage,
              date: new Date().toISOString(),
              notes: `Updated from ${existingConceptRelease.rolloutPercentage}% to ${conceptRelease.rolloutPercentage}%`,
              updatedBy: userInfo.email || undefined,
              updatedByName: userInfo.displayName || undefined,
            };
            
            // Add new entry to the beginning, keep all old history
            return {
              ...conceptRelease,
              rolloutHistory: [historyEntry, ...existingHistory],
            };
          }
          
          // No change in rollout percentage, just preserve existing history
          return {
            ...conceptRelease,
            rolloutHistory: existingHistory,
          };
        }),
      };
    });
    
    await updateDoc(docRef, {
      ...release,
      platforms: updatedPlatforms,
      updatedAt: new Date().toISOString(),
      updatedBy: userInfo.email,
      updatedByName: userInfo.displayName,
    });
  } else {
    // If document doesn't exist (shouldn't happen), just update normally
    await updateDoc(docRef, {
      ...release,
      updatedAt: new Date().toISOString(),
      updatedBy: userInfo.email,
      updatedByName: userInfo.displayName,
    });
  }
};

export const deleteRelease = async (id: string) => {
  const docRef = doc(db, RELEASES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getReleases = async (): Promise<Release[]> => {
  const q = query(
    collection(db, RELEASES_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Release));
};

// New function to update rollout percentage with history tracking
export const updateRolloutPercentage = async (
  releaseId: string,
  platformIndex: number,
  conceptReleaseIndex: number,
  newPercentage: number,
  notes?: string
) => {
  const userInfo = getUserInfo();
  const docRef = doc(db, RELEASES_COLLECTION, releaseId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Release not found');
  }
  
  const release = docSnap.data() as Release;
  const platform = release.platforms[platformIndex];
  const conceptRelease = platform.conceptReleases[conceptReleaseIndex];
  
  // Create new history entry
  const historyEntry: RolloutHistoryEntry = {
    percentage: newPercentage,
    date: new Date().toISOString(),
    notes: notes || `Updated from ${conceptRelease.rolloutPercentage}% to ${newPercentage}%`,
    updatedBy: userInfo.email || undefined,
    updatedByName: userInfo.displayName || undefined,
  };
  
  // Update the concept release
  const updatedConceptRelease = {
    ...conceptRelease,
    rolloutPercentage: newPercentage,
    rolloutHistory: [historyEntry, ...(conceptRelease.rolloutHistory || [])],
  };
  
  // Update the platforms array
  const updatedPlatforms = [...release.platforms];
  updatedPlatforms[platformIndex] = {
    ...platform,
    conceptReleases: [
      ...platform.conceptReleases.slice(0, conceptReleaseIndex),
      updatedConceptRelease,
      ...platform.conceptReleases.slice(conceptReleaseIndex + 1),
    ],
  };
  
  await updateDoc(docRef, {
    platforms: updatedPlatforms,
    updatedAt: new Date().toISOString(),
    updatedBy: userInfo.email,
    updatedByName: userInfo.displayName,
  });
};

// Helper function to get a single release
export const getRelease = async (id: string): Promise<Release | null> => {
  const docRef = doc(db, RELEASES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Release;
};