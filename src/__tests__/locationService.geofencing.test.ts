/**
 * locationService.geofencing.test.ts
 * 
 * Geofencing fallback mekanizmasını test eder.
 */

// Mocks - import'lardan ÖNCE tanımlanmalı
// expo-location PermissionStatus enum değerleri - gerçek enum değerleriyle eşleşmeli
jest.mock('expo-location', () => {
  // PermissionStatus enum'u - expo-location'ın gerçek enum değerleri
  const PermissionStatus = {
    UNDETERMINED: 0,
    GRANTED: 1,
    DENIED: 2,
  };
  return {
    PermissionStatus,
    getBackgroundPermissionsAsync: jest.fn(),
    requestBackgroundPermissionsAsync: jest.fn(),
    startGeofencingAsync: jest.fn(),
    stopGeofencingAsync: jest.fn(),
  };
});
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../utils/expoEnvironment', () => ({
  isExpoGo: jest.fn(() => false),
  areNativeModulesAvailable: jest.fn(() => true),
}));
jest.mock('../utils/errorReporting', () => ({
  captureError: jest.fn(),
}));

// Import'lar mock'lardan SONRA
import * as Location from 'expo-location';
import { startGeofencing, stopGeofencing, GEOFENCE_TASK_NAME } from '../services/locationService';
import { isExpoGo } from '../utils/expoEnvironment';

describe('locationService - Geofencing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // isExpoGo false olarak ayarla (default)
    (isExpoGo as jest.Mock).mockReturnValue(false);
    // Default mock'lar - her test kendi mock'unu override edebilir
    (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
    });
    (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
    });
    (Location.startGeofencingAsync as jest.Mock).mockResolvedValue(undefined);
    (Location.stopGeofencingAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('startGeofencing', () => {
    it('should return early if Expo Go', async () => {
      (isExpoGo as jest.Mock).mockReturnValue(true);

      await startGeofencing(41.0082, 28.9784, 400);

      expect(Location.startGeofencingAsync).not.toHaveBeenCalled();
    });

    it('should request background permission if not granted', async () => {
      (Location.getBackgroundPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({
          status: Location.PermissionStatus.DENIED,
        })
        .mockResolvedValueOnce({
          status: Location.PermissionStatus.GRANTED,
        });
      (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.GRANTED,
      });

      await startGeofencing(41.0082, 28.9784, 400);

      expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.startGeofencingAsync).toHaveBeenCalled();
    });

    it('should return early if background permission denied', async () => {
      // Mock'ları explicit olarak ayarla (beforeEach'teki default'ları override et)
      // mockReset kullanarak önceki mock implementation'ları temizle
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockReset();
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.DENIED,
      });
      (Location.requestBackgroundPermissionsAsync as jest.Mock).mockReset();
      (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.DENIED,
      });

      await startGeofencing(41.0082, 28.9784, 400);

      // Permission denied olduğu için startGeofencingAsync çağrılmamalı
      // getBackgroundPermissionsAsync DENIED döndüğü için requestBackgroundPermissionsAsync çağrılmalı
      expect(Location.getBackgroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.startGeofencingAsync).not.toHaveBeenCalled();
    });

    it('should use minimum radius of 150m', async () => {
      // Permission GRANTED olduğundan emin ol (beforeEach'teki default)
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.GRANTED,
      });

      await startGeofencing(41.0082, 28.9784, 100); // 100m radius

      expect(Location.startGeofencingAsync).toHaveBeenCalledWith(
        GEOFENCE_TASK_NAME,
        expect.arrayContaining([
          expect.objectContaining({
            radius: 150, // Minimum 150m
          }),
        ])
      );
    });

    it('should use provided radius if >= 150m', async () => {
      await startGeofencing(41.0082, 28.9784, 400);

      expect(Location.startGeofencingAsync).toHaveBeenCalledWith(
        GEOFENCE_TASK_NAME,
        expect.arrayContaining([
          expect.objectContaining({
            radius: 400,
          }),
        ])
      );
    });

    it('should create geofence region with correct parameters', async () => {
      await startGeofencing(41.0082, 28.9784, 400);

      expect(Location.startGeofencingAsync).toHaveBeenCalledWith(
        GEOFENCE_TASK_NAME,
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'alarm-target-geofence',
            latitude: 41.0082,
            longitude: 28.9784,
            radius: 400,
            notifyOnEnter: true,
            notifyOnExit: false,
          }),
        ])
      );
    });

    it('should handle errors gracefully', async () => {
      (Location.startGeofencingAsync as jest.Mock).mockRejectedValue(
        new Error('Geofencing error')
      );

      const { captureError } = require('../utils/errorReporting');

      await startGeofencing(41.0082, 28.9784, 400);

      expect(captureError).toHaveBeenCalled();
    });
  });

  describe('stopGeofencing', () => {
    it('should return early if Expo Go', async () => {
      (isExpoGo as jest.Mock).mockReturnValue(true);

      await stopGeofencing();

      expect(Location.stopGeofencingAsync).not.toHaveBeenCalled();
    });

    it('should stop geofencing', async () => {
      await stopGeofencing();

      expect(Location.stopGeofencingAsync).toHaveBeenCalledWith(GEOFENCE_TASK_NAME);
    });

    it('should handle errors gracefully', async () => {
      (Location.stopGeofencingAsync as jest.Mock).mockRejectedValue(
        new Error('Stop error')
      );

      const { captureError } = require('../utils/errorReporting');

      await stopGeofencing();

      expect(captureError).toHaveBeenCalled();
    });
  });
});

