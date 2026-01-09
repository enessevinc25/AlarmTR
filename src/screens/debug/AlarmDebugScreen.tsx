import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, Text, View, StyleSheet } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import { SettingsStackParamList } from '../../navigation/navigationTypes';
import { useAlarm } from '../../context/AlarmContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/date';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AlarmDebug'>;

/**
 * Alarm Debug Screen
 * 
 * Sadece development/test ortamında görünür.
 * Alarm sisteminin durumunu gözlemlemek için kullanılır:
 * - Aktif alarm session bilgisi
 * - Son bilinen kullanıcı konumu (eğer tutuluyorsa)
 * - Son hesaplanan mesafe
 * - Alarm durumu
 */
const AlarmDebugScreen = ({}: Props) => {
  const { activeAlarmSession } = useAlarm();
  const { user } = useAuth();

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kullanıcı Bilgisi</Text>
              <Text style={styles.infoText}>User ID: {user?.uid ?? 'Giriş yapılmamış'}</Text>
              <Text style={styles.infoText}>Email: {user?.email ?? 'E-posta bilgisi yok'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktif Alarm Session</Text>
          {activeAlarmSession ? (
            <>
              <Text style={styles.infoText}>Session ID: {activeAlarmSession.id}</Text>
              <Text style={styles.infoText}>Durum: {activeAlarmSession.status}</Text>
              <Text style={styles.infoText}>Hedef: {activeAlarmSession.targetName}</Text>
              <Text style={styles.infoText}>
                Hedef Tip: {activeAlarmSession.targetType === 'STOP' ? 'Durak' : 'Özel'}
              </Text>
              <Text style={styles.infoText}>Hedef ID: {activeAlarmSession.targetId}</Text>
              <Text style={styles.infoText}>
                Mesafe Eşiği: {activeAlarmSession.distanceThresholdMeters} m
              </Text>
              <Text style={styles.infoText}>
                Hedef Konum: {activeAlarmSession.targetLat.toFixed(6)},{' '}
                {activeAlarmSession.targetLon.toFixed(6)}
              </Text>
              {activeAlarmSession.lastKnownDistanceMeters !== undefined ? (
                <Text style={styles.infoText}>
                  Son Mesafe: {activeAlarmSession.lastKnownDistanceMeters} m
                </Text>
              ) : (
                <Text style={styles.infoText}>Son Mesafe: Henüz hesaplanmadı</Text>
              )}
              {activeAlarmSession.triggeredAt ? (
                <Text style={styles.infoText}>
                  Tetiklenme Zamanı: {formatDate(activeAlarmSession.triggeredAt)}
                </Text>
              ) : (
                <Text style={styles.infoText}>Tetiklenme Zamanı: Henüz tetiklenmedi</Text>
              )}
              {activeAlarmSession.createdAt ? (
                <Text style={styles.infoText}>
                  Oluşturulma: {formatDate(activeAlarmSession.createdAt)}
                </Text>
              ) : (
                <Text style={styles.infoText}>Oluşturulma: Bilgi yok</Text>
              )}
              {activeAlarmSession.updatedAt ? (
                <Text style={styles.infoText}>
                  Son Güncelleme: {formatDate(activeAlarmSession.updatedAt)}
                </Text>
              ) : (
                <Text style={styles.infoText}>Son Güncelleme: Bilgi yok</Text>
              )}
            </>
          ) : (
            <Text style={styles.infoText}>Aktif alarm yok</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <Text style={styles.noteText}>
            • Bu ekran sadece development/test ortamında görünür.{'\n'}
            • Production'da bu ekrana erişilemez.{'\n'}
            • Alarm durumunu gözlemlemek için kullanılır.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  noteText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
});

export default AlarmDebugScreen;


