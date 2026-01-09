import { TransitStop } from '../types/models';

const EARTH_RADIUS_METERS = 6371e3;

const toRad = (value: number) => (value * Math.PI) / 180;

export const distanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.round(distanceInMeters(lat1, lon1, lat2, lon2));
}

export const getNearbyStops = (
  allStops: TransitStop[],
  userLat: number,
  userLon: number,
  radiusMeters = 2500,
  maxCount = 300,
): TransitStop[] => {
  if (!allStops.length) {
    return [];
  }
  return allStops
    .map((stop) => ({
      stop,
      distance: distanceInMeters(userLat, userLon, stop.latitude, stop.longitude),
    }))
    .filter((entry) => Number.isFinite(entry.distance) && entry.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxCount)
    .map((entry) => entry.stop);
};
