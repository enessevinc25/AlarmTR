/**
 * Emulator Integration Test - deleteAccountAndData Flow
 * 
 * Bu test Firebase Emulator Suite kullanarak deleteAccountAndData flow'unu test eder.
 * 
 * Çalıştırma:
 *   npm run test:emu
 *   veya
 *   npm run qa:emu
 * 
 * Önkoşul: Firebase emulator'lar çalışıyor olmalı (scripts/qa/run-emu-integration.ps1)
 */

import { initializeFirebaseTestServices, cleanupFirebaseTestServices } from '../utils/firebaseTestEnv';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { deleteAccountAndData } from '../services/authService';

// Test verileri
const testUser = {
  email: 'test-delete@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

let testServices: ReturnType<typeof initializeFirebaseTestServices> | null = null;
let testUserAuth: User | null = null;

beforeAll(async () => {
  // Firebase test servislerini başlat (emulator'a bağlanır)
  // FIREBASE_AUTH_EMULATOR_HOST ve FIREBASE_FIRESTORE_EMULATOR_HOST env var'ları set edilmiş olmalı
  testServices = initializeFirebaseTestServices({
    projectId: 'alarmtr-test',
    apiKey: 'dummy-api-key',
    authDomain: 'test.firebaseapp.com',
    appId: 'test-app-id',
  });

  // Test kullanıcısı oluştur
  testUserAuth = (await createUserWithEmailAndPassword(
    testServices.auth,
    testUser.email,
    testUser.password
  )).user;

  // User document oluştur
  await setDoc(doc(testServices.db, 'users', testUserAuth.uid), {
    name: testUser.name,
    email: testUser.email,
    createdAt: serverTimestamp(),
    defaultDistanceMeters: 400,
    defaultTransportMode: 'BUS',
    defaultMinutesBefore: 3,
  });
}, 30000);

afterAll(async () => {
  // Test ortamını temizle
  cleanupFirebaseTestServices();
}, 30000);

describe('deleteAccountAndData Integration Test', () => {
  beforeEach(async () => {
    // Her test öncesi test verilerini seed et
    if (!testServices || !testUserAuth) {
      throw new Error('Test services not initialized');
    }

    // Eğer kullanıcı silinmişse yeniden oluştur
    try {
      await signInWithEmailAndPassword(testServices.auth, testUser.email, testUser.password);
    } catch {
      // Kullanıcı yoksa oluştur
      testUserAuth = (await createUserWithEmailAndPassword(
        testServices.auth,
        testUser.email,
        testUser.password
      )).user;

      await setDoc(doc(testServices.db, 'users', testUserAuth.uid), {
        name: testUser.name,
        email: testUser.email,
        createdAt: serverTimestamp(),
        defaultDistanceMeters: 400,
        defaultTransportMode: 'BUS',
        defaultMinutesBefore: 3,
      });
    }

    // Test verilerini seed et
    const userId = testUserAuth.uid;

    // userTargets
    await setDoc(doc(testServices.db, 'userTargets', 'target1'), {
      userId,
      name: 'Test Target',
      lat: 41.0082,
      lon: 28.9784,
      radiusMeters: 100,
      createdAt: serverTimestamp(),
    });

    // userSavedStops
    await setDoc(doc(testServices.db, 'userSavedStops', 'saved1'), {
      userId,
      stopId: 'stop1',
      stopName: 'Test Stop',
      createdAt: serverTimestamp(),
    });

    // userAlarmProfiles
    await setDoc(doc(testServices.db, 'userAlarmProfiles', 'profile1'), {
      userId,
      name: 'Test Profile',
      distanceMeters: 200,
      transportMode: 'BUS',
      minutesBefore: 5,
      createdAt: serverTimestamp(),
    });

    // alarmSessions
    await setDoc(doc(testServices.db, 'alarmSessions', 'session1'), {
      userId,
      targetType: 'STOP',
      targetId: 'stop1',
      distanceThresholdMeters: 100,
      status: 'ACTIVE',
      createdAt: serverTimestamp(),
    });
  });

  it('should delete all user data and account', async () => {
    if (!testServices || !testUserAuth) {
      throw new Error('Test services not initialized');
    }

    const userId = testUserAuth.uid;

    // Verilerin var olduğunu doğrula
    const userDocBefore = await getDoc(doc(testServices.db, 'users', userId));
    expect(userDocBefore.exists()).toBe(true);

    const targetsBefore = await getDocs(query(collection(testServices.db, 'userTargets'), where('userId', '==', userId)));
    expect(targetsBefore.size).toBeGreaterThan(0);

    const savedStopsBefore = await getDocs(query(collection(testServices.db, 'userSavedStops'), where('userId', '==', userId)));
    expect(savedStopsBefore.size).toBeGreaterThan(0);

    const profilesBefore = await getDocs(query(collection(testServices.db, 'userAlarmProfiles'), where('userId', '==', userId)));
    expect(profilesBefore.size).toBeGreaterThan(0);

    const sessionsBefore = await getDocs(query(collection(testServices.db, 'alarmSessions'), where('userId', '==', userId)));
    expect(sessionsBefore.size).toBeGreaterThan(0);

    // deleteAccountAndData'yı çalıştır
    await deleteAccountAndData(testUserAuth, testUser.password);

    // Verilerin silindiğini doğrula
    const userDocAfter = await getDoc(doc(testServices.db, 'users', userId));
    expect(userDocAfter.exists()).toBe(false);

    const targetsAfter = await getDocs(query(collection(testServices.db, 'userTargets'), where('userId', '==', userId)));
    expect(targetsAfter.size).toBe(0);

    const savedStopsAfter = await getDocs(query(collection(testServices.db, 'userSavedStops'), where('userId', '==', userId)));
    expect(savedStopsAfter.size).toBe(0);

    const profilesAfter = await getDocs(query(collection(testServices.db, 'userAlarmProfiles'), where('userId', '==', userId)));
    expect(profilesAfter.size).toBe(0);

    const sessionsAfter = await getDocs(query(collection(testServices.db, 'alarmSessions'), where('userId', '==', userId)));
    expect(sessionsAfter.size).toBe(0);

    // Auth kullanıcısının da silindiğini doğrula (signInWithEmailAndPassword başarısız olmalı)
    await expect(
      signInWithEmailAndPassword(testServices.auth, testUser.email, testUser.password)
    ).rejects.toThrow();
  });
});

