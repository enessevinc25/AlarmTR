/**
 * Design System - Colors
 * 
 * Uygulama genelinde kullanılan renk paleti.
 * DEPRECATED: Yeni kod için useAppTheme() hook'unu kullanın (dark mode desteği için)
 * 
 * @deprecated useAppTheme() hook'unu kullanın
 */

import { lightColors } from './palette';

// Geriye dönük uyumluluk için light theme renklerini export et
// Yeni kod için useAppTheme() hook'unu kullanın
export const colors = lightColors;

/**
 * Spacing constants
 * Tutarlı spacing için kullanılır
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Border radius constants
 */
export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999, // Pill shape
};

