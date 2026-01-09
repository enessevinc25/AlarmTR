import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useAppTheme } from '../../theme/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthWelcome'>;

const AuthWelcomeScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  
  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          LastStop Alarm TR
        </Text>
        <Text style={{ fontSize: 16, color: colors.textMuted, lineHeight: 22 }}>
          Yolculuğunuzda ineceğiniz durağa yaklaşırken sizi uyaran, konum tabanlı
          akıllı alarm uygulaması.
        </Text>
      </View>

      <PrimaryButton title="Üye Ol" onPress={() => navigation.navigate('SignUp')} />
      <PrimaryButton
        title="Giriş Yap"
        onPress={() => navigation.navigate('Login')}
        style={{ backgroundColor: colors.gray800 }}
      />
    </ScreenContainer>
  );
};

export default AuthWelcomeScreen;

