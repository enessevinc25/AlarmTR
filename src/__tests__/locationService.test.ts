import { getCurrentLocation, startForegroundLocationTracking, stopForegroundLocationTracking } from '../services/locationService';
import * as Location from 'expo-location';
import { isExpoGo } from '../utils/expoEnvironment';

jest.mock('expo-location');
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
jest.mock('../services/alarmBackgroundService', () => ({
  handleBackgroundLocationUpdate: jest.fn(),
}));
jest.mock('../services/alarmBackgroundCore', () => ({
  processBackgroundLocationUpdate: jest.fn(),
}));
jest.mock('../services/alarmBackgroundCore', () => ({
  processBackgroundLocationUpdate: jest.fn(),
}));

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('should return location when permission is granted', async () => {
      const mockLocation = {
        coords: {
          latitude: 41.0082,
          longitude: 28.9784,
          accuracy: 10,
        },
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.GRANTED,
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);

      const result = await getCurrentLocation();

      expect(result).toEqual(mockLocation);
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.Balanced,
      });
    });

    it('should request permission if not granted', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({
          status: Location.PermissionStatus.DENIED,
        })
        .mockResolvedValueOnce({
          status: Location.PermissionStatus.GRANTED,
        });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.GRANTED,
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: 41.0082, longitude: 28.9784 },
      });

      await getCurrentLocation();

      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should return null if permission is denied', async () => {
      // Mock'ları sıfırla
      (Location.getForegroundPermissionsAsync as jest.Mock).mockReset();
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockReset();
      (Location.getCurrentPositionAsync as jest.Mock).mockReset();
      
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.DENIED,
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.DENIED,
      });
      // getCurrentPositionAsync çağrılmamalı (permission denied)
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: 41.0082, longitude: 28.9784 },
      });

      const result = await getCurrentLocation();

      expect(result).toBeNull();
      // Permission denied olduğu için getCurrentPositionAsync çağrılmamalı
      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    });
  });

  describe('startForegroundLocationTracking', () => {
    it('should start location tracking with correct options', async () => {
      const mockSubscription = { remove: jest.fn() };
      const onLocationChange = jest.fn();

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.GRANTED,
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await startForegroundLocationTracking(onLocationChange);

      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        onLocationChange
      );
      expect(result).toBe(mockSubscription);
    });

    it('should throw error if permission is not granted', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.DENIED,
      });

      await expect(startForegroundLocationTracking(jest.fn())).rejects.toThrow('Konum izni verilmedi');
    });
  });

  describe('stopForegroundLocationTracking', () => {
    it('should stop location tracking', async () => {
      const mockSubscription = { remove: jest.fn() };
      const onLocationChange = jest.fn();

      // Start tracking first to set up subscription
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: Location.PermissionStatus.GRANTED,
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValue(mockSubscription);

      await startForegroundLocationTracking(onLocationChange);
      
      // Now stop tracking
      stopForegroundLocationTracking();

      // Subscription should be removed
      expect(mockSubscription.remove).toHaveBeenCalled();
    });
  });
});

