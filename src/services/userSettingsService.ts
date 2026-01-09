import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from './firebase';
import { UserAlarmPreferences } from '../types/models';
import { captureError } from '../utils/errorReporting';

const DEFAULT_PREFERENCES: UserAlarmPreferences = {
  defaultDistanceMeters: 400,
  defaultTransportMode: 'BUS',
  defaultMinutesBefore: 3,
};

export async function getUserAlarmPreferences(userId: string): Promise<UserAlarmPreferences> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return DEFAULT_PREFERENCES;
    }
    const data = snap.data();
    return {
      defaultDistanceMeters: data.defaultDistanceMeters ?? DEFAULT_PREFERENCES.defaultDistanceMeters,
      defaultTransportMode:
        data.defaultTransportMode ?? DEFAULT_PREFERENCES.defaultTransportMode,
      defaultMinutesBefore: data.defaultMinutesBefore ?? DEFAULT_PREFERENCES.defaultMinutesBefore,
    };
  } catch (error) {
    captureError(error, 'userSettingsService/getUserAlarmPreferences');
    throw error;
  }
}

export async function updateUserAlarmPreferences(
  userId: string,
  prefs: UserAlarmPreferences,
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
      defaultDistanceMeters: prefs.defaultDistanceMeters,
      defaultTransportMode: prefs.defaultTransportMode,
      defaultMinutesBefore: prefs.defaultMinutesBefore,
      },
      { merge: true },
    );
  } catch (error) {
    captureError(error, 'userSettingsService/updateUserAlarmPreferences');
    throw error;
  }
}

