
https://app-release-tracker.web.app/
# 🚀 Release Track
<img width="1315" height="855" alt="Screenshot 2026-02-02 at 4 38 30 PM" src="https://github.com/user-attachments/assets/41bccb4f-2c6f-459e-a31e-89751dad6f3a" />
er
<img width="923" height="802" alt="Screenshot 2026-02-02 at 4 38 47 PM" src="https://github.com/user-attachments/assets/2dbfe28b-a2d2-4969-b206-598ff3f11410" />
<img width="911" height="808" alt="Screenshot 2026-02-02 at 4 38 58 PM" src="https://github.com/user-attachments/assets/628aa269-cee8-4284-99db-e9008bc6a1c7" />
<img width="546" height="465" alt="Screenshot 2026-02-02 at 4 39 08 PM" src="https://github.com/user-attachments/assets/6a78268e-0cd1-4d8e-92d4-72e34b1c71fe" />
<img width="1163" height="829" alt="Screenshot 2026-02-02 at 4 39 21 PM" src="https://github.com/user-attachments/assets/8878bd01-1c5f-44d8-a7a9-ffe44559b7f6" />


A modern web application for tracking and managing application releases across multiple platforms (iOS, Android, etc.). Built with React, TypeScript, and Firebase.

![Release Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)

## 📋 Features

- **Multi-Platform Support**: Track releases for iOS, Android GMS, Android HMS, and Huawei platforms
- **Release Management**: Create, edit, and delete releases with detailed version information
- **Status Tracking**: Monitor release status (In Progress, Complete, Paused)
- **Rollout Management**: Track rollout percentages for each platform
- **Statistics Dashboard**: View real-time stats for total, active, completed, and paused releases
- **Search & Filter**: Search releases and filter by status and date range
- **Export Functionality**: Export release data to JSON or CSV formats
- **Import Releases**: Bulk import releases from JSON files
- **Authentication**: Admin access control for managing releases
- **Real-time Sync**: Data synced with Firebase Firestore
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18.3 with TypeScript
- **Build Tool**: Vite 6.0
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore, Hosting, Authentication)
- **Deployment**: Firebase Hosting with GitHub Actions CI/CD

## 📦 Installation

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
3. Enable Authentication (optional, for admin features)
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

Set up your Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /releases/{releaseId} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users
    }
  }
}
```

## 🚀 Development

### Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📤 Deployment

### Manual Deployment

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Hosting:
```bash
firebase init hosting
```

4. Build and deploy:
```bash
npm run build
firebase deploy --only hosting
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

Push to `main` branch to trigger automatic deployment.

## 📁 Project Structure
```
app-release-tracker/
├── src/
│   ├── components/        # React components
│   │   ├── ReleaseCard.tsx
│   │   ├── ReleaseModal.tsx
│   │   ├── StatsCard.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   └── useReleases.ts
│   ├── services/         # Firebase services
│   │   ├── firebase.ts
│   │   └── firebaseReleases.ts
│   ├── types/            # TypeScript type definitions
│   │   └── release.ts
│   ├── utils/            # Utility functions
│   │   └── fileStorage.ts
│   ├── data/             # Mock data
│   │   └── mockData.ts
│   ├── App.tsx           # Main app component
│   └── main.tsx          # App entry point
├── public/               # Static assets
├── .github/
│   └── workflows/        # GitHub Actions workflows
│       └── firebase-hosting.yml
├── firebase.json         # Firebase configuration
├── .firebaserc          # Firebase project settings
└── package.json         # Dependencies
```

## 🎯 Usage

### Adding a New Release

1. Click the **"+ Add Release"** button
2. Fill in release details:
   - Release Date
   - Release Name
   - Concept (e.g., All Concepts, HC Only)
3. Add platform-specific information:
   - Version number
   - Build ID
   - Rollout percentage
   - Platform notes (optional)
4. Click **"Save Release"**

### Editing a Release

1. Click the **"Edit"** button on any release card
2. Modify the necessary fields
3. Click **"Save Release"**

### Deleting a Release

1. Click the **"Delete"** button on any release card
2. Confirm the deletion

### Exporting Data

- Click **"CSV"** to export all releases as CSV
- Click **"JSON"** to export all releases as JSON

### Importing Data

1. Click **"Import"** button
2. Select a JSON file with release data
3. Confirm the import

## 🔒 Authentication

The app includes admin authentication for managing releases:

- Admin users can create, edit, and delete releases
- Non-admin users can view releases only
- Authentication is handled via Firebase Authentication

## 🧪 Testing
```bash
# Run tests (if configured)
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Sharanagouda** - [GitHub Profile](https://github.com/sharanagouda)

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Lucide React for beautiful icons
- Tailwind CSS for styling
- React community for amazing tools and libraries

## 📧 Contact

For questions or support, please open an issue on GitHub or contact [sharanu.mdl@gmail.com](mailto:sharanu.mdl@gmail.com)

## 🔗 Links

- **Live Demo**: [https://app-release-tracker.web.app](https://app-release-tracker.web.app)
- **GitHub Repository**: [https://github.com/sharanagouda/app-release-tracker](https://github.com/sharanagouda/app-release-tracker)
- **Firebase Console**: [https://console.firebase.google.com/project/app-release-tracker](https://console.firebase.google.com/project/app-release-tracker)

---

Made with ❤️ by Sharanagouda
