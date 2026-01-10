import { CommonActions } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { HomeStackParamList, RootStackParamList } from './navigationTypes';
import { StartAlarmSessionParams } from '../context/AlarmContext';

/**
 * Navigation service for cross-tab navigation
 * Uses NavigationContainer ref instead of getParent() to avoid crashes
 * Type-safe nested navigation using CommonActions.navigate
 */

export function goToStopsHome(initialTab: 'favorites' | 'history'): void {
  if (!navigationRef.isReady()) {
    if (__DEV__) {
      console.warn('[navigationService] Navigation ref is not ready, cannot navigate to StopsHome');
    }
    return;
  }

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'StopsTab',
          params: {
            screen: 'StopsHome',
            params: { initialTab },
          },
        },
      }),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[navigationService] Error navigating to StopsHome:', error);
    }
  }
}

export function goToAlarmDetails(params: HomeStackParamList['AlarmDetails']): void {
  if (!navigationRef.isReady()) {
    if (__DEV__) {
      console.warn('[navigationService] Navigation ref is not ready, cannot navigate to AlarmDetails');
    }
    return;
  }

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'HomeTab',
          params: {
            screen: 'AlarmDetails',
            params,
          },
        },
      }),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[navigationService] Error navigating to AlarmDetails:', error);
    }
  }
}

export function goToActiveAlarm(alarmSessionId: string): void {
  if (!navigationRef.isReady()) {
    if (__DEV__) {
      console.warn('[navigationService] Navigation ref is not ready, cannot navigate to ActiveAlarm');
    }
    return;
  }

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'HomeTab',
          params: {
            screen: 'ActiveAlarm',
            params: { alarmSessionId },
          },
        },
      }),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[navigationService] Error navigating to ActiveAlarm:', error);
    }
  }
}

export function goToPermissionsHelp(): void {
  if (!navigationRef.isReady()) {
    if (__DEV__) {
      console.warn('[navigationService] Navigation ref is not ready, cannot navigate to PermissionsHelp');
    }
    return;
  }

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'SettingsTab',
          params: {
            screen: 'PermissionsHelp',
          },
        },
      }),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[navigationService] Error navigating to PermissionsHelp:', error);
    }
  }
}

export function goToSamsungBatteryHelp(): void {
  if (!navigationRef.isReady()) {
    if (__DEV__) {
      console.warn('[navigationService] Navigation ref is not ready, cannot navigate to SamsungBattery');
    }
    return;
  }

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'SettingsTab',
          params: {
            screen: 'SamsungBattery',
          },
        },
      }),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[navigationService] Error navigating to SamsungBattery:', error);
    }
  }
}

export function goToAlarmPreflight(startPayload: StartAlarmSessionParams): void {
  if (!navigationRef.isReady()) {
    if (__DEV__) {
      console.warn('[navigationService] Navigation ref is not ready, cannot navigate to AlarmPreflight');
    }
    return;
  }

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'HomeTab',
          params: {
            screen: 'AlarmPreflight',
            params: { startPayload },
          },
        },
      }),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[navigationService] Error navigating to AlarmPreflight:', error);
    }
  }
}
