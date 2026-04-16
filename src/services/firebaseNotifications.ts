/**
 * Notifications service
 *
 * Stores notifications in Firestore `notifications` collection.
 * Users receive notifications when their access request is approved/rejected.
 */

import {
  collection,
  doc,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id: string;
  uid: string;
  type: 'access_approved' | 'access_rejected';
  message: string;
  createdAt: string;
  read: boolean;
}

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Create a notification for a user
 */
export const createNotification = async (
  uid: string,
  type: 'access_approved' | 'access_rejected',
  message: string
): Promise<void> => {
  await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    uid,
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  });
};

/**
 * Subscribe to notifications for a specific user
 */
export const subscribeToNotifications = (
  uid: string,
  onData: (notifications: Notification[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('uid', '==', uid),
    where('read', '==', false)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      onData(notifications);
    },
    (error) => {
      console.error('Error fetching notifications:', error);
      onError?.(error as Error);
    }
  );
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (uid: string): Promise<number> => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('uid', '==', uid),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};