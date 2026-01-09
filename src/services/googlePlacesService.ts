import { getTransitApiBaseUrl } from '../utils/env';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Google Places Autocomplete ile yer araması (Cloud Run proxy üzerinden)
 * 
 * @param query Arama metni
 * @returns Önerilen yerler
 */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return []; // Min 2 karakter kontrolü

  const baseUrl = getTransitApiBaseUrl();
  const url = `${baseUrl}/places/autocomplete?input=${encodeURIComponent(trimmed)}&language=tr&components=country:tr`;

  // AbortController ile timeout (10 saniye)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      // Önce JSON dene, olmazsa text
      let errorBody: Record<string, any> = {};
      try {
        const errorBodyUnknown: unknown = await res.json();
        errorBody = (errorBodyUnknown && typeof errorBodyUnknown === 'object') ? (errorBodyUnknown as Record<string, any>) : {};
      } catch {
        try {
          const text = await res.text();
          errorBody = { error: text || `HTTP ${res.status}` };
        } catch {
          errorBody = { error: `HTTP ${res.status}` };
        }
      }
      
      // Status code'a göre kullanıcı dostu mesaj
      let errorMessage: string;
      if (res.status === 429) {
        errorMessage = 'Çok fazla istek gönderildi, lütfen kısa süre sonra tekrar deneyin.';
      } else if (res.status === 503) {
        errorMessage = 'Yer arama servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (res.status === 502) {
        errorMessage = 'Yer arama servisi şu an yanıt vermiyor. Lütfen daha sonra tekrar deneyin.';
      } else if (res.status === 404) {
        if (__DEV__) {
          console.error(`[googlePlacesService] Places endpoint not found (404). Base URL: ${baseUrl}`);
        }
        errorMessage = 'Yer arama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else {
        errorMessage = errorBody.error || errorBody.message || `Yer araması hatası: HTTP ${res.status}`;
      }
      
      if (__DEV__) {
        console.error(`[googlePlacesService] HTTP ${res.status} error:`, errorBody);
      }
      throw new Error(errorMessage);
    }

    const jsonUnknown: unknown = await res.json();
    const json = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, any>) : {};
    const suggestions = Array.isArray(json.suggestions) ? json.suggestions : [];

    return suggestions.map((s: any) => ({
      placeId: s.placeId,
      description: s.description ?? '',
    }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // AbortError (timeout) kontrolü
    if (error.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }
    
    // Zaten Error tipinde ise direkt fırlat
    if (error instanceof Error) {
      throw error;
    }
    
    // Network hataları
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('İnternet bağlantısı yok. Lütfen bağlantıyı kontrol edin.');
    }
    
    if (__DEV__) {
      console.warn('[googlePlacesService] searchPlaces error:', error);
    }
    throw new Error('Yer araması sırasında bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

/**
 * Place ID'ye göre yer detaylarını getir (Cloud Run proxy üzerinden)
 * 
 * @param placeId Google Place ID
 * @returns Yer detayları veya null
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const baseUrl = getTransitApiBaseUrl();
  const url = `${baseUrl}/places/details?placeId=${encodeURIComponent(placeId)}&language=tr`;

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        if (__DEV__) {
          console.warn('[googlePlacesService] Place not found:', placeId);
        }
        return null;
      }
      let errorBody: Record<string, any> = { error: `HTTP ${res.status}` };
      try {
        const errorBodyUnknown: unknown = await res.json();
        errorBody = (errorBodyUnknown && typeof errorBodyUnknown === 'object') ? (errorBodyUnknown as Record<string, any>) : { error: `HTTP ${res.status}` };
      } catch {
        // JSON parse edilemezse default error mesajı kullan
      }
      if (__DEV__) {
        console.error(`[googlePlacesService] HTTP ${res.status} error:`, errorBody.error);
      }
      throw new Error(errorBody.error || `Yer detayları hatası: HTTP ${res.status}`);
    }

    const jsonUnknown: unknown = await res.json();
    const json = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, any>) : {};

    return {
      placeId: json.placeId || placeId,
      name: json.name ?? '',
      latitude: json.latitude,
      longitude: json.longitude,
      address: json.address ?? '',
    };
  } catch (error: any) {
    // Zaten Error tipinde ise direkt fırlat
    if (error instanceof Error) {
      throw error;
    }
    // Network hataları
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('İnternet bağlantısı yok. Lütfen bağlantıyı kontrol edin.');
    }
    if (__DEV__) {
      console.warn('[googlePlacesService] getPlaceDetails error:', error);
    }
    throw new Error('Yer detayları alınırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

