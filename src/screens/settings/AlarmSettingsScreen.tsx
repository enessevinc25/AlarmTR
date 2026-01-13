import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAppTheme } from '../../theme/useAppTheme';
import {
  AlarmSettings,
  AlarmSoundProfile,
  AlarmVibrationProfile,
  useAlarmSettings,
} from '../../context/AlarmSettingsContext';
import {
  ensureNotificationPermissions,
  showNotificationPermissionDeniedDialog,
} from '../../services/notificationService';
import { initializeNotifications, scheduleAlarmNotification } from '../../services/alarmService';

type Option<T> = {
  value: T;
  title: string;
  description: string;
};

const soundOptions: Option<AlarmSoundProfile>[] = [
  {
    value: 'device',
    title: 'Telefon zil sesi (cihaz varsayılan)',
    description: 'Cihazın sistem varsayılan zil sesini kullan. Ayarlar > Sesler ve Titreşimler\'den değiştirebilirsin.',
  },
  {
    value: 'default',
    title: 'Varsayılan',
    description: 'Dengeli ses & titreşim profili.',
  },
  {
    value: 'soft',
    title: 'Yumuşak',
    description: 'Daha hafif ses ve kısa titreşim.',
  },
  {
    value: 'loud',
    title: 'Yüksek',
    description: 'En yüksek ses ve belirgin titreşim.',
  },
  {
    value: 'silent',
    title: 'Sessiz',
    description: 'Sadece titreşim veya sessiz uyarı.',
  },
];

const vibrationOptions: Option<AlarmVibrationProfile>[] = [
  {
    value: 'off',
    title: 'Titreşim yok',
    description: 'Sadece sesle uyar.',
  },
  {
    value: 'short',
    title: 'Kısa titreşim',
    description: 'Standart titreşim döngüsü.',
  },
  {
    value: 'intense',
    title: 'Yoğun titreşim',
    description: 'Daha uzun ve sık titreşim.',
  },
];

const AlarmSettingsScreen = () => {
  const { settings, loading, updateSettings } = useAlarmSettings();
  const { colors } = useAppTheme();
  const [updating, setUpdating] = useState<'sound' | 'vibration' | null>(null);
  const [testing, setTesting] = useState(false);

  const handleSelectSound = async (value: AlarmSoundProfile) => {
    if (settings.soundProfile === value) {
      return;
    }
    setUpdating('sound');
    try {
      await updateSettings({ soundProfile: value });
    } catch (error) {
      if (__DEV__) {
        console.warn('Ses profili güncellenemedi', error);
      }
      Alert.alert('Hata', 'Ses profili kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setUpdating(null);
    }
  };

  const handleSelectVibration = async (value: AlarmVibrationProfile) => {
    if (settings.vibrationProfile === value) {
      return;
    }
    setUpdating('vibration');
    try {
      await updateSettings({ vibrationProfile: value });
    } catch (error) {
      if (__DEV__) {
        console.warn('Titreşim profili güncellenemedi', error);
      }
      Alert.alert('Hata', 'Titreşim profili kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setUpdating(null);
    }
  };

  const handleTestProfile = async () => {
    setTesting(true);
    try {
      const result = await ensureNotificationPermissions();
      if (!result.granted) {
        if (!result.canAskAgain) {
          showNotificationPermissionDeniedDialog();
        } else {
          Alert.alert(
            'Bildirim izni gerekli',
            'Alarm profilini test etmek için bildirim izni vermen gerekiyor.',
          );
        }
        return;
      }
      await initializeNotifications();
      await scheduleAlarmNotification(
        {
          title: 'Alarm testi',
          body: 'Seçtiğin profil bu şekilde çalacak.',
        },
        settings,
      );
    } catch (error) {
      if (__DEV__) {
        console.warn('Alarm testi başarısız', error);
      }
      Alert.alert('Hata', 'Alarm profili test edilirken bir sorun oluştu.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  const renderOption = <T extends string>(
    option: Option<T>,
    currentValue: string,
    disabled: boolean,
    onSelect: (value: T) => void,
  ) => {
    const isActive = currentValue === option.value;
    return (
      <Pressable
        key={option.value}
        onPress={() => onSelect(option.value)}
        disabled={disabled}
        style={[
          styles.optionRow,
          isActive ? styles.optionRowActive : undefined,
          disabled ? styles.optionRowDisabled : undefined,
        ]}
      >
        <View style={styles.optionTextWrapper}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
        <View style={[styles.radioOuter, isActive ? styles.radioOuterActive : undefined]}>
          {isActive ? <View style={styles.radioInner} /> : null}
        </View>
      </Pressable>
    );
  };

  const isUpdating = updating !== null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.sectionTitle}>Ses Profili</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {soundOptions.map((option) =>
            renderOption(option, settings.soundProfile, isUpdating, handleSelectSound),
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Titreşim Profili</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {vibrationOptions.map((option) =>
            renderOption(option, settings.vibrationProfile, isUpdating, handleSelectVibration),
          )}
        </View>

        <PrimaryButton
          title={testing ? 'Test gönderiliyor...' : 'Profili Test Et'}
          onPress={handleTestProfile}
          disabled={testing || isUpdating}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  optionRowActive: {
    backgroundColor: '#ecfeff',
  },
  optionRowDisabled: {
    opacity: 0.6,
  },
  optionTextWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  optionDescription: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#0E7490',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0E7490',
  },
});

export default AlarmSettingsScreen;


