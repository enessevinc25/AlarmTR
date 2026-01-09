import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsHomeScreen from '../screens/settings/SettingsHomeScreen';
import AlarmProfilesScreen from '../screens/settings/AlarmProfilesScreen';
import PermissionsHelpScreen from '../screens/settings/PermissionsHelpScreen';
import AccountScreen from '../screens/settings/AccountScreen';
import AlarmSettingsScreen from '../screens/settings/AlarmSettingsScreen';
import SamsungBatteryScreen from '../screens/settings/SamsungBatteryScreen';
import DiagnosticsScreen from '../screens/settings/DiagnosticsScreen';
import ReportIssueScreen from '../screens/settings/ReportIssueScreen';
import AlarmDebugScreen from '../screens/debug/AlarmDebugScreen';
import { SettingsStackParamList } from './navigationTypes';
import { isDevEnv } from '../utils/env';
import { useAppTheme } from '../theme/useAppTheme';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsStackNavigator = () => {
  const { colors } = useAppTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary,
        headerStyle: {
          backgroundColor: colors.cardBackground,
        },
        headerTitleStyle: {
          color: colors.text,
        },
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{ title: 'Ayarlar', headerShown: false }}
      />
      <Stack.Screen
        name="AlarmProfiles"
        component={AlarmProfilesScreen}
        options={{ title: 'Alarm Profilleri' }}
      />
      <Stack.Screen
        name="AlarmSettings"
        component={AlarmSettingsScreen}
        options={{ title: 'Alarm Ses & Titreşim' }}
      />
      <Stack.Screen
        name="PermissionsHelp"
        component={PermissionsHelpScreen}
        options={{ title: 'İzin Yardımı' }}
      />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Hesabım' }}
      />
      <Stack.Screen
        name="SamsungBattery"
        component={SamsungBatteryScreen}
        options={{ title: 'Arka Planda Çalışma (Samsung)' }}
      />
      <Stack.Screen
        name="Diagnostics"
        component={DiagnosticsScreen}
        options={{ title: 'Diagnostics' }}
      />
      <Stack.Screen
        name="ReportIssue"
        component={ReportIssueScreen}
        options={{ title: 'Sorun Bildir' }}
      />
      {isDevEnv() && (
        <Stack.Screen
          name="AlarmDebug"
          component={AlarmDebugScreen}
          options={{ title: 'Alarm Debug Paneli' }}
        />
      )}
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator;

