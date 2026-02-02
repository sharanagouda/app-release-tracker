# Copilot / AI Agent Instructions for app-release-tracker ✅

Short summary
- Single-page React + TypeScript app built with Vite + Tailwind.
- Uses Firebase Auth for sign-in and Firestore for releases storage.
- Central business logic lives in `src/hooks/useReleases.ts` and `src/services/firebaseReleases.ts`.

Quick start ⚡
- Install & run: `npm install` then `npm run dev` (dev server), `npm run build` (prod build), `npm run preview` (locally preview build), `npm run lint` (eslint).
- Required env vars (in local `.env`): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. See `src/services/firebase.ts`.

Big-picture architecture & data flow 🔧
- UI (components/*) drives actions (add/edit/delete) → `useReleases` (single source of truth) → calls `src/services/firebaseReleases.ts` (Firestore operations) → updates local state.
- On first load, if Firestore is empty, `useReleases` seeds `mockReleases` from `src/data/mockData.ts` and writes them to Firestore.
- Exports/downloads are implemented in `src/utils/fileStorage.ts` (CSV / JSON / mock data TS file).

Key files to inspect first 🔍
- Business logic: `src/hooks/useReleases.ts` (load, add, update, delete, import/export)
- Firestore: `src/services/firebaseReleases.ts` (get/add/update/delete)
- Auth: `src/services/firebaseAuth.ts` + usage in `src/App.tsx` (sets `isAdmin` based on `onAuthChange`)
- Data types: `src/types/release.ts` and sample data `src/data/mockData.ts`
- UI patterns: `src/components/ReleaseModal.tsx`, `ReleaseTable.tsx`, `ReleaseDetailsModal.tsx`, `FilterBar.tsx`

Project-specific conventions & patterns 🧭
- `Release` and `PlatformRelease` types are canonical — prefer updating `src/types/release.ts` for shape changes.
- UI components are controlled: modals expect `isOpen`, `onClose`; `ReleaseModal` accepts `Omit<Release, 'id' | 'createdAt' | 'updatedAt'>` when saving.
- Authentication is simple: any signed-in user is treated as admin (`isAdmin = !!user`). There is no role/RBAC system yet.
- File downloads use browser `Blob` + `URL.createObjectURL()` patterns (`src/utils/fileStorage.ts`).

Discoverable gotchas / actionable items for the agent (high priority) ⚠️
- Timestamp normalization: Firestore stores timestamps as Timestamps, `mockData` uses ISO strings and `addRelease` writes JS Date objects. Normalize in `getReleases` to return ISO strings (or use `serverTimestamp()` for writes). See `src/services/firebaseReleases.ts` and `src/hooks/useReleases.ts`.
  - Example conversion: `createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || '')`
- Import UI missing: `useReleases` exposes `importReleases(file)` but there's no UI hook-up. Add a file input / Import button in `FilterBar.tsx` and call into the hook.
- Validate `platforms`: Some code assumes `platforms` is always an array. Add robust guards and fallbacks when reading platform fields.

Low-effort improvements the agent can propose 🛠️
- Replace client-side `new Date()` in writes with Firestore `serverTimestamp()` for more consistent timestamps.
- Add a small unit / integration smoke test for `useReleases` (mock `firebaseReleases`) — currently no tests exist.
- Wire `importReleases` into the UI (simple import button + file chooser in `FilterBar`).

How to make safe edits (PR tips) ✅
- Small, focused PRs: change one service/hook at a time (e.g., add timestamp normalization in `firebaseReleases.getReleases` and add a short test or logging).
- Preserve current UI behavior (seeding mock data on empty DB) unless replacing it intentionally.
- Run `npm run lint` before pushing; this project has no test runner configured.

Notes for debugging & local dev 🐞
- To seed local data quickly: start with an empty Firestore collection; opening the app will push `mockReleases` automatically.
- Auth behavior: the app treats any signed-in user as admin; use Auth modal (`AuthModal`) to sign in during testing.

If anything above is unclear or you want more details (e.g., a small PR template for the timestamp patch or wiring import UI), tell me which part to expand and I'll update this file. 🙌
