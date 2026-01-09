import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import PrimaryButton from '../../components/common/PrimaryButton';
import TextInputField from '../../components/common/TextInputField';
import { useAuth } from '../../context/AuthContext';
import {
  getUserAlarmPreferences,
  updateUserAlarmPreferences,
} from '../../services/userSettingsService';
import { TransportMode, UserAlarmPreferences } from '../../types/models';
import { useNetwork } from '../../context/NetworkContext';
import { SettingsStackParamList } from '../../navigation/navigationTypes';
import { useAppTheme } from '../../theme/useAppTheme';

const transportOptions: TransportMode[] = ['BUS', 'METRO', 'METROBUS'];

type Navigation = NativeStackNavigationProp<SettingsStackParamList, 'Account'>;

const AccountScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { user, logout, deleteAccount } = useAuth();
  const { isOnline } = useNetwork();
  const { colors } = useAppTheme();
  const [preferences, setPreferences] = useState<UserAlarmPreferences | null>(null);
  const [distanceInput, setDistanceInput] = useState('400');
  const [transportMode, setTransportMode] = useState<TransportMode>('BUS');
  const [minutesBefore, setMinutesBefore] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const prefs = await getUserAlarmPreferences(user.uid);
        if (mounted) {
          setPreferences(prefs);
          setDistanceInput(String(prefs.defaultDistanceMeters));
          setTransportMode(prefs.defaultTransportMode);
          setMinutesBefore(prefs.defaultMinutesBefore);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Alarm tercihleri alınamadı', error);
        }
        captureError(error, 'AccountScreen/loadPreferences');
        Alert.alert('Hata', 'Alarm tercihleri yüklenirken sorun oluştu.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadPreferences();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ textAlign: 'center', color: colors.textMuted }}>
            Hesap bilgilerini görmek için giriş yapmalısın.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSavePreferences = async () => {
    const parsedDistance = Number(distanceInput);
    if (!Number.isFinite(parsedDistance)) {
      Alert.alert('Hata', 'Lütfen geçerli bir mesafe girin.');
      return;
    }
    const clampedDistance = Math.min(Math.max(parsedDistance, 50), 5000);
    const prefs: UserAlarmPreferences = {
      defaultDistanceMeters: clampedDistance,
      defaultTransportMode: transportMode,
      defaultMinutesBefore: minutesBefore,
    };
    if (!isOnline) {
      Alert.alert(
        'Bir hata oluştu',
        'İnternet bağlantısı yok. Lütfen bağlantıyı kontrol edip tekrar deneyin.',
      );
      return;
    }
    try {
      setSaving(true);
      await updateUserAlarmPreferences(user.uid, prefs);
      setPreferences(prefs);
      Alert.alert('Güncellendi', 'Varsayılan alarm ayarların kaydedildi.');
    } catch (error) {
      if (__DEV__) {
        console.warn('Alarm tercihleri kaydedilemedi', error);
      }
      captureError(error, 'AccountScreen/savePreferences');
      Alert.alert('Bir hata oluştu', 'Ayarlar kaydedilirken sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      if (__DEV__) {
        console.warn('Çıkış yapılamadı', error);
      }
      captureError(error, 'AccountScreen/logout');
      Alert.alert('Hata', 'Çıkış yapılırken sorun oluştu.');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabın, tüm alarm geçmişin, kayıtlı hedeflerin ve favori durakların kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek için şifrenizi girmeniz gerekecek. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, sil',
          style: 'destructive',
          onPress: () => {
            setShowPasswordModal(true);
            setPassword('');
            setPasswordError(null);
          },
        },
      ],
    );
  };

  const handleConfirmDelete = async () => {
    if (!password.trim()) {
      setPasswordError('Lütfen şifrenizi girin');
      return;
    }

    try {
      setDeleting(true);
      setPasswordError(null);
      await deleteAccount(password);
      setShowPasswordModal(false);
      Alert.alert('Hesap silindi', 'Hesabın ve tüm verilerin kalıcı olarak silindi.');
    } catch (error: any) {
      if (__DEV__) {
        console.warn('Hesap silinemedi', error);
      }
      captureError(error, 'AccountScreen/deleteAccount');
      
      let message = 'Hesap silinirken bir hata oluştu. Lütfen tekrar dene.';
      if (error?.code === 'auth/requires-recent-login') {
        message = 'Güvenlik için lütfen tekrar giriş yaptıktan sonra silmeyi dene.';
      } else if (error?.code === 'auth/wrong-password') {
        message = 'Şifre hatalı. Lütfen doğru şifrenizi girin.';
        setPasswordError('Şifre hatalı');
      } else if (error?.code === 'auth/invalid-credential') {
        message = 'Şifre hatalı. Lütfen doğru şifrenizi girin.';
        setPasswordError('Şifre hatalı');
      } else if (error?.message) {
        message = error.message;
      }
      
      Alert.alert('Hata', message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Hesap</Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Hesap bilgilerini ve varsayılan alarm ayarlarını buradan yönetebilirsin.
        </Text>
      </View>

      <View style={{ marginBottom: 24, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>{user.displayName ?? 'Kullanıcı'}</Text>
        <Text style={{ color: colors.textMuted }}>{user.email}</Text>
        <TouchableOpacity onPress={handleLogout} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>Çıkış yap</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.text }}>Alarm Varsayılanları</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <View style={{ marginBottom: 16 }}>
            <TextInputField
              label="Varsayılan Mesafe (m)"
              value={distanceInput}
              onChangeText={(text) => setDistanceInput(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            <Text style={{ color: colors.textLight, marginTop: 4 }}>50 - 5000 metre arası önerilir.</Text>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.text }}>Varsayılan Taşıt Türü</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {transportOptions.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setTransportMode(mode)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: transportMode === mode ? colors.primary : colors.border,
                    backgroundColor: transportMode === mode ? colors.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      color: transportMode === mode ? colors.white : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {mode === 'BUS' ? 'Otobüs' : mode === 'METRO' ? 'Metro' : 'Metrobüs'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.text }}>Kaç dakika önce uyarsın?</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 8,
                backgroundColor: colors.cardBackground,
              }}
            >
              <TouchableOpacity
                onPress={() => setMinutesBefore((prev) => Math.max(2, prev - 1))}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.border,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>-</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{minutesBefore} dk</Text>
              <TouchableOpacity
                onPress={() => setMinutesBefore((prev) => Math.min(5, prev + 1))}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.border,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <PrimaryButton
            title="Ayarları Kaydet"
            onPress={handleSavePreferences}
            disabled={saving}
          />
        </>
      )}

      <View
        style={{
          marginTop: 32,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.dangerSoft,
          backgroundColor: colors.dangerSoft,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.danger, marginBottom: 8 }}>
          Hesabı Sil
        </Text>
        <Text style={{ color: colors.danger, marginBottom: 12, opacity: 0.9 }}>
          Hesap, tüm alarm geçmişi, alarm profilleri, özel hedefler ve favori duraklar kalıcı olarak silinecek. Bu işlem geri alınamaz.
        </Text>
        <PrimaryButton
          title={deleting ? 'Hesap siliniyor...' : 'Hesabımı kalıcı olarak sil'}
          onPress={handleDeleteAccount}
          disabled={deleting}
          style={{ backgroundColor: colors.danger }}
        />
      </View>


      {/* Şifre Doğrulama Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!deleting) {
            setShowPasswordModal(false);
            setPassword('');
            setPasswordError(null);
          }
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8, color: colors.text }}>
              Şifre Doğrulama
            </Text>
            <Text style={{ color: colors.textMuted, marginBottom: 20 }}>
              Hesabınızı silmek için lütfen şifrenizi girin.
            </Text>

            <Text style={{ fontWeight: '600', marginBottom: 8, color: colors.text }}>Şifre</Text>
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(null);
              }}
              secureTextEntry
              placeholder="Şifrenizi girin"
              placeholderTextColor={colors.textLight}
              style={{
                borderWidth: 1,
                borderColor: passwordError ? colors.danger : colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: passwordError ? 8 : 20,
                color: colors.text,
                backgroundColor: colors.cardBackground,
              }}
              editable={!deleting}
            />
            {passwordError && (
              <Text style={{ color: colors.danger, marginBottom: 20, fontSize: 14 }}>
                {passwordError}
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  if (!deleting) {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError(null);
                  }
                }}
                disabled={deleting}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  backgroundColor: colors.cardBackground,
                }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.danger,
                  alignItems: 'center',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '600' }}>
                  {deleting ? 'Siliniyor...' : 'Onayla ve Sil'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

export default AccountScreen;

