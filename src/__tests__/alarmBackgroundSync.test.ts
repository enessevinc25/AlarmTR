/**
 * alarmBackgroundSync.test.ts
 * 
 * Foreground sync mekanizmasını test eder.
 * CRITICAL: Sync'in sadece foreground'da çalıştığını ve doğru çalıştığını garanti eder.
 */

import { syncPendingEventsToFirestore } from '../services/alarmBackgroundSync';
import {
  getPendingSyncEvents,
  clearPendingSyncEvents,
  PendingSyncEvent,
} from '../services/alarmBackgroundCore';
import { db } from '../services/firebase';
import { isLocalSessionId } from '../services/offlineQueueService';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../services/alarmBackgroundCore', () => ({
  getPendingSyncEvents: jest.fn(),
  clearPendingSyncEvents: jest.fn(),
  PendingSyncEvent: {} as any,
}));
jest.mock('../services/firebase', () => ({
  db: {},
}));
jest.mock('../services/offlineQueueService', () => ({
  isLocalSessionId: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
}));
jest.mock('../utils/errorReporting', () => ({
  captureError: jest.fn(),
}));

describe('alarmBackgroundSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isLocalSessionId as jest.Mock).mockReturnValue(false);
  });

  describe('syncPendingEventsToFirestore', () => {
    it('should return early if no pending events', async () => {
      (getPendingSyncEvents as jest.Mock).mockResolvedValue([]);

      await syncPendingEventsToFirestore();

      const { getDoc, updateDoc } = require('firebase/firestore');
      expect(getDoc).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should sync TRIGGERED event to Firestore', async () => {
      const mockEvents: PendingSyncEvent[] = [
        {
          type: 'TRIGGERED',
          sessionId: 'session-123',
          timestamp: Date.now(),
          data: { triggeredAt: Date.now(), lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc, updateDoc, serverTimestamp } = require('firebase/firestore');
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ status: 'ACTIVE' }),
      };

      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await syncPendingEventsToFirestore();

      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          status: 'TRIGGERED',
          triggeredAt: expect.anything(),
        })
      );
      expect(clearPendingSyncEvents).toHaveBeenCalledWith([mockEvents[0]]);
    });

    it('should skip TRIGGERED event if session already TRIGGERED', async () => {
      const mockEvents: PendingSyncEvent[] = [
        {
          type: 'TRIGGERED',
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

      expect(updateDoc).not.toHaveBeenCalled();
      // Event yine de temizlenmeli (idempotent)
      expect(clearPendingSyncEvents).toHaveBeenCalledWith([mockEvents[0]]);
    });

    it('should skip TRIGGERED event if session does not exist', async () => {
      const mockEvents: PendingSyncEvent[] = [
        {
          type: 'TRIGGERED',
          sessionId: 'session-123',
          timestamp: Date.now(),
          data: { triggeredAt: Date.now(), lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc, updateDoc } = require('firebase/firestore');
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => false, // Session yok
      };

      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      await syncPendingEventsToFirestore();

      expect(updateDoc).not.toHaveBeenCalled();
      expect(clearPendingSyncEvents).toHaveBeenCalledWith([mockEvents[0]]);
    });

    it('should sync DISTANCE_UPDATE event to Firestore', async () => {
      const mockEvents: PendingSyncEvent[] = [
        {
          type: 'DISTANCE_UPDATE',
          sessionId: 'session-123',
          timestamp: Date.now(),
          data: { lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc, updateDoc, serverTimestamp } = require('firebase/firestore');
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ status: 'ACTIVE' }),
      };

      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await syncPendingEventsToFirestore();

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          lastKnownDistanceMeters: 300,
          updatedAt: expect.anything(),
        })
      );
      expect(clearPendingSyncEvents).toHaveBeenCalledWith([mockEvents[0]]);
    });

    it('should skip DISTANCE_UPDATE if session is not ACTIVE', async () => {
      const mockEvents: PendingSyncEvent[] = [
        {
          type: 'DISTANCE_UPDATE',
          sessionId: 'session-123',
          timestamp: Date.now(),
          data: { lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc, updateDoc } = require('firebase/firestore');
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ status: 'TRIGGERED' }), // ACTIVE değil
      };

      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      await syncPendingEventsToFirestore();

      expect(updateDoc).not.toHaveBeenCalled();
      expect(clearPendingSyncEvents).toHaveBeenCalledWith([mockEvents[0]]);
    });

    it('should skip local session events', async () => {
      const mockEvents: PendingSyncEvent[] = [
        {
          type: 'TRIGGERED',
          sessionId: 'local-123',
          timestamp: Date.now(),
          data: { triggeredAt: Date.now(), lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);
      (isLocalSessionId as jest.Mock).mockReturnValue(true);

      const { doc, getDoc, updateDoc } = require('firebase/firestore');

      await syncPendingEventsToFirestore();

      expect(getDoc).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
      // Local session event'i temizlenmeli
      expect(clearPendingSyncEvents).toHaveBeenCalledWith([mockEvents[0]]);
    });

    it('should handle sync errors gracefully', async () => {
      const mockEvents: PendingSyncEvent[] = [
        {
          type: 'TRIGGERED',
          sessionId: 'session-123',
          timestamp: Date.now(),
          data: { triggeredAt: Date.now(), lastKnownDistanceMeters: 300 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc } = require('firebase/firestore');
      const mockDocRef = {};
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (getDoc as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { captureError } = require('../utils/errorReporting');

      await syncPendingEventsToFirestore();

      // Hata yakalanmalı ve loglanmalı
      expect(captureError).toHaveBeenCalled();
      // Event yine de temizlenmeli (retry için tutulabilir ama şimdilik temizle)
      expect(clearPendingSyncEvents).toHaveBeenCalled();
    });

    it('should sync multiple events', async () => {
      const mockEvents: PendingSyncEvent[] = [
        {
          type: 'TRIGGERED',
          sessionId: 'session-1',
          timestamp: Date.now(),
          data: { triggeredAt: Date.now(), lastKnownDistanceMeters: 300 },
        },
        {
          type: 'DISTANCE_UPDATE',
          sessionId: 'session-2',
          timestamp: Date.now(),
          data: { lastKnownDistanceMeters: 250 },
        },
      ];
      (getPendingSyncEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { doc, getDoc, updateDoc } = require('firebase/firestore');
      const mockDocRef1 = {};
      const mockDocRef2 = {};
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ status: 'ACTIVE' }),
      };

      (doc as jest.Mock)
        .mockReturnValueOnce(mockDocRef1)
        .mockReturnValueOnce(mockDocRef2);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await syncPendingEventsToFirestore();

      expect(updateDoc).toHaveBeenCalledTimes(2);
      expect(clearPendingSyncEvents).toHaveBeenCalledWith(mockEvents);
    });
  });
});

