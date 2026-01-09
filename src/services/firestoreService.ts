import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  QueryConstraint,
} from 'firebase/firestore';

import { db } from './firebase';

export async function addDocument<T>(collectionName: string, data: T) {
  const docRef = await addDoc(collection(db, collectionName), data as Record<string, unknown>);
  return docRef.id;
}

export async function getDocument<T>(collectionName: string, docId: string) {
  const ref = doc(db, collectionName, docId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...(snapshot.data() as T) };
}

export async function updateDocument<T>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
) {
  const ref = doc(db, collectionName, docId);
  await updateDoc(ref, data as Record<string, unknown>);
}

export async function queryCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
) {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as T),
  }));
}

