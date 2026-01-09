// scripts/gtfsImport.config.ts
import path from 'path';

// Proje kökünü baz alıyoruz (D:\AlarmTR)
const rootDir = process.cwd();

export const GTFS_PATHS = {
  routes: path.join(rootDir, 'gtfs', 'routes.csv'),
  stops: path.join(rootDir, 'gtfs', 'stops.csv'),
  trips: path.join(rootDir, 'gtfs', 'trips.csv'),
  stopTimes: path.join(rootDir, 'gtfs', 'stop_times.csv'),
} as const;

export const GTFS_CONFIG = {
  cityName: 'İstanbul',
};
