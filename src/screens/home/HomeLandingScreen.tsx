import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { useAlarm } from '../../context/AlarmContext';
import { HomeStackParamList } from '../../navigation/navigationTypes';
import { goToStopsHome } from '../../navigation/navigationService';
import { db } from '../../services/firebase';
import { AlarmSession } from '../../types/models';
import { buildTargetSnapshotFromSession, buildStartAlarmParamsFromSession } from '../../utils/quickAlarm';
import { Alert } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { runAlarmPreflight } from '../../services/alarmPreflight';
import { getFeatureFlag } from '../../services/featureFlags';
import { logEvent } from '../../services/telemetry';

type Navigation = NativeStackNavigationProp<HomeStackParamList, 'HomeLanding'>;

interface QuickAction {
  id: 'search' | 'map' | 'favorites' | 'history';
  title: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'search',
    title: 'Durak Ara',
    description: 'Durak veya hat bul',
  },
  {
    id: 'map',
    title: 'Haritadan Seç',
    description: 'Haritada özel hedef oluştur',
  },
  {
    id: 'favorites',
    title: 'Favori Duraklar',
    description: 'Kaydettiğin duraklar',
  },
  {
    id: 'history',
    title: 'Son Alarmlar',
    description: 'Geçmiş alarmları incele',
  },
];

const HomeLandingScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const { activeAlarmSession, startAlarmSession } = useAlarm();
  const { colors } = useAppTheme();

  const [recentAlarms, setRecentAlarms] = useState<AlarmSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [startingQuickAlarmId, setStartingQuickAlarmId] = useState<string | null>(null);

  const heroName = useMemo(() => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'LastStop kullanıcısı';
  }, [user]);

  const fetchRecentAlarms = useCallback(async () => {
    if (!user) {
      setRecentAlarms([]);
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    try {
      // Composite index gerektiren sorgu - fallback ile güvenli hale getir
      let data: AlarmSession[] = [];
      let useClientSideFilter = false;
      
      try {
        // Önce composite index ile sorguyu dene
        const q = query(
          collection(db, 'alarmSessions'),
          where('userId', '==', user.uid),
          where('deletedAt', '==', null),
          orderBy('createdAt', 'desc'),
          limit(1),
        );
        const snapshot = await getDocs(q);
        data = snapshot.docs.map((docSnap) => {
          const payload = docSnap.data() as Omit<AlarmSession, 'id'>;
          return {
            id: docSnap.id,
            ...payload,
          };
        });
      } catch (indexError: any) {
        // Index yoksa veya sorgu hatası varsa fallback kullan
        if (__DEV__) {
          console.warn('[HomeLandingScreen] Composite index/sorgu hatası, fallback kullanılıyor:', indexError);
        }
        useClientSideFilter = true;
        try {
          const fallbackQ = query(
            collection(db, 'alarmSessions'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10), // Daha fazla al, client-side filter için
          );
          const snapshot = await getDocs(fallbackQ);
          data = snapshot.docs.map((docSnap) => {
            const payload = docSnap.data() as Omit<AlarmSession, 'id'>;
            return {
              id: docSnap.id,
              ...payload,
            };
          });
          
          // Client-side filter: deletedAt null olanları filtrele
          data = data.filter((session) => {
            const deletedAt = (session as any).deletedAt;
            return deletedAt === null || deletedAt === undefined;
          });
          // En son 1 tanesini al
          data = data.slice(0, 1);
        } catch (fallbackError) {
          if (__DEV__) {
            console.warn('[HomeLandingScreen] Fallback sorgu da başarısız:', fallbackError);
          }
          captureError(fallbackError, 'HomeLandingScreen/fetchRecentAlarms/fallback');
          data = [];
        }
      }
      
      setRecentAlarms(data);
    } catch (error) {
      if (__DEV__) {
        console.warn('Son alarmlar alınamadı', error);
      }
      captureError(error, 'HomeLandingScreen/fetchRecentAlarms');
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentAlarms();
  }, [fetchRecentAlarms]);

  const handleQuickAction = (action: QuickAction['id']) => {
    switch (action) {
      case 'search':
        navigation.navigate('StopSearch');
        return;
      case 'map':
        // CRITICAL: logEvent'i try-catch ile koru, crash olursa bile navigation denemesi yapılsın
        try {
          logEvent('HOME_MAP_NAVIGATE_ATTEMPT', {
            from: 'HomeLanding',
            action: 'quick_action_map',
          });
        } catch (logError) {
          // Logging crash ederse bile devam et
          if (__DEV__) {
            console.error('[HomeLanding] Logging failed, continuing navigation:', logError);
          }
        }
        
        // Navigation'ı ayrı try-catch ile koru
        try {
          navigation.navigate('HomeMap');
        } catch (navError) {
          if (__DEV__) {
            console.error('[HomeLanding] Error navigating to HomeMap:', navError);
          }
          captureError(navError as Error, 'HomeLandingScreen/navigateToHomeMap');
          Alert.alert('Hata', 'Harita ekranına geçilemedi. Lütfen tekrar deneyin.');
        }
        return;
      case 'favorites':
        goToStopsHome('favorites');
        return;
      case 'history':
        goToStopsHome('history');
        return;
      default:
        return;
    }
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
              navigation.navigate('ActiveAlarm', { alarmSessionId: activeAlarmSession.id });
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
      // Feature flag kontrolü: enableAlarmPreflight
      const enablePreflight = await getFeatureFlag('enableAlarmPreflight', true);
      if (enablePreflight) {
        const preflight = await runAlarmPreflight();
        if (!preflight.canProceed) {
          // Eksik izinler var, preflight ekranına yönlendir
          navigation.navigate('AlarmPreflight', {
            startPayload: {
              ...params,
              targetSnapshot,
            },
          });
          return;
        }
      }

      const newSession = await startAlarmSession({
        ...params,
        targetSnapshot,
      });

      // ActiveAlarm ekranına navigate et
      navigation.navigate('ActiveAlarm', { alarmSessionId: newSession.id });
    } catch (error) {
      if (__DEV__) {
        console.warn('Hızlı alarm kurulamadı', error);
      }
      captureError(error, 'HomeLandingScreen/quickAlarm');
      Alert.alert('Hata', 'Alarm kurulurken bir sorun oluştu.');
    } finally {
      setStartingQuickAlarmId(null);
    }
  };

  const renderAlarmItem = ({ item }: { item: AlarmSession }) => {
    const isLoading = startingQuickAlarmId === item.id;
    return (
      <View
        style={{
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{item.targetName}</Text>
        <Text style={{ color: colors.textMuted, marginTop: 2 }}>
          Durum:{' '}
          <Text style={{ fontWeight: '700' }}>
            {item.status === 'ACTIVE'
              ? 'Aktif'
              : item.status === 'TRIGGERED'
                ? 'Tetiklendi'
                : 'İptal'}
          </Text>
        </Text>
        <Text style={{ color: colors.textLight, marginTop: 2 }}>
          Mesafe eşiği: {item.distanceThresholdMeters} m
        </Text>
        <TouchableOpacity
          onPress={() => handleQuickAlarm(item)}
          disabled={isLoading}
          style={{
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: colors.primary,
            opacity: isLoading ? 0.5 : 1,
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

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 14, color: colors.textLight }}>Hoş geldin</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 }}>
          {heroName}
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>
          İneceğin durağa yaklaşınca seni zamanında uyarmaya hazırım.
        </Text>
      </View>

      {activeAlarmSession ? (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ActiveAlarm', { alarmSessionId: activeAlarmSession.id })
          }
          style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: colors.primarySoft, fontWeight: '600', marginBottom: 4 }}>
            Aktif alarm
          </Text>
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: '700' }}>
            {activeAlarmSession.targetName}
          </Text>
          <Text style={{ color: colors.primarySoft, marginTop: 4 }}>
            Mesafe eşiği: {activeAlarmSession.distanceThresholdMeters} m
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => handleQuickAction(action.id)}
          style={{
            flexBasis: '48%',
            flexGrow: 1,
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            borderRadius: 16,
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.text }}>{action.title}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton
        title="Durak / Hat Ara"
        onPress={() => handleQuickAction('search')}
        style={{ marginBottom: 24 }}
      />

      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Son Alarm</Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Kurduğun son alarm oturumunun özetini burada görebilirsin.
        </Text>
      </View>

      {loadingHistory ? (
        <ActivityIndicator />
      ) : recentAlarms.length === 0 ? (
        <Text style={{ color: colors.textLight }}>
          Henüz alarm geçmişin yok. Durak arayarak veya haritadan hedef seçerek yeni bir alarm
          oluşturabilirsin.
        </Text>
      ) : (
        <FlatList
          data={recentAlarms}
          keyExtractor={(item) => item.id}
          renderItem={renderAlarmItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        />
      )}

    </ScreenContainer>
  );
};

export default HomeLandingScreen;

