import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/useAppTheme';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

const ScreenContainer = ({
  children,
  scrollable = false,
  contentStyle,
  backgroundColor,
}: Props) => {
  const { colors } = useAppTheme();
  const Wrapper = scrollable ? ScrollView : View;
  const bgColor = backgroundColor ?? colors.background;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <Wrapper
        contentContainerStyle={
          scrollable ? [styles.content, contentStyle] : undefined
        }
        style={!scrollable ? [styles.content, contentStyle] : undefined}
      >
        {children}
      </Wrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});

export default ScreenContainer;

