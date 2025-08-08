import { Release } from '../types/release';

export const CONCEPTS = [
  'All Concepts',
  'All BLC Concepts (CP, HC, MX)',
  'All Hybris Concepts',
  'lifestyle',
  'babyshop',
  'splash',
  'shoemart',
  'centrepoint',
  'shoexpress',
  'mothercare',
  'homecentre',
  'homebox',
  'max',
  'hybris',
  'blc'
];

export const PLATFORMS = ['iOS', 'Android GMS', 'Android HMS'] as const;

export const mockReleases: Release[] = [
  {
    id: '4',
    releaseDate: '2025-01-30',
    releaseName: 'BL_hotfix_30_July_2025',
    concept: 'All BLC Concepts (CP, HC, MX)',
    platforms: [
      {
        platform: 'iOS',
        version: '10.35.1 (3)',
        buildId: '7065',
        rolloutPercentage: 100,
        status: 'Complete',
        notes: 'BLC codepush completed for all concepts'
      },
      {
        platform: 'Android GMS',
        version: '8.91 (1595)',
        buildId: '7065',
        rolloutPercentage: 100,
        status: 'Complete',
        notes: 'BLC codepush completed - Build available at SharePoint',
        buildLink: 'https://landmarkgroup.sharepoint.com/:f:/r/sites/PlatformSquad/Shared%20Documents/General/BLC%20App%20builds/KW%20Launch/STAGE/8.91(1595)-7060?csf=1&web=1&e=RboBH7'
      }
    ],
    changes: [
      'BLC hotfix for CP, HC, MX concepts',
      'UAT environment deployment',
      'Codepush build 7065 for BLC concepts'
    ],
    notes: 'Hotfix branch: hotfix/BL_hotfix_30_July_2025, Environment: UAT, Build link: https://landmarkgroup.sharepoint.com/:f:/r/sites/PlatformSquad/Shared%20Documents/General/BLC%20App%20builds/KW%20Launch/STAGE/8.91(1595)-7060',
    createdAt: '2025-01-30T08:00:00Z',
    updatedAt: '2025-01-30T12:00:00Z'
  },
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