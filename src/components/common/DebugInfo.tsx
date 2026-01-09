import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { useNetwork } from '../../context/NetworkContext';
import { useAlarm } from '../../context/AlarmContext';
import { useAuth } from '../../context/AuthContext';
import { isDevEnv, getTransitApiBaseUrl, getGoogleMapsNativeKey } from '../../utils/env';

const DebugInfo = () => {
  // Standalone build'lerde de göster (environment kontrolü için)
  // Sadece production store build'lerde gizle
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT ?? Constants.expoConfig?.extra?.environment ?? 'development';
  const isProductionStore = env === 'production' && !__DEV__;
  
  if (isProductionStore) {
    return null;
  }

  const { isOnline, isConnected, isInternetReachable } = useNetwork();
  const { activeAlarmSession } = useAlarm();
  const { user } = useAuth();

  let transitApiUrl = 'N/A';
  let transitApiError: string | null = null;
  try {
    transitApiUrl = getTransitApiBaseUrl() || 'Not configured';
  } catch (error: any) {
    transitApiUrl = 'Error loading';
    transitApiError = error?.message || 'Unknown error';
  }

  let googleMapsKeyStatus = 'N/A';
  try {
    const key = getGoogleMapsNativeKey();
    googleMapsKeyStatus = key ? `${key.substring(0, 10)}...` : 'Not configured';
  } catch (error) {
    googleMapsKeyStatus = 'Error loading';
  }
  
  // Constants debug bilgisi - Standalone build'lerde de göster (debug için)
  const constantsExtra = Constants.expoConfig?.extra as any;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>[DEBUG]</Text>
      <Text style={styles.text}>Env: {isDevEnv() ? 'DEV' : 'PROD'}</Text>
      <Text style={styles.text}>
        Network: {isOnline ? 'Online' : 'Offline'} (Connected: {String(isConnected)}, Internet: {String(isInternetReachable)})
      </Text>
      <Text style={styles.text} numberOfLines={1}>
        Transit API: {transitApiUrl} (hardcoded)
      </Text>
      {transitApiError && (
        <Text style={[styles.text, { color: '#ff6b6b' }]} numberOfLines={3}>
          API Error: {transitApiError}
        </Text>
      )}
      <Text style={styles.text} numberOfLines={1}>
        Google Maps: {googleMapsKeyStatus}
      </Text>
      {/* Standalone build'lerde de Constants debug bilgisi göster */}
      {constantsExtra && (
        <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
          Extra.transitApiBaseUrl: {constantsExtra.transitApiBaseUrl || 'hardcoded'}
        </Text>
      )}
      <Text style={styles.text}>User: {user?.uid ?? 'Yok'}</Text>
      <Text style={styles.text}>
        Active alarm: {activeAlarmSession ? activeAlarmSession.targetName : 'Yok'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#00000099',
    padding: 6,
  },
  text: {
    color: '#fff',
    fontSize: 10,
  },
});

export default DebugInfo;

