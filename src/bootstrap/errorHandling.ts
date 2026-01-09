/**
 * Global Error Handling Bootstrap (P0)
 * 
 * Unhandled Promise/JS error yakalama ve logger'a yazma.
 * ErrorBoundary component'i ayrı dosyada (src/components/common/ErrorBoundary.tsx).
 */

import { logger } from '../utils/logger';
import { diagLog, getActiveAlarmSessionId } from '../services/alarmDiagnostics';

/**
 * Global error handler kurulumu
 */
export function setupGlobalErrorHandling(): void {
  // React Native ErrorUtils hook
  if (typeof ErrorUtils !== 'undefined' && ErrorUtils.setGlobalHandler) {
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      // Logger'a yaz
      logger.error('Unhandled error', {
        message: error.message,
        stack: error.stack,
        isFatal: isFatal ?? false,
        name: error.name,
      }).catch(() => {
        // Logger hatası: ignore
      });

      // Diagnostic'e yaz (eğer aktif alarm varsa)
      getActiveAlarmSessionId()
        .then((sessionId) => {
          if (sessionId) {
            return diagLog(sessionId, {
              level: 'error',
              type: 'ERROR',
              msg: `Unhandled error: ${error.message}`,
              data: {
                isFatal: isFatal ?? false,
                name: error.name,
              },
            });
          }
        })
        .catch(() => {
          // Diagnostic hatası: ignore
        });

      // Orijinal handler'ı çağır (Sentry vs. varsa)
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  // Unhandled promise rejection (destekliyorsa)
  if (typeof global !== 'undefined' && 'addEventListener' in global) {
    // React Native'de unhandledrejection event'i olmayabilir
    // Ama yine de hook edelim (web/Node.js uyumluluğu için)
    try {
      global.addEventListener('unhandledrejection', (event: any) => {
        const reason = event.reason || event;
        const error = reason instanceof Error ? reason : new Error(String(reason));
        
        logger.error('Unhandled promise rejection', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }).catch(() => {
          // Logger hatası: ignore
        });

        // Diagnostic'e yaz
        getActiveAlarmSessionId()
          .then((sessionId) => {
            if (sessionId) {
              return diagLog(sessionId, {
                level: 'error',
                type: 'ERROR',
                msg: `Unhandled promise rejection: ${error.message}`,
                data: {
                  name: error.name,
                },
              });
            }
          })
          .catch(() => {
            // Diagnostic hatası: ignore
          });
      });
    } catch (e) {
      // Event listener eklenemezse ignore (React Native'de olmayabilir)
      if (__DEV__) {
        console.log('[errorHandling] unhandledrejection event not supported');
      }
    }
  }
}

// Side-effect: setup'ı çağır
setupGlobalErrorHandling();
