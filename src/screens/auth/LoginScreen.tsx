import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ScreenContainer from '../../components/common/ScreenContainer';
import TextInputField from '../../components/common/TextInputField';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorMessages';
import { useAppTheme } from '../../theme/useAppTheme';

const REMEMBER_ME_KEY = '@laststop/rememberMe';
const REMEMBERED_EMAIL_KEY = '@laststop/rememberedEmail';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation, route }: Props) => {
  const prefillEmail = route.params?.email;
  const [email, setEmail] = useState(prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, loading } = useAuth();
  const { colors } = useAppTheme();

  // Remember me durumunu ve email'i yükle
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [rememberMeValue, rememberedEmail] = await Promise.all([
          AsyncStorage.getItem(REMEMBER_ME_KEY),
          AsyncStorage.getItem(REMEMBERED_EMAIL_KEY),
        ]);
        
        if (!mounted) return;
        
        if (rememberMeValue === 'true') {
          setRememberMe(true);
          if (rememberedEmail && !prefillEmail) {
            setEmail(rememberedEmail);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[LoginScreen] Remember me yükleme hatası', error);
        }
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, [prefillEmail]);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Lütfen e-posta ve şifre girin');
      return;
    }
    try {
      const trimmedEmail = email.trim();
      await login(trimmedEmail, password);
      
      // Login başarılı: remember me durumunu kaydet
      try {
        if (rememberMe) {
          await AsyncStorage.multiSet([
            [REMEMBER_ME_KEY, 'true'],
            [REMEMBERED_EMAIL_KEY, trimmedEmail],
          ]);
        } else {
          await AsyncStorage.multiRemove([REMEMBER_ME_KEY, REMEMBERED_EMAIL_KEY]);
        }
      } catch (storageError) {
        if (__DEV__) {
          console.warn('[LoginScreen] Remember me kaydetme hatası', storageError);
        }
        // Storage hatası login'i engellemez
      }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      if (__DEV__) {
        console.warn('[LoginScreen] Login error:', err);
      }
    }
  };

  return (
    <ScreenContainer>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
          Tekrar hoş geldin
        </Text>
        <Text style={{ marginTop: 8, color: colors.textMuted }}>
          Hesabına giriş yap ve favori duraklarını yönet.
        </Text>
      </View>

      <TextInputField
        label="E-posta"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInputField
        label="Şifre"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      {/* Remember Me Checkbox */}
      <TouchableOpacity
        onPress={() => setRememberMe(!rememberMe)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: rememberMe }}
        accessibilityLabel="Beni hatırla"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderWidth: 2,
            borderColor: rememberMe ? colors.primary : colors.border,
            borderRadius: 4,
            backgroundColor: rememberMe ? colors.primary : 'transparent',
            marginRight: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rememberMe && (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>✓</Text>
          )}
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Beni hatırla</Text>
      </TouchableOpacity>
      
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      <PrimaryButton 
        title="Giriş Yap" 
        onPress={handleSubmit} 
        disabled={loading}
        style={{ backgroundColor: colors.primary }}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('ForgotPassword')}
        accessibilityRole="button"
        accessibilityLabel="Şifremi unuttum"
        accessibilityHint="Şifre sıfırlama ekranına yönlendirir"
      >
        <Text style={{ marginTop: 12, color: colors.primary, textAlign: 'center' }}>
          Şifremi unuttum
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
        <Text style={{ color: colors.textMuted }}>Hesabın yok mu? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          accessibilityRole="button"
          accessibilityLabel="Üye ol"
          accessibilityHint="Kayıt ekranına yönlendirir"
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Üye ol</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

export default LoginScreen;

