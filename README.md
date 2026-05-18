
https://app-release-tracker.web.app/
# Release Tracker
<img width="1315" height="855" alt="Screenshot 2026-02-02 at 4 38 30 PM" src="https://github.com/user-attachments/assets/41bccb4f-2c6f-459e-a31e-89751dad6f3a" />
<img width="923" height="802" alt="Screenshot 2026-02-02 at 4 38 47 PM" src="https://github.com/user-attachments/assets/2dbfe28b-a2d2-4969-b206-598ff3f11410" />
<img width="911" height="808" alt="Screenshot 2026-02-02 at 4 38 58 PM" src="https://github.com/user-attachments/assets/628aa269-cee8-4284-99db-e9008bc6a1c7" />
<img width="546" height="465" alt="Screenshot 2026-02-02 at 4 39 08 PM" src="https://github.com/user-attachments/assets/6a78268e-0cd1-4d8e-92d4-72e34b1c71fe" />
<img width="1163" height="829" alt="Screenshot 2026-02-02 at 4 39 21 PM" src="https://github.com/user-attachments/assets/8878bd01-1c5f-44d8-a7a9-ffe44559b7f6" />


A modern web application for tracking and managing application releases across multiple platforms (iOS, Android GMS, Android HMS) with integrated CodePush OTA deployment management. Built with React, TypeScript, Firebase, and React Router.

![Release Tracker](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)

## Features

### Release Management
- **Multi-Platform Support**: Track releases for iOS, Android GMS, and Android HMS
- **Concept-Based Releases**: Group releases by concept (Babyshop, Max, Centrepoint, etc.) with per-concept statuses
- **Status Tracking**: Monitor release status (Not Started, In Progress, Complete, On Hold, Paused)
- **Rollout Management**: Track rollout percentages with full history for each platform/concept
- **Native Release Support**: Tag releases as native (app store) releases
- **Tags & Labels**: Add custom tags (hotfix, critical, feature) to releases
- **Version-Specific Changes**: Track what changed in each version

### CodePush OTA Deployments
- **Live CodePush Dashboard**: View deployment history and analytics from the CodePush server
- **Territory Support**: BLC and Hybris territories with different concept configurations
- **Environment Tabs**: Production, ProductionStaging, and Staging environments
- **Deployment Metrics**: Active users, downloads, installs, and failure rates per deployment
- **Edit Deployments**: Update rollout percentage, mandatory flag, description, and target version
- **Rollback Support**: Roll back problematic deployments
- **Compare Deployments**: Side-by-side comparison of deployment versions
- **Deployment Keys**: View deployment keys for each app

### Shareable URLs & Deep Linking
- **Release Deep Links**: Share a specific release via URL (`/releases/:id`)
- **CodePush Deep Links**: Share CodePush state via URL (`/codepush?territory=BLC&platform=iOS&concept=Babyshop&env=Production`)
- **Browser Back/Forward**: Full navigation history support

### CodePush <-> Release Sync
- **Auto-Sync Rollout**: When a CodePush rollout percentage is updated, matching Firestore releases are automatically updated with the same rollout percentage
- **Cross-Navigation**: Navigate from a CodePush deployment to its matching release, and vice versa
- **Version Matching**: Releases and CodePush deployments are linked by matching `appVersion`

### Collaboration
- **Role-Based Access**: Admin, Editor, and Viewer roles with granular permissions
- **Activity Log**: Full audit trail of all release changes with field-level diffs
- **Comments**: Discussion threads on each release
- **Notifications**: In-app notifications for release changes
- **Email Preview**: Generate formatted email summaries of releases
- **Teams Integration**: Share release updates to Microsoft Teams groups with editable messages

### General
- **Statistics Dashboard**: Real-time stats for total, in-progress, completed, and paused releases
- **Search & Filter**: Full-text search across release names, versions, build IDs, and tags
- **Date Range Filtering**: Filter releases by date range
- **Sorting**: Sort by release date, last update, or status
- **Export**: Export release data to CSV
- **Compare Releases**: Side-by-side comparison of any two releases
- **Dark Mode**: Full dark mode support with persistent preference
- **Keyboard Shortcuts**: `n` (new release), `/` (search), `?` (help), arrow keys (pagination)
- **Responsive Design**: Works on desktop and mobile
- **Real-time Sync**: All data synced via Firebase Firestore real-time listeners

## Tech Stack

- **Frontend**: React 18.3 with TypeScript
- **Routing**: React Router v7
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **CodePush API**: Axios-based REST client for CodePush server
- **Deployment**: Firebase Hosting with GitHub Actions CI/CD

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Clone the Repository
```bash
git clone https://github.com/sharanagouda/app-release-tracker.git
cd app-release-tracker
```

### Install Dependencies
```bash
npm install
```

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Copy your Firebase configuration

### Environment Variables

Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firestore Security Rules

Set up your Firestore security rules (see `firestore.rules` for full rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /releases/{releaseId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Development

### Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Type Check
```bash
npm run typecheck
```

### Preview Production Build
```bash
npm run preview
```

## Deployment

### Manual Deployment

```bash
# Dev environment
npm run deploy:dev

# Staging environment
npm run deploy:staging

# Production environment
npm run deploy:prod
```

### Automatic Deployment with GitHub Actions

The project is configured for automatic deployment to Firebase Hosting on every push to the `main` branch.

#### Setup GitHub Secrets

Add the following secrets in your GitHub repository settings:

- `FIREBASE_SERVICE_ACCOUNT_APP_RELEASE_TRACKER`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Project Structure
```
app-release-tracker/
├── src/
│   ├── components/           # React components
│   │   ├── common/           # Shared components (TabNavigation)
│   │   ├── codepush/         # CodePush-specific components
│   │   │   ├── CodePushLogin.tsx
│   │   │   ├── DeploymentHistory.tsx
│   │   │   ├── DeploymentAnalytics.tsx
│   │   │   ├── LatestDeployment.tsx
│   │   │   ├── EditRolloutModal.tsx
│   │   │   ├── CompareDeploymentsModal.tsx
│   │   │   └── ...
│   │   ├── layout/           # Layout components (AppLayout)
│   │   ├── ReleaseTable.tsx
│   │   ├── ReleaseModal.tsx
│   │   ├── ReleaseDetailsModal.tsx
│   │   ├── FilterBar.tsx
│   │   └── ...
│   ├── contexts/             # React contexts
│   │   └── AppContext.tsx     # Global app state (auth, releases, dark mode)
│   ├── pages/                # Route-level page components
│   │   ├── ReleasesPage.tsx   # /releases
│   │   ├── ReleaseDetailPage.tsx  # /releases/:id
│   │   └── CodePushPage.tsx   # /codepush
│   ├── hooks/                # Custom React hooks
│   │   ├── useReleases.ts    # Firestore real-time releases
│   │   ├── useCodePush.ts    # CodePush API data fetching
│   │   ├── usePagination.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── services/             # Backend services
│   │   ├── firebase.ts       # Firebase app init
│   │   ├── firebaseAuth.ts   # Email/password auth
│   │   ├── firebaseReleases.ts  # Release CRUD + rollout tracking
│   │   ├── firebaseActivityLog.ts
│   │   ├── firebaseComments.ts
│   │   ├── firebaseUsers.ts  # User profiles + RBAC
│   │   ├── firebaseNotifications.ts
│   │   ├── firebaseConfig.ts # Teams groups config
│   │   ├── codepushReleaseSync.ts  # CodePush <-> Release sync
│   │   └── api/              # CodePush REST API client
│   │       ├── ApiClient.ts
│   │       ├── CodePushService.ts
│   │       ├── AuthService.ts
│   │       └── interfaces.ts
│   ├── config/
│   │   └── codepushApps.ts   # Territory/concept/platform config
│   ├── types/
│   │   └── release.ts        # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── data/                 # Mock data (dev seeding)
│   ├── App.tsx               # Router setup
│   └── main.tsx              # App entry point
├── firebase.json             # Firebase hosting config (SPA rewrites)
├── firestore.rules           # Firestore security rules
├── .firebaserc               # Firebase project settings
└── package.json
```

## Routes

| Route | Description |
|-------|-------------|
| `/releases` | Release list with stats, filters, and pagination |
| `/releases/:id` | Release detail page (shareable deep link) |
| `/codepush` | CodePush dashboard |
| `/codepush?territory=BLC&platform=iOS&concept=Babyshop&env=Production` | CodePush with pre-selected filters (shareable) |

## Authentication

The app has two independent auth systems:

- **Firebase Auth** (Email/Password): For release management (create, edit, delete). Three roles: Admin, Editor, Viewer.
- **CodePush Token**: For accessing the CodePush API. Stored in localStorage. Independent of Firebase auth.

## Usage

### Adding a New Release

1. Navigate to `/releases`
2. Click **"+ Add Release"**
3. Fill in release details (date, name, environment)
4. Add platform-specific information (version, build ID, rollout %, concepts)
5. Click **"Save Release"**

### Viewing CodePush Deployments

1. Navigate to `/codepush`
2. Sign in with your CodePush token
3. Select territory, platform, concept, and environment
4. View latest deployment analytics and full history

### Sharing a Release

Copy the URL from the browser address bar when viewing a release detail page (e.g., `https://app-release-tracker.web.app/releases/abc123`). Anyone with the link can view it.

### CodePush Auto-Sync

When you update a CodePush deployment's rollout percentage via the Edit Deployment modal, the app automatically finds matching Firestore releases (by version) and updates their rollout percentage with a history entry.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Authors

- **Sharanagouda** - [GitHub Profile](https://github.com/sharanagouda)

## Links

- **Live Demo**: [https://app-release-tracker.web.app](https://app-release-tracker.web.app)
- **GitHub Repository**: [https://github.com/sharanagouda/app-release-tracker](https://github.com/sharanagouda/app-release-tracker)

---

Made with care by Sharanagouda
