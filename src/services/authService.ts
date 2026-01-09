import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import { captureError } from '../utils/errorReporting';

export async function signUp(email: string, password: string, name: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });

  await setDoc(doc(db, 'users', credential.user.uid), {
    name,
    email,
    createdAt: serverTimestamp(),
    defaultDistanceMeters: 400,
    defaultTransportMode: 'BUS',
    defaultMinutesBefore: 3,
  });

  return credential.user;
}

export function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Kullanıcıya ait tüm belgeleri bir collection'dan siler (batch delete kullanarak)
 */
async function deleteCollectionByUser(collectionName: string, userId: string): Promise<number> {
  try {
    const snap = await getDocs(query(collection(db, collectionName), where('userId', '==', userId)));
    
    if (snap.empty) {
      return 0;
    }

    // Firestore batch limit: 500 operations per batch
    const BATCH_LIMIT = 500;
    const docs = snap.docs;
    let deletedCount = 0;

    // Büyük collection'lar için batch'leri böl
    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + BATCH_LIMIT);
      
      batchDocs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        deletedCount++;
      });
      
      await batch.commit();
    }

    return deletedCount;
  } catch (error) {
    if (__DEV__) {
      console.error(`[deleteCollectionByUser] ${collectionName} silinirken hata:`, error);
    }
    captureError(error, `authService/deleteCollectionByUser/${collectionName}`);
    throw error;
  }
}

/**
 * Kullanıcı hesabını ve tüm verilerini kalıcı olarak siler.
 * Önce şifre ile yeniden kimlik doğrulama yapılmalıdır.
 * 
 * SİLİNEN VERİLER:
 * - users/{userId} - Kullanıcı profili
 * - userTargets - Özel hedefler
 * - userSavedStops - Favori duraklar
 * - userAlarmProfiles - Alarm profilleri
 * - alarmSessions - Alarm geçmişi (tüm alarm oturumları)
 * 
 * @param user - Silinecek kullanıcı
 * @param password - Kullanıcının şifresi (reauth için)
 */
export async function deleteAccountAndData(user: User, password: string) {
  const userId = user.uid;
  
  // Önce reauthentication yap
  if (!user.email) {
    throw new Error('Kullanıcı email adresi bulunamadı');
  }
  
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  
  try {
    if (__DEV__) {
      console.log(`[deleteAccountAndData] User ${userId} siliniyor...`);
    }
    
    // Tüm kullanıcı verilerini sil (paralel olarak)
    const deletionPromises = [
      deleteCollectionByUser('userTargets', userId).then(count => {
        if (__DEV__) {
          console.log(`[deleteAccountAndData] userTargets: ${count} belge silindi`);
        }
        return count;
      }),
      deleteCollectionByUser('userSavedStops', userId).then(count => {
        if (__DEV__) {
          console.log(`[deleteAccountAndData] userSavedStops: ${count} belge silindi`);
        }
        return count;
      }),
      deleteCollectionByUser('userAlarmProfiles', userId).then(count => {
        if (__DEV__) {
          console.log(`[deleteAccountAndData] userAlarmProfiles: ${count} belge silindi`);
        }
        return count;
      }),
      deleteCollectionByUser('alarmSessions', userId).then(count => {
        if (__DEV__) {
          console.log(`[deleteAccountAndData] alarmSessions: ${count} belge silindi`);
        }
        return count;
      }),
    ];

    // Tüm collection'ları paralel olarak sil
    await Promise.all(deletionPromises);
    
    // User document'i sil
    const userRef = doc(db, 'users', userId);
    try {
      await deleteDoc(userRef);
      if (__DEV__) {
        console.log(`[deleteAccountAndData] users/${userId} silindi`);
      }
    } catch (userDeleteError) {
      // User document yoksa hata verme (zaten silinmiş olabilir)
      if (__DEV__) {
        console.warn(`[deleteAccountAndData] users/${userId} silinirken uyarı:`, userDeleteError);
      }
    }
    
    // Son olarak Firebase Auth kullanıcısını sil
    await deleteUser(user);
    
    if (__DEV__) {
      console.log(`[deleteAccountAndData] User ${userId} ve tüm verileri başarıyla silindi.`);
    }
  } catch (error) {
    if (__DEV__) {
      console.error(`[deleteAccountAndData] Hata:`, error);
    }
    captureError(error, 'authService/deleteAccountAndData');
    throw error;
  }
}

