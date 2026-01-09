/**
 * Firebase Cloud Functions
 * 
 * Bu dosya, hesap silme işlemi için Cloud Function içerir.
 * 
 * KURULUM:
 * 1. Firebase CLI'yi yükle: npm install -g firebase-tools
 * 2. Firebase'e giriş yap: firebase login
 * 3. Functions'ı başlat: firebase init functions
 * 4. Deploy et: firebase deploy --only functions
 * 
 * NOT: Bu Cloud Function OPSİYONEL'dir. Mevcut client-side silme çalışıyor,
 * ama Cloud Function daha güvenli ve güvenilirdir.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin SDK'yı başlat (sadece bir kez)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Kullanıcı Firebase Auth'dan silindiğinde otomatik olarak tetiklenir.
 * Tüm kullanıcı verilerini Firestore'dan siler.
 * 
 * TRİGGER: Firebase Auth user delete event
 * 
 * GÜVENLİK: Bu function sadece Firebase Auth'dan user silindiğinde tetiklenir.
 * Client-side'da deleteUser() çağrıldığında otomatik olarak çalışır.
 */
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  const db = admin.firestore();
  
  console.log(`[onUserDelete] User ${userId} siliniyor...`);

  try {
    // Batch write için batch oluştur
    const batch = db.batch();
    let deleteCount = 0;

    // Silinecek collection'lar (tüm kullanıcı verileri)
    const collections = [
      'userTargets',        // Özel hedefler
      'userSavedStops',    // Favori duraklar
      'userAlarmProfiles', // Alarm profilleri
      'alarmSessions',     // Alarm geçmişi (tüm alarm oturumları)
    ];

    // Her collection için tüm belgeleri bul ve batch'e ekle
    // Firestore batch limit: 500 operations per batch
    const BATCH_LIMIT = 500;
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName)
        .where('userId', '==', userId)
        .get();
      
      if (snapshot.empty) {
        console.log(`[onUserDelete] ${collectionName}: 0 belge (zaten boş)`);
        continue;
      }

      // Büyük collection'lar için batch'leri böl
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
        const subBatch = db.batch();
        const batchDocs = docs.slice(i, i + BATCH_LIMIT);
        
        batchDocs.forEach((doc) => {
          subBatch.delete(doc.ref);
          deleteCount++;
        });
        
        await subBatch.commit();
      }
      
      console.log(`[onUserDelete] ${collectionName}: ${snapshot.docs.length} belge silindi`);
    }

    // User document'i sil
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      batch.delete(userRef);
      deleteCount++;
      console.log(`[onUserDelete] users/${userId} silindi`);
    }

    // Batch'i commit et
    await batch.commit();
    
    console.log(`[onUserDelete] Toplam ${deleteCount} belge silindi. User ${userId} başarıyla silindi.`);
    
    return { success: true, deletedCount: deleteCount };
  } catch (error) {
    console.error(`[onUserDelete] Hata:`, error);
    // Hata durumunda tekrar deneme için throw et
    throw new functions.https.HttpsError(
      'internal',
      `Kullanıcı verileri silinirken hata oluştu: ${error}`
    );
  }
});

/**
 * OPSİYONEL: HTTP endpoint ile manuel hesap silme
 * 
 * GÜVENLİK: Bu endpoint sadece authenticated kullanıcılar tarafından çağrılabilir.
 * Client-side'da deleteUser() kullanmak daha güvenlidir (reauth gerektirir).
 * 
 * KULLANIM:
 * const response = await fetch('https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/manualDeleteAccount', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${idToken}`,
 *   },
 * });
 */
export const manualDeleteAccount = functions.https.onCall(async (data, context) => {
  // Authentication kontrolü
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Kullanıcı giriş yapmamış'
    );
  }

  const userId = context.auth.uid;
  const db = admin.firestore();

  console.log(`[manualDeleteAccount] User ${userId} manuel olarak siliniyor...`);

  try {
    // Batch write için batch oluştur
    const batch = db.batch();
    let deleteCount = 0;

    // Silinecek collection'lar (tüm kullanıcı verileri)
    const collections = [
      'userTargets',        // Özel hedefler
      'userSavedStops',    // Favori duraklar
      'userAlarmProfiles', // Alarm profilleri
      'alarmSessions',     // Alarm geçmişi (tüm alarm oturumları)
    ];

    // Her collection için tüm belgeleri bul ve batch'e ekle
    // Firestore batch limit: 500 operations per batch
    const BATCH_LIMIT = 500;
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName)
        .where('userId', '==', userId)
        .get();
      
      if (snapshot.empty) {
        continue;
      }

      // Büyük collection'lar için batch'leri böl
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
        const subBatch = db.batch();
        const batchDocs = docs.slice(i, i + BATCH_LIMIT);
        
        batchDocs.forEach((doc) => {
          subBatch.delete(doc.ref);
          deleteCount++;
        });
        
        await subBatch.commit();
      }
    }

    // User document'i sil
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      batch.delete(userRef);
      deleteCount++;
    }

    // Batch'i commit et
    await batch.commit();
    
    // Firebase Auth'dan user'ı sil (admin SDK ile)
    await admin.auth().deleteUser(userId);
    
    console.log(`[manualDeleteAccount] User ${userId} ve ${deleteCount} belge başarıyla silindi.`);
    
    return { success: true, deletedCount: deleteCount };
  } catch (error) {
    console.error(`[manualDeleteAccount] Hata:`, error);
    throw new functions.https.HttpsError(
      'internal',
      `Hesap silinirken hata oluştu: ${error}`
    );
  }
});

