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
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Release, RolloutHistoryEntry } from '../types/release';
import { getCurrentUser } from './firebaseAuth';
import { addActivityLog } from './firebaseActivityLog';

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

// Check if a release with the same name, date, and environment already exists
export const checkDuplicateRelease = async (
  releaseName: string,
  releaseDate: string,
  environment: string
): Promise<boolean> => {
  const q = query(
    collection(db, RELEASES_COLLECTION),
    where('releaseName', '==', releaseName),
    where('releaseDate', '==', releaseDate),
    where('environment', '==', environment)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const addRelease = async (release: Omit<Release, 'id'>) => {
  const userInfo = getUserInfo();

  // Check for duplicate before adding
  const isDuplicate = await checkDuplicateRelease(
    release.releaseName,
    release.releaseDate,
    release.environment
  );
  if (isDuplicate) {
    throw new Error(
      `A release with the name "${release.releaseName}" on ${release.releaseDate} for environment "${release.environment}" already exists.`
    );
  }
  
  const docRef = await addDoc(collection(db, RELEASES_COLLECTION), {
    ...release,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userInfo.email,
    createdByName: userInfo.displayName,
    updatedBy: userInfo.email,
    updatedByName: userInfo.displayName,
  });

  // Log the creation (fire-and-forget — don't block the caller)
  addActivityLog({
    releaseId: docRef.id,
    releaseName: release.releaseName,
    action: 'created',
    summary: `Release "${release.releaseName}" was created`,
    userEmail: userInfo.email || 'unknown',
    userName: userInfo.displayName || 'Unknown',
  }).catch(console.error);

  return docRef.id;
};

// ─── Field-level diff helpers ─────────────────────────────────────────────────

/** Compare two scalar values and return a human-readable change summary, or null if unchanged. */
const diffScalar = (
  field: string,
  label: string,
  oldVal: unknown,
  newVal: unknown
): { field: string; summary: string; oldValue: string; newValue: string } | null => {
  const oldStr = oldVal == null ? '' : String(oldVal);
  const newStr = newVal == null ? '' : String(newVal);
  if (oldStr === newStr) return null;
  return {
    field,
    summary: `Changed ${label} from "${oldStr}" to "${newStr}"`,
    oldValue: oldStr,
    newValue: newStr,
  };
};

/** Compare two string arrays and return a summary if they differ. */
const diffStringArray = (
  field: string,
  label: string,
  oldArr: string[] | undefined,
  newArr: string[] | undefined
): { field: string; summary: string; oldValue: string; newValue: string } | null => {
  const oldStr = (oldArr || []).join(', ');
  const newStr = (newArr || []).join(', ');
  if (oldStr === newStr) return null;
  return {
    field,
    summary: `Changed ${label}`,
    oldValue: oldStr || '(none)',
    newValue: newStr || '(none)',
  };
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

    // ── Build field-level diff for activity log ──────────────────────────────
    const diffs: Array<{ field: string; summary: string; oldValue: string; newValue: string }> = [];

    const d1 = diffScalar('releaseName', 'release name', existingRelease.releaseName, release.releaseName);
    if (d1) diffs.push(d1);

    const d2 = diffScalar('releaseDate', 'release date', existingRelease.releaseDate, release.releaseDate);
    if (d2) diffs.push(d2);

    const d3 = diffScalar('environment', 'environment', existingRelease.environment, release.environment);
    if (d3) diffs.push(d3);

    const d4 = diffScalar('notes', 'notes', existingRelease.notes, release.notes);
    if (d4) diffs.push(d4);

    const d5 = diffStringArray('changes', 'changes list', existingRelease.changes, release.changes);
    if (d5) diffs.push(d5);

    const d6 = diffStringArray('tags', 'tags', existingRelease.tags, release.tags);
    if (d6) diffs.push(d6);

    const d7 = diffScalar('isNative', 'native status', existingRelease.isNative, release.isNative);
    if (d7) diffs.push(d7);

    // Check platform-level rollout / status changes
    release.platforms.forEach((platform, pi) => {
      const existingPlatform = existingRelease.platforms[pi];
      platform.conceptReleases.forEach((cr, ci) => {
        const existingCr = existingPlatform?.conceptReleases?.[ci];
        if (!existingCr) return;

        if (existingCr.rolloutPercentage !== cr.rolloutPercentage) {
          diffs.push({
            field: `platforms[${pi}].conceptReleases[${ci}].rolloutPercentage`,
            summary: `${platform.platform} rollout updated from ${existingCr.rolloutPercentage}% to ${cr.rolloutPercentage}%`,
            oldValue: `${existingCr.rolloutPercentage}%`,
            newValue: `${cr.rolloutPercentage}%`,
          });
        }

        if (existingCr.status !== cr.status) {
          diffs.push({
            field: `platforms[${pi}].conceptReleases[${ci}].status`,
            summary: `${platform.platform} status changed from "${existingCr.status}" to "${cr.status}"`,
            oldValue: existingCr.status,
            newValue: cr.status,
          });
        }
      });
    });

    // Write one activity log entry per changed field (fire-and-forget)
    if (diffs.length > 0) {
      const logPromises = diffs.map((diff) =>
        addActivityLog({
          releaseId: id,
          releaseName: release.releaseName,
          action: diff.field.includes('rollout') ? 'rollout_updated'
                : diff.field.includes('status') ? 'status_changed'
                : diff.field === 'tags' ? 'tags_updated'
                : 'updated',
          summary: diff.summary,
          field: diff.field,
          oldValue: diff.oldValue,
          newValue: diff.newValue,
          userEmail: userInfo.email || 'unknown',
          userName: userInfo.displayName || 'Unknown',
        }).catch(console.error)
      );
      await Promise.allSettled(logPromises);
    }
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

  // Fetch release name before deleting for the log
  const docSnap = await getDoc(docRef);
  const releaseName = docSnap.exists() ? (docSnap.data() as Release).releaseName : id;
  const userInfo = getUserInfo();

  await deleteDoc(docRef);

  // Log the deletion (fire-and-forget)
  addActivityLog({
    releaseId: id,
    releaseName,
    action: 'deleted',
    summary: `Release "${releaseName}" was deleted`,
    userEmail: userInfo.email || 'unknown',
    userName: userInfo.displayName || 'Unknown',
  }).catch(console.error);
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