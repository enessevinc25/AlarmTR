import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { borderRadius, spacing } from '../../theme/colors';
import { useAppTheme } from '../../theme/useAppTheme';

interface CardProps extends ViewProps {
  /**
   * Kartın border rengi (varsayılan: theme colors.border)
   */
  borderColor?: string;
  /**
   * Kartın arka plan rengi (varsayılan: theme colors.cardBackground)
   */
  backgroundColor?: string;
  /**
   * Padding değeri (varsayılan: spacing.md)
   */
  padding?: number;
}

/**
 * Card Component
 * 
 * Tutarlı kart görünümü için ortak component.
 * Tüm kartlar (durak kartları, hata kutuları, bilgi kutuları) için kullanılır.
 */
export function Card({ style, borderColor, backgroundColor, padding, ...props }: CardProps) {
  const { colors } = useAppTheme();
  
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: borderColor ?? colors.border,
          backgroundColor: backgroundColor ?? colors.cardBackground,
          padding: padding ?? spacing.md,
        },
        style,
      ]}
      {...props}
    >
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
});

