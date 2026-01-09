import { ReactNode } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const PrimaryButton = ({ title, onPress, disabled, leftIcon, style, textStyle, accessibilityLabel, accessibilityHint }: Props) => {
  const { colors } = useAppTheme();
  const defaultBgColor = style && typeof style === 'object' && 'backgroundColor' in style 
    ? undefined 
    : colors.primary;
  
  // Text rengini dinamik olarak belirle: backgroundColor varsa ona göre, yoksa white
  const textColor = textStyle && typeof textStyle === 'object' && 'color' in textStyle
    ? undefined // textStyle'da color varsa onu kullan
    : (style && typeof style === 'object' && 'backgroundColor' in style && (style.backgroundColor === '#ffffff' || style.backgroundColor === 'white'))
      ? colors.text // Beyaz arka plan varsa text rengi kullan
      : colors.white; // Varsayılan olarak beyaz

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.button,
        defaultBgColor ? { backgroundColor: defaultBgColor } : undefined,
        disabled ? styles.buttonDisabled : undefined,
        style,
      ]}
    >
      {leftIcon ? <View style={styles.iconWrapper}>{leftIcon}</View> : null}
      <Text style={[styles.text, textColor ? { color: textColor } : undefined, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    flexDirection: 'row',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconWrapper: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrimaryButton;

