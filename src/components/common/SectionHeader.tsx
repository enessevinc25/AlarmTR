import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

interface SectionHeaderProps {
  title: string;
  /**
   * Alt margin (varsayılan: spacing.sm)
   */
  marginBottom?: number;
}

/**
 * SectionHeader Component
 * 
 * Bölüm başlıkları için tutarlı görünüm sağlar.
 * "Duraklar", "Hatlar", "Yakın Duraklar" gibi başlıklar için kullanılır.
 */
export function SectionHeader({ title, marginBottom }: SectionHeaderProps) {
  return (
    <Text style={[styles.header, { marginBottom: marginBottom ?? spacing.sm }]}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  header: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

