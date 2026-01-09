import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { captureError } from '../utils/errorReporting';
import { UserTarget } from '../types/models';

const COLLECTION = 'userTargets';

export function subscribeUserTargets(
  userId: string,
  callback: (targets: UserTarget[]) => void,
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const targets = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<UserTarget, 'id'>),
      }));
      callback(targets);
    },
    (error) => {
      if (__DEV__) {
        console.warn('[userTargets] listen error', error);
      }
      captureError(error, 'userTargetsService/subscribeUserTargets');
      callback([]);
    },
  );
}

export async function deleteUserTarget(targetId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, targetId));
  } catch (error) {
    if (__DEV__) {
      console.warn('[userTargets] delete error', error);
    }
    captureError(error, 'userTargetsService/deleteUserTarget');
    throw error;
  }
}

