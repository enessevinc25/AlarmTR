import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_FLAG_KEY = 'HAS_COMPLETED_ONBOARDING_V1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_FLAG_KEY);
    return value === 'true';
  } catch (error) {
    if (__DEV__) {
      console.warn('Onboarding bayrağı okunamadı', error);
    }
    return false;
  }
}

export async function setOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_FLAG_KEY, 'true');
  } catch (error) {
    if (__DEV__) {
      console.warn('Onboarding bayrağı kaydedilemedi', error);
    }
  }
}


