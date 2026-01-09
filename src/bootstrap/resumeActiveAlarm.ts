/**
 * Resume Active Alarm (P0)
 * 
 * Uygulama açılışında aktif alarm varsa location tracking'i
 * otomatik olarak yeniden başlatır.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACTIVE_ALARM_STORAGE_KEY, ActiveAlarmStateSnapshot } from '../context/AlarmContext';
import { ensureLocationTrackingForAlarm } from '../services/alarmSurvivalService';
import { diagLog } from '../services/alarmDiagnostics';

/**
 * Aktif alarm varsa location tracking'i yeniden başlat
 */
export async function resumeActiveAlarmIfNeeded(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_ALARM_STORAGE_KEY);
    if (!raw) {
      return;
    }

    let snapshot: ActiveAlarmStateSnapshot;
    try {
      snapshot = JSON.parse(raw);
    } catch (parseError) {
      if (__DEV__) {
        console.warn('[resumeActiveAlarm] Failed to parse snapshot:', parseError);
      }
      return;
    }

    // Sadece ACTIVE durumundaki alarmlar için resume yap
    if (snapshot.status !== 'ACTIVE' || !snapshot.sessionId) {
      return;
    }

    // Location tracking'i yeniden başlat
    await ensureLocationTrackingForAlarm(snapshot.sessionId);

    // Diagnostic log
    try {
      await diagLog(snapshot.sessionId, {
        level: 'info',
        type: 'SESSION_START',
        msg: 'resumeActiveAlarmIfNeeded triggered',
      });
    } catch {
      // Ignore diagnostic errors
    }

    if (__DEV__) {
      console.log('[resumeActiveAlarm] Active alarm resumed:', snapshot.sessionId);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[resumeActiveAlarm] Failed to resume active alarm:', error);
    }
  }
}
