import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeStackNavigator from './HomeStackNavigator';
import StopsStackNavigator from './StopsStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import { MainTabsParamList } from './navigationTypes';
import { useAppTheme } from '../theme/useAppTheme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const MainTabsNavigator = () => {
  const { colors, isDark } = useAppTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof MainTabsParamList, string> = {
            HomeTab: 'home',
            StopsTab: 'bus',
            SettingsTab: 'settings',
          };
          const iconName =
            (icons[route.name as keyof MainTabsParamList] ??
              'ellipse') as React.ComponentProps<typeof Ionicons>['name'];
          return <Ionicons name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="StopsTab" component={StopsStackNavigator} options={{ title: 'Duraklar' }} />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: 'Ayarlar' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabsNavigator;

