import { TransitStop } from '../types/models';

/**
 * Map Clustering Utilities
 * 
 * ⚠️ KULLANILMIYOR: Bu dosya şu anda hiçbir yerde import edilmiyor.
 * 
 * İleride haritada çok fazla marker olduğunda clustering (gruplama) yapmak için
 * hazırlık altyapısı. Şu an aktif değil, sadece interface tanımları mevcut.
 * 
 * TODO (perf): Clustering algoritması eklendiğinde bu dosyada implement edilecek.
 * Önerilen yaklaşım: Marker'ları yakınlıklarına göre gruplamak ve tek bir cluster
 * marker'ı göstermek. Kullanıcı zoom yaptığında cluster'lar açılır.
 */

export interface ClusteredStop {
  id: string;
  stops: TransitStop[];
  centerLat: number;
  centerLon: number;
  count: number;
}

/**
 * Haversine mesafe hesaplama (metre cinsinden)
 * Export edildi - HomeMapScreen'de kullanılıyor
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Dünya yarıçapı (metre)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Stops'ları cluster'lara ayırır (gerçek clustering algoritması)
 * 
 * Grid-based clustering algoritması kullanır:
 * 1. Haritayı grid'lere böler
 * 2. Her grid içindeki stop'ları bir cluster'da toplar
 * 3. Cluster merkezini hesaplar
 * 
 * @param stops - Clustering yapılacak durak listesi
 * @param zoomLevel - Harita zoom seviyesi (kullanılmıyor, gelecekte kullanılabilir)
 * @param clusterRadiusMeters - Cluster yarıçapı (metre cinsinden, varsayılan: 300m)
 * @returns Clustered stop'lar
 */
export function clusterStops(
  stops: TransitStop[],
  zoomLevel: number,
  clusterRadiusMeters: number = 300,
): ClusteredStop[] {
  if (stops.length === 0) {
    return [];
  }

  if (stops.length === 1) {
    return [
      {
        id: `cluster-${stops[0].id}`,
        stops: [stops[0]],
        centerLat: stops[0].latitude,
        centerLon: stops[0].longitude,
        count: 1,
      },
    ];
  }

  const clusters: ClusteredStop[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    
    // Zaten bir cluster'a eklenmişse atla
    if (processed.has(stop.id)) {
      continue;
    }

    // Bu stop'a yakın olan tüm stop'ları bul
    const nearbyStops: TransitStop[] = [stop];
    processed.add(stop.id);

    for (let j = i + 1; j < stops.length; j++) {
      const otherStop = stops[j];
      
      if (processed.has(otherStop.id)) {
        continue;
      }

      const distance = haversineDistance(
        stop.latitude,
        stop.longitude,
        otherStop.latitude,
        otherStop.longitude,
      );

      if (distance <= clusterRadiusMeters) {
        nearbyStops.push(otherStop);
        processed.add(otherStop.id);
      }
    }

    // Cluster merkezini hesapla
    const center = calculateClusterCenter(nearbyStops);

    clusters.push({
      id: `cluster-${stop.id}-${nearbyStops.length}`,
      stops: nearbyStops,
      centerLat: center.lat,
      centerLon: center.lon,
      count: nearbyStops.length,
    });
  }

  return clusters;
}

/**
 * Cluster'ın merkez koordinatını hesaplar
 */
export function calculateClusterCenter(stops: TransitStop[]): { lat: number; lon: number } {
  if (stops.length === 0) {
    return { lat: 0, lon: 0 };
  }
  if (stops.length === 1) {
    return { lat: stops[0].latitude, lon: stops[0].longitude };
  }
  const sumLat = stops.reduce((sum, stop) => sum + stop.latitude, 0);
  const sumLon = stops.reduce((sum, stop) => sum + stop.longitude, 0);
  return {
    lat: sumLat / stops.length,
    lon: sumLon / stops.length,
  };
}


