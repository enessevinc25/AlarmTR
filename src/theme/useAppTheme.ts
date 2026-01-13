/**
 * App Theme Hook
 * 
 * Theme context'ini kullanarak renkleri döndüren hook
 * Geriye dönük uyumluluk için mevcut API'yi koruyor
 */

import { useTheme } from '../context/ThemeContext';
import { lightTokens, darkTokens, ThemeTokens } from './tokens';

export type ColorScheme = 'light' | 'dark';

export function useAppTheme() {
  const { resolvedColorScheme, colors, isDark } = useTheme();
  const tokens: ThemeTokens = isDark ? darkTokens : lightTokens;

  return {
    colorScheme: resolvedColorScheme,
    colors,
    tokens, // Theme tokens eklendi
    isDark,
  };
}

