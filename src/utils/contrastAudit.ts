/**
 * Contrast Audit Utility
 * 
 * UI kontrast sorunlarını tespit etmek için basit bir utility.
 * WCAG tam uyumlu değil ama temel kontrast kontrolü yapar.
 * 
 * Kullanım:
 *   warnIfLowContrast('#ffffff', '#ffffff', 'Login Button');
 */

/**
 * Hex rengi RGB'ye çevir
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB rengi relative luminance'a çevir (WCAG 2.1)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * İki renk arasındaki kontrast oranını hesapla (WCAG 2.1)
 * @returns 1.0 (aynı renk) ile 21.0 (maksimum kontrast) arasında
 */
function getContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return null;
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  if (darker === 0) {
    return lighter > 0 ? Infinity : 1;
  }

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Kontrast oranını kontrol et ve düşükse uyarı ver
 * 
 * @param fgHex Foreground color (text rengi)
 * @param bgHex Background color (arka plan rengi)
 * @param contextLabel Hangi bileşen/ekran için kontrol yapılıyor (debug için)
 * @param minContrast Minimum kontrast oranı (WCAG AA için 4.5, AAA için 7.0)
 * @returns Kontrast oranı yeterli mi?
 */
export function warnIfLowContrast(
  fgHex: string,
  bgHex: string,
  contextLabel: string,
  minContrast: number = 4.5, // WCAG AA standardı
): boolean {
  if (!__DEV__) {
    return true; // Production'da kontrol yapma
  }

  // Hex formatını normalize et (# olmadan da çalışsın)
  const normalizedFg = fgHex.startsWith('#') ? fgHex : `#${fgHex}`;
  const normalizedBg = bgHex.startsWith('#') ? bgHex : `#${bgHex}`;

  const contrast = getContrastRatio(normalizedFg, normalizedBg);

  if (contrast === null) {
    if (__DEV__) {
      console.warn(
        `[ContrastAudit] Invalid color format in ${contextLabel}: fg=${fgHex}, bg=${bgHex}`,
      );
    }
    return false;
  }

  if (contrast < minContrast) {
    console.warn(
      `[ContrastAudit] ⚠️ LOW CONTRAST in ${contextLabel}:`,
      `\n  Foreground: ${normalizedFg}`,
      `\n  Background: ${normalizedBg}`,
      `\n  Contrast Ratio: ${contrast.toFixed(2)}:1`,
      `\n  Minimum Required: ${minContrast}:1 (WCAG AA)`,
      `\n  Status: ${contrast < 3 ? '❌ CRITICAL' : '⚠️ WARNING'}`,
    );
    return false;
  }

  return true;
}

/**
 * Primary button kontrastını kontrol et
 * 
 * @param bgHex Button background color
 * @param textHex Button text color
 * @param contextLabel Button context (örn: "Login Button")
 */
export function auditButtonContrast(
  bgHex: string,
  textHex: string,
  contextLabel: string,
): boolean {
  return warnIfLowContrast(textHex, bgHex, contextLabel, 4.5);
}
