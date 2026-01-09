import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';

const RouteFavoritesScreen = () => {
  const navigation = useNavigation();

  return (
    <ScreenContainer>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 40, marginBottom: 4 }}>⭐</Text>
        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
          Favori rotalar yakında
        </Text>
        <Text style={{ color: '#64748b', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
          Sık kullandığın hat ve durak kombinasyonlarını tek dokunuşla seçebileceğin “favori rotalar”
          özelliği üzerinde çalışıyoruz. Şimdilik harita veya arama ekranından durak seçerek alarm
          kurmaya devam edebilirsin.
        </Text>
        <PrimaryButton title="Geri Dön" onPress={() => navigation.goBack()} />
      </View>
    </ScreenContainer>
  );
};

export default RouteFavoritesScreen;