import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0E7490" />
      <Text style={styles.title}>LastStop Alarm TR</Text>
      <Text style={styles.subtitle}>Lütfen bekleyin...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
  },
});

export default SplashScreen;

