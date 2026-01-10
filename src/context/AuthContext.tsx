import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from 'firebase/auth';
import {
  login as loginRequest,
  logout as logoutRequest,
  sendPasswordReset,
  signUp as signUpRequest,
  subscribeAuthState,
  deleteAccountAndData,
} from '../services/authService';
import { auth } from '../services/firebase';
import { captureError } from '../utils/errorReporting';
import { logEvent } from '../services/telemetry';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  deleteAccount(password: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeAuthState((nextUser) => {
        try {
          setUser(nextUser);
          setInitializing(false);
          // Log auth state change
          logEvent('AUTH_STATE', {
            state: nextUser ? 'SIGNED_IN' : 'SIGNED_OUT',
          });
        } catch (error) {
          if (__DEV__) {
            console.warn('[AuthContext] Auth state callback hatası', error);
          }
          captureError(error, 'AuthContext/authStateCallback');
          setInitializing(false);
        }
      });
    } catch (error) {
      if (__DEV__) {
        console.error('[AuthContext] Auth state subscription hatası', error);
      }
      captureError(error, 'AuthContext/subscribeAuthState');
      setInitializing(false);
    }
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          if (__DEV__) {
            console.warn('[AuthContext] Auth state unsubscribe hatası', error);
          }
        }
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await loginRequest(email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutRequest();
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await signUpRequest(email, password, name);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordReset(email);
  };

  const deleteAccount = async (password: string) => {
    if (!auth.currentUser) {
      throw new Error('Silinecek kullanıcı bulunamadı');
    }
    setLoading(true);
    try {
      await deleteAccountAndData(auth.currentUser, password);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      initializing,
      loading,
      login,
      logout,
      signUp,
      sendPasswordReset: resetPassword,
      deleteAccount,
    }),
    [user, initializing, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth sadece AuthProvider içinde kullanılabilir');
  }
  return context;
};

