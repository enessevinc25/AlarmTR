import { StyleSheet, Text, View } from 'react-native';

import { useNetwork } from '../../context/NetworkContext';
import { useAppTheme } from '../../theme/useAppTheme';

const OfflineBanner = () => {
  const { isOnline } = useNetwork();
  const { colors } = useAppTheme();
  
  if (isOnline) {
    return null;
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.danger }]}>
      <Text style={[styles.text, { color: colors.white }]}>
        İnternet bağlantın yok. Alarm kurma, favori kaydetme ve veri yönetimi geçici olarak
        devre dışı.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default OfflineBanner;

