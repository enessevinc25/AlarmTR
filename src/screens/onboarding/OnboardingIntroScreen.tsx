import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { RootStackParamList } from '../../navigation/navigationTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingIntro'>;

const slides = [
  {
    title: 'Durağını Asla Kaçırma',
    description:
      'LastStop Alarm TR, ineceğin durağa yaklaşmanı izler ve tam zamanında alarm çalar. Uykuda ya da telefona bakmıyorken bile güvendesin.',
  },
  {
    title: 'Harita + Favoriler',
    description:
      'Durakları haritadan seçebilir, son aramalarını görebilir ve favori duraklarını tek dokunuşla alarm hedefi yapabilirsin.',
  },
  {
    title: 'Konum & Bildirim İzinleri',
    description:
      'Alarmın düzgün çalışabilmesi için konumunu (arka planda) ve bildirim iznini kullanıyoruz. İzin vermeden önce nedenini bil istedik.',
  },
];

const OnboardingIntroScreen = ({ navigation }: Props) => {
  const [index, setIndex] = useState(0);
  const current = slides[index];

  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    navigation.navigate('OnboardingPermissions');
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.counter}>{`${index + 1}/${slides.length}`}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>
      </View>

      <PrimaryButton title={index === slides.length - 1 ? 'İzinleri Ayarla' : 'Devam Et'} onPress={handleNext} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  counter: {
    fontSize: 16,
    color: '#94a3b8',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginVertical: 16,
    color: '#0f172a',
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
});

export default OnboardingIntroScreen;

