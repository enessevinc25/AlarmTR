import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Switch, Text, View, Linking, Alert } from 'react-native';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import { SettingsStackParamList } from '../../navigation/navigationTypes';
import { isDevEnv } from '../../utils/env';
import { useAppTheme } from '../../theme/useAppTheme';
import { useTheme } from '../../context/ThemeContext';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

const options = [
  {
    label: 'Alarm Profilleri',
    description: 'Sık kullandığın alarm ayarlarını kaydet.',
    route: 'AlarmProfiles' as const,
  },
  {
    label: 'Alarm Ses & Titreşim',
    description: 'Alarm sesi ve titreşim profilini seç.',
    route: 'AlarmSettings' as const,
  },
  {
    label: 'İzin Yardımı',
    description: 'Konum/Bildirim izinlerini nasıl açacağını öğren.',
    route: 'PermissionsHelp' as const,
  },
  {
    label: 'Hesabım',
    description: 'Varsayılan mesafe ve tercihlerini düzenle.',
    route: 'Account' as const,
  },
];

const SettingsHomeScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  const { setColorScheme, isDark } = useTheme();
  const isSamsung = Device.manufacturer?.toLowerCase().includes('samsung') ?? false;
  
  const handleThemeToggle = async (value: boolean) => {
    await setColorScheme(value ? 'dark' : 'light');
  };
  
  return (
    <ScreenContainer>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Ayarlar</Text>
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>
          Varsayılan alarm mesafesi: 400 m (yakında özelleştirilebilir)
        </Text>
      </View>

      {/* Dark Mode Toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Karanlık Mod</Text>
          <Text style={{ color: colors.textLight, marginTop: 4 }}>
            {isDark ? 'Karanlık tema aktif' : 'Açık tema aktif'}
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={handleThemeToggle}
          trackColor={{ false: colors.border, true: colors.primarySoft }}
          thumbColor={isDark ? colors.primary : colors.gray400}
        />
      </View>

      {options.map((item) => (
        <Pressable
          key={item.route}
          onPress={() => navigation.navigate(item.route)}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityHint={item.description}
          style={{
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{item.label}</Text>
          <Text style={{ color: colors.textLight }}>{item.description}</Text>
        </Pressable>
      ))}

      {/* Samsung Battery (sadece Samsung cihazlarda) */}
      {isSamsung && Platform.OS === 'android' && (
        <Pressable
          onPress={() => navigation.navigate('SamsungBattery')}
          accessibilityRole="button"
          accessibilityLabel="Arka Planda Çalışma (Samsung)"
          style={{
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: colors.border,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            Arka Planda Çalışma (Samsung)
          </Text>
          <Text style={{ color: colors.textLight }}>
            Alarm takibinin ekran kilitliyken çalışması için Samsung ayarları
          </Text>
        </Pressable>
      )}

      {/* Diagnostics (her zaman görünür) */}
      <Pressable
        onPress={() => navigation.navigate('Diagnostics')}
        accessibilityRole="button"
        accessibilityLabel="Diagnostics"
        style={{
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderColor: colors.border,
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Diagnostics</Text>
        <Text style={{ color: colors.textLight }}>
          Alarm takibi durumunu ve sistem bilgilerini görüntüle
        </Text>
      </Pressable>

      {isDevEnv() && (
        <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontWeight: '700', marginBottom: 12, color: colors.text }}>Geliştirici Araçları</Text>
          <Pressable
            onPress={() => navigation.navigate('AlarmDebug')}
            accessibilityRole="button"
            accessibilityLabel="Alarm Debug Paneli"
            accessibilityHint="Alarm sisteminin durumunu gözlemle (sadece dev/test)"
            style={{
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Alarm Debug Paneli</Text>
            <Text style={{ color: colors.textLight }}>
              Alarm sisteminin durumunu gözlemle (sadece dev/test)
            </Text>
          </Pressable>
        </View>
      )}

      {/* Legal Links */}
      <View style={{ marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12 }}>Yasal</Text>
        <Pressable
          onPress={() => {
            // GitHub Pages URL formatı: https://[username].github.io/[repository-name]/privacy-policy.html
            // GitHub Pages'i aktifleştirdikten sonra [username] ve [repository-name] kısımlarını değiştirin
            // Kurulum rehberi: docs/GITHUB_PAGES_SETUP.md
            const privacyPolicyUrl = 'https://enessevinc25.github.io/AlarmTR/privacy-policy.html';
            Linking.openURL(privacyPolicyUrl).catch(() => {
              Alert.alert('Hata', 'Gizlilik Politikası açılamadı. Lütfen daha sonra tekrar deneyin.');
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Gizlilik Politikası"
          style={{
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.textMuted }}>Gizlilik Politikası</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            // GitHub Pages URL formatı: https://[username].github.io/[repository-name]/terms-of-service.html
            // GitHub Pages'i aktifleştirdikten sonra [username] ve [repository-name] kısımlarını değiştirin
            // Kurulum rehberi: docs/GITHUB_PAGES_SETUP.md
            const termsUrl = 'https://enessevinc25.github.io/AlarmTR/terms-of-service.html';
            Linking.openURL(termsUrl).catch(() => {
              Alert.alert('Hata', 'Kullanım Şartları açılamadı. Lütfen daha sonra tekrar deneyin.');
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Kullanım Şartları"
          style={{
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.textMuted }}>Kullanım Şartları</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: '700', color: colors.text }}>Hakkında</Text>
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>
          LastStop Alarm TR, toplu taşımada durağını kaçırmaman için geliştirildi.
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>
          Versiyon 1.1.0
        </Text>
      </View>
    </ScreenContainer>
  );
};

export default SettingsHomeScreen;

