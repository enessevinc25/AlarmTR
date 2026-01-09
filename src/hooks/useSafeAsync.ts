import { DependencyList, useEffect } from 'react';

/**
 * Safe Async Effect Hook
 * 
 * Async effect'lerde component unmount olduğunda setState hatalarını engellemek için.
 * Her yerde tekrarlanan `let isMounted = true; if (isMounted) setState(...)` pattern'ini
 * tek bir hook'ta toplar.
 * 
 * Kullanım örneği:
 * useSafeAsync(async (isMounted) => {
 *   const data = await fetchData();
 *   if (isMounted()) {
 *     setData(data);
 *   }
 * }, [dependency]);
 * 
 * @param effect - Async effect fonksiyonu, isMounted callback'i alır
 * @param deps - Dependency array (useEffect ile aynı)
 */
export function useSafeAsync(
  effect: (isMounted: () => boolean) => void | Promise<void>,
  deps: DependencyList,
) {
  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;

    const maybePromise = effect(isMounted);

    // Promise dönerse hataları yakala
    if (maybePromise instanceof Promise) {
      maybePromise.catch((error) => {
        if (__DEV__) {
          console.warn('[useSafeAsync] Unhandled async error', error);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, deps);
}


