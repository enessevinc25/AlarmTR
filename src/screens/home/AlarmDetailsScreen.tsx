import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import PrimaryButton from '../../components/common/PrimaryButton';
import { getUserTargetById } from '../../services/stopsService';
import { fetchStopById } from '../../services/transitProvider';
import {
  TransitStop,
  TransportMode,
  UserAlarmPreferences,
  UserAlarmProfile,
  UserTarget,
} from '../../types/models';
import { HomeStackParamList } from '../../navigation/navigationTypes';
import { useAlarm } from '../../context/AlarmContext';
import { useAuth } from '../../context/AuthContext';
import { getUserAlarmPreferences } from '../../services/userSettingsService';
import { useNetwork } from '../../context/NetworkContext';
import {
  createUserAlarmProfile,
  listUserAlarmProfiles,
} from '../../services/alarmProfilesService';
import { runAlarmPreflight } from '../../services/alarmPreflight';
import { getFeatureFlag } from '../../services/featureFlags';

type Props = NativeStackScreenProps<HomeStackParamList, 'AlarmDetails'>;

const DISTANCE_OPTIONS = [250, 400, 600];

function getSuggestedDistanceMeters(mode: TransportMode, minutesBefore: number): number {
  const speedKmH = mode === 'METRO' ? 50 : mode === 'METROBUS' ? 40 : 30;
  const speedMS = (speedKmH * 1000) / 3600;
  const seconds = minutesBefore * 60;
  const distance = speedMS * seconds;
  return Math.min(Math.max(Math.round(distance), 200), 3000);
}

const clampDistance = (value: number) => Math.min(Math.max(value, 50), 5000);

const AlarmDetailsScreen = ({ route, navigation }: Props) => {
  const {
    targetId,
    targetType,
    defaultDistanceMeters,
    defaultTransportMode,
    defaultMinutesBefore,
  } = route.params;
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [target, setTarget] = useState<TransitStop | UserTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDistance, setSelectedDistance] = useState(defaultDistanceMeters ?? 400);
  const [customDistance, setCustomDistance] = useState('');
  const [transportMode, setTransportMode] = useState<TransportMode>(
    defaultTransportMode ?? 'BUS',
  );
  const [minutesBefore, setMinutesBefore] = useState(defaultMinutesBefore ?? 3);
  const [suggestedDistance, setSuggestedDistance] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<UserAlarmPreferences | null>(null);
  const preferencesAppliedRef = useRef(false);
  const [profiles, setProfiles] = useState<UserAlarmProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesModalVisible, setProfilesModalVisible] = useState(false);
  const [saveProfileModalVisible, setSaveProfileModalVisible] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const { startAlarmSession, activeAlarmSession } = useAlarm();
  const fetchProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      return;
    }
    setProfilesLoading(true);
    try {
      const data = await listUserAlarmProfiles(user.uid);
      setProfiles(data);
    } catch (err) {
      if (__DEV__) {
        console.warn('Profiller alınamadı', err);
      }
      captureError(err, 'AlarmDetailsScreen/fetchProfiles');
      Alert.alert('Bir hata oluştu', 'Alarm profilleri yüklenirken sorun oluştu.');
    } finally {
      setProfilesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const loadPreferences = async () => {
      if (!user) {
        setPreferences(null);
        setProfiles([]);
        return;
      }
      try {
        const prefs = await getUserAlarmPreferences(user.uid);
        if (mounted) {
          setPreferences(prefs);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('Tercihler alınamadı', err);
        }
        captureError(err, 'AlarmDetailsScreen/loadPreferences');
      }
    };
    loadPreferences();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!preferences || preferencesAppliedRef.current) {
      return;
    }
    if (!defaultDistanceMeters) {
      setSelectedDistance(preferences.defaultDistanceMeters);
    }
    if (!defaultTransportMode) {
      setTransportMode(preferences.defaultTransportMode);
    }
    if (!defaultMinutesBefore) {
      setMinutesBefore(preferences.defaultMinutesBefore);
    }
    preferencesAppliedRef.current = true;
  }, [preferences, defaultDistanceMeters, defaultTransportMode, defaultMinutesBefore]);

  useEffect(() => {
    const fetchTarget = async () => {
      setLoading(true);
      setError(null);
      try {
        const data =
          targetType === 'STOP' ? await fetchStopById(targetId) : await getUserTargetById(targetId);
        if (!data) {
          setError('Hedef bulunamadı');
        }
        setTarget(data);
      } catch (err) {
        if (__DEV__) {
          console.warn(err);
        }
        setError('Hedef bilgileri alınamadı.');
      } finally {
        setLoading(false);
      }
    };

    fetchTarget();
  }, [targetId, targetType]);

  useEffect(() => {
    const distance = getSuggestedDistanceMeters(transportMode, minutesBefore);
    setSuggestedDistance(distance);
  }, [transportMode, minutesBefore]);

  const getCurrentDistanceForProfile = () => {
    const trimmed = customDistance.trim();
    if (trimmed.length > 0) {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) {
        return selectedDistance;
      }
      return clampDistance(parsed);
    }
    return selectedDistance;
  };

  const handleOpenProfilePicker = () => {
    if (!user) {
      Alert.alert('Bilgi', 'Profil kullanmak için lütfen giriş yapın.');
      return;
    }
    setProfilesModalVisible(true);
    fetchProfiles();
  };

  const handleApplyProfile = (profile: UserAlarmProfile) => {
    setSelectedDistance(profile.distanceMeters);
    setTransportMode(profile.transportMode);
    setMinutesBefore(profile.minutesBefore);
    setCustomDistance('');
    setProfilesModalVisible(false);
  };

  const handleOpenSaveProfileModal = () => {
    if (!user) {
      Alert.alert('Bilgi', 'Profil kaydetmek için lütfen giriş yapın.');
      return;
    }
    if (!isOnline) {
      Alert.alert(
        'Bir hata oluştu',
        'İnternet bağlantısı yok. Lütfen bağlantıyı kontrol edip tekrar deneyin.',
      );
      return;
    }
    setProfileNameInput('');
    setSaveProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert('Bilgi', 'Profil kaydetmek için lütfen giriş yapın.');
      return;
    }
    if (!isOnline) {
      Alert.alert(
        'Bir hata oluştu',
        'İnternet bağlantısı yok. Lütfen bağlantıyı kontrol edip tekrar deneyin.',
      );
      return;
    }
    const name = profileNameInput.trim();
    if (name.length === 0) {
      Alert.alert('Bir hata oluştu', 'Profil ismi boş olamaz.');
      return;
    }
    const distance = getCurrentDistanceForProfile();
    setProfileSaving(true);
    try {
      await createUserAlarmProfile(user.uid, {
        name,
        distanceMeters: distance,
        transportMode,
        minutesBefore,
      });
      await fetchProfiles();
      setSaveProfileModalVisible(false);
      Alert.alert('Başarılı', 'Profil kaydedildi.');
    } catch (err) {
      if (__DEV__) {
        console.warn('Profil kaydedilemedi', err);
      }
      captureError(err, 'AlarmDetailsScreen/saveProfile');
      Alert.alert('Bir hata oluştu', 'Profil kaydedilirken sorun oluştu.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCustomDistanceChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    setCustomDistance(sanitized);
  };

  const handleStartAlarm = async () => {
    if (!target) {
      return;
    }
    
    // Aktif alarm kontrolü
    if (activeAlarmSession) {
      Alert.alert(
        'Aktif alarm var',
        'Yeni bir alarm kurmadan önce mevcut alarmı sonlandırmalısın.',
      );
      return;
    }

    try {
      setError(null);
      const trimmedCustom = customDistance.trim();
      let finalDistance = selectedDistance;
      if (trimmedCustom.length > 0) {
        const parsed = Number(trimmedCustom);
        if (Number.isNaN(parsed)) {
          setError('Lütfen geçerli bir mesafe girin.');
          return;
        }
        if (parsed < 50 || parsed > 5000) {
          setError('Mesafe 50 - 5000 metre arasında olmalı.');
          return;
        }
        finalDistance = clampDistance(parsed);
      }

      // Preflight kontrolü (P0)
      const preflight = await runAlarmPreflight();
      if (!preflight.canProceed) {
        // Eksik izinler var, preflight ekranına yönlendir
        navigation.navigate('AlarmPreflight', {
          startPayload: {
            targetType,
            targetId,
            distanceThresholdMeters: finalDistance,
            transportMode,
            minutesBefore,
            targetSnapshot: target, // Zaten yüklenmiş target objesini geçir
          },
        });
        return;
      }

      // Preflight başarılı, alarmı başlat
      // NOT: Offline kontrolü kaldırıldı - startAlarmSession offline queue'yu destekliyor
      // Offline modda local session oluşturulur ve network gelince sync edilir
      const session = await startAlarmSession({
        targetType,
        targetId,
        distanceThresholdMeters: finalDistance,
        transportMode,
        minutesBefore,
        targetSnapshot: target, // Zaten yüklenmiş target objesini geçir
      });
      navigation.replace('ActiveAlarm', { alarmSessionId: session.id });
    } catch (err) {
      if (__DEV__) {
        console.warn(err);
      }
      setError('Alarm başlatılırken sorun oluştu.');
      Alert.alert('Bir hata oluştu', 'İşlem tamamlanamadı. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  if (!target) {
    return (
      <ScreenContainer>
        <Text>{error ?? 'Hedef bulunamadı'}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>{target.name}</Text>
        <Text style={{ color: '#64748b', marginTop: 4 }}>
          {targetType === 'STOP' ? 'Durak' : 'Özel hedef'}
        </Text>
        {targetType === 'STOP' && 'addressDescription' in target && target.addressDescription ? (
          <Text style={{ color: '#94a3b8' }}>{target.addressDescription}</Text>
        ) : null}
        
        {/* Haritada Göster butonu - sadece STOP için */}
        {targetType === 'STOP' && target && 'latitude' in target && 'longitude' in target ? (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('HomeMap', {
                mode: 'STOP_PREVIEW',
                stop: {
                  id: target.id,
                  name: target.name,
                  latitude: target.latitude,
                  longitude: target.longitude,
                },
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Haritada göster"
            accessibilityHint="Bu durağı haritada gösterir"
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: '#0E7490',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              alignSelf: 'flex-start',
              backgroundColor: '#f0f9ff',
            }}
          >
            <Text style={{ color: '#0E7490', fontWeight: '600', fontSize: 14 }}>
              📍 Haritada Göster
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {user ? (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={handleOpenProfilePicker}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#0E7490',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#0E7490', fontWeight: '600' }}>Profil Uygula</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenSaveProfileModal}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#0E7490',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#0E7490', fontWeight: '600' }}>Profil Kaydet</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Alarm mesafesi</Text>
      <View style={{ flexDirection: 'row', marginBottom: 24, flexWrap: 'wrap' }}>
        {DISTANCE_OPTIONS.map((option, index) => (
          <Pressable
            key={option}
            onPress={() => {
              setSelectedDistance(option);
              setCustomDistance('');
            }}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: selectedDistance === option ? '#0E7490' : '#e2e8f0',
              backgroundColor: selectedDistance === option ? '#0E7490' : 'transparent',
              marginRight: index !== DISTANCE_OPTIONS.length - 1 ? 12 : 0,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: selectedDistance === option ? '#fff' : '#0f172a',
                fontWeight: '600',
              }}
            >
              {option} m
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ marginBottom: 6, fontWeight: '600' }}>Özel mesafe (metre)</Text>
        <TextInput
          value={customDistance}
          onChangeText={handleCustomDistanceChange}
          placeholder="Örn. 550"
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
        <Text style={{ color: '#94a3b8', marginTop: 6 }}>
          Değer girmezsen son seçtiğin hazır mesafe ({selectedDistance} m) kullanılacak.
        </Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Toplu taşıma türü</Text>
        <View style={{ flexDirection: 'row' }}>
          {(['BUS', 'METRO', 'METROBUS'] as TransportMode[]).map((mode, index) => (
            <Pressable
              key={mode}
              onPress={() => setTransportMode(mode)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: transportMode === mode ? '#0E7490' : '#e2e8f0',
                backgroundColor: transportMode === mode ? '#0E7490' : 'transparent',
                borderRadius: index === 0 ? 12 : index === 2 ? 12 : 0,
                marginRight: index !== 2 ? 8 : 0,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  color: transportMode === mode ? '#fff' : '#0f172a',
                  fontWeight: '600',
                }}
              >
                {mode === 'BUS' ? 'Otobüs' : mode === 'METRO' ? 'Metro' : 'Metrobüs'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Kaç dakika önce uyarsın?</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: 12,
            padding: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setMinutesBefore((prev) => Math.max(2, prev - 1))}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: '#e2e8f0',
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700' }}>-</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>{minutesBefore} dk</Text>
          <TouchableOpacity
            onPress={() => setMinutesBefore((prev) => Math.min(5, prev + 1))}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: '#e2e8f0',
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600' }}>
          Önerilen mesafe:{' '}
          {suggestedDistance ? `${suggestedDistance} m` : 'Hesaplanıyor...'}
        </Text>
        <Pressable
          onPress={() => {
            if (suggestedDistance) {
              setSelectedDistance(suggestedDistance);
              setCustomDistance('');
            }
          }}
          disabled={!suggestedDistance}
          style={{
            marginTop: 8,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#0E7490',
            alignItems: 'center',
            opacity: suggestedDistance ? 1 : 0.5,
          }}
        >
          <Text style={{ color: '#0E7490', fontWeight: '600' }}>Önerilen mesafeyi kullan</Text>
        </Pressable>
      </View>

      {error ? <Text style={{ color: '#be123c', marginBottom: 16 }}>{error}</Text> : null}

      <PrimaryButton title="Alarmı Başlat" onPress={handleStartAlarm} />

      <Modal transparent visible={profilesModalVisible} animationType="slide">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.content}>
            <Text style={modalStyles.title}>Profili seç</Text>
            {profilesLoading ? (
              <ActivityIndicator />
            ) : profiles.length === 0 ? (
              <Text style={{ color: '#475569' }}>Kayıtlı profil bulunamadı.</Text>
            ) : (
              <FlatList
                data={profiles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleApplyProfile(item)}
                    style={modalStyles.profileRow}
                  >
                    <Text style={{ fontWeight: '700' }}>{item.name}</Text>
                    <Text style={{ color: '#475569' }}>
                      {item.distanceMeters} m • {item.transportMode} • {item.minutesBefore} dk
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <PrimaryButton
              title="Kapat"
              onPress={() => setProfilesModalVisible(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      <Modal transparent visible={saveProfileModalVisible} animationType="slide">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.content}>
            <Text style={modalStyles.title}>Profil adı</Text>
            <TextInput
              value={profileNameInput}
              onChangeText={setProfileNameInput}
              placeholder="Örn. Sabah Servisi"
              style={modalStyles.input}
            />
            <Text style={{ color: '#475569', marginTop: 8 }}>
              Kaydedilecek değerler: {getCurrentDistanceForProfile()} m • {transportMode} •{' '}
              {minutesBefore} dk önce
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <PrimaryButton
                title="Vazgeç"
                onPress={() => setSaveProfileModalVisible(false)}
                style={{ flex: 1, backgroundColor: '#e2e8f0' }}
              />
              <PrimaryButton
                title="Kaydet"
                onPress={handleSaveProfile}
                disabled={profileSaving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </ScreenContainer>
  );
};

export default AlarmDetailsScreen;

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  profileRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

