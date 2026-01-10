import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { getCurrentLocation } from '../../services/locationService';
import { createUserTarget } from '../../services/stopsService';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from '../../navigation/navigationTypes';
import { useAlarm } from '../../context/AlarmContext';
import { searchPlaces, getPlaceDetails, PlaceSuggestion } from '../../services/googlePlacesService';
import CachedImage from '../../components/common/CachedImage';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSafeAsync } from '../../hooks/useSafeAsync';
import { captureError } from '../../utils/errorReporting';
import { colors, spacing, borderRadius } from '../../theme/colors';
import { useAppTheme } from '../../theme/useAppTheme';
import { isExpoGo, areNativeModulesAvailable } from '../../utils/expoEnvironment';
import { logEvent } from '../../services/telemetry';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { haversineDistance } from '../../utils/mapClustering';
import { goToAlarmDetails } from '../../navigation/navigationService';
// Asset import - TypeScript doesn't have built-in type for image imports in React Native
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appIcon = require('../../../assets/icon.png');

// MapView Expo Go'da native modül olarak yüklenmeye çalışırken crash olabilir
// Conditional import kullanarak güvenli hale getiriyoruz
let MapView: any = null;
let Marker: any = null;

// Expo Go kontrolü - import'tan önce yapıyoruz
const isExpoGoEnv = (() => {
  try {
    return isExpoGo();
  } catch {
    return true; // Güvenli tarafta kal
  }
})();

const canUseMaps = !isExpoGoEnv && areNativeModulesAvailable();

if (!isExpoGoEnv) {
  try {
    const mapsModule = require('react-native-maps');
    MapView = mapsModule.default;
    Marker = mapsModule.Marker;
  } catch (error) {
    if (__DEV__) {
      console.warn('[HomeMap] react-native-maps yüklenemedi:', error);
    }
  }
}

// Type definitions
type LongPressEvent = {
  nativeEvent: {
    coordinate: { latitude: number; longitude: number };
  };
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type BaseMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  stopId?: string; // Stop marker'ları için stop ID
};

type Cluster = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  markers: BaseMarker[];
};

// Basit kümeleme: belirli mesafe içindeki marker'ları tek cluster'da birleştir
// mapClustering.ts'deki haversineDistance fonksiyonu kullanılıyor
function clusterMarkers(markers: BaseMarker[], maxDistanceMeters = 300): Cluster[] {
  const clusters: Cluster[] = [];

  markers.forEach((marker) => {
    const found = clusters.find(
      (cluster) => haversineDistance(cluster.latitude, cluster.longitude, marker.latitude, marker.longitude) <= maxDistanceMeters,
    );

    if (found) {
      found.markers.push(marker);
      found.count += 1;
      // Yeni ağırlıklı merkez
      found.latitude =
        found.markers.reduce((sum, m) => sum + m.latitude, 0) / found.markers.length;
      found.longitude =
        found.markers.reduce((sum, m) => sum + m.longitude, 0) / found.markers.length;
    } else {
      clusters.push({
        id: marker.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
        count: 1,
        markers: [marker],
      });
    }
  });

  return clusters;
}

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMap'>;

const DEFAULT_REGION: Region = {
  latitude: 41.015137,
  longitude: 28.97953,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const HomeMapScreen = ({ route, navigation }: Props) => {
  // route.params undefined olabilir (HomeLanding'den gelirken params yok), güvenli şekilde handle et
  const { mode, stop, place } = route.params ?? {};
  const { user } = useAuth();
  const { activeAlarmSession } = useAlarm();
  const mapRef = useRef<any>(null);
  const mapMountTimeRef = useRef<number | null>(null);
  const regionChangeThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapReadyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapReadyLoggedRef = useRef<boolean>(false);
  
  // Map mount logging
  useEffect(() => {
    if (!isExpoGoEnv && canUseMaps && MapView) {
      mapMountTimeRef.current = Date.now();
      mapReadyLoggedRef.current = false;
      const extra = (Constants.expoConfig?.extra as any) ?? {};
      logEvent('MAP_MOUNT', {
        provider: 'google',
        platform: Platform.OS,
        hasAndroidKey: extra.hasGoogleMapsAndroidKey ?? false,
        hasIOSKey: extra.hasGoogleMapsIOSKey ?? false,
        hasWebKey: extra.hasGoogleWebKey ?? false,
      });
      
      // Timeout check: if MAP_READY doesn't come within 8 seconds, log error
      mapReadyTimeoutRef.current = setTimeout(() => {
        if (!mapReadyLoggedRef.current) {
          logEvent('MAP_ERROR', { reason: 'timeout_no_ready' }, 'warn');
        }
      }, 8000) as ReturnType<typeof setTimeout>;
    }
    
    return () => {
      if (mapReadyTimeoutRef.current) {
        clearTimeout(mapReadyTimeoutRef.current);
        mapReadyTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Google Maps API key kontrolü (debug için)
  useEffect(() => {
    if (__DEV__) {
      // Runtime'da Constants.expoConfig üzerinden erişilmeli (app.config.ts build-time'da çalışır)
      const config = Constants.expoConfig;
      const androidKey = config?.android?.config?.googleMaps?.apiKey || 'NOT SET';
      const iosKey = config?.ios?.config?.googleMapsApiKey || 'NOT SET';
      const extra = (config?.extra as any) ?? {};
      
      // Environment detection
      const executionEnv = Constants.executionEnvironment;
      const isExpoGoCheck = isExpoGoEnv;
      const nativeModulesAvailable = areNativeModulesAvailable();
      
      console.log('[HomeMap] Google Maps API Keys:', {
        android: androidKey === 'NOT SET' ? 'NOT SET' : androidKey.substring(0, 20) + '...',
        ios: iosKey === 'NOT SET' ? 'NOT SET' : iosKey.substring(0, 20) + '...',
        canUseMaps,
        MapViewAvailable: !!MapView,
        hasAndroidKeyFromExtra: !!extra.hasGoogleMapsAndroidKey,
        hasIOSKeyFromExtra: !!extra.hasGoogleMapsIOSKey,
        hasWebKeyFromExtra: !!extra.hasGoogleWebKey,
        // Debug info
        executionEnvironment: executionEnv,
        isExpoGoEnv: isExpoGoCheck,
        nativeModulesAvailable: nativeModulesAvailable,
        // Env vars check
        envAndroidKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ? 'SET' : 'NOT SET',
        envIOSKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ? 'SET' : 'NOT SET',
        envWebKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      });
    }
  }, []);
  
  // STOP_PREVIEW ve PLACE_PREVIEW mode için initial region'ı ayarla
  const initialRegion = useMemo<Region>(() => {
    if (mode === 'STOP_PREVIEW' && stop) {
      return {
        latitude: stop.latitude,
        longitude: stop.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    if (mode === 'PLACE_PREVIEW' && place) {
      return {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return DEFAULT_REGION;
  }, [mode, stop, place]);
  
  const [region, setRegion] = useState<Region>(initialRegion);
  const [longPressMarker, setLongPressMarker] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Google Places search state'leri
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<PlaceSuggestion[]>([]);
  const [isPlaceLoading, setIsPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [selectedPlaceMarker, setSelectedPlaceMarker] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);

  // STOP_PREVIEW ve PLACE_PREVIEW mode için initial region'ı güncelle (eğer route params değişirse)
  useEffect(() => {
    if (mode === 'STOP_PREVIEW' && stop) {
      const newRegion: Region = {
        latitude: stop.latitude,
        longitude: stop.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
    } else if (mode === 'PLACE_PREVIEW' && place) {
      const newRegion: Region = {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
    }
  }, [mode, stop, place]);

  // Kullanıcı konumu yükle (sadece STOP_PREVIEW ve PLACE_PREVIEW değilse)
  useEffect(() => {
    if (mode === 'STOP_PREVIEW' || mode === 'PLACE_PREVIEW') {
      return; // Preview mode'larda kullanıcı konumunu yükleme
    }
    
    const loadLocation = async () => {
      try {
      const location = await getCurrentLocation();
      if (location) {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserCoords(coords);
        setRegion((prev) => ({
          ...prev,
          ...coords,
        }));
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[HomeMap] Konum alınamadı:', error);
        }
        captureError(error, 'HomeMap/loadLocation');
        // Konum alınamazsa varsayılan bölgede kal (Istanbul)
      }
    };
    loadLocation();
  }, [mode]);

  // Google Places search - debounced
  const debouncedPlaceQuery = useDebouncedValue(placeQuery.trim(), 600); // Debounce 600ms'e çıkarıldı (rate-limit sorununu azaltmak için)
  
  useSafeAsync(
    async (isMounted) => {
      const trimmed = debouncedPlaceQuery.trim();
      // Min 2 karakter kontrolü (rate-limit sorununu azaltmak için)
      if (!trimmed || trimmed.length < 2) {
        setPlaceResults([]);
        setPlaceError(null);
        return;
      }

      setIsPlaceLoading(true);
      setPlaceError(null);
      try {
        const results = await searchPlaces(trimmed);
        if (!isMounted()) {
          return;
        }
        setPlaceResults(results);
        setPlaceError(null);
      } catch (error: any) {
        if (!isMounted()) {
          return;
        }
        if (__DEV__) {
          console.warn('[HomeMap] Places search error', error);
        }
        captureError(error, 'HomeMap/placesSearch');
        setPlaceResults([]);
        // Kullanıcı dostu hata mesajı göster
        let errorMessage = error?.message || 'Yer araması yapılırken bir hata oluştu.';
        // 404 hatası için özel mesaj
        if (errorMessage.includes('404') || errorMessage.includes('bulunamadı')) {
          errorMessage = 'Yer arama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
        }
        setPlaceError(errorMessage);
      } finally {
        if (isMounted()) {
          setIsPlaceLoading(false);
        }
      }
    },
    [debouncedPlaceQuery],
  );

  const baseMarkers = useMemo<BaseMarker[]>(() => {
    const markers: BaseMarker[] = [];
    if (mode === 'STOP_PREVIEW' && stop) {
      markers.push({
        id: `stop-${stop.id ?? 'stop'}`,
        latitude: stop.latitude,
        longitude: stop.longitude,
        title: stop.name,
        stopId: stop.id, // Stop ID'yi marker'a ekle
      });
    }
    if (mode === 'PLACE_PREVIEW' && place) {
      markers.push({
        id: 'place-preview',
        latitude: place.latitude,
        longitude: place.longitude,
        title: place.name,
      });
    }
    if (selectedPlaceMarker) {
      markers.push({
        id: 'selected-place',
        latitude: selectedPlaceMarker.latitude,
        longitude: selectedPlaceMarker.longitude,
        title: selectedPlaceMarker.name,
      });
    }
    if (longPressMarker) {
      markers.push({
        id: 'custom-target',
        latitude: longPressMarker.latitude,
        longitude: longPressMarker.longitude,
        title: 'Özel hedef',
      });
    }
    return markers;
  }, [longPressMarker, mode, selectedPlaceMarker, stop, place]);

  const clusteredMarkers = useMemo<Cluster[]>(() => {
    const clusters = clusterMarkers(baseMarkers, 350);
    // Log markers render
    if (!isExpoGoEnv && canUseMaps && MapView) {
      logEvent('MAP_MARKERS_RENDER', { count: clusters.length });
    }
    return clusters;
  }, [baseMarkers]);

  const handleLongPress = async (event: LongPressEvent) => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Özel hedef oluşturmak için önce giriş yapmalısın.');
      return;
    }
    try {
      const { coordinate } = event.nativeEvent;
      setLongPressMarker(coordinate);
      // Alarm kurma butonu gösterilecek, burada sadece marker'ı ayarla
    } catch (error) {
      if (__DEV__) {
        console.warn(error);
      }
      captureError(error, 'HomeMap/handleLongPress');
      Alert.alert('Hata', 'Hedef oluşturulurken bir hata oluştu, lütfen tekrar deneyin.');
    }
  };

  const handleCreateAlarmFromMarker = async () => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Alarm kurmak için önce giriş yapmalısın.');
      return;
    }

    // Önce longPressMarker'ı kontrol et, sonra selectedPlaceMarker'ı
    const marker = longPressMarker || (selectedPlaceMarker ? {
      latitude: selectedPlaceMarker.latitude,
      longitude: selectedPlaceMarker.longitude,
    } : null);

    if (!marker) {
      return;
    }

    try {
      const target = await createUserTarget(user.uid, {
        name: selectedPlaceMarker?.name || 'Özel hedef',
        lat: marker.latitude,
        lon: marker.longitude,
        radiusMeters: 400,
      });
      
      // Marker'ları temizle
      setLongPressMarker(null);
      setSelectedPlaceMarker(null);
      
      navigation.navigate('AlarmDetails', {
        targetType: 'CUSTOM',
        targetId: target.id,
        defaultDistanceMeters: target.radiusMeters,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn(error);
      }
      captureError(error, 'HomeMap/handleCreateAlarmFromMarker');
      Alert.alert('Hata', 'Alarm kurulurken bir hata oluştu, lütfen tekrar deneyin.');
    }
  };

  const handleCenterOnUser = async () => {
    // STOP_PREVIEW ve PLACE_PREVIEW mode'da kullanıcı konumuna gitme, preview target'a git
    if (mode === 'STOP_PREVIEW' && stop) {
      const newRegion: Region = {
        latitude: stop.latitude,
        longitude: stop.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(newRegion, 500);
      setRegion(newRegion);
      return;
    }
    if (mode === 'PLACE_PREVIEW' && place) {
      const newRegion: Region = {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(newRegion, 500);
      setRegion(newRegion);
      return;
    }

    try {
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Konum alınamadı', 'Lütfen konum izinlerinin açık olduğundan emin ol.');
        return;
      }
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserCoords(coords);
      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500,
      );
    } catch (error) {
      if (__DEV__) {
        console.warn('Konum merkezlenemedi', error);
      }
      captureError(error, 'HomeMap/handleCenterOnUser');
      Alert.alert('Hata', 'Konumuna giderken bir sorun oluştu.');
    }
  };

  const handleGoToActiveAlarm = () => {
    if (!activeAlarmSession) {
      return;
    }
    navigation.navigate('ActiveAlarm', { alarmSessionId: activeAlarmSession.id });
  };

  // Google Places suggestion seçildiğinde
  const handlePlaceSelect = useCallback(async (suggestion: PlaceSuggestion) => {
    try {
      setPlaceError(null);
      const details = await getPlaceDetails(suggestion.placeId);
      if (!details) {
        setPlaceError('Yer detayları alınamadı. Lütfen tekrar deneyin.');
        return;
      }

      // Haritayı seçilen yere taşı
      const newRegion: Region = {
        latitude: details.latitude,
        longitude: details.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      mapRef.current?.animateToRegion(newRegion, 500);
      setRegion(newRegion);
      
      // Marker ekle
      setSelectedPlaceMarker({
        latitude: details.latitude,
        longitude: details.longitude,
        name: details.name,
      });
      
      // Search'i temizle
      setPlaceQuery('');
      setPlaceResults([]);
      setPlaceError(null);
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[HomeMap] Place details error', error);
      }
      captureError(error, 'HomeMap/handlePlaceSelect');
      const errorMessage = error?.message || 'Yer detayları alınırken bir sorun oluştu.';
      setPlaceError(errorMessage);
      Alert.alert('Hata', errorMessage);
    }
  }, []);

  const renderPlaceSuggestion = useCallback(
    ({ item }: { item: PlaceSuggestion }) => {
      return (
        <TouchableOpacity
          style={styles.searchResultRow}
          onPress={() => handlePlaceSelect(item)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Yer seç: ${item.description}`}
          accessibilityHint="Bu yeri haritada göstermek için dokunun"
        >
          <Text style={styles.searchResultTitle}>{item.description}</Text>
        </TouchableOpacity>
      );
    },
    [handlePlaceSelect],
  );

  // isExpoGoEnv zaten yukarıda tanımlandı

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <View style={styles.mapWrapper}>
        {isExpoGoEnv ? (
          // Expo Go'da MapView yerine fallback UI
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.border,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
              Harita Görünümü
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textMuted,
                textAlign: 'center',
                marginBottom: spacing.lg,
                lineHeight: 20,
              }}
            >
              Harita görünümü Expo Go'da tam desteklenmiyor.{'\n'}
              Lütfen development build veya APK kullanın.
            </Text>
            <PrimaryButton
              title="Durak / Hat Listesinden Seç"
              onPress={() => navigation.navigate('StopSearch', { initialTab: 'stops' })}
            />
          </View>
        ) : MapView && canUseMaps ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            region={region}
            onRegionChangeComplete={(newRegion: Region) => {
              setRegion(newRegion);
              // Throttle region change logging (2s)
              if (regionChangeThrottleRef.current) {
                clearTimeout(regionChangeThrottleRef.current);
                regionChangeThrottleRef.current = null;
              }
              regionChangeThrottleRef.current = setTimeout(() => {
                logEvent('MAP_REGION_CHANGE', {
                  zoomApprox: Math.round(1 / newRegion.latitudeDelta),
                  moved: true,
                });
                regionChangeThrottleRef.current = null;
              }, 2000) as ReturnType<typeof setTimeout>;
            }}
            showsUserLocation
            onLongPress={handleLongPress}
            mapType="standard"
            loadingEnabled
            onError={(error: any) => {
              if (__DEV__) {
                console.error('[HomeMap] MapView error:', error);
                console.error('[HomeMap] MapView error details:', JSON.stringify(error, null, 2));
              }
              captureError(error, 'HomeMap/MapView');
              logEvent('MAP_ERROR', {
                messageShort: error?.message?.substring(0, 100) || 'Unknown error',
              }, 'error');
            }}
            onMapReady={() => {
              if (__DEV__) {
                console.log('[HomeMap] MapView ready');
              }
              // Clear timeout since MAP_READY arrived
              if (mapReadyTimeoutRef.current) {
                clearTimeout(mapReadyTimeoutRef.current);
                mapReadyTimeoutRef.current = null;
              }
              mapReadyLoggedRef.current = true;
              const msFromMount = mapMountTimeRef.current
                ? Date.now() - mapMountTimeRef.current
                : undefined;
              logEvent('MAP_READY', { msFromMount });
            }}
          >
            {/* Kümeleme uygulanmış marker'lar */}
            {clusteredMarkers.map((cluster) => {
              if (cluster.count > 1) {
                return (
                  <Marker
                    key={`cluster-${cluster.id}`}
                    coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                    onPress={() => {
                      // Cluster'a tıklandığında zoom yap
                      const newRegion: Region = {
                        latitude: cluster.latitude,
                        longitude: cluster.longitude,
                        latitudeDelta: Math.max(region.latitudeDelta * 0.5, 0.005),
                        longitudeDelta: Math.max(region.longitudeDelta * 0.5, 0.005),
                      };
                      mapRef.current?.animateToRegion(newRegion, 500);
                      setRegion(newRegion);
                    }}
                  >
                    <View style={styles.clusterContainer}>
                      <Text style={styles.clusterText}>{cluster.count}</Text>
                    </View>
                  </Marker>
                );
              }
              const marker = cluster.markers[0];
              // Handle marker press - if it's a stop preview, navigate to AlarmDetails
              const handleMarkerPress = () => {
                try {
                  // Marker'dan stop ID'yi al (mode undefined olsa bile çalışır)
                  const markerStopId = marker.stopId;
                  
                  if (markerStopId) {
                    // Stop marker'ına tıklandı
                    // Log stop pick from map
                    logEvent('STOP_PICK_FROM_MAP', {
                      stopIdHash: (() => {
                        let hash = 2166136261;
                        for (let i = 0; i < markerStopId.length; i++) {
                          hash ^= markerStopId.charCodeAt(i);
                          hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
                        }
                        return (hash >>> 0).toString(16).padStart(8, '0');
                      })(),
                    });
                    
                    // Navigate to AlarmDetails
                    goToAlarmDetails({
                      targetType: 'STOP',
                      targetId: markerStopId,
                    });
                    return;
                  }
                  
                  // Mode-based handling (legacy support)
                  if (mode === 'STOP_PREVIEW' && stop && stop.id) {
                    // Log stop pick from map
                    logEvent('STOP_PICK_FROM_MAP', {
                      stopIdHash: (() => {
                        let hash = 2166136261;
                        for (let i = 0; i < stop.id.length; i++) {
                          hash ^= stop.id.charCodeAt(i);
                          hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
                        }
                        return (hash >>> 0).toString(16).padStart(8, '0');
                      })(),
                    });
                    
                    // Navigate to AlarmDetails
                    goToAlarmDetails({
                      targetType: 'STOP',
                      targetId: stop.id,
                    });
                  } else if (mode === 'STOP_PREVIEW' && stop && !stop.id) {
                    // Stop ID yoksa hata logla ve kullanıcıya bilgi ver
                    if (__DEV__) {
                      console.warn('[HomeMap] Stop ID missing, cannot navigate to AlarmDetails');
                    }
                    captureError(new Error('Stop ID is missing'), 'HomeMap/handleMarkerPress/missingStopId');
                    Alert.alert('Hata', 'Durak bilgisi eksik. Lütfen tekrar deneyin.');
                  } else if (mode === 'PLACE_PREVIEW' && place) {
                    // For place preview, show alert or navigate
                    Alert.alert(
                      'Özel Hedef',
                      'Bu konumdan alarm kurmak ister misiniz?',
                      [
                        { text: 'İptal', style: 'cancel' },
                        {
                          text: 'Alarm Kur',
                          onPress: async () => {
                            if (!user) {
                              Alert.alert('Giriş gerekli', 'Alarm kurmak için önce giriş yapmalısın.');
                              return;
                            }
                            try {
                              const target = await createUserTarget(user.uid, {
                                name: place.name,
                                lat: place.latitude,
                                lon: place.longitude,
                                radiusMeters: 400,
                              });
                              goToAlarmDetails({
                                targetType: 'CUSTOM',
                                targetId: target.id,
                                defaultDistanceMeters: target.radiusMeters,
                              });
                            } catch (error) {
                              captureError(error, 'HomeMap/markerPress/createTarget');
                              Alert.alert('Hata', 'Alarm kurulurken bir hata oluştu.');
                            }
                          },
                        },
                      ],
                    );
                  }
                } catch (error) {
                  captureError(error, 'HomeMap/handleMarkerPress');
                }
              };
              
              return (
                <Marker
                  key={marker.id}
                  coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                  title={marker.title}
                  onPress={handleMarkerPress}
                />
              );
            })}
          </MapView>
        ) : (
          // MapView yüklenemedi, fallback UI
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.border,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
              Harita Görünümü
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textMuted,
                textAlign: 'center',
                marginBottom: spacing.lg,
                lineHeight: 20,
              }}
            >
              Harita görünümü şu anda kullanılamıyor.{'\n'}
              Lütfen development build veya APK kullanın.
            </Text>
            <PrimaryButton
              title="Durak / Hat Listesinden Seç"
              onPress={() => navigation.navigate('StopSearch', { initialTab: 'stops' })}
            />
          </View>
        )}
        {/* Search Overlay - Google Places Search */}
        <View style={styles.searchOverlay}>
          <View style={styles.brandRow}>
            <CachedImage source={appIcon} style={styles.brandIcon} accessibilityLabel="LastStop Alarm TR" />
            <Text style={styles.brandTitle}>Haritada ara</Text>
          </View>
          {/* Search Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              marginBottom: spacing.sm,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: spacing.sm }}>🔍</Text>
            <TextInput
              value={placeQuery}
              onChangeText={setPlaceQuery}
              placeholder="Arama Yapabilirsiniz..."
              placeholderTextColor={colors.textLight}
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.text,
              }}
            />
            {placeQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setPlaceQuery('');
                  setPlaceResults([]);
                  setPlaceError(null);
                }}
                style={{ marginLeft: spacing.sm }}
              >
                <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Error State */}
          {placeError && !isPlaceLoading ? (
            <View
              style={{
                marginTop: spacing.sm,
                padding: spacing.md,
                backgroundColor: colors.dangerSoft,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.danger,
              }}
            >
              <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '500' }}>⚠️ {placeError}</Text>
            </View>
          ) : null}

          {/* Loading State */}
          {isPlaceLoading ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.sm,
                padding: spacing.sm,
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Yerler aranıyor...</Text>
            </View>
          ) : null}

          {/* Place Suggestions */}
          {placeResults.length > 0 && !isPlaceLoading && !placeError ? (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={placeResults}
              keyExtractor={(item) => item.placeId}
              renderItem={renderPlaceSuggestion}
              style={styles.searchResultsList}
            />
          ) : debouncedPlaceQuery.trim().length >= 2 && !isPlaceLoading && !placeError && placeResults.length === 0 ? (
            <View style={{ padding: spacing.md, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔍</Text>
              <Text style={styles.noResultsText}>Yer bulunamadı.</Text>
            </View>
          ) : null}
        </View>
      </View>


      {activeAlarmSession ? (
        <View style={styles.activeAlarmBar}>
          <Text style={styles.activeAlarmText}>
            {activeAlarmSession.targetName} için alarm aktif
          </Text>
          <TouchableOpacity onPress={handleGoToActiveAlarm}>
            <Text style={styles.activeAlarmLink}>Görüntüle</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* STOP_PREVIEW ve PLACE_PREVIEW mode için alarm kurma butonu */}
      {((mode === 'STOP_PREVIEW' && stop) || (mode === 'PLACE_PREVIEW' && place)) && !activeAlarmSession ? (
        <View style={{ paddingHorizontal: spacing.xs, marginBottom: spacing.md }}>
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, color: colors.text }}>
              {mode === 'STOP_PREVIEW' && stop ? `🚌 ${stop.name}` : mode === 'PLACE_PREVIEW' && place ? `📍 ${place.name}` : 'Hedef seçildi'}
            </Text>
            <PrimaryButton
              title="Alarm Kur"
              onPress={async () => {
                if (!user) {
                  Alert.alert('Giriş gerekli', 'Alarm kurmak için önce giriş yapmalısın.');
                  return;
                }
                try {
                  if (mode === 'STOP_PREVIEW' && stop) {
                    // STOP_PREVIEW: Direkt AlarmDetails'e git (targetId stop.id)
                    navigation.navigate('AlarmDetails', {
                      targetType: 'STOP',
                      targetId: stop.id,
                    });
                  } else if (mode === 'PLACE_PREVIEW' && place) {
                    // PLACE_PREVIEW: Önce UserTarget oluştur, sonra AlarmDetails'e git
                    const target = await createUserTarget(user.uid, {
                      name: place.name,
                      lat: place.latitude,
                      lon: place.longitude,
                      radiusMeters: 400,
                    });
                    navigation.navigate('AlarmDetails', {
                      targetType: 'CUSTOM',
                      targetId: target.id,
                      defaultDistanceMeters: target.radiusMeters,
                    });
                  }
                } catch (error) {
                  if (__DEV__) {
                    console.warn('[HomeMap] Alarm kurma hatası', error);
                  }
                  captureError(error, 'HomeMap/handleCreateAlarmFromPreview');
                  Alert.alert('Hata', 'Alarm kurulurken bir hata oluştu, lütfen tekrar deneyin.');
                }
              }}
              style={{ marginBottom: spacing.sm }}
            />
          </View>
        </View>
      ) : null}

      {/* Pinleme sonrası alarm kurma butonu */}
      {(longPressMarker || selectedPlaceMarker) && !activeAlarmSession ? (
        <View style={{ paddingHorizontal: spacing.xs, marginBottom: spacing.md }}>
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, color: colors.text }}>
              {selectedPlaceMarker ? `📍 ${selectedPlaceMarker.name}` : '📍 Özel hedef seçildi'}
            </Text>
            <PrimaryButton
              title="Alarm Kur"
              onPress={handleCreateAlarmFromMarker}
              style={{ marginBottom: spacing.sm }}
            />
            <TouchableOpacity
              onPress={() => {
                setLongPressMarker(null);
                setSelectedPlaceMarker(null);
              }}
              style={{
                paddingVertical: spacing.sm,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: spacing.xs }}>
        <Text
          style={{
            textAlign: 'center',
            color: colors.textMuted,
            marginBottom: spacing.sm,
            fontSize: 13,
          }}
        >
          1) Haritaya uzun basarak özel bir hedef seçebilirsin.
          {'\n'}
          2) Ya da aşağıdaki butonla durak/hat listesinden seçim yapabilirsin.
        </Text>
        <PrimaryButton
          title="Durak / Hat Listesinden Seç"
          onPress={() => navigation.navigate('StopSearch', { initialTab: 'stops' })}
        />
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={handleCenterOnUser} style={styles.fabButton} activeOpacity={0.8}>
          <Text style={{ fontSize: 20 }}>📍</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clusterContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
  clusterText: {
    color: colors.white,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  activeAlarmBar: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  activeAlarmText: {
    color: colors.primarySoft,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.md,
    fontSize: 14,
  },
  activeAlarmLink: {
    color: colors.white,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  searchOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.overlay,
    borderRadius: 16,
    padding: 12,
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
  },
  catalogNoticeText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.primary,
  },
  noResultsText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  searchResultsList: {
    maxHeight: 220,
    marginTop: 8,
  },
  searchResultRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  searchResultMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  quickListsContainer: {
    marginTop: 12,
    gap: 12,
  },
  quickListSection: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 12,
  },
  quickListTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  quickListItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  quickListItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  quickListItemMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  stopSheet: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.sm,
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stopSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stopSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  stopSheetFavorite: {
    fontSize: 28,
    color: colors.warning,
  },
  stopSheetMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  stopSheetLines: {
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.sm,
  },
  stopSheetActions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  stopSheetButtonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stopSheetButtonPrimaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  stopSheetButtonSecondary: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  stopSheetButtonSecondaryText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HomeMapScreen;

