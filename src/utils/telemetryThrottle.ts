/**
 * Telemetry write throttle helper
 * 
 * Firestore write maliyetini azaltmak için:
 * - Min write interval: 25 saniye
 * - Anlamlı hareket yoksa yazma (< 25m değişimse pas geç)
 * - Triggered/CANCELLED sonrası hiç yazma
 */

interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Telemetry update yazılmalı mı kontrol eder
 * 
 * @param lastWriteAt Son yazma zamanı (ms timestamp)
 * @param prevLocation Önceki konum (opsiyonel)
 * @param newLocation Yeni konum
 * @param status Alarm durumu (TRIGGERED/CANCELLED ise false döner)
 * @returns true ise yazılmalı, false ise yazılmamalı
 */
export function shouldWriteSessionUpdate(
  lastWriteAt: number,
  prevLocation: Location | null,
  newLocation: Location,
  status?: string
): boolean {
  // TRIGGERED veya CANCELLED durumunda yazma
  if (status === 'TRIGGERED' || status === 'CANCELLED') {
    return false;
  }

  const now = Date.now();
  const timeSinceLastWrite = now - lastWriteAt;

  // Min write interval: 25 saniye
  if (timeSinceLastWrite < 25000) {
    return false;
  }

  // Anlamlı hareket kontrolü (25m'den az değişimse pas geç)
  if (prevLocation) {
    const latDiff = Math.abs(newLocation.latitude - prevLocation.latitude);
    const lonDiff = Math.abs(newLocation.longitude - prevLocation.longitude);
    
    // Basit mesafe tahmini (metre cinsinden)
    // 1 derece latitude ≈ 111 km, 1 derece longitude ≈ 111 km * cos(latitude)
    const latMeters = latDiff * 111000;
    const lonMeters = lonDiff * 111000 * Math.cos((newLocation.latitude * Math.PI) / 180);
    const distanceMeters = Math.sqrt(latMeters * latMeters + lonMeters * lonMeters);

    if (distanceMeters < 25) {
      return false;
    }
  }

  return true;
}

