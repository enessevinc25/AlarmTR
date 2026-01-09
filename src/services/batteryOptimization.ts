/**
 * Battery Optimization Service (P0)
 * 
 * Android'de pil optimizasyonu istisnası istemek için intent launcher.
 */

import { Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';

/**
 * Pil optimizasyonu istisnası istemek için sistem ayar ekranını aç
 */
export async function requestIgnoreBatteryOptimizations(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const pkg = Application.applicationId;
  if (!pkg) {
    // Fallback: genel ayarlar
    await Linking.openSettings();
    return;
  }

  try {
    // Android 6.0+ için doğrudan istisna isteme ekranı
    // Intent action string'i direkt kullan
    await IntentLauncher.startActivityAsync(
      'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      {
        data: `package:${pkg}`,
      },
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[batteryOptimization] REQUEST_IGNORE_BATTERY_OPTIMIZATIONS failed:', error);
    }
    
    // Fallback 1: Pil optimizasyonu ayarları ekranı
    try {
      await IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    } catch (fallbackError) {
      if (__DEV__) {
        console.warn('[batteryOptimization] IGNORE_BATTERY_OPTIMIZATION_SETTINGS failed:', fallbackError);
      }
      
      // Fallback 2: Genel ayarlar
      await Linking.openSettings();
    }
  }
}
