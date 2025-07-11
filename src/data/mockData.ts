import { Release } from '../types/release';

export const CONCEPTS = [
  'lifestyle',
  'babyshop',
  'splash',
  'shoemart',
  'centrepoint',
  'shoexpress',
  'mothercare',
  'homecentre',
  'homebox',
  'max'
];

export const PLATFORMS = ['iOS', 'Android GMS', 'Android HMS'] as const;

export const mockReleases: Release[] = [
  {
    id: '1',
    releaseDate: '2025-01-09',
    releaseName: 'July-9 Release',
    concept: 'All Concepts',
    platforms: [
      {
        platform: 'iOS',
        version: '10.34.2',
        buildId: '7055',
        rolloutPercentage: 100,
        status: 'Complete',
        notes: 'iOS codepush completed with 100% rollout'
      },
      {
        platform: 'Android GMS',
        version: '8.89',
        buildId: '7055',
        rolloutPercentage: 20,
        status: 'In Progress',
        notes: 'Native rollout is at 20% for Android GMS'
      },
      {
        platform: 'Android HMS',
        version: '8.90',
        buildId: '7055',
        rolloutPercentage: 100,
        status: 'Complete',
        notes: 'HMS rollout completed'
      }
    ],
    changes: [
      'GA4 Changes in PLP - Devika Ramadasi',
      'Sentry Error Fixes - Arun / Sharanagouda',
      'Posting Facebook error logs to Posthog - Sharanagouda Konasirasagi'
    ],
    notes: 'iOS, Android (GMS n HMS) codepush for July-9 release is done for production users with 100% rollout.',
    createdAt: '2025-01-09T10:00:00Z',
    updatedAt: '2025-01-09T15:30:00Z'
  },
  {
    id: '2',
    releaseDate: '2025-01-02',
    releaseName: 'July-02 Release',
    concept: 'All Concepts',
    platforms: [
      {
        platform: 'iOS',
        version: '10.34.1',
        buildId: '7050',
        rolloutPercentage: 50,
        status: 'Paused',
        notes: 'iOS kept in staged rollout at 50%'
      },
      {
        platform: 'Android GMS',
        version: '8.891',
        buildId: '7050',
        rolloutPercentage: 0,
        status: 'Paused',
        notes: 'Codepush paused due to application issues'
      },
      {
        platform: 'Android HMS',
        version: '8.891',
        buildId: '7050',
        rolloutPercentage: 0,
        status: 'Paused',
        notes: 'Codepush paused due to application issues'
      }
    ],
    changes: [
      'GA4 Changes in PLP - Devika Ramadasi',
      'Sentry Error Fixes - Arun / Sharanagouda',
      'Posting Facebook error logs to Posthog - Sharanagouda Konasirasagi'
    ],
    notes: '7044 codepush has been paused for Android platform, since we are facing some issue while the codepush is getting applied.',
    createdAt: '2025-01-02T09:00:00Z',
    updatedAt: '2025-01-02T14:30:00Z'
  },
  {
    id: '3',
    releaseDate: '2025-01-04',
    releaseName: 'June-4 Release',
    concept: 'All Concepts',
    platforms: [
      {
        platform: 'iOS',
        version: '10.32.2',
        buildId: '7040',
        rolloutPercentage: 10,
        status: 'In Progress',
        notes: 'Native release rollout at 10%'
      },
      {
        platform: 'Android GMS',
        version: '8.83',
        buildId: '7040',
        rolloutPercentage: 50,
        status: 'In Progress',
        notes: 'Android native release rollout at 50%'
      },
      {
        platform: 'Android HMS',
        version: '8.83',
        buildId: '7040',
        rolloutPercentage: 100,
        status: 'Complete',
        notes: 'HMS rollout completed at 100%'
      }
    ],
    changes: [
      'Performance improvements',
      'Bug fixes for checkout flow',
      'UI/UX enhancements'
    ],
    notes: 'Native release rollout in progress across platforms',
    createdAt: '2025-01-04T08:00:00Z',
    updatedAt: '2025-01-04T12:00:00Z'
  }
];