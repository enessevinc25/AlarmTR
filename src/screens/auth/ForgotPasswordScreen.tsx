import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import TextInputField from '../../components/common/TextInputField';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorMessages';
import { useAppTheme } from '../../theme/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ route }: Props) => {
  const [email, setEmail] = useState(route.params?.prefillEmail ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { sendPasswordReset } = useAuth();
  const { colors } = useAppTheme();

  const handleReset = async () => {
    setMessage(null);
    setError(null);
    if (!email) {
      setError('Lütfen e-posta girin');
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      setMessage('Şifre sıfırlama e-postası gönderildi.');
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      if (__DEV__) {
        console.warn('[ForgotPasswordScreen] Password reset error:', err);
      }
    }
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16 }}>Şifremi Unuttum</Text>
      <TextInputField
        label="E-posta"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {message ? <Text style={{ color: colors.success }}>{message}</Text> : null}

      <PrimaryButton title="Sıfırlama Bağlantısı Gönder" onPress={handleReset} />
    </ScreenContainer>
  );
};

export default ForgotPasswordScreen;

