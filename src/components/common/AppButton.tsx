/**
 * AppButton - Standardized Button Component
 * 
 * Theme token'larını kullanarak kontrast garantili buton bileşeni.
 * White-on-white sorunlarını önlemek için tasarlandı.
 */

import { ReactNode } from 'react';
import {
  ActivityIndicator,
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

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: Props) => {
  const { tokens } = useAppTheme();

  // Variant'a göre renkleri belirle
  let backgroundColor: string;
  let textColor: string;

  if (disabled) {
    backgroundColor = tokens.button.disabledBg;
    textColor = tokens.button.disabledText;
  } else {
    switch (variant) {
      case 'primary':
        backgroundColor = tokens.button.primaryBg;
        textColor = tokens.button.primaryText;
        break;
      case 'secondary':
        backgroundColor = tokens.button.secondaryBg;
        textColor = tokens.button.secondaryText;
        break;
      case 'ghost':
        backgroundColor = tokens.button.ghostBg;
        textColor = tokens.button.ghostText;
        break;
    }
  }

  // Kontrast kontrolü (sadece dev mode'da)
  if (__DEV__ && !disabled && variant === 'primary') {
    auditButtonContrast(backgroundColor, textColor, `AppButton (${title})`);
  }

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.button,
        {
          backgroundColor,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={textColor} />
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </View>
      ) : (
        <>
          {leftIcon ? <View style={styles.iconWrapper}>{leftIcon}</View> : null}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    flexDirection: 'row',
    minHeight: 48, // Minimum touch target size
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconWrapper: {
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default AppButton;
