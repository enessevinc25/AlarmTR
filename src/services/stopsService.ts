import {
  DocumentData,
  QueryConstraint,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from './firebase';
import { TransitStop, UserTarget } from '../types/models';

const STOPS_COLLECTION = 'stops';
const USER_TARGETS_COLLECTION = 'userTargets';

const normalizeStop = (id: string, data: DocumentData): TransitStop => {
  const latitude = Number(data.latitude ?? data.lat);
  const longitude = Number(data.longitude ?? data.lon);
  const resolvedLines = Array.isArray(data.lines)
    ? (data.lines as string[])
    : Array.isArray(data.lineIds)
      ? (data.lineIds as string[])
      : [];
  return {
    id,
    name: String(data.name ?? 'Bilinmeyen Durak'),
    code: (data.code as string) || undefined,
    lines: resolvedLines.length ? resolvedLines : undefined,
    addressDescription: (data.addressDescription as string) || undefined,
    city: (data.city ?? data.cityId) as string | undefined,
    latitude,
    longitude,
    radiusMeters: (data.radiusMeters as number | undefined) ?? 400,
    lineIds: (data.lineIds as string[] | undefined) ?? [],
    searchKeywords: (data.searchKeywords as string[] | undefined) ?? undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

export async function fetchStops(limit = 200, city?: string): Promise<TransitStop[]> {
  try {
    const constraints: QueryConstraint[] = [orderBy('name', 'asc'), limitQuery(limit)];
    if (city) {
      constraints.push(where('city', '==', city));
    }
    const q = query(collection(db, STOPS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeStop(docSnap.id, docSnap.data()));
  } catch (error) {
    if (__DEV__) {
      console.warn('Duraklar alınamadı', error);
    }
    return [];
  }
}

export async function getStopById(stopId: string): Promise<TransitStop | null> {
  const ref = doc(db, STOPS_COLLECTION, stopId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }
  return normalizeStop(snapshot.id, snapshot.data());
}

export async function getUserTargetById(targetId: string) {
  const ref = doc(db, USER_TARGETS_COLLECTION, targetId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data() as Omit<UserTarget, 'id'>;
  return { id: snapshot.id, ...data };
}

export async function createUserTarget(
  userId: string,
  data: Omit<UserTarget, 'id' | 'userId' | 'createdAt'>,
) {
  const payload = {
    ...data,
    userId,
    createdAt: Date.now(),
  };
  const docRef = await addDoc(collection(db, USER_TARGETS_COLLECTION), payload);
  return { id: docRef.id, ...payload };
}

