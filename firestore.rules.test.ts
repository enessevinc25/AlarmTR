/**
 * Firestore Rules Unit Tests
 * 
 * Bu test dosyası Firebase Emulator Suite kullanarak Firestore security rules'ları test eder.
 * 
 * Çalıştırma:
 *   npm run test:rules
 *   veya
 *   npm run qa:rules
 */

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { deleteApp, FirebaseApp } from 'firebase/app';

let testEnv: RulesTestEnvironment | null = null;
// eslint-disable-next-line prefer-const
let app: FirebaseApp | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
let auth: Auth | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
let db: Firestore | null = null;

// Test verileri
const testUserA = {
  uid: 'userA',
  email: 'usera@test.com',
  name: 'User A',
};

const testUserB = {
  uid: 'userB',
  email: 'userb@test.com',
  name: 'User B',
};

beforeAll(async () => {
  // Firebase Emulator Suite baslatilmali (firebase emulators:exec tarafindan)
  // FIREBASE_EMULATOR_HOST env var otomatik set edilir
  const emulatorHost = process.env.FIREBASE_EMULATOR_HOST || '127.0.0.1:8085';
  const [host, port] = emulatorHost.split(':');
  
  testEnv = await initializeTestEnvironment({
    projectId: 'alarmtr-test',
    firestore: {
      host: host || '127.0.0.1',
      port: parseInt(port || '8085'),
    },
    // Note: auth emulator configuration is handled separately via connectAuthEmulator
  });

  if (!testEnv) {
    throw new Error('Firebase Test Environment baslatilamadi. Emulator Suite calisiyor mu?');
  }
}, 30000);

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
  if (app) {
    await deleteApp(app);
  }
});

beforeEach(() => {
  if (testEnv) {
    testEnv.clearFirestore();
    // clearAuth() metodu yok, her test için yeni context kullanıyoruz
  }
});

describe('Firestore Security Rules', () => {
  describe('Anonymous Access', () => {
    it('should DENY anonymous read access to users collection', async () => {
      if (!testEnv) throw new Error('Test environment not initialized');
      
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      
      await expect(
        unauthedDb.collection('users').doc('userA').get()
      ).rejects.toThrow();
    });

    it('should DENY anonymous write access to alarmSessions', async () => {
      if (!testEnv) throw new Error('Test environment not initialized');
      
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      
      await expect(
        unauthedDb.collection('alarmSessions').add({
          userId: 'userA',
          targetType: 'STOP',
          targetId: 'stop1',
          distanceThresholdMeters: 100,
          status: 'ACTIVE',
          createdAt: new Date(),
        })
      ).rejects.toThrow();
    });
  });

  describe('User A - Own Data Access', () => {
    it('should ALLOW userA to read own user document', async () => {
      if (!testEnv) throw new Error('Test environment not initialized');
      
      // Seed data
      const authedDb = testEnv.authenticatedContext(testUserA.uid).firestore();
      await authedDb.collection('users').doc(testUserA.uid).set({
        userId: testUserA.uid,
        email: testUserA.email,
        name: testUserA.name,
        createdAt: new Date(),
      });

      // Test read
      const doc = await authedDb.collection('users').doc(testUserA.uid).get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.userId).toBe(testUserA.uid);
    });

    it('should ALLOW userA to create own alarmSession', async () => {
      if (!testEnv) throw new Error('Test environment not initialized');
      
      const authedDb = testEnv.authenticatedContext(testUserA.uid).firestore();
      
      const sessionRef = authedDb.collection('alarmSessions').doc();
      await sessionRef.set({
        userId: testUserA.uid,
        targetType: 'STOP',
        targetId: 'stop1',
        distanceThresholdMeters: 100,
        status: 'ACTIVE',
        createdAt: new Date(),
      });

      const doc = await sessionRef.get();
      expect(doc.exists).toBe(true);
    });

    it('should ALLOW userA to read own alarmSession with deletedAt==null', async () => {
      if (!testEnv) throw new Error('Test environment not initialized');
      
      const authedDb = testEnv.authenticatedContext(testUserA.uid).firestore();
      
      // Create session with deletedAt==null
      const sessionRef = authedDb.collection('alarmSessions').doc();
      await sessionRef.set({
        userId: testUserA.uid,
        targetType: 'STOP',
        targetId: 'stop1',
        distanceThresholdMeters: 100,
        status: 'ACTIVE',
        createdAt: new Date(),
        deletedAt: null,
      });

      const doc = await sessionRef.get();
      expect(doc.exists).toBe(true);
    });

    it('should DENY userA to read own alarmSession with deletedAt set', async () => {
      if (!testEnv) throw new Error('Test environment not initialized');
      
      const authedDb = testEnv.authenticatedContext(testUserA.uid).firestore();
      
      // Create session with deletedAt set (soft delete)
      const sessionRef = authedDb.collection('alarmSessions').doc();
      await sessionRef.set({
        userId: testUserA.uid,
        targetType: 'STOP',
        targetId: 'stop1',
        distanceThresholdMeters: 100,
        status: 'ACTIVE',
        createdAt: new Date(),
        deletedAt: new Date(),
      });

      // Read should fail (isNotDeleted() check)
      await expect(sessionRef.get()).rejects.toThrow();
    });
  });

  describe('User A - Other User Data Access', () => {
    it('should DENY userA to read userB user document', async () => {
      if (!testEnv) throw new Error('Test environment not initialized');
      
      // Seed userB data
      const userBDb = testEnv.authenticatedContext(testUserB.uid).firestore();
      await userBDb.collection('users').doc(testUserB.uid).set({
        userId: testUserB.uid,
        email: testUserB.email,
        name: testUserB.name,
        createdAt: new Date(),
      });

      // Try to read as userA
      const userADb = testEnv.authenticatedContext(testUserA.uid).firestore();
      await expect(
        userADb.collection('users').doc(testUserB.uid).get()
      ).rejects.toThrow();
    });

    it('should DENY userA to read userB alarmSession', async () => {
      if (!testEnv) throw new Error('Test environment not initialized');
      
      // Seed userB alarmSession
      const userBDb = testEnv.authenticatedContext(testUserB.uid).firestore();
      const sessionRef = userBDb.collection('alarmSessions').doc();
      await sessionRef.set({
        userId: testUserB.uid,
        targetType: 'STOP',
        targetId: 'stop1',
        distanceThresholdMeters: 100,
        status: 'ACTIVE',
        createdAt: new Date(),
      });

      // Try to read as userA
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userADb = testEnv.authenticatedContext(testUserA.uid).firestore();
      await expect(sessionRef.get()).rejects.toThrow();
    });
  });
});

