import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { captureError } from '../utils/errorReporting';
import { TransportMode, UserAlarmProfile } from '../types/models';

const COLLECTION = 'userAlarmProfiles';

function validateProfileInput(
  data: Pick<UserAlarmProfile, 'name' | 'distanceMeters' | 'minutesBefore'>,
) {
  const name = data.name.trim();
  if (name.length < 1 || name.length > 50) {
    throw new Error('Profil ismi 1-50 karakter olmalıdır.');
  }
  if (data.distanceMeters < 50 || data.distanceMeters > 5000) {
    throw new Error('Mesafe 50 - 5000 metre arasında olmalıdır.');
  }
  if (data.minutesBefore < 0 || data.minutesBefore > 120) {
    throw new Error('Dakika değeri 0 - 120 arasında olmalıdır.');
  }
}

export async function listUserAlarmProfiles(userId: string): Promise<UserAlarmProfile[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<UserAlarmProfile, 'id'>;
      return {
        id: docSnap.id,
        ...data,
      };
    });
  } catch (error) {
    captureError(error, 'alarmProfilesService/listUserAlarmProfiles');
    throw error;
  }
}

export async function createUserAlarmProfile(
  userId: string,
  data: {
    name: string;
    distanceMeters: number;
    transportMode: TransportMode;
    minutesBefore: number;
  },
): Promise<UserAlarmProfile> {
  try {
    validateProfileInput(data);
    const payload = {
      userId,
      name: data.name.trim(),
      distanceMeters: data.distanceMeters,
      transportMode: data.transportMode,
      minutesBefore: data.minutesBefore,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return {
      id: ref.id,
      userId: payload.userId,
      name: payload.name,
      distanceMeters: payload.distanceMeters,
      transportMode: payload.transportMode,
      minutesBefore: payload.minutesBefore,
      // createdAt ve updatedAt serverTimestamp() olduğu için return edilemez
      // Firestore'dan okunduğunda gerçek Timestamp değerleri gelecek
    };
  } catch (error) {
    captureError(error, 'alarmProfilesService/createUserAlarmProfile');
    throw error;
  }
}

export async function updateUserAlarmProfile(
  profileId: string,
  userId: string,
  data: Partial<{
    name: string;
    distanceMeters: number;
    transportMode: TransportMode;
    minutesBefore: number;
  }>,
): Promise<void> {
  try {
    const ref = doc(db, COLLECTION, profileId);
    const snapshot = await getDoc(ref);
    const current = snapshot.data() as UserAlarmProfile | undefined;
    if (!current || current.userId !== userId) {
      throw new Error('Profil bulunamadı.');
    }

    validateProfileInput({
      name: data.name ?? current.name,
      distanceMeters: data.distanceMeters ?? current.distanceMeters,
      minutesBefore: data.minutesBefore ?? current.minutesBefore,
    });

    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    captureError(error, 'alarmProfilesService/updateUserAlarmProfile');
    throw error;
  }
}

export async function deleteUserAlarmProfile(profileId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, profileId));
  } catch (error) {
    captureError(error, 'alarmProfilesService/deleteUserAlarmProfile');
    throw error;
  }
}

