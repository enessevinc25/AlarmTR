import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import ScreenContainer from '../../components/common/ScreenContainer';
import { StopsStackParamList } from '../../navigation/navigationTypes';
import SavedStopsScreen from './SavedStopsScreen';
import AlarmHistoryScreen from '../settings/AlarmHistoryScreen';
import { useAppTheme } from '../../theme/useAppTheme';

type Props = NativeStackScreenProps<StopsStackParamList, 'StopsHome'>;

type Tab = 'favorites' | 'history';

const StopsHomeScreen = ({ route }: Props) => {
  const initialTab = (route.params?.initialTab as Tab) || 'favorites';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const { colors } = useAppTheme();

  return (
    <ScreenContainer>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Duraklar</Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Favori duraklarını yönet ve alarm geçmişini görüntüle.
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('favorites')}
          accessibilityRole="tab"
          accessibilityLabel="Favori Duraklar"
          accessibilityState={{ selected: activeTab === 'favorites' }}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: activeTab === 'favorites' ? colors.primary : colors.gray100,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: activeTab === 'favorites' ? colors.white : colors.textMuted,
              fontWeight: '600',
              fontSize: 14,
            }}
          >
            Favori Duraklar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          accessibilityRole="tab"
          accessibilityLabel="Alarm Geçmişi"
          accessibilityState={{ selected: activeTab === 'history' }}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: activeTab === 'history' ? colors.primary : colors.gray100,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: activeTab === 'history' ? colors.white : colors.textMuted,
              fontWeight: '600',
              fontSize: 14,
            }}
          >
            Alarm Geçmişi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'favorites' ? (
          <SavedStopsScreen hideHeader />
        ) : (
          <AlarmHistoryScreen hideHeader />
        )}
      </View>
    </ScreenContainer>
  );
};

export default StopsHomeScreen;

