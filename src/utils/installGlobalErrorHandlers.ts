import { writeCrashLog } from './crashLog';

/**
 * Global error handler'ları kurar.
 * - ErrorUtils.setGlobalHandler: Fatal JS hatalarını yakalar
 * - process.on('unhandledRejection'): Unhandled promise rejection'ları yakalar
 * 
 * Bu fonksiyon App.tsx'de uygulama başlangıcında bir kere çağrılmalıdır.
 */
export function installGlobalErrorHandlers(): void {
  // 1. Global fatal error handler (ErrorUtils)
  try {
    const ErrorUtils = (global as any).ErrorUtils;
    if (ErrorUtils?.setGlobalHandler) {
      const prevHandler = ErrorUtils.getGlobalHandler?.();
      
      ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        // Önce logla
        try {
          const e = error instanceof Error ? error : new Error(String(error));
          writeCrashLog({
            ts: Date.now(),
            name: e.name,
            message: e.message || String(error),
            stack: e.stack,
            isFatal: !!isFatal,
            extra: { source: 'ErrorUtils' },
          }).catch(() => {
            // writeCrashLog hatası olsa bile devam et
          });
        } catch (logError) {
          // Log yazma hatası olsa bile devam et
          if (__DEV__) {
            console.warn('[installGlobalErrorHandlers] Log yazma hatası:', logError);
          }
        }
        
        // Sonra önceki handler'ı çağır (uygulama yine kapanabilir ama log kalır)
        try {
          if (prevHandler && typeof prevHandler === 'function') {
            prevHandler(error, isFatal);
          }
        } catch (handlerError) {
          // Önceki handler hatası olsa bile devam et
          if (__DEV__) {
            console.warn('[installGlobalErrorHandlers] Önceki handler hatası:', handlerError);
          }
        }
      });
      
      if (__DEV__) {
        console.log('[installGlobalErrorHandlers] ErrorUtils handler kuruldu');
      }
    } else {
      if (__DEV__) {
        console.warn('[installGlobalErrorHandlers] ErrorUtils.setGlobalHandler bulunamadı');
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[installGlobalErrorHandlers] ErrorUtils handler kurulum hatası:', error);
    }
  }

  // 2. Unhandled promise rejection handler
  try {
    // React Native'de process.on her zaman mevcut olmayabilir, kontrol et
    if (typeof (global as any).process?.on === 'function') {
      (global as any).process.on('unhandledRejection', (reason: any) => {
        try {
          const e = reason instanceof Error ? reason : new Error(String(reason));
          writeCrashLog({
            ts: Date.now(),
            name: e.name,
            message: e.message || String(reason),
            stack: e.stack,
            isFatal: false,
            extra: { source: 'unhandledRejection' },
          }).catch(() => {
            // writeCrashLog hatası olsa bile devam et
          });
        } catch (logError) {
          // Log yazma hatası olsa bile devam et
          if (__DEV__) {
            console.warn('[installGlobalErrorHandlers] Unhandled rejection log hatası:', logError);
          }
        }
      });
      
      if (__DEV__) {
        console.log('[installGlobalErrorHandlers] Unhandled rejection handler kuruldu');
      }
    } else {
      if (__DEV__) {
        console.warn('[installGlobalErrorHandlers] process.on bulunamadı (normal olabilir)');
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[installGlobalErrorHandlers] Unhandled rejection handler kurulum hatası:', error);
    }
  }
}
