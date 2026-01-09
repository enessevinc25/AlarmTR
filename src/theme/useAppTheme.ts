/**
 * App Theme Hook
 * 
 * Theme context'ini kullanarak renkleri döndüren hook
 * Geriye dönük uyumluluk için mevcut API'yi koruyor
 */

import { useTheme } from '../context/ThemeContext';

export type ColorScheme = 'light' | 'dark';

export function useAppTheme() {
  const { resolvedColorScheme, colors, isDark } = useTheme();

  return {
    colorScheme: resolvedColorScheme,
    colors,
    isDark,
  };
}

