/**
 * Search Cache Service - TTL-based caching for stop/line search results
 * 
 * Cache key format: `searchType:queryHash`
 * TTL: 5 minutes (300000ms)
 * PII-safe: Only stores queryHash, not full query text
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@laststop/search_cache_';
const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Generate cache key from search type and query hash
 */
function getCacheKey(searchType: 'stops' | 'lines', queryHash: string): string {
  return `${CACHE_PREFIX}${searchType}:${queryHash}`;
}

/**
 * Simple hash function for query string (FNV-1a)
 */
export function hashQuery(query: string): string {
  let hash = 2166136261; // FNV-1a 32-bit offset basis
  const normalized = query.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Get cached value if not expired
 */
export async function getCachedSearch<T>(
  searchType: 'stops' | 'lines',
  queryHash: string,
): Promise<T | null> {
  try {
    const key = getCacheKey(searchType, queryHash);
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    const age = now - entry.timestamp;

    // Check TTL
    if (age > TTL_MS) {
      // Expired, remove from cache
      await AsyncStorage.removeItem(key);
      return null;
    }

    return entry.value;
  } catch (error) {
    if (__DEV__) {
      console.warn('[searchCache] Get cache failed:', error);
    }
    return null;
  }
}

/**
 * Set cached value with current timestamp
 */
export async function setCachedSearch<T>(
  searchType: 'stops' | 'lines',
  queryHash: string,
  value: T,
): Promise<void> {
  try {
    const key = getCacheKey(searchType, queryHash);
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    if (__DEV__) {
      console.warn('[searchCache] Set cache failed:', error);
    }
    // Ignore cache errors (non-critical)
  }
}

/**
 * Clear all search cache entries
 */
export async function clearSearchCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[searchCache] Clear cache failed:', error);
    }
  }
}

/**
 * Clear expired cache entries (cleanup utility)
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const key of cacheKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const entry: CacheEntry<any> = JSON.parse(cached);
          if (now - entry.timestamp > TTL_MS) {
            expiredKeys.push(key);
          }
        }
      } catch {
        // Invalid entry, mark for removal
        expiredKeys.push(key);
      }
    }

    if (expiredKeys.length > 0) {
      await AsyncStorage.multiRemove(expiredKeys);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[searchCache] Clear expired cache failed:', error);
    }
  }
}
