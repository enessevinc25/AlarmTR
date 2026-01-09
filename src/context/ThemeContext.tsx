import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme/palette';

export type ColorScheme = 'light' | 'dark' | 'system';
export type ResolvedColorScheme = 'light' | 'dark';

const THEME_STORAGE_KEY = '@laststop_alarm_tr:theme_preference';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  resolvedColorScheme: ResolvedColorScheme;
  isDark: boolean;
  colors: typeof lightColors;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('system'); // Default to system, will be loaded from storage
  const [isLoading, setIsLoading] = useState(true);

  // Resolved color scheme - 'system' ise system'e göre, değilse direkt kullan
  const resolvedColorScheme: ResolvedColorScheme = 
    colorScheme === 'system' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : colorScheme;

  const isDark = resolvedColorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setColorSchemeState(stored as ColorScheme);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[ThemeContext] Failed to load theme preference:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadThemePreference();
  }, []);

  const setColorScheme = async (scheme: ColorScheme) => {
    try {
      setColorSchemeState(scheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch (error) {
      if (__DEV__) {
        console.warn('[ThemeContext] Failed to save theme preference:', error);
      }
    }
  };

  // Update resolved scheme when system color scheme changes
  useEffect(() => {
    // This will trigger a re-render when system color scheme changes
    // and colorScheme is 'system'
  }, [systemColorScheme, colorScheme]);

  const value: ThemeContextValue = {
    colorScheme,
    resolvedColorScheme,
    isDark,
    colors,
    setColorScheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

