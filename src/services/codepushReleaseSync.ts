/**
 * CodePush <-> Release Sync Service
 *
 * Provides utilities to:
 * 1. Find matching Firestore releases by CodePush appVersion
 * 2. Auto-update release rollout when CodePush rollout changes
 */

import { Release } from '../types/release';
import { getConceptReleases } from '../utils/conceptReleases';
import * as firebaseReleases from './firebaseReleases';

/**
 * Find Firestore releases that have a matching version string.
 * Searches across all platforms and concept releases.
 */
export function findMatchingReleases(releases: Release[], appVersion: string): Release[] {
  if (!appVersion) return [];

  return releases.filter((release) => {
    return (release.platforms || []).some((platform) => {
      const conceptReleases = getConceptReleases(platform);
      return conceptReleases.some((cr) => cr.version === appVersion);
    });
  });
}

/**
 * When a CodePush rollout percentage changes, find matching releases
 * and update their rollout percentage to match.
 *
 * @param releases - Current releases list (for lookup)
 * @param appVersion - The CodePush appVersion (e.g., "5.66.0")
 * @param newRollout - The new rollout percentage (0-100)
 * @returns Array of release IDs that were updated
 */
export async function syncCodePushRolloutToReleases(
  releases: Release[],
  appVersion: string,
  newRollout: number
): Promise<string[]> {
  if (!appVersion || newRollout < 0 || newRollout > 100) return [];

  const matchingReleases = findMatchingReleases(releases, appVersion);
  const updatedIds: string[] = [];

  for (const release of matchingReleases) {
    for (let pi = 0; pi < (release.platforms || []).length; pi++) {
      const platform = release.platforms[pi];
      const conceptReleases = getConceptReleases(platform);

      for (let ci = 0; ci < conceptReleases.length; ci++) {
        const cr = conceptReleases[ci];
        if (cr.version === appVersion && cr.rolloutPercentage !== newRollout) {
          try {
            await firebaseReleases.updateRolloutPercentage(
              release.id,
              pi,
              ci,
              newRollout,
              `Auto-synced from CodePush (${cr.rolloutPercentage}% → ${newRollout}%)`
            );
            if (!updatedIds.includes(release.id)) {
              updatedIds.push(release.id);
            }
          } catch (err) {
            console.error(
              `[CodePush Sync] Failed to update release ${release.id} rollout:`,
              err
            );
          }
        }
      }
    }
  }

  return updatedIds;
}
