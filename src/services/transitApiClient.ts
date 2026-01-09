/**
 * Transit API Client
 * 
 * REST API üzerinden durak ve hat verilerini çekmek için kullanılır.
 * Firestore'dan transit verilerini okumayı bırakıp API'ye geçiş için hazırlanmıştır.
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransitApiBaseUrl } from '../utils/env';
import { captureError } from '../utils/errorReporting';
import { TransitLine, TransitStop } from '../types/models';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Retry configuration for API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3, // Artırıldı: 2'den 3'e (daha dayanıklı)
  retryDelayMs: 1000, // İlk retry için 1 saniye
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Retry on these HTTP status codes
  networkErrorRetries: 3, // Network hataları için özel retry sayısı
};

type CacheEntry = {
  timestamp: number;
  data: unknown;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 dk
const CACHE_KEY_PREFIX = 'transitApiCache:';
const memoryCache = new Map<string, CacheEntry>();
const CACHE_MAX_ITEMS = 60;

// Request deduplication: Aynı anda aynı isteğin birden fazla yapılmasını önler
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff with jitter
 * Jitter ekleyerek aynı anda çok sayıda isteğin retry yapmasını önler
 */
function getRetryDelay(retryCount: number): number {
  const baseDelay = RETRY_CONFIG.retryDelayMs * Math.pow(2, retryCount);
  // Jitter: ±20% rastgele ekleme
  const jitter = baseDelay * 0.2 * (Math.random() * 2 - 1);
  return Math.min(baseDelay + jitter, 10000); // Max 10 saniye
}

async function getCachedResponse<T>(cacheKey: string): Promise<T | null> {
  const now = Date.now();
  const mem = memoryCache.get(cacheKey);
  if (mem && now - mem.timestamp < CACHE_TTL_MS) {
    return mem.data as T;
  }

  try {
    const stored = await AsyncStorage.getItem(cacheKey);
    if (!stored) return null;
    const parsed: CacheEntry = JSON.parse(stored);
    if (now - parsed.timestamp < CACHE_TTL_MS) {
      memoryCache.set(cacheKey, parsed);
      return parsed.data as T;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[transitApiClient] Cache read failed', error);
    }
  }
  return null;
}

async function setCachedResponse(cacheKey: string, data: unknown) {
  const entry: CacheEntry = { timestamp: Date.now(), data };
  memoryCache.set(cacheKey, entry);

  // Basit LRU temizliği
  if (memoryCache.size > CACHE_MAX_ITEMS) {
    const oldestKey = [...memoryCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
    if (oldestKey) {
      memoryCache.delete(oldestKey);
      await AsyncStorage.removeItem(oldestKey).catch(() => null);
    }
  }

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    if (__DEV__) {
      console.warn('[transitApiClient] Cache write failed', error);
    }
  }
}

/**
 * Cache'i temizler (invalidation)
 * @param pattern - Temizlenecek cache key pattern'i (opsiyonel, tüm cache'i temizlemek için boş bırak)
 */
export async function invalidateCache(pattern?: string) {
  if (pattern) {
    // Pattern'e uyan cache'leri temizle
    const keysToDelete: string[] = [];
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => {
      memoryCache.delete(key);
      AsyncStorage.removeItem(key).catch(() => null);
    });
    if (__DEV__) {
      console.log(`[transitApiClient] Cache invalidated for pattern: ${pattern}`);
    }
  } else {
    // Tüm cache'i temizle
    const allKeys = Array.from(memoryCache.keys());
    memoryCache.clear();
    await Promise.all(
      allKeys.map((key) => AsyncStorage.removeItem(key).catch(() => null))
    );
    if (__DEV__) {
      console.log('[transitApiClient] All cache invalidated');
    }
  }
}

/**
 * Generic API GET wrapper with retry mechanism
 * 
 * @param path API endpoint path (örn: '/stops/search')
 * @param query Query parametreleri
 * @param retryCount Internal retry counter (don't set manually)
 * @returns API response'u tip güvenli şekilde döner
 */
async function apiGet<T>(path: string, query?: QueryParams, retryCount = 0): Promise<T> {
  // Production API URL (hardcoded)
  const baseUrl = getTransitApiBaseUrl();
  
  // Debug: İlk çağrıda base URL'i logla (sadece development'ta)
  if (__DEV__ && !(global as any)._transitApiBaseUrlLogged) {
    if (__DEV__) {
      console.log('[transitApiClient] Using Transit API base URL:', baseUrl);
    }
    (global as any)._transitApiBaseUrlLogged = true;
  }

  const url = new URL(path, baseUrl);
  
  // URL oluşturulduktan sonra logla (sadece development'ta)
  if (__DEV__ && !(global as any)._transitApiFullUrlLogged) {
    if (__DEV__) {
      console.log('[transitApiClient] Full URL will be:', url.toString());
    }
    (global as any)._transitApiFullUrlLogged = true;
  }

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${url.toString()}`;
  const cached = await getCachedResponse<T>(cacheKey);
  if (cached) {
    if (__DEV__) {
      console.log(`[transitApiClient] Using cached response for ${path}`);
    }
    return cached;
  }

  // Request deduplication: Eğer aynı istek zaten yapılıyorsa, onu bekle
  const requestKey = `${path}:${JSON.stringify(query || {})}`;
  const existingRequest = pendingRequests.get(requestKey);
  if (existingRequest) {
    if (__DEV__) {
      console.log(`[transitApiClient] Deduplicating request for ${path}`);
    }
    try {
      return (await existingRequest) as T;
    } catch (error) {
      // Eğer mevcut istek başarısız olduysa, yeni bir istek yap
      pendingRequests.delete(requestKey);
    }
  }

  // Timeout ile fetch (20 saniye - network sorunları için artırıldı)
  const timeoutMs = 20000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Yeni isteği pendingRequests'e ekle
  const requestPromise = (async () => {
    try {
      return await makeRequest<T>(path, query, retryCount, url, cacheKey, controller, timeoutId, timeoutMs, baseUrl);
    } finally {
      // İstek tamamlandığında (başarılı veya başarısız) pendingRequests'ten kaldır
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  
  return requestPromise as Promise<T>;
}

/**
 * Actual network request implementation
 */
async function makeRequest<T>(
  path: string,
  query: QueryParams | undefined,
  retryCount: number,
  url: URL,
  cacheKey: string,
  controller: AbortController,
  timeoutId: NodeJS.Timeout,
  timeoutMs: number,
  baseUrl: string
): Promise<T> {

  try {
    let res: Response;
    try {
      res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // fetch() çağrısı başarısız oldu - network error
      const isNetworkError = 
        fetchError.message?.includes('fetch') ||
        fetchError.message?.includes('network') ||
        fetchError.message?.includes('Failed to fetch') ||
        fetchError.message?.includes('Network request failed') ||
        fetchError.message?.includes('NetworkError') ||
        fetchError.code === 'NETWORK_ERROR' ||
        fetchError.name === 'TypeError'; // fetch failed genelde TypeError fırlatır
      
      if (isNetworkError || fetchError.name === 'AbortError') {
        // AbortError kontrolü timeout için - timeout'larda da retry yap (sadece ilk birkaç denemede)
        if (fetchError.name === 'AbortError') {
          // Timeout durumunda retry yap (sadece ilk 2 denemede)
          if (retryCount < 2) {
            const delay = getRetryDelay(retryCount);
            if (__DEV__) {
              console.warn(`[transitApiClient] Timeout on ${path}, retrying (${retryCount + 1}/2) after ${Math.round(delay)}ms`);
            }
            await sleep(delay);
            // Retry için yeni controller ve timeout oluştur (timeout'u artır)
            const retryController = new AbortController();
            const retryTimeoutMs = timeoutMs + 5000; // Timeout retry'lerde timeout'u daha fazla artır
            const retryTimeoutId = setTimeout(() => retryController.abort(), retryTimeoutMs);
            try {
              return await makeRequest<T>(path, query, retryCount + 1, url, cacheKey, retryController, retryTimeoutId, retryTimeoutMs, baseUrl);
            } finally {
              clearTimeout(retryTimeoutId);
            }
          }
          
          // Timeout retry'leri tükendi, cache'den dönmeyi dene
          const fallback = await getCachedResponse<T>(cacheKey);
          if (fallback) {
            if (__DEV__) {
              console.warn(`[transitApiClient] Timeout on ${path}, serving cached response after ${retryCount} retries`);
            }
            return fallback;
          }
          
          const timeoutError = new Error(`İstek zaman aşımına uğradı. İnternet bağlantınızı veya VPN ayarlarınızı kontrol edin.`);
          timeoutError.name = 'TransitApiTimeoutError';
          // Sadece development'ta log
          if (__DEV__) {
            console.error(`[transitApiClient] Timeout on ${path} after ${retryCount} retries`, { baseUrl, fullUrl: url.toString() });
          }
          captureError(timeoutError, `transitApiClient/apiGet:${path}`);
          throw timeoutError;
        }
        
        // Network error - retry logic (network hataları için özel retry sayısı kullan)
        const maxNetworkRetries = RETRY_CONFIG.networkErrorRetries;
        if (retryCount < maxNetworkRetries) {
          const delay = getRetryDelay(retryCount); // Exponential backoff with jitter
          if (__DEV__) {
            console.warn(`[transitApiClient] Network error on ${path}, retrying (${retryCount + 1}/${maxNetworkRetries}) after ${Math.round(delay)}ms`);
          }
          await sleep(delay);
          // Retry için yeni controller ve timeout oluştur (timeout'u biraz artır)
          const retryController = new AbortController();
          const retryTimeoutMs = timeoutMs + 2000; // Retry'lerde timeout'u biraz artır
          const retryTimeoutId = setTimeout(() => retryController.abort(), retryTimeoutMs);
          try {
            return await makeRequest<T>(path, query, retryCount + 1, url, cacheKey, retryController, retryTimeoutId, retryTimeoutMs, baseUrl);
          } finally {
            clearTimeout(retryTimeoutId);
          }
        }
        
        // Network error - max retries reached, cache'den dönmeyi dene
        const fallback = await getCachedResponse<T>(cacheKey);
        if (fallback) {
          if (__DEV__) {
            console.warn(`[transitApiClient] Network error on ${path}, serving cached response after ${retryCount} retries`);
          }
          return fallback;
        }

        // Cache'de de yoksa hata fırlat - ama daha kullanıcı dostu mesaj
        const networkError = new Error(`Bağlantı hatası. İnternet bağlantınızı veya VPN ayarlarınızı kontrol edin.`);
        networkError.name = 'TransitApiNetworkError';
        // Sadece development'ta log
        if (__DEV__) {
          console.error(`[transitApiClient] Network error on ${path} (max retries reached: ${retryCount})`, { 
            baseUrl, 
            fullUrl: url.toString(),
            originalError: fetchError.message,
            errorName: fetchError.name,
            errorCode: fetchError.code,
            retryCount,
            stack: fetchError.stack?.substring(0, 200)
          });
        }
        captureError(fetchError, `transitApiClient/apiGet:${path}`);
        throw networkError;
      }
      
      // Diğer fetch hataları
      throw fetchError;
    }

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Retry logic for retryable status codes
      if (retryCount < RETRY_CONFIG.maxRetries && RETRY_CONFIG.retryableStatusCodes.includes(res.status)) {
        const delay = getRetryDelay(retryCount); // Exponential backoff with jitter
        if (__DEV__) {
          console.warn(`[transitApiClient] HTTP ${res.status} on ${path}, retrying (${retryCount + 1}/${RETRY_CONFIG.maxRetries}) after ${Math.round(delay)}ms`);
        }
        await sleep(delay);
        // Yeni bir request key oluştur (retry için)
        const retryRequestKey = `${path}:${JSON.stringify(query || {})}:retry${retryCount + 1}`;
        const retryPromise = makeRequest<T>(path, query, retryCount + 1, url, cacheKey, new AbortController(), setTimeout(() => {}, 0), timeoutMs, baseUrl);
        pendingRequests.set(retryRequestKey, retryPromise);
        try {
          return await retryPromise;
        } finally {
          pendingRequests.delete(retryRequestKey);
        }
      }
      
      let errorMessage = `Transit API error ${res.status}`;
      let errorDetails = '';
      
      try {
        const errorBodyUnknown: unknown = await res.json();
        const errorBody = (errorBodyUnknown && typeof errorBodyUnknown === 'object') ? (errorBodyUnknown as Record<string, any>) : {};
        if (errorBody.error) {
          errorMessage = errorBody.error;
        }
        if (errorBody.details) {
          errorDetails = errorBody.details;
        }
      } catch {
        // JSON parse edilemezse sadece status kullan
        try {
          const text = await res.text();
          if (text) {
            errorDetails = text.substring(0, 200); // İlk 200 karakter
          }
        } catch {
          // Text de okunamazsa devam et
        }
      }
      
      const error = new Error(errorMessage || `Transit API error ${res.status}`);
      (error as any).status = res.status;
      (error as any).name = 'TransitApiError';
      (error as any).details = errorDetails;
      
      // Sadece development'ta log
      if (__DEV__) {
        console.error(`[transitApiClient] HTTP ${res.status} on ${path}`, { 
        baseUrl, 
        fullUrl: url.toString(),
        query,
        errorMessage,
        errorDetails,
        retryCount
        });
      }
      
      captureError(error, `transitApiClient/apiGet:${path}`);
      throw error;
    }

    const jsonUnknown: unknown = await res.json();
    const json = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as T) : ({} as T);
    setCachedResponse(cacheKey, json);
    return json;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Zaten özel error type'ları (TransitApiNetworkError, TransitApiTimeoutError, TransitApiError) fırlatılmışsa direkt throw et
    if (error.name === 'TransitApiNetworkError' || 
        error.name === 'TransitApiTimeoutError' || 
        error.name === 'TransitApiError') {
      throw error;
    }

    // Beklenmeyen hatalar - Sadece development'ta log
    if (__DEV__) {
      console.error(`[transitApiClient] Unexpected error on ${path}`, { 
      baseUrl, 
      fullUrl: url.toString(),
      error: error.message,
      errorName: error.name,
        errorStack: error.stack?.substring(0, 300)
      });
    }
    
    if (!error.status) {
      captureError(error, `transitApiClient/apiGet:${path}`);
    }
    
    // Genel hata mesajı
    const generalError = new Error('Bağlantı hatası. Lütfen tekrar deneyin.');
    generalError.name = 'TransitApiError';
    throw generalError;
  }
}

/**
 * Metin ile durak araması
 * 
 * @param params Arama parametreleri
 * @returns Bulunan duraklar
 */
export async function apiSearchStops(params: {
  q: string;
  mode?: string;
  limit?: number;
}): Promise<{ stops: TransitStop[] }> {
  return apiGet<{ stops: TransitStop[] }>('/stops/search', params);
}

/**
 * Hat listesi
 * 
 * @param params İsteğe bağlı filtre parametreleri
 * @returns Hat listesi
 */
export async function apiGetLines(params?: {
  mode?: string;
  q?: string;
}): Promise<{ lines: TransitLine[] }> {
  return apiGet<{ lines: TransitLine[] }>('/lines', params);
}

/**
 * Belirli bir hattın durakları
 * 
 * @param lineId Hat ID
 * @returns Hat bilgisi ve durakları
 */
export async function apiGetLineStops(
  lineId: string
): Promise<{ line: TransitLine; stops: TransitStop[] }> {
  return apiGet<{ line: TransitLine; stops: TransitStop[] }>(
    `/lines/${encodeURIComponent(lineId)}/stops`
  );
}

/**
 * Tek durak bilgisi
 * 
 * @param stopId Durak ID
 * @returns Durak bilgisi
 */
export async function apiGetStopById(stopId: string): Promise<{ stop: TransitStop }> {
  return apiGet<{ stop: TransitStop }>(
    `/stops/${encodeURIComponent(stopId)}`
  );
}

