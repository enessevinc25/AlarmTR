import { FlatList, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { subscribeUserTargets, deleteUserTarget } from '../../services/userTargetsService';
import { UserTarget } from '../../types/models';
import { useCallback, useEffect, useState } from 'react';

const CustomTargetFormScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [targets, setTargets] = useState<UserTarget[]>([]);

  useEffect(() => {
    if (!user) {
      setTargets([]);
      return;
    }
    const unsubscribe = subscribeUserTargets(user.uid, (items) => setTargets(items));
    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleDeleteTarget = useCallback((targetId: string) => {
    Alert.alert('Hedefi sil', 'Bu hedefi silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserTarget(targetId);
          } catch (error) {
            Alert.alert('Hata', 'Hedef silinirken bir hata oluştu.');
          }
        },
      },
    ]);
  }, []);

  return (
    <ScreenContainer>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {user ? (
          <FlatList
            data={targets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 16 }}
            ListHeaderComponent={
              <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
                Kayıtlı özel hedeflerin
              </Text>
            }
            renderItem={({ item }) => (
              <View
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#e2e8f0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#0f172a', fontWeight: '600' }}>
                    {item.name || 'İsimsiz hedef'}
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                    {item.lat.toFixed(5)}, {item.lon.toFixed(5)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteTarget(item.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#e11d48',
                  }}
                >
                  <Text style={{ color: '#e11d48', fontWeight: '600' }}>Sil</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: '#94a3b8', fontSize: 14 }}>
                Henüz kayıtlı özel hedefin yok. Haritada uzun basarak yeni bir hedef oluşturabilirsin.
              </Text>
            }
          />
        ) : (
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>
            Özel hedeflerini görmek için lütfen giriş yap.
          </Text>
        )}

        <View
          style={{
            alignItems: 'center',
            paddingVertical: 24,
            paddingHorizontal: 24,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: 4 }}>🛠️</Text>
          <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
            Özel hedef formu yakında
          </Text>
          <Text style={{ color: '#64748b', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
            Harita üzerinde seçtiğin noktalar için daha detaylı ayarlar yapabileceğin form üzerinde
            çalışıyoruz. Şimdilik kayıtlı hedeflerini buradan görüntüleyip silebilirsin.
          </Text>
          <PrimaryButton title="Geri Dön" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </ScreenContainer>
  );
};

export default CustomTargetFormScreen;