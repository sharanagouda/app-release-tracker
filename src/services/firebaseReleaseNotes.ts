import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import { ReleaseNote, ReleaseNoteType } from '../types/releaseNote';
import { getCurrentUser } from './firebaseAuth';

const RELEASE_NOTES_COLLECTION = 'releaseNotes';

// Helper function to get user info
const getUserInfo = () => {
  const user = getCurrentUser();
  if (!user) return { email: null, displayName: null };

  const email = user.email || '';
  const username = email.split('@')[0];
  const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

  return {
    email,
    displayName: formattedName
  };
};

export const addReleaseNote = async (releaseNote: Omit<ReleaseNote, 'id' | 'createdAt' | 'updatedAt'>) => {
  const userInfo = getUserInfo();

  const docRef = await addDoc(collection(db, RELEASE_NOTES_COLLECTION), {
    ...releaseNote,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userInfo.email,
    createdByName: userInfo.displayName,
    updatedBy: userInfo.email,
    updatedByName: userInfo.displayName,
    history: [], // Initialize history
  });
  return docRef.id;
};

export const updateReleaseNote = async (id: string, releaseNote: Partial<ReleaseNote>, historyEntry?: any) => {
  const userInfo = getUserInfo();
  const docRef = doc(db, RELEASE_NOTES_COLLECTION, id);

  const updates: any = {
    ...releaseNote,
    updatedAt: new Date().toISOString(),
    updatedBy: userInfo.email,
    updatedByName: userInfo.displayName,
  };

  if (historyEntry) {
    updates.history = arrayUnion({
      ...historyEntry,
      updatedBy: userInfo.displayName || userInfo.email,
      updatedAt: new Date().toISOString(),
    });
  }

  await updateDoc(docRef, updates);
};

export const deleteReleaseNote = async (id: string) => {
  const docRef = doc(db, RELEASE_NOTES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getReleaseNotes = async (type?: ReleaseNoteType): Promise<ReleaseNote[]> => {
  let q;
  if (type) {
    q = query(
      collection(db, RELEASE_NOTES_COLLECTION),
      where('type', '==', type)
    );
  } else {
    q = query(
      collection(db, RELEASE_NOTES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);
  const notes = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as ReleaseNote));

  // Sort in memory if we filtered by type (to avoid composite index requirement)
  if (type) {
    notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return notes;
};
