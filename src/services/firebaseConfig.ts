/**
 * App Configuration service
 *
 * Stores app-wide configuration in Firestore `appConfig` collection.
 * Currently manages Teams groups for sharing releases.
 *
 * Only admins can modify the configuration.
 */

import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface TeamsGroup {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface AppConfig {
  teamsGroups: TeamsGroup[];
  updatedAt: string;
  updatedBy?: string;
}

const APP_CONFIG_DOC = 'appConfig';
const APP_CONFIG_COLLECTION = 'appConfig';

// Get the singleton app config document
const getConfigDoc = () => doc(db, APP_CONFIG_COLLECTION, APP_CONFIG_DOC);

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Get the app configuration (teams groups)
 */
export const getAppConfig = async (): Promise<AppConfig | null> => {
  const snap = await getDoc(getConfigDoc());
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as AppConfig;
};

/**
 * Get all teams groups
 */
export const getTeamsGroups = async (): Promise<TeamsGroup[]> => {
  const config = await getAppConfig();
  return config?.teamsGroups || [];
};

// ─── Write (Admin only) ──────────────────────────────────────────────────────

/**
 * Add a new Teams group
 */
export const addTeamsGroup = async (
  name: string,
  url: string,
  updatedBy?: string
): Promise<void> => {
  const config = await getAppConfig();

  const newGroup: TeamsGroup = {
    id: `team-${Date.now()}`,
    name,
    url,
    createdAt: new Date().toISOString(),
  };

  const teamsGroups = config?.teamsGroups
    ? [...config.teamsGroups, newGroup]
    : [newGroup];

  await setDoc(getConfigDoc(), {
    teamsGroups,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }, { merge: true });
};

/**
 * Update an existing Teams group
 */
export const updateTeamsGroup = async (
  groupId: string,
  name: string,
  url: string,
  updatedBy?: string
): Promise<void> => {
  const config = await getAppConfig();
  if (!config?.teamsGroups) return;

  const teamsGroups = config.teamsGroups.map((g) =>
    g.id === groupId ? { ...g, name, url } : g
  );

  await setDoc(getConfigDoc(), {
    teamsGroups,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }, { merge: true });
};

/**
 * Delete a Teams group
 */
export const deleteTeamsGroup = async (
  groupId: string,
  updatedBy?: string
): Promise<void> => {
  const config = await getAppConfig();
  if (!config?.teamsGroups) return;

  const teamsGroups = config.teamsGroups.filter((g) => g.id !== groupId);

  await setDoc(getConfigDoc(), {
    teamsGroups,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }, { merge: true });
};

/**
 * Reorder Teams groups
 */
export const reorderTeamsGroups = async (
  orderedIds: string[],
  updatedBy?: string
): Promise<void> => {
  const config = await getAppConfig();
  if (!config?.teamsGroups) return;

  const groupMap = new Map(config.teamsGroups.map((g) => [g.id, g]));
  const teamsGroups = orderedIds
    .map((id) => groupMap.get(id))
    .filter((g): g is TeamsGroup => g !== undefined);

  await setDoc(getConfigDoc(), {
    teamsGroups,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }, { merge: true });
};

// ─── Initialize Default ─────────────────────────────────────────────────────

/**
 * Initialize with default teams groups if not configured
 */
export const initializeDefaultTeamsGroups = async (): Promise<TeamsGroup[]> => {
  const existing = await getAppConfig();
  
  if (existing?.teamsGroups && existing.teamsGroups.length > 0) {
    return existing.teamsGroups;
  }

  const defaultGroups: TeamsGroup[] = [
    {
      id: 'mobile-releases',
      name: 'Mobile Releases',
      url: 'https://teams.microsoft.com/l/chat/19:2cb23d7b15004c18a3368e6d6e58d5c2@thread.v2/conversations?context=%7B%22contextType%22%3A%22chat%22%7D',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'release-group-for-blc',
      name: 'Release-group-for-BLC',
      url: 'https://teams.microsoft.com/l/chat/19:00c1e6a443f4473a9c928734dc53f4e4@thread.v2/conversations?context=%7B%22contextType%22%3A%22chat%22%7D',
      createdAt: new Date().toISOString(),
    },
  ];

  await setDoc(getConfigDoc(), {
    teamsGroups: defaultGroups,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  return defaultGroups;
};