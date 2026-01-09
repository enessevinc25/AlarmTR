/**
 * Transit Data Provider
 * 
 * Bu dosya transit veri kaynağı için bir abstraction katmanı sağlar.
 * Artık REST API üzerinden çalışıyor (Firestore'dan transit verileri okunmuyor).
 * 
 * Firestore sadece kullanıcıya özel veriler için kullanılmaya devam ediyor:
 * - userSavedStops, userTargets, alarmProfiles, alarmHistory, userSettings
 */

import { TransitLine, TransitStop } from '../types/models';
import {
  apiSearchStops,
  apiGetLines,
  apiGetLineStops,
  apiGetStopById,
} from './transitApiClient';

/**
 * Tüm hatları çek (isteğe bağlı mode filtresi ve arama query'si ile)
 * 
 * @param mode Taşıt türü filtresi (opsiyonel)
 * @param query Arama query'si (opsiyonel)
 * @returns Hat listesi
 */
export async function fetchAllLines(mode?: string, query?: string): Promise<TransitLine[]> {
  const params: { mode?: string; q?: string } = {};
  if (mode) params.mode = mode;
  if (query && query.trim().length > 0) params.q = query.trim();
  
  const { lines } = await apiGetLines(Object.keys(params).length > 0 ? params : undefined);
  return lines;
}

/**
 * Query ile hat araması
 * 
 * @param query Arama metni
 * @param options Arama seçenekleri
 * @returns Bulunan hatlar
 */
export async function searchRoutesByQuery(
  query: string,
  options?: { mode?: string; limit?: number }
): Promise<TransitLine[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 1) {
    return [];
  }

  const params: { q: string; mode?: string } = { q: trimmed };
  if (options?.mode) params.mode = options.mode;

  const { lines } = await apiGetLines(params);
  return lines;
}

/**
 * Metin ile durak arama (StopSearch ekranı için)
 * 
 * @param query Arama metni (en az 2 karakter olmalı)
 * @param options Arama seçenekleri
 * @returns Bulunan duraklar
 */
export async function searchStops(
  query: string,
  options?: { mode?: string; limit?: number }
): Promise<TransitStop[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const { stops } = await apiSearchStops({
    q: trimmed,
    mode: options?.mode,
    limit: options?.limit ?? 25,
  });

  return stops;
}

/**
 * Hat durakları
 * 
 * @param lineId Hat ID
 * @returns Hat bilgisi ve durakları
 */
export async function fetchLineStops(
  lineId: string
): Promise<{ line: TransitLine; stops: TransitStop[] }> {
  const { line, stops } = await apiGetLineStops(lineId);
  return { line, stops };
}


/**
 * Tek durak bilgisi
 * 
 * @param stopId Durak ID
 * @returns Durak bilgisi veya null
 */
export async function fetchStopById(stopId: string): Promise<TransitStop | null> {
  try {
    const { stop } = await apiGetStopById(stopId);
    return stop ?? null;
  } catch (error) {
    // captureError zaten transitApiClient içinde çağrılıyor
    return null;
  }
}

