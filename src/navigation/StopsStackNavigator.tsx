import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StopsHomeScreen from '../screens/stops/StopsHomeScreen';
import SavedStopsScreen from '../screens/stops/SavedStopsScreen';
import CustomTargetFormScreen from '../screens/stops/CustomTargetFormScreen';
import RouteFavoritesScreen from '../screens/stops/RouteFavoritesScreen';
import { StopsStackParamList } from './navigationTypes';
import { useAppTheme } from '../theme/useAppTheme';

const Stack = createNativeStackNavigator<StopsStackParamList>();

const StopsStackNavigator = () => {
  const { colors } = useAppTheme();
  
  return (
    <Stack.Navigator 
      initialRouteName="StopsHome"
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
        name="StopsHome"
        component={StopsHomeScreen}
        options={{ title: 'Duraklar', headerShown: false }}
      />
      <Stack.Screen
        name="SavedStops"
        component={SavedStopsScreen}
        options={{ title: 'Kaydedilen Duraklar' }}
      />
      <Stack.Screen
        name="CustomTargetForm"
        component={CustomTargetFormScreen}
        options={{ title: 'Özel Hedef' }}
      />
      <Stack.Screen
        name="RouteFavorites"
        component={RouteFavoritesScreen}
        options={{ title: 'Hat Favorileri' }}
      />
    </Stack.Navigator>
  );
};

export default StopsStackNavigator;

