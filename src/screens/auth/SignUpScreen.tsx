import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, TouchableOpacity } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import TextInputField from '../../components/common/TextInputField';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorMessages';
import { useAppTheme } from '../../theme/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { signUp, loading } = useAuth();
  const { colors } = useAppTheme();

  const handleSubmit = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError('Tüm alanları doldurun');
      return;
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    try {
      await signUp(name.trim(), email.trim(), password);
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      if (__DEV__) {
        console.warn('[SignUpScreen] Signup error:', err);
      }
    }
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 24 }}>
        Hesap Oluştur
      </Text>
      <TextInputField label="Ad Soyad" value={name} onChangeText={setName} />
      <TextInputField
        label="E-posta"
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />
      <TextInputField
        label="Şifre"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <TextInputField
        label="Şifre (Tekrar)"
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
      />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      <PrimaryButton title="Hesap Oluştur" onPress={handleSubmit} disabled={loading} />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ marginTop: 16, textAlign: 'center', color: colors.primary }}>
          Zaten hesabım var
        </Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
};

export default SignUpScreen;

