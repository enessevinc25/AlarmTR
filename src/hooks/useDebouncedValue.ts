import { useEffect, useState } from 'react';

/**
 * Debounced Value Hook
 * 
 * Kullanıcı input'larında her tuş vuruşunda işlem yapmak yerine,
 * kullanıcı yazmayı bıraktıktan belirli bir süre sonra değeri günceller.
 * 
 * Kullanım örneği:
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(query, 200);
 * // debouncedQuery, query değiştikten 200ms sonra güncellenir
 * 
 * @param value - Debounce edilecek değer
 * @param delay - Gecikme süresi (milisaniye), varsayılan 200ms
 * @returns Debounced değer
 */
export function useDebouncedValue<T>(value: T, delay: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // value değiştiğinde timer başlat
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: component unmount veya value/delay değiştiğinde timer'ı temizle
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}


