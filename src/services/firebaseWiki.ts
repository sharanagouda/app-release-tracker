import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { WikiPage, WikiComment } from '../types/wiki';
import { getCurrentUser } from './firebaseAuth';

const WIKI_COLLECTION = 'wikiPages';

// Helper function to get user info
const getUserInfo = () => {
  const user = getCurrentUser();
  if (!user) return { email: null, displayName: null };

  const email = user.email || '';
  const username = email.split('@')[0];
  const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

  return {
    email,
    displayName: formattedName,
  };
};

export const addWikiPage = async (
  page: Omit<WikiPage, 'id' | 'createdAt' | 'updatedAt' | 'comments'>
): Promise<string> => {
  const userInfo = getUserInfo();

  const docRef = await addDoc(collection(db, WIKI_COLLECTION), {
    ...page,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userInfo.email,
    createdByName: userInfo.displayName,
    updatedBy: userInfo.email,
    updatedByName: userInfo.displayName,
  });
  return docRef.id;
};

export const updateWikiPage = async (
  id: string,
  updates: Partial<WikiPage>
): Promise<void> => {
  const userInfo = getUserInfo();
  const docRef = doc(db, WIKI_COLLECTION, id);

  // Remove fields we don't want to overwrite
  const { id: _id, createdAt, createdBy, createdByName, children, ...rest } = updates as any;

  await updateDoc(docRef, {
    ...rest,
    updatedAt: new Date().toISOString(),
    updatedBy: userInfo.email,
    updatedByName: userInfo.displayName,
  });
};

export const deleteWikiPage = async (id: string): Promise<void> => {
  // First, delete all children recursively
  const childrenQuery = query(
    collection(db, WIKI_COLLECTION),
    where('parentId', '==', id)
  );
  const childrenSnapshot = await getDocs(childrenQuery);

  for (const childDoc of childrenSnapshot.docs) {
    await deleteWikiPage(childDoc.id);
  }

  // Then delete the page itself
  const docRef = doc(db, WIKI_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getWikiPages = async (): Promise<WikiPage[]> => {
  const q = query(
    collection(db, WIKI_COLLECTION),
    orderBy('order', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as WikiPage));
};

export const getWikiPage = async (id: string): Promise<WikiPage | null> => {
  const docRef = doc(db, WIKI_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as WikiPage;
};

// Add a comment to a wiki page
export const addWikiComment = async (
  pageId: string,
  content: string
): Promise<void> => {
  const userInfo = getUserInfo();
  const docRef = doc(db, WIKI_COLLECTION, pageId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Wiki page not found');
  }

  const page = docSnap.data() as WikiPage;
  const newComment: WikiComment = {
    id: `comment-${Date.now()}`,
    content,
    authorEmail: userInfo.email || '',
    authorName: userInfo.displayName || 'Anonymous',
    createdAt: new Date().toISOString(),
  };

  await updateDoc(docRef, {
    comments: [...(page.comments || []), newComment],
    updatedAt: new Date().toISOString(),
  });
};

// Delete a comment from a wiki page
export const deleteWikiComment = async (
  pageId: string,
  commentId: string
): Promise<void> => {
  const docRef = doc(db, WIKI_COLLECTION, pageId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Wiki page not found');
  }

  const page = docSnap.data() as WikiPage;
  const updatedComments = (page.comments || []).filter(
    (c: WikiComment) => c.id !== commentId
  );

  await updateDoc(docRef, {
    comments: updatedComments,
    updatedAt: new Date().toISOString(),
  });
};

// Move a page to a new parent
export const moveWikiPage = async (
  pageId: string,
  newParentId: string | null
): Promise<void> => {
  const docRef = doc(db, WIKI_COLLECTION, pageId);
  await updateDoc(docRef, {
    parentId: newParentId,
    updatedAt: new Date().toISOString(),
  });
};

// Build tree structure from flat list
export const buildWikiTree = (pages: WikiPage[]): WikiPage[] => {
  const pageMap = new Map<string, WikiPage>();
  const rootPages: WikiPage[] = [];

  // Create a map of all pages with empty children arrays
  pages.forEach((page) => {
    pageMap.set(page.id, { ...page, children: [] });
  });

  // Build the tree
  pages.forEach((page) => {
    const currentPage = pageMap.get(page.id)!;
    if (page.parentId && pageMap.has(page.parentId)) {
      const parent = pageMap.get(page.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(currentPage);
    } else {
      rootPages.push(currentPage);
    }
  });

  return rootPages;
};
