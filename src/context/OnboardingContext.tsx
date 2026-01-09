import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { hasCompletedOnboarding, setOnboardingCompleted } from '../services/onboardingService';
import { captureError } from '../utils/errorReporting';

interface OnboardingContextValue {
  hasCompletedOnboarding: boolean;
  onboardingChecked: boolean;
  markOnboardingCompleted(): Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [hasCompleted, setHasCompleted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const completed = await hasCompletedOnboarding();
        if (mounted) {
          setHasCompleted(completed);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Onboarding durumu okunamadı', error);
        }
        captureError(error, 'OnboardingContext/checkOnboarding');
      } finally {
        if (mounted) {
          setChecked(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const markOnboardingCompleted = useCallback(async () => {
    try {
      await setOnboardingCompleted();
      setHasCompleted(true);
    } catch (error) {
      if (__DEV__) {
        console.warn('Onboarding tamamlandı olarak işaretlenemedi', error);
      }
      captureError(error, 'OnboardingContext/markCompleted');
    }
  }, []);

  const value = useMemo(
    () => ({
      hasCompletedOnboarding: hasCompleted,
      onboardingChecked: checked,
      markOnboardingCompleted,
    }),
    [checked, hasCompleted, markOnboardingCompleted],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding yalnızca OnboardingProvider içinde kullanılabilir');
  }
  return context;
};


