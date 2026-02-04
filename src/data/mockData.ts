import { Release } from '../types/release';

export const ENVIRONMENTS = [
  'PROD',
  'PRODSTAGE',
  'UAT5',
  'UAT6',
  'UAT4',
  'UAT2',
  'UAT1'
];

export const CONCEPTS = [
  'All Concepts',
  'CP',
  'MX',
  'SP',
  'BS',
  'HB',
  'HC',
  'EMAX',
  'MC'
];

export const PLATFORMS = ['iOS', 'Android GMS', 'Android HMS'] as const;

export const mockReleases: Release[] = [
  {
    id: '4',
    releaseDate: '2025-01-30',
    releaseName: 'BL_hotfix_30_July_2025',
    environment: 'UAT5',
    platforms: [
      {
        platform: 'iOS',
        version: '10.35.1 (3)',
        buildId: '7065',
        rolloutPercentage: 100,
        status: 'Complete',
        concepts: ['CP', 'HC', 'MX'],
        notes: 'BLC codepush completed for all concepts',
        rolloutHistory: [
          {
            percentage: 0,
            date: '2025-01-30T08:00:00Z',
            notes: 'Initial deployment started'
          },
          {
            percentage: 50,
            date: '2025-01-30T10:00:00Z',
            notes: 'Staged rollout to 50%'
          },
          {
            percentage: 100,
            date: '2025-01-30T12:00:00Z',
            notes: 'Full rollout completed'
          }
        ]
      },
      {
        platform: 'Android GMS',
        version: '8.91 (1595)',
        buildId: '7065',
        rolloutPercentage: 100,
        status: 'Complete',
        concepts: ['CP', 'HC', 'MX'],
        notes: 'BLC codepush completed - Build available at SharePoint',
        buildLink: 'https://landmarkgroup.sharepoint.com/:f:/r/sites/PlatformSquad/Shared%20Documents/General/BLC%20App%20builds/KW%20Launch/STAGE/8.91(1595)-7060?csf=1&web=1&e=RboBH7',
        rolloutHistory: [
          {
            percentage: 0,
            date: '2025-01-30T08:00:00Z',
            notes: 'Initial deployment started'
          },
          {
            percentage: 25,
            date: '2025-01-30T09:30:00Z',
            notes: 'Gradual rollout to 25%'
          },
          {
            percentage: 100,
            date: '2025-01-30T12:00:00Z',
            notes: 'Full rollout completed'
          }
        ]
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
    environment: 'PROD',
    platforms: [
      {
        platform: 'iOS',
        version: '10.34.2',
        buildId: '7055',
        rolloutPercentage: 100,
        status: 'Complete',
        concepts: ['All Concepts'],
        notes: 'iOS codepush completed with 100% rollout'
      },
      {
        platform: 'Android GMS',
        version: '8.89',
        buildId: '7055',
        rolloutPercentage: 20,
        status: 'In Progress',
        concepts: ['All Concepts'],
        notes: 'Native rollout is at 20% for Android GMS'
      },
      {
        platform: 'Android HMS',
        version: '8.90',
        buildId: '7055',
        rolloutPercentage: 100,
        status: 'Complete',
        concepts: ['All Concepts'],
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
    environment: 'PROD',
    platforms: [
      {
        platform: 'iOS',
        version: '10.34.1',
        buildId: '7050',
        rolloutPercentage: 50,
        status: 'Paused',
        concepts: ['All Concepts'],
        notes: 'iOS kept in staged rollout at 50%'
      },
      {
        platform: 'Android GMS',
        version: '8.891',
        buildId: '7050',
        rolloutPercentage: 0,
        status: 'Paused',
        concepts: ['All Concepts'],
        notes: 'Codepush paused due to application issues'
      },
      {
        platform: 'Android HMS',
        version: '8.891',
        buildId: '7050',
        rolloutPercentage: 0,
        status: 'Paused',
        concepts: ['All Concepts'],
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
  "id": "3",
  "releaseDate": "2025-01-04",
  "releaseName": "June-4 Release",
  "environment": "PRODSTAGE",
  "platforms": [
    {
      "platform": "iOS",
      "conceptReleases": [
        {
          "id": "ios-1",
          "concepts": ["CP"],
          "version": "10.41.1",
          "buildId": "8084",
          "rolloutPercentage": 10,
          "status": "In Progress",
          "notes": "Centrepoint specific release",
          "buildLink": "https://sharepoint.com/builds/cp-8084"
        },
        {
          "id": "ios-2",
          "concepts": ["MX", "SP", "BS", "HB", "HC", "EMAX", "MC"],
          "version": "10.40.1",
          "buildId": "8085",
          "rolloutPercentage": 50,
          "status": "In Progress",
          "notes": "Other concepts release",
          "buildLink": "https://sharepoint.com/builds/other-8085"
        }
      ]
    },
    {
      "platform": "Android GMS",
      "conceptReleases": [
        {
          "id": "android-gms-1",
          "concepts": ["All Concepts"],
          "version": "8.83",
          "buildId": "7040",
          "rolloutPercentage": 50,
          "status": "In Progress",
          "notes": "Android native release rollout at 50%",
          "buildLink": ""
        }
      ]
    },
    {
      "platform": "Android HMS",
      "conceptReleases": [
        {
          "id": "android-hms-1",
          "concepts": ["All Concepts"],
          "version": "8.83",
          "buildId": "7040",
          "rolloutPercentage": 100,
          "status": "Complete",
          "notes": "HMS rollout completed at 100%",
          "buildLink": ""
        }
      ]
    }
  ],
  "changes": [
    "Performance improvements",
    "Bug fixes for checkout flow",
    "UI/UX enhancements"
  ],
  "notes": "Native release rollout in progress across platforms",
  "createdAt": "2025-01-04T08:00:00Z",
  "updatedAt": "2025-01-04T12:00:00Z"
},
];