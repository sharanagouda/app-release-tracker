/**
 * User Roles service
 *
 * Stores user profiles and roles in a top-level Firestore collection `users`.
 * Each document ID is the Firebase Auth UID.
 *
 * Roles:
 *  - viewer  → read-only (default for new sign-ups)
 *  - editor  → can create and edit releases
 *  - admin   → can delete releases + manage user roles
 *
 * Flow:
 *  1. New user signs up → createUserProfile() assigns 'viewer' role
 *  2. Admin opens Admin Panel → sees all users → can call updateUserRole()
 *  3. App reads current user's role via getUserRole() / subscribeToUserRole()
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  Unsubscribe,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './firebaseAuth';

export type UserRole = 'viewer' | 'editor' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  grantedBy?: string; // email of admin who last changed the role
  grantedAt?: string; // ISO timestamp of last role change
}

export interface AccessRequest {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  /** What the user was trying to do when they clicked “Request Access” */
  action?: string;
}

const USERS_COLLECTION = 'users';
const REQUESTS_COLLECTION = 'accessRequests';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDisplayName = (email: string): string => {
  const username = email.split('@')[0];
  return username.charAt(0).toUpperCase() + username.slice(1);
};

// ─── Create / Ensure Profile ──────────────────────────────────────────────────

/**
 * Called after sign-in/sign-up.
 * Creates a user profile with 'viewer' role if one doesn't exist yet.
 * If the profile already exists, it is left unchanged.
 */
export const ensureUserProfile = async (uid: string, email: string): Promise<UserProfile> => {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const data = snap.data() as Omit<UserProfile, 'uid'>;
    return { uid, ...data };
  }

  // New user — assign viewer role
  const profile: Omit<UserProfile, 'uid'> = {
    email,
    displayName: formatDisplayName(email),
    role: 'viewer',
    createdAt: new Date().toISOString(),
  };

  await setDoc(docRef, profile);
  return { uid, ...profile };
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
};

/**
 * Subscribe to the current user's role in real-time.
 * Fires immediately with the current value, then on every change.
 */
export const subscribeToUserRole = (
  uid: string,
  onRole: (role: UserRole) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  return onSnapshot(
    doc(db, USERS_COLLECTION, uid),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Omit<UserProfile, 'uid'>;
        onRole(data.role);
      } else {
        // Profile not yet created — default to viewer
        onRole('viewer');
      }
    },
    (error) => {
      console.error('subscribeToUserRole error:', error);
      onError?.(error);
    }
  );
};

// ─── Admin: List All Users ────────────────────────────────────────────────────

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
};

/**
 * Subscribe to all user profiles in real-time (for Admin Panel).
 */
export const subscribeToAllUsers = (
  onData: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const users = snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<UserProfile, 'uid'>),
      }));
      onData(users);
    },
    (error) => {
      console.error('subscribeToAllUsers error:', error);
      onError?.(error);
    }
  );
};

// ─── Access Requests ──────────────────────────────────────────────────────────

export const requestAccess = async (
  uid: string,
  email: string,
  displayName: string,
  action?: string
): Promise<void> => {
  // If the user is already an editor/admin, there's no need to request access.
  const profileSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (profileSnap.exists()) {
    const profile = profileSnap.data() as Omit<UserProfile, 'uid'>;
    if (profile.role === 'editor' || profile.role === 'admin') {
      return;
    }
  }

  // Prevent duplicates only for *pending* requests.
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('uid', '==', uid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    throw new Error('You already have a pending access request.');
  }

  await addDoc(collection(db, REQUESTS_COLLECTION), {
    uid,
    email,
    displayName,
    action: action || undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
};

export const subscribeToAccessRequests = (
  onData: (requests: AccessRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(
    q,
    (snap) => {
      const requests = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AccessRequest, 'id'>),
      }));
      onData(requests);
    },
    (error) => {
      console.error('subscribeToAccessRequests error:', error);
      onError?.(error);
    }
  );
};

export const resolveAccessRequest = async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
  // Remove the request document after it's handled so it disappears from the pending list.
  // (Keeps the `accessRequests` collection clean and avoids stale UI.)
  if (status === 'approved' || status === 'rejected') {
    await deleteDoc(doc(db, REQUESTS_COLLECTION, requestId));
    return;
  }

  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), { status });
};

// ─── Admin: Update Role ───────────────────────────────────────────────────────

/**
 * Update a user's role. Only admins should call this.
 */
export const updateUserRole = async (
  targetUid: string,
  newRole: UserRole
): Promise<void> => {
  const adminUser = getCurrentUser();
  const adminEmail = adminUser?.email || 'unknown';

  await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
    role: newRole,
    grantedBy: adminEmail,
    grantedAt: new Date().toISOString(),
  });
};
