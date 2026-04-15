/**
 * Release Comments service
 *
 * Stores comments in a top-level Firestore collection `releaseComments`.
 * Each document represents one comment on a release.
 *
 * Uses real-time `onSnapshot` for live updates so all team members
 * see new comments instantly.
 *
 * Also logs each new comment to the activity log for audit trail.
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { ReleaseComment } from '../types/release';
import { getCurrentUser } from './firebaseAuth';
import { addActivityLog } from './firebaseActivityLog';

const COMMENTS_COLLECTION = 'releaseComments';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getUserInfo = () => {
  const user = getCurrentUser();
  if (!user) return { email: '', displayName: 'Unknown' };

  const email = user.email || '';
  const username = email.split('@')[0];
  const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

  return { email, displayName: formattedName };
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const addComment = async (
  releaseId: string,
  releaseName: string,
  text: string
): Promise<string> => {
  const userInfo = getUserInfo();

  try {
    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
      releaseId,
      text,
      userEmail: userInfo.email,
      userName: userInfo.displayName,
      createdAt: new Date().toISOString(),
      edited: false,
    });

    // Log to activity trail (fire-and-forget)
    addActivityLog({
      releaseId,
      releaseName,
      action: 'commented',
      summary: `${userInfo.displayName} commented: "${text.length > 80 ? text.slice(0, 80) + '…' : text}"`,
      field: 'comment',
      newValue: text,
      userEmail: userInfo.email,
      userName: userInfo.displayName,
    }).catch(console.error);

    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const updateComment = async (
  commentId: string,
  newText: string
): Promise<void> => {
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);
  try {
    await updateDoc(docRef, {
      text: newText,
      updatedAt: new Date().toISOString(),
      edited: true,
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (
  commentId: string,
  releaseId: string,
  releaseName: string,
  commentText: string
): Promise<void> => {
  const userInfo = getUserInfo();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);
  
  try {
    await deleteDoc(docRef);

    // Log deletion to activity trail (fire-and-forget)
    addActivityLog({
      releaseId,
      releaseName,
      action: 'commented',
      summary: `${userInfo.displayName} deleted a comment: "${commentText.length > 80 ? commentText.slice(0, 80) + '…' : commentText}"`,
      field: 'comment_deleted',
      oldValue: commentText,
      userEmail: userInfo.email,
      userName: userInfo.displayName,
    }).catch(console.error);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// ─── Real-time Read ───────────────────────────────────────────────────────────

/**
 * Subscribe to real-time comments for a specific release.
 * Returns an unsubscribe function for cleanup.
 */
export const subscribeToComments = (
  releaseId: string,
  onData: (comments: ReleaseComment[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('releaseId', '==', releaseId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ReleaseComment, 'id'>),
      }));

      // Sort newest first client-side (avoids composite index requirement)
      comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      onData(comments);
    },
    (error) => {
      console.error('Comments onSnapshot error:', error);
      onError(error);
    }
  );
};
