import { ConceptRelease, PlatformRelease } from '../types/release';

/**
 * Normalize platform releases so the UI can always work with `conceptReleases[]`.
 *
 * Supports legacy shape where `platform.version/buildId/status/...` lived directly
 * on the platform object.
 */
export function getConceptReleases(platform: PlatformRelease): ConceptRelease[] {
  if (platform.conceptReleases && platform.conceptReleases.length > 0) {
    return platform.conceptReleases;
  }

  return [
    {
      id: `${platform.platform}-legacy`,
      concepts: platform.concepts || ['All Concepts'],
      version: platform.version || '',
      buildId: platform.buildId || '',
      rolloutPercentage: platform.rolloutPercentage || 0,
      status: platform.status || 'Not Started',
      notes: platform.notes || '',
      buildLink: platform.buildLink || '',
      rolloutHistory: platform.rolloutHistory || [],
    },
  ];
}
