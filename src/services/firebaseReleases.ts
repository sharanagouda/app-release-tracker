import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Release } from '../types/release';

const RELEASES_COLLECTION = 'releases';

export const addRelease = async (release: Omit<Release, 'id'>) => {
  const docRef = await addDoc(collection(db, RELEASES_COLLECTION), {
    ...release,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const updateRelease = async (id: string, release: Omit<Release, 'id'>) => {
  const docRef = doc(db, RELEASES_COLLECTION, id);
  await updateDoc(docRef, {
    ...release,
    updatedAt: new Date(),
  });
};

export const deleteRelease = async (id: string) => {
  const docRef = doc(db, RELEASES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getReleases = async (): Promise<Release[]> => {
  const q = query(
    collection(db, RELEASES_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Release));
};
