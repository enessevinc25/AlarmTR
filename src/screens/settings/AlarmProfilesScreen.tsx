import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { useAppTheme } from '../../theme/useAppTheme';
import {
  createUserAlarmProfile,
  deleteUserAlarmProfile,
  listUserAlarmProfiles,
  updateUserAlarmProfile,
} from '../../services/alarmProfilesService';
import { TransportMode, UserAlarmProfile } from '../../types/models';

const transportOptions: TransportMode[] = ['BUS', 'METRO', 'METROBUS'];

const AlarmProfilesScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { colors } = useAppTheme();

  const [profiles, setProfiles] = useState<UserAlarmProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserAlarmProfile | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('400');
  const [minutesInput, setMinutesInput] = useState('3');
  const [modeInput, setModeInput] = useState<TransportMode>('BUS');
  const [saving, setSaving] = useState(false);

  const ensureOnline = () => {
    if (!isOnline) {
      Alert.alert('Bir hata oluştu', 'İnternet bağlantısı yok. Lütfen tekrar deneyin.');
      return false;
    }
    return true;
  };

  const refreshProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listUserAlarmProfiles(user.uid);
      setProfiles(data);
    } catch (error) {
      if (__DEV__) {
        console.warn('Alarm profilleri alınamadı', error);
      }
      captureError(error, 'AlarmProfilesScreen/refreshProfiles');
      Alert.alert('Bir hata oluştu', 'Alarm profilleri yüklenirken sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const resetForm = () => {
    setNameInput('');
    setDistanceInput('400');
    setMinutesInput('3');
    setModeInput('BUS');
    setEditingProfile(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (profile: UserAlarmProfile) => {
    setEditingProfile(profile);
    setNameInput(profile.name);
    setDistanceInput(String(profile.distanceMeters));
    setMinutesInput(String(profile.minutesBefore));
    setModeInput(profile.transportMode);
    setModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert('Bilgi', 'Profil kaydetmek için giriş yapmalısın.');
      return;
    }
    if (!ensureOnline()) {
      return;
    }
    const trimmedName = nameInput.trim();
    const distance = Number(distanceInput);
    const minutes = Number(minutesInput);
    if (!trimmedName) {
      Alert.alert('Bir hata oluştu', 'Profil ismi boş olamaz.');
      return;
    }
    if (!Number.isFinite(distance) || distance < 50 || distance > 5000) {
      Alert.alert('Bir hata oluştu', 'Mesafe 50 - 5000 metre arasında olmalı.');
      return;
    }
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 120) {
      Alert.alert('Bir hata oluştu', 'Dakika değeri 0 - 120 arasında olmalı.');
      return;
    }

    setSaving(true);
    try {
      if (editingProfile) {
        await updateUserAlarmProfile(editingProfile.id, user.uid, {
          name: trimmedName,
          distanceMeters: distance,
          minutesBefore: minutes,
          transportMode: modeInput,
        });
      } else {
        await createUserAlarmProfile(user.uid, {
          name: trimmedName,
          distanceMeters: distance,
          minutesBefore: minutes,
          transportMode: modeInput,
        });
      }
      await refreshProfiles();
      setModalVisible(false);
    } catch (error) {
      if (__DEV__) {
        console.warn('Profil kaydedilemedi', error);
      }
      captureError(error, 'AlarmProfilesScreen/saveProfile');
      Alert.alert('Bir hata oluştu', 'Profil kaydedilirken sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = (profile: UserAlarmProfile) => {
    Alert.alert(
      'Profili Sil',
      `"${profile.name}" profilini silmek istediğine emin misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!ensureOnline()) {
              return;
            }
            try {
              await deleteUserAlarmProfile(profile.id);
              await refreshProfiles();
            } catch (error) {
              if (__DEV__) {
                console.warn('Profil silinemedi', error);
              }
              captureError(error, 'AlarmProfilesScreen/deleteProfile');
              Alert.alert('Bir hata oluştu', 'Profil silinirken sorun oluştu.');
            }
          },
        },
      ],
    );
  };

  const handleNavigateToLogin = () => {
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      parentNavigator.navigate('Login' as never);
    } else {
      if (__DEV__) {
        console.warn(
        '[AlarmProfilesScreen] Parent navigator bulunamadı, Login ekranına yönlendirilemiyor.',
      );
      }
    }
  };

  if (!user) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Text style={{ color: '#475569', textAlign: 'center' }}>
            Alarm profillerini yönetmek için giriş yapmalısın.
          </Text>
          <PrimaryButton title="Giriş Yap" onPress={handleNavigateToLogin} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>Alarm Profilleri</Text>
          <Text style={{ color: '#64748b', marginTop: 4 }}>
            Sık kullandığın ayarları kaydet, tek dokunuşla uygula.
          </Text>
        </View>
        <PrimaryButton
          title="Yeni Profil"
          onPress={openCreateModal}
          style={{ paddingVertical: 10, paddingHorizontal: 12, height: 44 }}
        />
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : profiles.length === 0 ? (
        <Text style={{ color: '#94a3b8' }}>Henüz kaydedilmiş alarm profilin yok.</Text>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderColor: '#e2e8f0',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: '#475569' }}>
                Mesafe: {item.distanceMeters} m • Mod: {modeLabel(item.transportMode)} • Dakika:{' '}
                {item.minutesBefore} dk önce
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#0E7490',
                  }}
                >
                  <Text style={{ color: '#0E7490', fontWeight: '600' }}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteProfile(item)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e11d48',
                  }}
                >
                  <Text style={{ color: '#e11d48', fontWeight: '600' }}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
              {editingProfile ? 'Profili Düzenle' : 'Yeni Profil'}
            </Text>
            <Text style={styles.label}>Profil Adı</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Örn. İşe Gidiş"
              style={styles.input}
            />
            <Text style={styles.label}>Mesafe (metre)</Text>
            <TextInput
              value={distanceInput}
              onChangeText={(text) => setDistanceInput(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.label}>Taşıt Türü</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {transportOptions.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setModeInput(mode)}
                  style={[
                    styles.modeButton,
                    modeInput === mode ? styles.modeButtonActive : undefined,
                  ]}
                >
                  <Text
                    style={{
                      color: modeInput === mode ? '#fff' : '#0f172a',
                      fontWeight: '600',
                    }}
                  >
                    {modeLabel(mode)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Kaç dakika önce uyarsın?</Text>
            <TextInput
              value={minutesInput}
              onChangeText={(text) => setMinutesInput(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <PrimaryButton
                title="İptal"
                onPress={() => {
                  setModalVisible(false);
                  setEditingProfile(null);
                }}
                style={{ flex: 1, backgroundColor: '#e2e8f0' }}
              />
              <PrimaryButton
                title={editingProfile ? 'Güncelle' : 'Kaydet'}
                onPress={handleSaveProfile}
                disabled={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const modeLabel = (mode: TransportMode) => {
  switch (mode) {
    case 'BUS':
      return 'Otobüs';
    case 'METRO':
      return 'Metro';
    case 'METROBUS':
      return 'Metrobüs';
    default:
      return mode;
  }
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#0E7490',
    borderColor: '#0E7490',
  },
});

export default AlarmProfilesScreen;

