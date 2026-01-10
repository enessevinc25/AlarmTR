import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { TransitLine, TransitStop } from '../../types/models';
import { HomeStackParamList } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import { toggleUserSavedStop, subscribeUserSavedStops } from '../../services/savedStopsService';
import { useNetwork } from '../../context/NetworkContext';
import { searchStops, fetchAllLines, fetchLineStops } from '../../services/transitProvider';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSafeAsync } from '../../hooks/useSafeAsync';
import { captureError } from '../../utils/errorReporting';
import { spacing, borderRadius } from '../../theme/colors';
import { useAppTheme } from '../../theme/useAppTheme';
import { logEvent } from '../../services/telemetry';
import { useRef } from 'react';
import { getCachedSearch, setCachedSearch, hashQuery } from '../../services/searchCache';

type Props = NativeStackScreenProps<HomeStackParamList, 'StopSearch'>;
type Tabs = 'stops' | 'lines';

type LineStopWithData = {
  stop: TransitStop;
  order: number;
  direction?: string;
};

const StopSearchScreen = ({ navigation, route }: Props) => {
  const initialTab = route.params?.initialTab ?? 'stops';
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState<Tabs>(initialTab as Tabs);
  
  // Tab değiştiğinde query'yi temizle
  useEffect(() => {
    if (activeTab === 'lines') {
      setQuery('');
      setStopSearchResults([]);
      setStopSearchError(null);
    }
  }, [activeTab]);
  // Stops tab için API arama sonuçları
  const [stopSearchResults, setStopSearchResults] = useState<TransitStop[]>([]);
  const [stopSearchLoading, setStopSearchLoading] = useState(false);
  const [stopSearchError, setStopSearchError] = useState<string | null>(null);
  // Lines tab için hat listesi
  const [lines, setLines] = useState<TransitLine[]>([]);
  const [lineStopsMap, setLineStopsMap] = useState<Record<string, LineStopWithData[]>>({});
  const [lineStopsLoadingId, setLineStopsLoadingId] = useState<string | null>(null);
  const [loadingLines, setLoadingLines] = useState(true);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Favori duraklar için Set (hızlı lookup için)
  const [savedStopIds, setSavedStopIds] = useState<Set<string>>(new Set());
  const inputDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Screen open logging
  useEffect(() => {
    logEvent('STOP_SEARCH_OPEN', { initialTab: activeTab });
  }, []);

  // Debounced arama: kullanıcı yazmayı bıraktıktan 300ms sonra API araması yapılır (performance için)
  const debouncedQuery = useDebouncedValue(query.trim().toLocaleLowerCase('tr-TR'), 300);

  // Input change logging (debounced 400ms)
  useEffect(() => {
    if (activeTab !== 'stops') {
      return;
    }
    if (inputDebounceTimerRef.current) {
      clearTimeout(inputDebounceTimerRef.current);
      inputDebounceTimerRef.current = null;
    }
    if (query.trim().length > 0) {
      inputDebounceTimerRef.current = setTimeout(() => {
        logEvent('STOP_SEARCH_INPUT', {
          queryLen: query.trim().length,
        });
        inputDebounceTimerRef.current = null;
      }, 400) as ReturnType<typeof setTimeout>;
    }
    return () => {
      if (inputDebounceTimerRef.current) {
        clearTimeout(inputDebounceTimerRef.current);
        inputDebounceTimerRef.current = null;
      }
    };
  }, [query, activeTab]);

  // Favori durakları subscribe et
  useEffect(() => {
    if (!user) {
      setSavedStopIds(new Set());
      return;
    }
    let mounted = true;
    let unsubscribeFn: (() => void) | null = null;
    
    try {
      unsubscribeFn = subscribeUserSavedStops(user.uid, (stops) => {
        if (!mounted) return;
        try {
          // stopId'leri Set'e çevir
          const stopIds = new Set(stops.map((stop) => stop.stopId).filter(Boolean));
          setSavedStopIds(stopIds);
        } catch (error) {
          if (__DEV__) {
            console.warn('[StopSearchScreen] Favori duraklar subscribe hatası', error);
          }
          captureError(error, 'StopSearchScreen/subscribeSavedStops');
        }
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[StopSearchScreen] Subscribe başlatma hatası', error);
      }
      captureError(error, 'StopSearchScreen/subscribeInit');
    }
    
    return () => {
      mounted = false;
      if (unsubscribeFn && typeof unsubscribeFn === 'function') {
        try {
          unsubscribeFn();
        } catch (cleanupError) {
          if (__DEV__) {
            console.warn('[StopSearchScreen] Favori cleanup hatası', cleanupError);
          }
        }
      }
    };
  }, [user]);

  // Stops tab için API araması - debouncedQuery değiştiğinde tetiklenir
  useSafeAsync(
    async (isMounted) => {
      if (activeTab !== 'stops') {
        return;
      }

      // debouncedQuery üzerinden min length kontrolü
      if (debouncedQuery.length < 2) {
        setStopSearchResults([]);
        setStopSearchError(null);
        return;
      }

      // Network kontrolü
      if (!isOnline) {
        setStopSearchError('Çevrimdışı görünüyorsun. Durak aramak için internet bağlantısı gerekiyor.');
        setStopSearchResults([]);
        setStopSearchLoading(false);
        return;
      }

      setStopSearchLoading(true);
      setStopSearchError(null);

      // Check cache first
      const queryHash = hashQuery(debouncedQuery);
      const cachedResults = await getCachedSearch<TransitStop[]>('stops', queryHash);
      
      if (cachedResults) {
        // Cache hit
        if (!isMounted()) {
          return;
        }
        setStopSearchResults(cachedResults);
        setStopSearchError(null);
        setStopSearchLoading(false);
        
        // Log cache hit
        logEvent('STOP_SEARCH_RESULTS', {
          count: cachedResults.length,
          source: 'cache',
          cacheHit: true,
        });
        return;
      }

      // Cache miss - network request
      // Log submit
      logEvent('STOP_SEARCH_SUBMIT', {
        queryLen: debouncedQuery.length,
      });

      try {
        const startTime = Date.now();
        const results = await searchStops(debouncedQuery, { limit: 25 });
        const durationMs = Date.now() - startTime;
        
        if (!isMounted()) {
          return;
        }
        setStopSearchResults(results);
        setStopSearchError(null);
        
        // Cache the results
        await setCachedSearch('stops', queryHash, results);
        
        // Log results
        logEvent('STOP_SEARCH_RESULTS', {
          count: results.length,
          source: 'network',
          durationMs,
          cacheHit: false,
        });
      } catch (error: any) {
        if (!isMounted()) {
          return;
        }
        
        if (__DEV__) {
          console.warn('[StopSearch] Durak araması başarısız', error);
        }
        captureError(error, 'StopSearch/searchStops');
        
        // Kullanıcı dostu hata mesajları
        let errorMessage = 'Durak araması yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
        
        if (error.name === 'TransitApiNetworkError' || error.message?.includes('network') || error.message?.includes('bağlanılamadı')) {
          errorMessage = 'İnternet bağlantısı yok veya backend\'e erişilemiyor. Lütfen bağlantıyı kontrol edip backend\'in çalıştığından emin olun.';
        } else if (error.name === 'TransitApiTimeoutError') {
          errorMessage = 'Arama zaman aşımına uğradı. Lütfen tekrar deneyin.';
        } else if (error.name === 'TransitApiConfigError' || error.message?.includes('base URL') || error.message?.includes('yapılandırılmamış')) {
          errorMessage = 'Transit API yapılandırması eksik. Lütfen uygulamayı güncelleyin.';
        } else if (error.status === 404) {
          errorMessage = 'Durak bulunamadı. Lütfen farklı bir arama terimi deneyin.';
        } else if (error.status >= 500) {
          errorMessage = 'Backend sunucusunda bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        }
        
        setStopSearchError(errorMessage);
        setStopSearchResults([]);
        
        // Log error
        logEvent('STOP_SEARCH_ERROR', {
          code: error?.status || error?.name || 'UNKNOWN',
          messageShort: errorMessage.substring(0, 100),
        }, 'error');
      } finally {
        if (isMounted()) {
          setStopSearchLoading(false);
        }
      }
    },
    [debouncedQuery, activeTab, isOnline],
  );


  // Lines tab için hat listesi - ilk açılışta yüklenir
  const [linesError, setLinesError] = useState<string | null>(null);
  
  useSafeAsync(
    async (isMounted) => {
      if (activeTab !== 'lines') {
        return;
      }
      
      setLoadingLines(true);
      setLinesError(null);
      
      // Network kontrolü
      if (!isOnline) {
        setLinesError('Çevrimdışı görünüyorsun. Hat listesi için internet bağlantısı gerekiyor.');
        setLoadingLines(false);
        return;
      }
      
      // Check cache first (lines search uses empty query hash for "all lines")
      const queryHash = hashQuery(''); // Empty query for "all lines"
      const cachedLines = await getCachedSearch<TransitLine[]>('lines', queryHash);
      
      if (cachedLines) {
        // Cache hit
        if (!isMounted()) {
          return;
        }
        setLines(cachedLines);
        setLinesError(null);
        setLoadingLines(false);
        
        // Log cache hit
        logEvent('LINE_SEARCH_RESULTS', {
          count: cachedLines.length,
          source: 'cache',
          cacheHit: true,
        });
        return;
      }
      
      try {
        const startTime = Date.now();
        const data = await fetchAllLines();
        const durationMs = Date.now() - startTime;
        
        if (!isMounted()) {
          return;
        }
        setLines(data);
        setLinesError(null);
        
        // Cache the results
        await setCachedSearch('lines', queryHash, data);
        
        // Log line search results
        logEvent('LINE_SEARCH_RESULTS', {
          count: data.length,
          source: 'network',
          durationMs,
          cacheHit: false,
        });
      } catch (error: any) {
        if (!isMounted()) {
          return;
        }
        
        if (__DEV__) {
          console.warn('[StopSearch] Hat listesi yüklenemedi', error);
        }
        captureError(error, 'StopSearch/loadLines');
        
        // Kullanıcı dostu hata mesajları
        let errorMessage = 'Hat listesi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
        
        if (error.name === 'TransitApiNetworkError' || error.message?.includes('network') || error.message?.includes('bağlanılamadı')) {
          errorMessage = 'İnternet bağlantısı yok veya backend\'e erişilemiyor. Lütfen bağlantıyı kontrol edip backend\'in çalıştığından emin olun.';
        } else if (error.name === 'TransitApiTimeoutError') {
          errorMessage = 'Hat listesi yüklenirken zaman aşımı oluştu. Lütfen tekrar deneyin.';
        } else if (error.name === 'TransitApiConfigError' || error.message?.includes('base URL') || error.message?.includes('yapılandırılmamış')) {
          errorMessage = 'Transit API yapılandırması eksik. Lütfen uygulamayı güncelleyin.';
        } else if (error.status === 404) {
          errorMessage = 'Hat listesi bulunamadı.';
        } else if (error.status >= 500) {
          errorMessage = 'Backend sunucusunda bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        }
        
        setLinesError(errorMessage);
        
        // Log line search error
        logEvent('LINE_SEARCH_ERROR', {
          code: error?.status || error?.name || 'UNKNOWN',
          messageShort: errorMessage.substring(0, 100),
        }, 'error');
      } finally {
        if (isMounted()) {
          setLoadingLines(false);
        }
      }
    },
    [activeTab, isOnline],
  );

  const lineMap = useMemo(() => {
    const map = new Map<string, TransitLine>();
    lines.forEach((line) => map.set(line.id, line));
    return map;
  }, [lines]);

  // Stops tab için sonuçlar - API'den gelen sonuçlar direkt kullanılır
  const filteredStops = useMemo(() => {
    return stopSearchResults;
  }, [stopSearchResults]);

  const filteredLines = useMemo(() => {
    if (!debouncedQuery) {
      return lines;
    }
    return lines.filter((line) => {
      const pool = [
        line.name,
        line.code,
        line.displayName,
        line.description,
      ].filter(Boolean) as string[];
      return pool.some((value) =>
        value.toLocaleLowerCase('tr-TR').includes(debouncedQuery),
      );
    });
  }, [lines, debouncedQuery]);

  const getTabTitle = (tab: Tabs) => {
    if (tab === 'stops') {
      return 'Duraklar';
    }
    if (tab === 'lines') {
      return 'Hatlar';
    }
    return 'Duraklar';
  };

  const handleStopPress = (stop: TransitStop) => {
    // Log stop pick from list
    logEvent('STOP_PICK_FROM_LIST', {
      stopIdHash: stop.id ? (() => {
        let hash = 2166136261;
        for (let i = 0; i < stop.id.length; i++) {
          hash ^= stop.id.charCodeAt(i);
          hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return (hash >>> 0).toString(16).padStart(8, '0');
      })() : undefined,
    });
    
    navigation.navigate('HomeMap', {
      mode: 'STOP_PREVIEW',
      stop: {
        id: stop.id,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
      },
    });
  };

  const handleSaveStop = async (stop: TransitStop) => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Favorilere eklemek için önce giriş yapmalısın.');
      return;
    }
    if (!isOnline) {
      Alert.alert(
        'Bir hata oluştu',
        'İnternet bağlantısı yok. Lütfen bağlantıyı kontrol edip tekrar deneyin.',
      );
      return;
    }
    
    const isAlreadySaved = savedStopIds.has(stop.id);
    
    try {
      setSavingId(stop.id);
      // toggleUserSavedStop duplicate kontrolü yapar ve ekler/siler
      await toggleUserSavedStop(user.uid, stop);
      
      // UI otomatik güncellenecek (subscribeUserSavedStops callback'i tetiklenecek)
      // Alert'i kaldırdık çünkü subscribe zaten UI'ı güncelleyecek
      // Sadece hata durumunda Alert göster
    } catch (error) {
      if (__DEV__) {
        console.warn('Durak favorilere eklenemedi/kaldırılamadı', error);
        console.warn('Error details:', error);
      }
      captureError(error, 'StopSearch/handleSaveStop');
      const action = isAlreadySaved ? 'kaldırılamadı' : 'eklenemedi';
      Alert.alert('Bir hata oluştu', `Durak favorilerden ${action}. Lütfen tekrar deneyin.`);
    } finally {
      setSavingId(null);
    }
  };

  const lineBadges = useCallback((stop: TransitStop) => {
    if (!stop.lineIds || stop.lineIds.length === 0) {
      return null;
    }
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }}>
        {stop.lineIds.slice(0, 3).map((lineId) => {
          const line = lineMap.get(lineId);
          return (
            <View
              key={lineId}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.full,
                backgroundColor: colors.primarySoft,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                {line?.code ?? line?.name ?? lineId}
              </Text>
            </View>
          );
        })}
        {stop.lineIds.length > 3 ? (
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            +{stop.lineIds.length - 3} hat
          </Text>
        ) : null}
      </View>
    );
  }, [lineMap]);

  const renderStop = useCallback(
    ({ item }: { item: TransitStop }) => (
      <Card
        style={{
          marginBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable 
          onPress={() => handleStopPress(item)} 
          style={{ flex: 1 }}
          accessibilityRole="button"
          accessibilityLabel={`Durak: ${item.name}`}
          accessibilityHint="Bu durağı haritada görmek ve alarm kurmak için dokunun"
        >
          <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text, marginBottom: 2 }}>
            {item.name}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 2, fontSize: 13 }}>
            {item.city ?? 'Şehir bilgisi yok'}
          </Text>
          {item.addressDescription ? (
            <Text style={{ color: colors.textLight, marginTop: 2, fontSize: 12 }}>
              {item.addressDescription}
            </Text>
          ) : null}
          {lineBadges(item)}
        </Pressable>
        <TouchableOpacity
          onPress={() => handleSaveStop(item)}
          disabled={!user || savingId === item.id}
          accessibilityRole="button"
          accessibilityLabel={
            savingId === item.id
              ? 'Kaydediliyor'
              : savedStopIds.has(item.id)
                ? `${item.name} durağını favorilerden kaldır`
                : `${item.name} durağını favorilere ekle`
          }
          accessibilityHint={
            savedStopIds.has(item.id)
              ? 'Bu durağı favorilerinizden kaldırmak için dokunun'
              : 'Bu durağı favorilerinize eklemek için dokunun'
          }
          accessibilityState={{ disabled: !user || savingId === item.id }}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: savedStopIds.has(item.id) ? colors.danger : colors.warning,
            backgroundColor: savedStopIds.has(item.id) ? colors.dangerSoft : colors.warningSoft,
            opacity: !user || savingId === item.id ? 0.5 : 1,
            marginLeft: spacing.md,
          }}
        >
          <Text
            style={{
              color: savedStopIds.has(item.id) ? colors.danger : colors.warning,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            {savingId === item.id
              ? 'Kaydediliyor...'
              : savedStopIds.has(item.id)
                ? '✓ Favoride'
                : '⭐ Favori Ekle'}
          </Text>
        </TouchableOpacity>
      </Card>
    ),
    [user, savingId, savedStopIds, handleStopPress, handleSaveStop, lineBadges, colors],
  );

  const keyExtractorStop = useCallback((item: TransitStop) => item.id, []);
  const keyExtractorLine = useCallback((item: TransitLine) => item.id, []);

  const handleRefresh = async () => {
    if (!isOnline) {
      Alert.alert('Bağlantı yok', 'Yenilemek için internet bağlantısına ihtiyacın var.');
      return;
    }
    setRefreshing(true);
    try {
      if (activeTab === 'lines') {
        const data = await fetchAllLines();
        setLines(data);
        setLinesError(null);
      } else if (activeTab === 'stops') {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length >= 2) {
          const results = await searchStops(trimmedQuery, { limit: 25 });
          setStopSearchResults(results);
          setStopSearchError(null);
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[StopSearch] Yenileme başarısız', error);
      }
      captureError(error, 'StopSearch/refresh');
      if (activeTab === 'lines') {
        setLinesError('Yenileme sırasında bir hata oluştu.');
      } else {
        setStopSearchError('Yenileme sırasında bir hata oluştu.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleLine = async (lineId: string) => {
    if (expandedLineId === lineId) {
      setExpandedLineId(null);
      return;
    }
    if (!isOnline) {
      Alert.alert(
        'Bağlantı yok',
        'Hat detaylarını görüntülemek için internet bağlantısına ihtiyacın var.',
      );
      return;
    }
    setExpandedLineId(lineId);
    // Cache kontrolü - daha önce yüklenmişse tekrar yükleme
    if (lineStopsMap[lineId]) {
      return;
    }
    setLineStopsLoadingId(lineId);
    try {
      const { line, stops: lineStops } = await fetchLineStops(lineId);
      // API'den gelen stops dizisini order'a göre sırala ve LineStopWithData formatına çevir
      const enriched: LineStopWithData[] = lineStops.map((stop, index) => ({
        stop,
        order: index + 1,
        direction: undefined, // API'den direction gelmiyorsa undefined
      }));
      setLineStopsMap((prev) => ({ ...prev, [lineId]: enriched }));
    } catch (error) {
      if (__DEV__) {
        console.warn('Hat durakları alınamadı', error);
      }
      captureError(error, 'StopSearch/handleToggleLine');
      Alert.alert('Hata', 'Hatın durakları listelenirken sorun oluştu.');
    } finally {
      setLineStopsLoadingId(null);
    }
  };

  const renderLineCard = useCallback(
    ({ item }: { item: TransitLine }) => {
      const isExpanded = expandedLineId === item.id;
      const stopsForLine = lineStopsMap[item.id] ?? [];
      return (
        <Card style={{ marginBottom: spacing.md }}>
          <TouchableOpacity 
            onPress={() => handleToggleLine(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`${item.displayName ?? item.name} hattı`}
            accessibilityHint={isExpanded ? 'Durakları gizlemek için dokunun' : 'Durakları göstermek için dokunun'}
            accessibilityState={{ expanded: isExpanded }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                {item.displayName ?? item.name}
              </Text>
              {item.code && item.code !== item.name ? (
                <View
                  style={{
                    marginLeft: spacing.sm,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: 2,
                    backgroundColor: colors.primarySoft,
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
                    {item.code}
                  </Text>
                </View>
              ) : null}
            </View>
            {item.description ? (
              <Text style={{ color: colors.textMuted, marginTop: 2, fontSize: 13 }}>
                {item.description}
              </Text>
            ) : null}
            <Text style={{ color: colors.textLight, marginTop: 2, fontSize: 12 }}>
              {item.city ?? 'Şehir bilgisi yok'}
            </Text>
            <View
              style={{
                marginTop: spacing.sm,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
                backgroundColor: colors.primarySoft,
                borderRadius: borderRadius.md,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                {isExpanded ? '▼ Durakları gizle' : '▶ Durakları göster'}
              </Text>
            </View>
          </TouchableOpacity>
          {isExpanded ? (
            lineStopsLoadingId === item.id ? (
              <View style={{ marginTop: spacing.md, alignItems: 'center', padding: spacing.lg }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textMuted, marginTop: spacing.sm, fontSize: 12 }}>
                  Duraklar yükleniyor...
                </Text>
              </View>
            ) : stopsForLine.length === 0 ? (
              <View style={{ marginTop: spacing.md, padding: spacing.md }}>
                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                  Durak bilgisi yok.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: spacing.md }}>
                {stopsForLine.map(({ stop, order }, index) => (
                  <Pressable
                    key={`${item.id}-${stop.id}`}
                    onPress={() => handleStopPress(stop)}
                    accessibilityRole="button"
                    accessibilityLabel={`${order}. durak: ${stop.name}`}
                    accessibilityHint="Bu durağı haritada görmek ve alarm kurmak için dokunun"
                    style={{
                      paddingVertical: spacing.md,
                      borderBottomWidth: index < stopsForLine.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text }}>
                      #{order} • {stop.name}
                    </Text>
                    {stop.addressDescription ? (
                      <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 2 }}>
                        {stop.addressDescription}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            )
          ) : null}
        </Card>
      );
    },
    [expandedLineId, lineStopsMap, lineStopsLoadingId, handleToggleLine, handleStopPress],
  );

  const inputPlaceholder =
    activeTab === 'lines'
      ? 'Hat adı veya kodu ara...'
      : 'Durak adı veya hat kodu ara...';

  return (
    <ScreenContainer>
      {/* Tab Navigation */}
      <View style={{ flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.xs }}>
        {(['stops', 'lines'] as Tabs[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityLabel={getTabTitle(tab)}
            accessibilityState={{ selected: activeTab === tab }}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderBottomWidth: 2,
              borderColor: activeTab === tab ? colors.primary : colors.border,
              backgroundColor: activeTab === tab ? colors.primarySoft : 'transparent',
              borderRadius: borderRadius.sm,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                color: activeTab === tab ? colors.primary : colors.textMuted,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              {getTabTitle(tab)}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'lines' ? (
            <React.Fragment>
              {/* Search Input for Lines */}
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
                  marginBottom: spacing.md,
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 16, marginRight: spacing.sm }}>🔍</Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Hat ara (isim, kod, açıklama)..."
                  placeholderTextColor={colors.textLight}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: colors.text,
                  }}
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setQuery('')}
                    style={{ marginLeft: spacing.sm, padding: spacing.xs }}
                  >
                    <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Lines Error Message */}
              {linesError ? (
                <Card
                  backgroundColor={colors.dangerSoft}
                  borderColor={colors.danger}
                  style={{ marginBottom: spacing.md }}
                >
                  <Text
                    style={{
                      fontWeight: '700',
                      color: colors.danger,
                      marginBottom: spacing.xs,
                      fontSize: 14,
                    }}
                  >
                    Bir hata oluştu
                  </Text>
                  <Text style={{ color: colors.danger, fontSize: 13 }}>
                    {linesError}
                  </Text>
                </Card>
              ) : null}

              {loadingLines ? (
                <FlatList
                  data={Array(5).fill(null)}
                  keyExtractor={(_, index) => `skeleton-${index}`}
                  renderItem={() => <SkeletonCard />}
                  scrollEnabled={false}
                />
              ) : (
                <FlatList
                  data={filteredLines}
                  keyExtractor={keyExtractorLine}
                  renderItem={renderLineCard}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  updateCellsBatchingPeriod={50}
                  initialNumToRender={10}
                  windowSize={10}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      tintColor={colors.primary}
                      colors={[colors.primary]}
                    />
                  }
                  ListEmptyComponent={
                    <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
                      <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🕵️‍♂️</Text>
                      <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>
                        Aradığınız kriterde hat bulunamadı.
                      </Text>
                    </View>
                  }
                />
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
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
              marginBottom: spacing.md,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: spacing.sm }}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={inputPlaceholder}
              placeholderTextColor={colors.textLight}
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.text,
              }}
            />
          </View>

          {/* Search Error */}
          {stopSearchError ? (
            <Card
              backgroundColor={colors.dangerSoft}
              borderColor={colors.danger}
              style={{ marginBottom: spacing.md }}
            >
              <Text
                style={{
                  color: colors.danger,
                  textAlign: 'center',
                  marginBottom: spacing.md,
                  fontWeight: '600',
                  fontSize: 14,
                }}
              >
                Bir hata oluştu
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  textAlign: 'center',
                  fontSize: 13,
                }}
              >
                {stopSearchError}
              </Text>
            </Card>
          ) : null}

          {/* Empty State - Query yoksa */}
          {query.trim().length < 2 ? (
            <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔍</Text>
              <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>
                Durak aramak için en az 2 karakter yazın
              </Text>
            </View>
          ) : stopSearchLoading ? (
            <FlatList
              data={Array(5).fill(null)}
              keyExtractor={(_, index) => `skeleton-${index}`}
              renderItem={() => <SkeletonCard />}
              scrollEnabled={false}
            />
          ) : (
            <FlatList
              data={filteredStops}
              keyExtractor={keyExtractorStop}
              renderItem={renderStop}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={10}
              windowSize={10}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🕵️‍♂️</Text>
                  <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>
                    Bu kriterlere uygun durak bulunamadı.
                  </Text>
                </View>
              }
            />
          )}
            </React.Fragment>
          )}
    </ScreenContainer>
  );
};

export default StopSearchScreen;

