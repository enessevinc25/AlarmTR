import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeLandingScreen from '../screens/home/HomeLandingScreen';
import HomeMapScreen from '../screens/home/HomeMapScreen';
import StopSearchScreen from '../screens/home/StopSearchScreen';
import AlarmDetailsScreen from '../screens/home/AlarmDetailsScreen';
import ActiveAlarmScreen from '../screens/home/ActiveAlarmScreen';
import AlarmTriggeredScreen from '../screens/home/AlarmTriggeredScreen';
import AlarmPreflightScreen from '../screens/home/AlarmPreflightScreen';
import { HomeStackParamList } from './navigationTypes';
import { useAppTheme } from '../theme/useAppTheme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => {
  const { colors } = useAppTheme();
  
  return (
    <Stack.Navigator 
      initialRouteName="HomeLanding"
      screenOptions={{
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
        name="HomeLanding"
        component={HomeLandingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HomeMap"
        component={HomeMapScreen}
        options={{ title: 'LastStop', headerShown: false }}
      />
      <Stack.Screen
        name="StopSearch"
        component={StopSearchScreen}
        options={{ title: 'Durak Seç' }}
      />
      <Stack.Screen
        name="AlarmDetails"
        component={AlarmDetailsScreen}
        options={{ title: 'Alarm Detayları' }}
      />
      <Stack.Screen
        name="ActiveAlarm"
        component={ActiveAlarmScreen}
        options={{ title: 'Aktif Alarm' }}
      />
      <Stack.Screen
        name="AlarmTriggered"
        component={AlarmTriggeredScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AlarmPreflight"
        component={AlarmPreflightScreen}
        options={{ title: 'Alarm Ön Kontrol' }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;

