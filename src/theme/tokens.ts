/**
 * Theme Tokens - Design System Color Tokens
 * 
 * Uygulama genelinde kullanılan renk token'ları.
 * Light ve dark mode için aynı token isimleri kullanılır.
 * 
 * Kullanım:
 *   const { tokens } = useAppTheme();
 *   <View style={{ backgroundColor: tokens.bg.default }} />
 */

import { lightColors, darkColors } from './palette';

export type ThemeTokens = {
  bg: {
    default: string;
    elevated: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    light: string;
    onPrimary: string; // Primary button üzerindeki text rengi
    onSurface: string; // Surface üzerindeki text rengi
  };
  button: {
    primaryBg: string;
    primaryText: string;
    secondaryBg: string;
    secondaryText: string;
    disabledBg: string;
    disabledText: string;
    ghostBg: string;
    ghostText: string;
  };
  input: {
    bg: string;
    text: string;
    placeholder: string;
    border: string;
    borderError: string;
  };
  border: {
    default: string;
    light: string;
  };
};

/**
 * Light theme tokens
 */
export const lightTokens: ThemeTokens = {
  bg: {
    default: lightColors.background,
    elevated: lightColors.cardBackground,
    overlay: lightColors.overlay,
  },
  text: {
    primary: lightColors.text,
    secondary: lightColors.textMuted,
    muted: lightColors.textMuted,
    light: lightColors.textLight,
    onPrimary: lightColors.white, // Primary button üzerinde beyaz text
    onSurface: lightColors.text, // Surface üzerinde normal text
  },
  button: {
    primaryBg: lightColors.primary,
    primaryText: lightColors.white, // Primary button üzerinde beyaz text (kontrast garantili)
    secondaryBg: lightColors.primarySoft,
    secondaryText: lightColors.primaryDark,
    disabledBg: lightColors.gray300,
    disabledText: lightColors.gray500, // Disabled durumda okunabilir text
    ghostBg: 'transparent',
    ghostText: lightColors.primary,
  },
  input: {
    bg: lightColors.cardBackground,
    text: lightColors.text,
    placeholder: lightColors.textLight,
    border: lightColors.border,
    borderError: lightColors.danger,
  },
  border: {
    default: lightColors.border,
    light: lightColors.borderLight,
  },
};

/**
 * Dark theme tokens
 */
export const darkTokens: ThemeTokens = {
  bg: {
    default: darkColors.background,
    elevated: darkColors.cardBackground,
    overlay: darkColors.overlay,
  },
  text: {
    primary: darkColors.text,
    secondary: darkColors.textMuted,
    muted: darkColors.textMuted,
    light: darkColors.textLight,
    onPrimary: darkColors.white, // Primary button üzerinde beyaz text
    onSurface: darkColors.text, // Surface üzerinde normal text
  },
  button: {
    primaryBg: darkColors.primary,
    primaryText: darkColors.white, // Primary button üzerinde beyaz text (kontrast garantili)
    secondaryBg: darkColors.primarySoft,
    secondaryText: darkColors.text, // Dark mode'da primarySoft üzerinde text rengi
    disabledBg: darkColors.gray300,
    disabledText: darkColors.gray500, // Disabled durumda okunabilir text
    ghostBg: 'transparent',
    ghostText: darkColors.primary,
  },
  input: {
    bg: darkColors.cardBackground,
    text: darkColors.text,
    placeholder: darkColors.textLight,
    border: darkColors.border,
    borderError: darkColors.danger,
  },
  border: {
    default: darkColors.border,
    light: darkColors.borderLight,
  },
};
