import { TimestampLike } from '../utils/date';

export type TransportMode = 'BUS' | 'METRO' | 'METROBUS' | 'TRAM' | 'TRAIN' | 'FERRY';

export interface TransitLine {
  id: string;
  name: string; // Örn: 34AS
  displayName?: string; // Örn: 34AS – Beşiktaş / Avcılar
  code?: string;
  description?: string;
  city?: string;
  colorHex?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface TransitStop {
  id: string;
  name: string;
  displayName?: string;
  code?: string;
  lines?: string[];
  addressDescription?: string;
  city?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  lineIds?: string[];
  searchKeywords?: string[];
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface TransitLineStop {
  id: string;
  lineId: string;
  stopId: string;
  order: number;
  direction?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface UserTarget {
  id: string;
  userId: string;
  name: string;
  lat: number;
  lon: number;
  radiusMeters: number;
  createdAt: TimestampLike;
}

export type AlarmStatus = 'ACTIVE' | 'CANCELLED' | 'TRIGGERED';

export interface AlarmSession {
  id: string;
  userId: string;
  targetType: 'STOP' | 'CUSTOM';
  targetId: string;
  distanceThresholdMeters: number;
  status: AlarmStatus;
  targetName: string;
  targetLat: number;
  targetLon: number;
  transportMode?: TransportMode;
  minutesBefore?: number;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  triggeredAt?: TimestampLike;
  lastKnownDistanceMeters?: number;
}

export interface UserSavedStop {
  id: string;
  userId: string;
  stopId: string;
  stopName: string;
  latitude: number;
  longitude: number;
  addressDescription?: string;
  city?: string;
  lineIds?: string[];
  defaultDistanceMeters?: number;
  createdAt?: TimestampLike;
}

export interface UserAlarmPreferences {
  defaultDistanceMeters: number;
  defaultTransportMode: TransportMode;
  defaultMinutesBefore: number;
}

export interface UserAlarmProfile {
  id: string;
  userId: string;
  name: string;
  distanceMeters: number;
  transportMode: TransportMode;
  minutesBefore: number;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

