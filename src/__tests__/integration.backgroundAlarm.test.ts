/**
 * integration.backgroundAlarm.test.ts
 * 
 * Background alarm akışının end-to-end testi.
 * CRITICAL: Tüm akışın doğru çalıştığını garanti eder.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { processBackgroundLocationUpdate } from '../services/alarmBackgroundCore';
import { syncPendingEventsToFirestore } from '../services/alarmBackgroundSync';
import { handleBackgroundLocationUpdate } from '../services/alarmBackgroundService';
import { ACTIVE_ALARM_STORAGE_KEY, ActiveAlarmStateSnapshot } from '../context/AlarmContext';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-location');
jest.mock('../services/alarmService', () => ({
  scheduleAlarmNotification: jest.fn(),
}));
// alarmBackgroundCore partial mock - getPendingSyncEvents ve clearPendingSyncEvents mock'lanır, processBackgroundLocationUpdate gerçek kalır
jest.mock('../services/alarmBackgroundCore', () => {
  const actual = jest.requireActual('../services/alarmBackgroundCore');
  return {
    ...actual,
    getPendingSyncEvents: jest.fn(),
    clearPendingSyncEvents: jest.fn(),
  };
});
jest.mock('../utils/distance', () => ({
  getDistanceInMeters: jest.fn((lat1, lon1, lat2, lon2) => {
    // Basit mock - 300m mesafe döndür
    return 300;
  }),
}));
jest.mock('../services/firebase', () => ({
  db: {},
}));
jest.mock('../services/offlineQueueService', () => ({
  isLocalSessionId: jest.fn(() => false),
}));
jest.mock('../utils/errorReporting', () => ({
  captureError: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
}));

describe('Integration - Background Alarm Flow', () => {
  const mockSnapshot: ActiveAlarmStateSnapshot = {
    sessionId: 'test-session-123',
    userId: 'user-123',
    status: 'ACTIVE',
    targetName: 'Test Durak',
    targetLat: 41.0082,
    targetLon: 28.9784,
    distanceThresholdMeters: 400,
    targetType: 'STOP',
    targetId: 'stop-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === ACTIVE_ALARM_STORAGE_KEY) {
        return Promise.resolve(JSON.stringify(mockSnapshot));
      }
      if (key === '@laststop/pendingSyncEvents') {
        return Promise.resolve(JSON.stringify([]));
      }
      if (key === '@laststop/heartbeatLog') {
        return Promise.resolve(JSON.stringify([]));
      }
      return Promise.resolve(null);
    });
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Complete Background Alarm Flow', () => {
    it('should process location update, trigger alarm, and queue sync event', async () => {
      const { scheduleAlarmNotification } = require('../services/alarmService');

      // 1. Background location update gelir
      const result = await processBackgroundLocationUpdate({
        latitude: 41.0085, // Yakın konum (300m mesafe, threshold 400m)
        longitude: 28.9784,
        accuracy: 10,
      });

      // 2. Alarm tetiklenmeli
      expect(result.triggered).toBe(true);
      expect(result.distance).toBe(300);
      expect(scheduleAlarmNotification).toHaveBeenCalledWith({
        title: 'Durağa yaklaşıyorsun!',
        body: 'Test Durak durağına yaklaştın.',
      });

      // 3. Snapshot TRIGGERED olarak güncellenmeli
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const snapshotUpdate = setItemCalls.find(
        (call) => call[0] === ACTIVE_ALARM_STORAGE_KEY
      );
      expect(snapshotUpdate).toBeDefined();
      if (snapshotUpdate) {
        const updated: ActiveAlarmStateSnapshot = JSON.parse(snapshotUpdate[1]);
        expect(updated.status).toBe('TRIGGERED');
      }

      // 4. Pending sync event eklenmeli
      const pendingSyncCall = setItemCalls.find(
        (call) => call[0] === '@laststop/pendingSyncEvents'
      );
      expect(pendingSyncCall).toBeDefined();

      // 5. Heartbeat log eklenmeli
      const heartbeatCall = setItemCalls.find(
        (call) => call[0] === '@laststop/heartbeatLog'
      );
      expect(heartbeatCall).toBeDefined();
    });

    it('should sync pending events to Firestore when foreground', async () => {
      const { syncPendingEventsToFirestore } = require('../services/alarmBackgroundSync');
      const { getPendingSyncEvents, clearPendingSyncEvents } = require('../services/alarmBackgroundCore');
      const mockEvents = [
        {
          type: 'TRIGGERED' as const,
          sessionId: 'session-123',
          timestamp: Date.now(),
          data: { triggeredAt: Date.now(), lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc, updateDoc } = require('firebase/firestore');
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ status: 'ACTIVE' }),
      };

      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      // Foreground'da sync çağrılır
      await syncPendingEventsToFirestore();

      // Firestore'a yazılmalı
      expect(updateDoc).toHaveBeenCalled();
      // Event temizlenmeli
      expect(clearPendingSyncEvents).toHaveBeenCalledWith(mockEvents);
    });

    it('should handle background task wiring correctly', async () => {
      // Background task'tan handleBackgroundLocationUpdate çağrılır
      // Bu sadece processBackgroundLocationUpdate'i çağırmalı
      const { processBackgroundLocationUpdate } = require('../services/alarmBackgroundCore');
      const processSpy = jest.spyOn(
        require('../services/alarmBackgroundCore'),
        'processBackgroundLocationUpdate'
      );

      await handleBackgroundLocationUpdate({
        latitude: 41.0085,
        longitude: 28.9784,
        accuracy: 10,
      });

      // processBackgroundLocationUpdate çağrılmalı
      expect(processSpy).toHaveBeenCalledWith({
        latitude: 41.0085,
        longitude: 28.9784,
        accuracy: 10,
      });
    });
  });

  describe('Idempotency Tests', () => {
    it('should not trigger alarm twice', async () => {
      const triggeredSnapshot = { ...mockSnapshot, status: 'TRIGGERED' as const };
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === ACTIVE_ALARM_STORAGE_KEY) {
          return Promise.resolve(JSON.stringify(triggeredSnapshot));
        }
        return Promise.resolve(null);
      });

      const { scheduleAlarmNotification } = require('../services/alarmService');

      const result = await processBackgroundLocationUpdate({
        latitude: 41.0085, // Çok yakın
        longitude: 28.9784,
        accuracy: 10,
      });

      expect(result.triggered).toBe(false);
      expect(scheduleAlarmNotification).not.toHaveBeenCalled();
    });

    it('should not sync already TRIGGERED session', async () => {
      const { getPendingSyncEvents } = require('../services/alarmBackgroundCore');
      const mockEvents = [
        {
          type: 'TRIGGERED' as const,
          sessionId: 'session-123',
          timestamp: Date.now(),
          data: { triggeredAt: Date.now(), lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc, updateDoc } = require('firebase/firestore');
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ status: 'TRIGGERED' }), // Zaten tetiklenmiş
      };

      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      await syncPendingEventsToFirestore();

      // Update çağrılmamalı (zaten TRIGGERED)
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle snapshot parse errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');

      const result = await processBackgroundLocationUpdate({
        latitude: 41.0082,
        longitude: 28.9784,
        accuracy: 10,
      });

      expect(result).toEqual({ triggered: false, distance: null });
    });

    it('should handle sync errors gracefully', async () => {
      const { getPendingSyncEvents } = require('../services/alarmBackgroundCore');
      const mockEvents = [
        {
          type: 'TRIGGERED' as const,
          sessionId: 'session-123',
          timestamp: Date.now(),
          data: { triggeredAt: Date.now(), lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc } = require('firebase/firestore');
      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { captureError } = require('../utils/errorReporting');

      await syncPendingEventsToFirestore();

      // Hata yakalanmalı
      expect(captureError).toHaveBeenCalled();
    });
  });
});

