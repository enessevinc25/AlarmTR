import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import { formatDate } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';
import { AlarmSession } from '../../types/models';
import { db } from '../../services/firebase';
import { useNetwork } from '../../context/NetworkContext';
import { useAlarm } from '../../context/AlarmContext';
import { buildTargetSnapshotFromSession, buildStartAlarmParamsFromSession } from '../../utils/quickAlarm';
import { goToActiveAlarm, goToAlarmPreflight } from '../../navigation/navigationService';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/useAppTheme';
import { runAlarmPreflight } from '../../services/alarmPreflight';

const statusMeta: Record<
  AlarmSession['status'],
  { label: string; color: string }
> = {
  ACTIVE: { label: 'Aktif', color: '#0EA5E9' },
  CANCELLED: { label: 'İptal', color: '#94a3b8' },
  TRIGGERED: { label: 'Çaldı', color: '#22c55e' },
};


type HistoryFilter = 'ALL' | 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';

const FILTER_OPTIONS: { label: string; value: HistoryFilter }[] = [
  { label: 'Tümü', value: 'ALL' },
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Tetiklenen', value: 'TRIGGERED' },
  { label: 'İptal', value: 'CANCELLED' },
];

const HISTORY_LIMIT = 50;

type AlarmHistoryScreenProps = {
  hideHeader?: boolean;
};

const AlarmHistoryScreen = ({ hideHeader = false }: AlarmHistoryScreenProps = { hideHeader: false }) => {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { startAlarmSession, activeAlarmSession } = useAlarm();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const [history, setHistory] = useState<AlarmSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const [startingQuickAlarmId, setStartingQuickAlarmId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      if (!user) {
        setHistory([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Composite index gerektiren sorgu - fallback ile güvenli hale getir
        let sessions: AlarmSession[] = [];
        let useClientSideFilter = false;
        
        try {
          // Önce composite index ile sorguyu dene
        const historyQuery = query(
          collection(db, 'alarmSessions'),
          where('userId', '==', user.uid),
          where('deletedAt', '==', null),
          orderBy('createdAt', 'desc'),
          limit(HISTORY_LIMIT),
        );
        const snapshot = await getDocs(historyQuery);
        if (!isMounted) {
          return;
        }
        
          sessions = snapshot.docs
            .map((docSnap) => {
              try {
                const data = docSnap.data() as Omit<AlarmSession, 'id'>;
                return { id: docSnap.id, ...data };
              } catch (docError) {
                if (__DEV__) {
                  console.warn(`[AlarmHistoryScreen] Doc parse hatası (${docSnap.id}):`, docError);
                }
                return null;
              }
            })
            .filter((session): session is AlarmSession => session !== null);
        } catch (indexError: any) {
          // Index yoksa veya sorgu hatası varsa fallback kullan
          if (__DEV__) {
            console.warn('[AlarmHistoryScreen] Composite index/sorgu hatası, fallback kullanılıyor:', indexError);
          }
          useClientSideFilter = true;
          try {
            const fallbackQuery = query(
              collection(db, 'alarmSessions'),
              where('userId', '==', user.uid),
              orderBy('createdAt', 'desc'),
              limit(HISTORY_LIMIT * 2), // Daha fazla al, client-side filter için
            );
            const snapshot = await getDocs(fallbackQuery);
            if (!isMounted) {
              return;
            }
            
            sessions = snapshot.docs
          .map((docSnap) => {
            try {
              const data = docSnap.data() as Omit<AlarmSession, 'id'>;
              return { id: docSnap.id, ...data };
            } catch (docError) {
              if (__DEV__) {
                console.warn(`[AlarmHistoryScreen] Doc parse hatası (${docSnap.id}):`, docError);
              }
              return null;
            }
          })
          .filter((session): session is AlarmSession => session !== null);
            
            // Client-side filter: deletedAt null olanları filtrele
            sessions = sessions.filter((session) => {
              const deletedAt = (session as any).deletedAt;
              return deletedAt === null || deletedAt === undefined;
            });
            // Limit'e uygun şekilde kes
            sessions = sessions.slice(0, HISTORY_LIMIT);
          } catch (fallbackError) {
            if (__DEV__) {
              console.warn('[AlarmHistoryScreen] Fallback sorgu da başarısız:', fallbackError);
            }
            captureError(fallbackError, 'AlarmHistoryScreen/fetchHistory/fallback');
            sessions = [];
          }
        }
        
        if (!isMounted) {
          return;
        }
        
        if (isMounted) {
          setHistory(sessions);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Alarm geçmişi alınamadı', error);
        }
        captureError(error, 'AlarmHistoryScreen/fetchHistory');
        // Hata durumunda kullanıcıya bilgi ver
        if (isMounted) {
          setHistory([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredHistory = useMemo(() => {
    if (filter === 'ALL') {
      return history;
    }
    return history.filter((session) => session.status === filter);
  }, [history, filter]);

  const handleClearHistory = () => {
    if (!isOnline) {
      Alert.alert(
        'Bağlantı yok',
        'Alarm geçmişini temizlemek için internet bağlantısına ihtiyacın var.',
      );
      return;
    }
    if (history.length === 0) {
      return;
    }
    Alert.alert(
      'Geçmişi temizle',
      'Tüm alarm geçmişini silmek istediğine emin misin? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearing(true);
              const batch = writeBatch(db);
              history.forEach((session) => {
                const ref = doc(db, 'alarmSessions', session.id);
                batch.update(ref, {
                  deletedAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              });
              await batch.commit();
              setHistory([]);
              Alert.alert('Bilgi', 'Alarm geçmişin temizlendi.');
            } catch (error) {
              if (__DEV__) {
                console.warn('Geçmiş silinemedi', error);
              }
              captureError(error, 'AlarmHistoryScreen/clearHistory');
              Alert.alert('Bir hata oluştu', 'Geçmiş temizlenirken sorun oluştu.');
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  const handleQuickAlarm = async (session: AlarmSession) => {
    // Aktif alarm kontrolü
    if (activeAlarmSession) {
      Alert.alert(
        'Aktif alarm var',
        'Zaten aktif bir alarm var. Yeni alarm kurmak için önce mevcut alarmı iptal etmelisin.',
        [
          {
            text: 'Tamam',
            style: 'cancel',
          },
          {
            text: 'Aktif Alarmı Aç',
            onPress: () => {
              goToActiveAlarm(activeAlarmSession.id);
            },
          },
        ],
      );
      return;
    }

    setStartingQuickAlarmId(session.id);
    try {
      // Target snapshot oluştur (eğer target silinmişse null dönebilir)
      const targetSnapshot = await buildTargetSnapshotFromSession(session);
      if (!targetSnapshot) {
        Alert.alert('Hata', 'Hedef bulunamadı. Bu hedef silinmiş olabilir.');
        return;
      }

      const params = await buildStartAlarmParamsFromSession(session);
      
      // Preflight kontrolü (P0)
      const preflight = await runAlarmPreflight();
      if (!preflight.canProceed) {
        // Eksik izinler var, preflight ekranına yönlendir
        goToAlarmPreflight({
          ...params,
          targetSnapshot,
        });
        return;
      }

      const newSession = await startAlarmSession({
        ...params,
        targetSnapshot,
      });

      // ActiveAlarm ekranına navigate et
      goToActiveAlarm(newSession.id);
    } catch (error) {
      if (__DEV__) {
        console.warn('Hızlı alarm kurulamadı', error);
      }
      captureError(error, 'AlarmHistoryScreen/quickAlarm');
      Alert.alert('Hata', 'Alarm kurulurken bir sorun oluştu.');
    } finally {
      setStartingQuickAlarmId(null);
    }
  };

  const renderItem = ({ item }: { item: AlarmSession }) => {
    const status = statusMeta[item.status];
    const createdAtLabel = formatDate(item.createdAt);
    const triggeredAtLabel =
      item.status === 'TRIGGERED' ? formatDate(item.triggeredAt) : null;
    const lastDistance =
      typeof item.lastKnownDistanceMeters === 'number'
        ? Math.round(item.lastKnownDistanceMeters)
        : null;
    const displayName = item.targetName || 'Hedef';
    const isLoading = startingQuickAlarmId === item.id;
    
    return (
      <View
        style={{
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{displayName}</Text>
        <Text style={{ color: status.color, marginTop: 2, fontWeight: '600' }}>
          {status.label}
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Kurulum: {createdAtLabel}
        </Text>
        {triggeredAtLabel ? (
          <Text style={{ color: colors.textMuted, marginTop: 2 }}>
            Tetiklenme: {triggeredAtLabel}
          </Text>
        ) : null}
        <Text style={{ color: colors.textMuted, marginTop: 2 }}>
          Mesafe eşiği: {item.distanceThresholdMeters} m
        </Text>
        {lastDistance !== null ? (
          <Text style={{ color: colors.textMuted, marginTop: 2 }}>
            Son ölçüm: {lastDistance} m
          </Text>
        ) : null}
        <TouchableOpacity
          onPress={() => handleQuickAlarm(item)}
          disabled={isLoading || !isOnline}
          style={{
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: colors.primary,
            opacity: isLoading || !isOnline ? 0.5 : 1,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.white, fontWeight: '600' }}>
            {isLoading ? 'Kuruluyor...' : 'Hızlı Alarm Kur'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const content = (
    <>
      {!hideHeader && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Alarm Geçmişi</Text>
          <Text style={{ color: colors.textMuted }}>
            Son 30 alarm oturumunun durumunu, mesafe eşiklerini ve tetiklenme zamanlarını burada
            görebilirsin.
          </Text>
          <Text style={{ color: colors.textLight, marginTop: 6, fontSize: 12 }}>
            Not: Bu ekranda yalnızca son 50 kayıt gösterilir. “Geçmişi Temizle” bu kayıtları gizler,
            daha eski kayıtlar korunur.
          </Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setFilter(option.value)}
            style={[
              styles.filterButton,
              filter === option.value ? { ...styles.filterButtonActive, backgroundColor: colors.primary } : { borderColor: colors.border },
            ]}
          >
            <Text
              style={{
                color: filter === option.value ? colors.white : colors.text,
                fontWeight: '600',
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
        <TouchableOpacity
          onPress={handleClearHistory}
          disabled={history.length === 0 || clearing}
          style={[
            styles.clearButton,
            { borderColor: colors.danger },
            history.length === 0 || clearing ? styles.clearButtonDisabled : undefined,
          ]}
        >
          <Text style={{ color: colors.danger, fontWeight: '600' }}>
            {clearing ? 'Temizleniyor...' : 'Geçmişi Temizle'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : history.length === 0 && !loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: colors.textLight, textAlign: 'center' }}>
            Veri alınamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.
          </Text>
        </View>
      ) : filteredHistory.length === 0 ? (
        <Text style={{ color: colors.textLight }}>{emptyStateCopy(filter)}</Text>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </>
  );

  if (hideHeader) {
    return content;
  }

  return <ScreenContainer>{content}</ScreenContainer>;
};

export default AlarmHistoryScreen;

const emptyStateCopy = (filter: HistoryFilter) => {
  switch (filter) {
    case 'ACTIVE':
      return 'Şu anda aktif alarmın bulunmuyor.';
    case 'TRIGGERED':
      return 'Daha önce tetiklenen alarm bulunmuyor.';
    case 'CANCELLED':
      return 'İptal edilmiş alarm bulunmuyor.';
    default:
      return 'Henüz alarm geçmişin yok. Bir durak seçip alarm kurarak hemen dene!';
  }
};

// Styles will use dynamic colors via inline styles now
const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterButtonActive: {
    // backgroundColor and borderColor set inline with theme colors
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
});

