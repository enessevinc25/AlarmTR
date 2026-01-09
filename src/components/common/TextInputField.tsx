import {
  AccessibilityRole,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

interface Props extends TextInputProps {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  errorMessage?: string;
}

const TextInputField = ({
  label,
  containerStyle,
  errorMessage,
  ...rest
}: Props) => {
  const { colors } = useAppTheme();
  
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textLight}
        style={[
          styles.input,
          {
            borderColor: errorMessage ? colors.danger : colors.border,
            color: colors.text,
            backgroundColor: colors.cardBackground,
          },
        ]}
        accessibilityLabel={rest.accessibilityLabel || label}
        accessibilityHint={rest.accessibilityHint}
        accessibilityRole={'text' as AccessibilityRole}
        {...rest}
      />
      {errorMessage ? (
        <Text style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
  },
});

export default TextInputField;

