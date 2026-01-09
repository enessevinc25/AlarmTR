import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import { requestIgnoreBatteryOptimizations } from '../../services/batteryOptimization';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAppTheme } from '../../theme/useAppTheme';

const iosSteps = [
  'Ayarlar uygulamasını aç.',
  'Aşağı kaydırıp “LastStop Alarm TR” yi seç.',
  'Konum için “Uygulamayı Kullanırken” veya “Her Zaman” seç.',
  'Bildirimleri aktif edip uyarı stilini açık tut.',
];

const androidSteps = [
  'Ayarlar > Uygulamalar > LastStop Alarm TR yolunu takip et.',
  'İzinler bölümünden Konum iznini “İzin ver” olarak ayarla.',
  'Bildirime izin ver seçeneğini aç.',
  'Pil optimizasyonu engelliyorsa “Sınırsız” olarak güncelle.',
];

const PermissionsHelpScreen = () => {
  const steps = Platform.OS === 'ios' ? iosSteps : androidSteps;
  const { colors } = useAppTheme();

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      if (__DEV__) {
        console.warn('Ayarlar açılamadı', error);
      }
      captureError(error, 'PermissionsHelpScreen/openSettings');
    }
  };

  const handleRequestBatteryOptimization = async () => {
    try {
      await requestIgnoreBatteryOptimizations();
    } catch (error) {
      if (__DEV__) {
        console.warn('Pil optimizasyonu istisnası açılamadı', error);
      }
      captureError(error, 'PermissionsHelpScreen/requestBatteryOptimization');
    }
  };

  return (
    <ScreenContainer>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>İzinler Nasıl Açılır?</Text>
        <Text style={{ color: '#64748b', marginTop: 6 }}>
          Konum ve bildirim izinlerini kapattıysan aşağıdaki adımları izleyerek tekrar açabilirsin.
        </Text>
      </View>

      {steps.map((step, index) => (
        <View key={step} style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
          <Text style={{ fontWeight: '700', color: colors.primary }}>{index + 1}.</Text>
          <Text style={{ flex: 1, color: colors.textMuted }}>{step}</Text>
        </View>
      ))}

      {/* Android: Pil Optimizasyonu İstisnası */}
      {Platform.OS === 'android' && (
        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            Pil Optimizasyonu
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
            Alarmın arka planda stabil çalışması için uygulamayı optimizasyondan hariç tut.
          </Text>
          <PrimaryButton
            title="İstisna İste"
            onPress={handleRequestBatteryOptimization}
            style={{ marginBottom: 12 }}
          />
        </View>
      )}

      <PrimaryButton
        title="Cihaz Ayarlarını Aç"
        onPress={handleOpenSettings}
        style={{ marginTop: 8 }}
      />
    </ScreenContainer>
  );
};

export default PermissionsHelpScreen;

