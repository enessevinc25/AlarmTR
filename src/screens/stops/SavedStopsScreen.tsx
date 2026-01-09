import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import { useAuth } from '../../context/AuthContext';
import {
  removeSavedStop,
  subscribeUserSavedStops,
} from '../../services/savedStopsService';
import { UserSavedStop } from '../../types/models';
import { fetchStopById } from '../../services/transitProvider';
import { useNetwork } from '../../context/NetworkContext';
import { useAppTheme } from '../../theme/useAppTheme';
import { goToAlarmDetails } from '../../navigation/navigationService';

type SavedStopsScreenProps = {
  hideHeader?: boolean;
};

const SavedStopsScreen = ({ hideHeader = false }: SavedStopsScreenProps = { hideHeader: false }) => {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { colors } = useAppTheme();
  const [savedStops, setSavedStops] = useState<UserSavedStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSavedStops([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let mounted = true;
    let unsubscribeFn: (() => void) | null = null;
    
    try {
      unsubscribeFn = subscribeUserSavedStops(user.uid, (stops) => {
        if (!mounted) return;
        try {
          // Güvenli veri işleme - undefined/null kontrolü ve tip kontrolü
          if (!Array.isArray(stops)) {
            if (__DEV__) {
              console.warn('[SavedStopsScreen] Stops is not an array:', stops);
            }
            if (mounted) {
              setSavedStops([]);
              setLoading(false);
            }
            return;
          }
          
          const safeStops = stops.filter((stop) => {
            try {
              // Guard 1: stop null/undefined kontrolü
              if (!stop || typeof stop !== 'object') {
                return false;
              }
              
              // Guard 2: id kontrolü (Firestore document ID)
              if (!stop.id || typeof stop.id !== 'string' || stop.id.trim().length === 0) {
                return false;
              }
              
              // Guard 3: stopId kontrolü (TransitStop ID)
              if (!stop.stopId || typeof stop.stopId !== 'string' || stop.stopId.trim().length === 0) {
                return false;
              }
              
              // Guard 4: userId kontrolü
              if (!stop.userId || typeof stop.userId !== 'string' || stop.userId.trim().length === 0) {
                return false;
              }
              
              // Guard 5: stopName kontrolü (renderItem'da kullanılıyor)
              if (!stop.stopName || typeof stop.stopName !== 'string' || stop.stopName.trim().length === 0) {
                return false;
              }
              
              // Guard 6: latitude/longitude kontrolü (number olmalı)
              if (typeof stop.latitude !== 'number' || typeof stop.longitude !== 'number') {
                return false;
              }
              
              // Guard 7: NaN kontrolü
              if (isNaN(stop.latitude) || isNaN(stop.longitude)) {
                return false;
              }
              
              return true;
            } catch (filterError) {
              if (__DEV__) {
                console.warn('[SavedStopsScreen] Filter error for stop:', filterError, stop);
              }
              return false;
            }
          });
          
          if (mounted) {
            setSavedStops(safeStops);
            setLoading(false);
          }
        } catch (error) {
          if (__DEV__) {
            console.warn('[SavedStopsScreen] Stops callback hatası', error);
          }
          captureError(error, 'SavedStopsScreen/subscribeCallback');
          if (mounted) {
            setSavedStops([]);
            setLoading(false);
          }
        }
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[SavedStopsScreen] Subscribe hatası', error);
      }
      captureError(error, 'SavedStopsScreen/subscribe');
      if (mounted) {
        setSavedStops([]);
        setLoading(false);
      }
      unsubscribeFn = null;
    }
    
    return () => {
      mounted = false;
      if (unsubscribeFn && typeof unsubscribeFn === 'function') {
        try {
          unsubscribeFn();
        } catch (cleanupError) {
          if (__DEV__) {
            console.warn('[SavedStopsScreen] Cleanup hatası', cleanupError);
          }
          captureError(cleanupError, 'SavedStopsScreen/cleanup');
        }
      }
    };
  }, [user]);

  const handleRemove = async (savedStopId: string) => {
    if (!isOnline) {
      Alert.alert(
        'Bağlantı yok',
        'Favori durakları düzenlemek için internet bağlantısına ihtiyacın var.',
      );
      return;
    }
    Alert.alert('Favoriden çıkar', 'Bu durağı favorilerden silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            setRemovingId(savedStopId);
            await removeSavedStop(savedStopId);
          } catch (error) {
            if (__DEV__) {
              console.warn('Favoriden silinemedi', error);
            }
            captureError(error, 'SavedStopsScreen/remove');
            Alert.alert('Hata', 'Durağı silerken sorun oluştu.');
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const handleStartAlarm = async (stop: UserSavedStop) => {
    if (!stop || !stop.stopId) {
      Alert.alert('Hata', 'Durak bilgisi eksik.');
      return;
    }
    if (!isOnline) {
      Alert.alert(
        'Bir hata oluştu',
        'İnternet bağlantısı yok. Lütfen bağlantıyı kontrol edip tekrar deneyin.',
      );
      return;
    }
    try {
      const stopData = await fetchStopById(stop.stopId);
      
      if (!stopData || !stopData.id) {
        Alert.alert('Bir hata oluştu', 'Durak bilgisine erişilemedi, lütfen tekrar deneyin.');
        return;
      }
      
      // Navigation service kullanarak AlarmDetails'e git
      goToAlarmDetails({
        targetType: 'STOP',
        targetId: stopData.id,
        defaultDistanceMeters: stopData.radiusMeters ?? stop.defaultDistanceMeters ?? 400,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('Alarm başlatma hatası', error);
      }
      captureError(error, 'SavedStopsScreen/startAlarm');
      Alert.alert('Hata', 'Alarm başlatılırken sorun oluştu.');
    }
  };

  const renderItem = ({ item, index }: { item: UserSavedStop | null; index: number }) => {
    try {
      // Guard 1: item null/undefined kontrolü
      if (!item) {
        if (__DEV__) {
          console.warn(`[SavedStopsScreen] renderItem: item is null/undefined at index ${index}`);
        }
        return null;
      }

      // Guard 2: stop ID çıkarımı - öncelik sırası: stopId > id > stop.id
      const stopId = (item as any)?.stopId ?? (item as any)?.id ?? (item as any)?.stop?.id;
      if (!stopId) {
        if (__DEV__) {
          console.warn(`[SavedStopsScreen] renderItem: stopId is missing at index ${index}`, item);
        }
        return null;
      }

      // Guard 3: stopId tip kontrolü
      if (typeof stopId !== 'string' && typeof stopId !== 'number') {
        if (__DEV__) {
          console.warn(`[SavedStopsScreen] renderItem: stopId has invalid type at index ${index}`, stopId);
        }
        return null;
      }

      // Guard 4: item.id kontrolü (Firestore document ID)
      if (!item.id || typeof item.id !== 'string' || item.id.trim().length === 0) {
        if (__DEV__) {
          console.warn(`[SavedStopsScreen] renderItem: item.id is invalid at index ${index}`, item.id);
        }
        return null;
      }

      // Güvenli metin alanları - optional chaining + fallback
      const stopName = (item.stopName && typeof item.stopName === 'string' && item.stopName.trim().length > 0) 
        ? item.stopName.trim() 
        : 'Durak';
      const city = (item.city && typeof item.city === 'string') ? item.city.trim() : undefined;
      const addressDescription = (item.addressDescription && typeof item.addressDescription === 'string') 
        ? item.addressDescription.trim() 
        : undefined;
      
      return (
        <View
          accessible={false}
          style={{
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: colors.border,
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
            {stopName}
          </Text>
          {city && city.length > 0 ? (
            <Text style={{ color: colors.textMuted }} numberOfLines={1}>
              {city}
            </Text>
          ) : null}
          {addressDescription && addressDescription.length > 0 ? (
            <Text style={{ color: colors.textLight, fontSize: 12 }} numberOfLines={2}>
              {addressDescription}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => {
                try {
                  handleStartAlarm(item);
                } catch (error) {
                  if (__DEV__) {
                    console.warn('[SavedStopsScreen] handleStartAlarm error:', error);
                  }
                  captureError(error, 'SavedStopsScreen/renderItem/handleStartAlarm');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`${stopName} için alarm kur`}
              accessibilityHint="Bu durak için alarm kurar"
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: colors.primary,
                minWidth: 100,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: '600', textAlign: 'center' }}>
                Alarm Kur
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                try {
                  handleRemove(item.id);
                } catch (error) {
                  if (__DEV__) {
                    console.warn('[SavedStopsScreen] handleRemove error:', error);
                  }
                  captureError(error, 'SavedStopsScreen/renderItem/handleRemove');
                }
              }}
              disabled={removingId === item.id}
              accessibilityRole="button"
              accessibilityLabel={`${stopName} durağını favorilerden sil`}
              accessibilityHint="Bu durağı favorilerden kaldırır"
              accessibilityState={{ disabled: removingId === item.id }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.danger,
                opacity: removingId === item.id ? 0.5 : 1,
                minWidth: 60,
              }}
            >
              <Text style={{ color: colors.danger, fontWeight: '600', textAlign: 'center' }}>
                Sil
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } catch (error) {
      // Render hatası - crash'i önle
      if (__DEV__) {
        console.warn(`[SavedStopsScreen] renderItem error at index ${index}:`, error);
      }
      captureError(error, 'SavedStopsScreen/renderItem');
      return null;
    }
  };

  if (!user) {
    const content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ textAlign: 'center', color: colors.textMuted }}>
          Favori duraklarını görmek için önce giriş yapmalısın.
        </Text>
      </View>
    );
    
    if (hideHeader) {
      return content;
    }
    
    return <ScreenContainer>{content}</ScreenContainer>;
  }

  const content = (
    <>
      {!hideHeader && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Favori Duraklar</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            Sık kullandığın durakları burada saklayabilir, tek dokunuşla alarm kurabilirsin.
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator />
      ) : savedStops.length === 0 ? (
        <Text style={{ color: colors.textLight }}>
          Henüz favori durağın yok. Durak arama ekranından sık kullandığın durakları kaydedebilirsin.
        </Text>
      ) : (
        <FlatList 
          data={savedStops || []} 
          keyExtractor={(item, index) => {
            try {
              // Stabil ID kullan - öncelik sırası: id > stopId > stop.id
              if (!item) {
                return `null-${index}`;
              }
              const key = (item as any)?.id ?? (item as any)?.stopId ?? (item as any)?.stop?.id;
              if (typeof key === 'string' && key.length > 0) return key;
              if (typeof key === 'number') return String(key);
              return `invalid-${index}`;
            } catch (error) {
              if (__DEV__) {
                console.warn(`[SavedStopsScreen] keyExtractor error at index ${index}:`, error);
              }
              return `error-${index}`;
            }
          }} 
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
                Favori duraklar listesi boş.
              </Text>
            </View>
          }
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </>
  );

  if (hideHeader) {
    return content;
  }

  return <ScreenContainer>{content}</ScreenContainer>;
};

export default SavedStopsScreen;

