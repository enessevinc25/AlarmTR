import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, Platform, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import * as Device from 'expo-device';
import ScreenContainer from '../../components/common/ScreenContainer';
import { SettingsStackParamList } from '../../navigation/navigationTypes';
import { useAppTheme } from '../../theme/useAppTheme';
import PrimaryButton from '../../components/common/PrimaryButton';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SamsungBattery'>;

const SamsungBatteryScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  const isSamsung = Device.manufacturer?.toLowerCase().includes('samsung') ?? false;

  const openBatterySettings = async () => {
    try {
      // Android battery optimization settings
      if (Platform.OS === 'android') {
        const intent = 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS';
        const canOpen = await Linking.canOpenURL(`intent:#Intent;action=${intent};end`);
        if (canOpen) {
          await Linking.openURL(`intent:#Intent;action=${intent};end`);
        } else {
          // Fallback: app settings
          await Linking.openSettings();
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[SamsungBatteryScreen] Settings açılamadı', error);
      }
      // Fallback: genel app settings
      await Linking.openSettings();
    }
  };

  const openAppDetails = async () => {
    try {
      if (Platform.OS === 'android') {
        const packageName = 'com.laststop.alarmtr';
        const intent = `android.settings.APPLICATION_DETAILS_SETTINGS`;
        await Linking.openURL(`intent:#Intent;action=${intent};data=package:${packageName};end`);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[SamsungBatteryScreen] App details açılamadı', error);
      }
      await Linking.openSettings();
    }
  };

  if (!isSamsung && Platform.OS === 'android') {
    return (
      <ScreenContainer>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Bu ekran Samsung cihazlar için
          </Text>
          <Text style={{ color: colors.textMuted }}>
            Cihazınız Samsung değil. Bu ayarlar diğer Android cihazlarda da geçerli olabilir.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <ScrollView>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            Arka Planda Çalışma (Samsung)
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 24 }}>
            Alarm takibinin ekran kilitliyken çalışması için aşağıdaki ayarları yapmanız gerekiyor.
          </Text>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Adım 1: Battery Optimization
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              1. "Battery Optimization" ayarlarını açın
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              2. "LastStop Alarm TR" uygulamasını bulun
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              3. "Unrestricted" seçeneğini seçin
            </Text>
            <PrimaryButton
              title="Battery Optimization Ayarlarını Aç"
              onPress={openBatterySettings}
              style={{ marginTop: 12 }}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Adım 2: Background Usage Limits
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              1. "App info" veya "Uygulama bilgileri"ne gidin
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              2. "Battery" veya "Pil" bölümüne gidin
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              3. "Background usage limits" veya "Arka plan kullanım limitleri"ni kontrol edin
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              4. "Sleeping apps" veya "Uyuyan uygulamalar" listesinde uygulama olmamalı
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              5. "Deep sleeping apps" veya "Derin uyku uygulamaları" listesinde de olmamalı
            </Text>
            <PrimaryButton
              title="Uygulama Bilgilerini Aç"
              onPress={openAppDetails}
              style={{ marginTop: 12 }}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Adım 3: Put Unused Apps to Sleep (Opsiyonel)
            </Text>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              "Kullanılmayan uygulamaları uyut" özelliği kapalı olmalı veya LastStop Alarm TR bu listede olmamalı.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.primarySoft,
              padding: 16,
              borderRadius: 12,
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 8 }}>
              ⚠️ Önemli
            </Text>
            <Text style={{ color: colors.text, marginBottom: 4 }}>
              • Bu ayarlar yapılmazsa alarm takibi ekran kilitliyken çalışmayabilir.
            </Text>
            <Text style={{ color: colors.text, marginBottom: 4 }}>
              • "Force stop" yapılırsa uygulama tamamen durur (beklenen davranış).
            </Text>
            <Text style={{ color: colors.text }}>
              • "Deep sleeping apps" listesindeyse alarm takibi çalışmayabilir.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default SamsungBatteryScreen;

