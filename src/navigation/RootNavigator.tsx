import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/root/SplashScreen';
import AuthWelcomeScreen from '../screens/auth/AuthWelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingIntroScreen from '../screens/onboarding/OnboardingIntroScreen';
import OnboardingPermissionsScreen from '../screens/onboarding/OnboardingPermissionsScreen';
import MainTabsNavigator from './MainTabsNavigator';
import { RootStackParamList } from './navigationTypes';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  // Context'ler zaten App.tsx'te mount edildiği için burada güvenli
  const { user, initializing } = useAuth();
  const { hasCompletedOnboarding, onboardingChecked } = useOnboarding();

  const showSplash = initializing || !onboardingChecked;

  let flow: 'splash' | 'onboarding' | 'auth' | 'main' = 'auth';
  if (showSplash) {
    flow = 'splash';
  } else if (!hasCompletedOnboarding) {
    flow = 'onboarding';
  } else if (!user) {
    flow = 'auth';
  } else {
    flow = 'main';
  }

  return (
    <Stack.Navigator key={flow} screenOptions={{ headerShown: false }}>
      {flow === 'splash' && (
        <Stack.Screen name="Splash" component={SplashScreen} />
      )}

      {flow === 'auth' && (
        <>
          <Stack.Screen name="AuthWelcome" component={AuthWelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}

      {flow === 'onboarding' && (
        <>
          <Stack.Screen name="OnboardingIntro" component={OnboardingIntroScreen} />
          <Stack.Screen
            name="OnboardingPermissions"
            component={OnboardingPermissionsScreen}
          />
        </>
      )}

      {flow === 'main' && (
        <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;

