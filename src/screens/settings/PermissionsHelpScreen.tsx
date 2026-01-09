import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';

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
          <Text style={{ fontWeight: '700', color: '#0E7490' }}>{index + 1}.</Text>
          <Text style={{ flex: 1, color: '#475569' }}>{step}</Text>
        </View>
      ))}

      <TouchableOpacity
        onPress={handleOpenSettings}
        style={{
          marginTop: 24,
          backgroundColor: '#0E7490',
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Cihaz Ayarlarını Aç</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
};

export default PermissionsHelpScreen;

