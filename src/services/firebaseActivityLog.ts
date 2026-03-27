/**
 * Activity Log / Audit Trail service
 *
 * Stores activity entries in a top-level Firestore collection `activityLogs`.
 * Each document represents one discrete change event on a release.
 *
 * Writes happen only on explicit save actions (create / update / delete),
 * never on every keystroke.
 *
 * NOTE: Queries use only a single `where` clause and sort client-side to avoid
 * requiring a Firestore composite index (which would need manual setup in the
 * Firebase console or firestore.indexes.json).
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { ActivityLogEntry, ActivityAction } from '../types/release';

const ACTIVITY_LOGS_COLLECTION = 'activityLogs';

// ─── Write ────────────────────────────────────────────────────────────────────

export interface AddActivityLogParams {
  releaseId: string;
  releaseName: string;
  action: ActivityAction;
  summary: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userEmail: string;
  userName: string;
}

export const addActivityLog = async (params: AddActivityLogParams): Promise<void> => {
  await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
    ...params,
    timestamp: new Date().toISOString(),
  });
};

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all activity logs for a specific release, newest first.
 * Uses only a single `where` clause (no composite index needed).
 * Sorting is done client-side.
 */
export const getActivityLogsForRelease = async (
  releaseId: string,
  maxEntries = 100
): Promise<ActivityLogEntry[]> => {
  const q = query(
    collection(db, ACTIVITY_LOGS_COLLECTION),
    where('releaseId', '==', releaseId)
  );
  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ActivityLogEntry, 'id'>),
  }));

  // Sort newest first client-side
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return entries.slice(0, maxEntries);
};

/**
 * Fetch the most recent activity logs across ALL releases (global audit view).
 * Sorting is done client-side.
 */
export const getAllActivityLogs = async (maxEntries = 200): Promise<ActivityLogEntry[]> => {
  const q = query(collection(db, ACTIVITY_LOGS_COLLECTION));
  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ActivityLogEntry, 'id'>),
  }));

  // Sort newest first client-side
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return entries.slice(0, maxEntries);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format an ISO timestamp string to a readable local date-time. */
export const formatActivityTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
