/**
 * Alarm Accuracy Engine (P0)
 * 
 * GPS jitter, düşük accuracy, eski konum, hızlı geçiş gibi durumlarda
 * alarmın yanlış tetiklenmesini önler.
 * 
 * Özellikler:
 * - Quality gates (stale location, bad accuracy)
 * - Smoothing (median filter)
 * - Confirmation (ardışık iyi örnekler)
 * - Hysteresis (çıkış eşiği)
 * - Cooldown (tekrar tetikleme önleme)
 */

export const DEFAULT_ACC_CFG = {
  // Location quality gates
  maxLocationAgeSec: 30, // konum 30 sn'den eskiyse ignore
  maxAccuracyMeters: 80, // accuracy 80m'den kötüyse ignore
  // Trigger logic
  enterRadiusMetersBuffer: 0, // istersen radius - buffer mantığı
  confirmHits: 2, // "içerdeyim" için ardışık 2 iyi örnek
  confirmWindowSec: 25, // bu 2 hit 25 sn içinde gelmeli
  minGoodSamplesBeforeTrigger: 2,
  // Hysteresis & cooldown
  cooldownSec: 60, // tetikledikten sonra 60 sn yeniden tetikleme yok
  exitRadiusMultiplier: 1.4, // çıkış eşiği = radius * 1.4 (histerezis)
  // Smoothing
  distanceWindowSize: 5, // son 5 distance ile median
};

export type AccuracyState = {
  sessionId: string;
  lastGoodAt?: number;
  lastTriggerAt?: number;
  insideStreak: number; // ardışık "içerde" sayısı
  lastInsideAt?: number;
  firstInsideAt?: number; // confirmation window için
  distances: number[]; // ring buffer (rounded)
  lastDecision?: 'inside' | 'outside' | 'ignored';
};

export type AccuracyInput = {
  nowMs: number;
  targetRadiusMeters: number;
  distanceMeters: number; // hesaplanan dist
  locationTimestampMs?: number; // expo-location timestamp
  accuracyMeters?: number; // coords.accuracy
};

export type AccuracyDecision = {
  acceptedSample: boolean; // quality gate geçti mi
  smoothedDistanceMeters: number; // median/ema sonucu
  isInside: boolean; // (smoothed) dist <= radius
  shouldTrigger: boolean; // confirmation + cooldown sonrası true
  reason: string; // debug için kısa reason (no PII)
  nextState: AccuracyState;
};

/**
 * Konum eski mi kontrol et
 */
function isLocationStale(nowMs: number, locationTimestampMs: number | undefined, maxAgeSec: number): boolean {
  if (!locationTimestampMs) {
    return false; // Timestamp yoksa stale sayma (fallback)
  }
  const ageSec = (nowMs - locationTimestampMs) / 1000;
  return ageSec > maxAgeSec;
}

/**
 * Accuracy iyi mi kontrol et
 */
function isAccuracyGood(accuracyMeters: number | undefined, maxAcc: number): boolean {
  if (accuracyMeters === undefined) {
    return true; // Accuracy bilgisi yoksa kabul et (fallback)
  }
  return accuracyMeters <= maxAcc;
}

/**
 * Ring buffer: yeni değer ekle, max uzunluğu koru
 */
function pushRing<T>(arr: T[], value: T, max: number): T[] {
  const newArr = [...arr, value];
  if (newArr.length > max) {
    return newArr.slice(-max);
  }
  return newArr;
}

/**
 * Median hesapla
 */
function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Mesafeyi yuvarla (5m/10m bucket)
 */
function roundDist(d: number): number {
  return Math.round(d / 5) * 5; // 5m'lik yuvarlama
}

/**
 * Accuracy state'i güncelle ve karar ver
 */
export function updateAccuracyState(
  state: AccuracyState,
  input: AccuracyInput,
  cfg = DEFAULT_ACC_CFG,
): AccuracyDecision {
  const { nowMs, targetRadiusMeters, distanceMeters, locationTimestampMs, accuracyMeters } = input;

  // Edge case: invalid distance
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return {
      acceptedSample: false,
      smoothedDistanceMeters: state.distances.length > 0 ? median(state.distances) : distanceMeters,
      isInside: false,
      shouldTrigger: false,
      reason: 'invalid_distance',
      nextState: {
        ...state,
        lastDecision: 'ignored',
      },
    };
  }

  // 1) Quality Gate: Stale location
  if (isLocationStale(nowMs, locationTimestampMs, cfg.maxLocationAgeSec)) {
    return {
      acceptedSample: false,
      smoothedDistanceMeters: state.distances.length > 0 ? median(state.distances) : distanceMeters,
      isInside: false,
      shouldTrigger: false,
      reason: 'stale_location',
      nextState: {
        ...state,
        lastDecision: 'ignored',
      },
    };
  }

  // 2) Quality Gate: Bad accuracy
  if (!isAccuracyGood(accuracyMeters, cfg.maxAccuracyMeters)) {
    return {
      acceptedSample: false,
      smoothedDistanceMeters: state.distances.length > 0 ? median(state.distances) : distanceMeters,
      isInside: false,
      shouldTrigger: false,
      reason: 'bad_accuracy',
      nextState: {
        ...state,
        lastDecision: 'ignored',
      },
    };
  }

  // Quality gate geçti, sample kabul edildi
  const acceptedSample = true;

  // 3) Smoothing: Distance'ı ring buffer'a ekle ve median hesapla
  const roundedDist = roundDist(distanceMeters);
  const newDistances = pushRing(state.distances, roundedDist, cfg.distanceWindowSize);
  const smoothedDistance = newDistances.length > 0 ? median(newDistances) : roundedDist;

  // 4) Inside/Outside kararı
  const isInside = smoothedDistance <= targetRadiusMeters;

  // 5) Hysteresis: Çıkış eşiği
  const exitThreshold = targetRadiusMeters * cfg.exitRadiusMultiplier;
  // Edge case: Radius çok küçükse (örn < 80m) exit threshold'u clamp et
  const minExitThreshold = targetRadiusMeters + 50;
  const finalExitThreshold = Math.max(exitThreshold, minExitThreshold);

  // 6) Inside streak güncelleme
  let newInsideStreak = state.insideStreak;
  let newLastInsideAt = state.lastInsideAt;
  let newFirstInsideAt = state.firstInsideAt;

  if (isInside) {
    // İçerideyiz
    if (state.insideStreak === 0) {
      // İlk kez içeri girdik
      newFirstInsideAt = nowMs;
    }
    newInsideStreak = state.insideStreak + 1;
    newLastInsideAt = nowMs;
  } else {
    // Dışarıdayız
    if (smoothedDistance <= finalExitThreshold) {
      // Hysteresis: Çıkış eşiğinin içindeyiz, streak'i koru (jitter toleransı)
      // Streak'i sıfırlama
    } else {
      // Gerçekten dışarıdayız, streak'i sıfırla
      newInsideStreak = 0;
      newFirstInsideAt = undefined;
      newLastInsideAt = undefined;
    }
  }

  // 7) Confirmation window kontrolü
  if (newInsideStreak >= cfg.confirmHits && newFirstInsideAt !== undefined) {
    const windowDurationSec = (nowMs - newFirstInsideAt) / 1000;
    if (windowDurationSec > cfg.confirmWindowSec) {
      // Window aşıldı, streak'i resetle
      newInsideStreak = 0;
      newFirstInsideAt = undefined;
      newLastInsideAt = undefined;
    }
  }

  // 8) Cooldown kontrolü
  let shouldTrigger = false;
  let reason = '';

  if (state.lastTriggerAt !== undefined) {
    const cooldownDurationSec = (nowMs - state.lastTriggerAt) / 1000;
    if (cooldownDurationSec < cfg.cooldownSec) {
      reason = 'cooldown';
      shouldTrigger = false;
    } else if (newInsideStreak >= cfg.confirmHits) {
      // Cooldown geçti ve confirmation tamam
      shouldTrigger = true;
      reason = 'confirmed_inside';
    } else {
      reason = `waiting_confirmation (${newInsideStreak}/${cfg.confirmHits})`;
      shouldTrigger = false;
    }
  } else {
    // İlk tetikleme: confirmation kontrolü
    if (newInsideStreak >= cfg.confirmHits) {
      shouldTrigger = true;
      reason = 'confirmed_inside';
    } else {
      reason = `waiting_confirmation (${newInsideStreak}/${cfg.confirmHits})`;
      shouldTrigger = false;
    }
  }

  // 9) Next state oluştur
  const nextState: AccuracyState = {
    ...state,
    lastGoodAt: nowMs,
    insideStreak: newInsideStreak,
    lastInsideAt: newLastInsideAt,
    firstInsideAt: newFirstInsideAt,
    distances: newDistances,
    lastDecision: isInside ? 'inside' : 'outside',
  };

  // Trigger olduysa lastTriggerAt güncelle
  if (shouldTrigger) {
    nextState.lastTriggerAt = nowMs;
    // Trigger sonrası streak'i resetle (veya koru, tercih meselesi)
    // nextState.insideStreak = 0; // Resetle
  }

  return {
    acceptedSample,
    smoothedDistanceMeters: smoothedDistance,
    isInside,
    shouldTrigger,
    reason,
    nextState,
  };
}

/**
 * Yeni accuracy state oluştur
 */
export function createAccuracyState(sessionId: string): AccuracyState {
  return {
    sessionId,
    insideStreak: 0,
    distances: [],
  };
}

/**
 * Accuracy state'i AsyncStorage'dan yükle
 */
export async function loadAccuracyState(sessionId: string): Promise<AccuracyState | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const key = `alarm_accuracy_state_${sessionId}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AccuracyState;
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmAccuracyEngine] Load state failed:', error);
    }
    return null;
  }
}

/**
 * Accuracy state'i AsyncStorage'a kaydet
 */
export async function saveAccuracyState(state: AccuracyState): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const key = `alarm_accuracy_state_${state.sessionId}`;
    await AsyncStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmAccuracyEngine] Save state failed:', error);
    }
  }
}
