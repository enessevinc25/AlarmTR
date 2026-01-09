/**
 * Error Reporting Utility
 * 
 * Sentry hata raporlama için ortak helper fonksiyonları.
 * Sentry optional olduğu için (Expo Go'da mevcut olmayabilir) güvenli bir şekilde
 * hata yakalama ve raporlama sağlar.
 * 
 * ÖNEMLİ: Bu fonksiyon ASLA yeni bir exception fırlatmaz. Sentry raporlama
 * başarısız olsa bile uygulama crash olmaz.
 */

type SentryModule = {
  Native: {
    captureException: (error: unknown, context?: any) => void;
  };
};

let Sentry: SentryModule | null = null;

// Sentry'i optional olarak yükle; Expo Go veya bazı build senaryolarında native link yoksa crash olmasın.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('sentry-expo') as SentryModule;
} catch (error) {
  // Sentry yoksa sorun değil, sadece konsola yaz.
  if (__DEV__) {
    console.warn('[errorReporting] sentry-expo yüklenemedi:', error);
  }
}

/**
 * Hata yakalama ve Sentry'ye gönderme
 * 
 * Bu fonksiyon ASLA yeni bir exception fırlatmaz. Sentry raporlama başarısız olsa bile
 * uygulama crash olmaz.
 * 
 * @param error - Yakalanan hata (Error, string, veya unknown)
 * @param context - Hatanın oluştuğu bağlam (opsiyonel, debug için)
 */
export function captureError(error: unknown, context?: string): void {
  if (__DEV__) {
    const contextMessage = context ? `[${context}] ` : '';
    console.warn(`[captureError] ${contextMessage}`, error);
  }

  if (!Sentry || !Sentry.Native || typeof Sentry.Native.captureException !== 'function') {
    return;
  }

  try {
    if (context) {
      Sentry.Native.captureException(error, {
        tags: { context },
      });
    } else {
      Sentry.Native.captureException(error);
    }
  } catch (reportError) {
    // Burada ASLA yeni bir throw yapma. Sentry raporlama başarısız olsa bile uygulama crash olmamalı.
    if (__DEV__) {
      console.warn('[captureError] Hata raporlanırken sorun oluştu:', reportError);
    }
  }
}

