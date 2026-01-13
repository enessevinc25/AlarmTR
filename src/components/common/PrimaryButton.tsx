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
import { auditButtonContrast } from '../../utils/contrastAudit';

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
  const { tokens, colors } = useAppTheme();
  
  // Style'dan backgroundColor'ü çıkar (varsa)
  const styleObj = style && typeof style === 'object' && !Array.isArray(style) ? style : {};
  const customBgColor = 'backgroundColor' in styleObj ? (styleObj.backgroundColor as string) : undefined;
  
  // Background color: custom varsa onu kullan, yoksa token'dan al
  const backgroundColor = customBgColor || tokens.button.primaryBg;
  
  // Text color: custom textStyle'da color varsa onu kullan, yoksa kontrast garantili token'dan al
  const customTextColor = textStyle && typeof textStyle === 'object' && !Array.isArray(textStyle) && 'color' in textStyle
    ? (textStyle.color as string)
    : undefined;
  
  // Kontrast garantili text color belirleme
  let textColor: string;
  if (customTextColor) {
    textColor = customTextColor;
  } else if (customBgColor) {
    // Custom background color varsa kontrast kontrolü yap
    // Beyaz veya çok açık renkse koyu text, değilse beyaz text
    const isLightBg = customBgColor === '#ffffff' || 
                      customBgColor === 'white' || 
                      customBgColor === '#FFFFFF' ||
                      (customBgColor.startsWith('#') && parseInt(customBgColor.slice(1, 3), 16) > 240);
    
    textColor = isLightBg ? tokens.text.onSurface : tokens.button.primaryText;
    
    // Dev mode'da kontrast kontrolü
    if (__DEV__ && !disabled) {
      auditButtonContrast(backgroundColor, textColor, `PrimaryButton (${title})`);
    }
  } else {
    // Token'dan gelen primary button için garantili kontrast
    textColor = tokens.button.primaryText;
  }

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
        {
          backgroundColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {leftIcon ? <View style={styles.iconWrapper}>{leftIcon}</View> : null}
      <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
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
  iconWrapper: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrimaryButton;

