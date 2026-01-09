// scripts/importGtfsToFirestore.ts
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import admin from 'firebase-admin';

/**
 * APP İÇİNDEKİ models.ts’i import etmek yerine
 * burada script’e özel minimal tipleri tanımlıyoruz.
 * Böylece ../src/types/models import hatası tamamen ortadan kalkıyor.
 */

export interface TransitLine {
  id: string;
  name: string;
  displayName?: string;
  code?: string;
  description?: string;
  city?: string;
  colorHex?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface TransitStop {
  id: string;
  name: string;
  displayName?: string;
  code?: string;
  addressDescription?: string;
  city?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  lineIds?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface TransitLineStop {
  id: string;
  lineId: string;
  stopId: string;
  order: number;
  direction?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * 🔐 Firebase Admin SDK Initialization
 * 
 * GOOGLE_APPLICATION_CREDENTIALS ortam değişkenini kullanır.
 * Service account key dosyası repoya KONULMAMALIDIR.
 * 
 * Örnek kullanım:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
 *   npm run import:gtfs
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// 🔧 GTFS dosya yolları
const rootDir = process.cwd();

const GTFS_PATHS = {
  routes: path.join(rootDir, 'gtfs', 'routes.csv'),
  stops: path.join(rootDir, 'gtfs', 'stops.csv'),
  trips: path.join(rootDir, 'gtfs', 'trips.csv'),
  stopTimes: path.join(rootDir, 'gtfs', 'stop_times.csv'),
} as const;

const GTFS_CONFIG = {
  cityName: 'İstanbul',
};

/**
 * CSV dosyasını satır satır okuyan yardımcı fonksiyon
 */
function streamCsv(
  filePath: string,
  onRow: (row: any) => void | Promise<void>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      trim: true,
      skip_empty_lines: true,
      // GTFS setindeki problemli satırlar için parser'ı esnekleştiriyoruz
      relax_column_count: true,
      relax_quotes: true,
    });

    fs.createReadStream(filePath)
      .pipe(parser)
      .on('data', async (row) => {
        try {
          await onRow(row);
        } catch (err) {
          console.error('[streamCsv] Row error:', err);
        }
      })
      .on('end', () => {
        console.log('[streamCsv] Finished:', filePath);
        resolve();
      })
      .on('error', (err) => {
        console.error('[streamCsv] Error:', filePath, err);
        reject(err);
      });
  });
}

/**
 * routes.csv → lines koleksiyonu
 */
async function importLines(): Promise<Map<string, TransitLine>> {
  console.log('--- Importing routes → lines ---');

  const lines = new Map<string, TransitLine>();

  await streamCsv(GTFS_PATHS.routes, (row) => {
    const routeId = row.route_id as string;
    if (!routeId) return;

    const shortName = (row.route_short_name as string) || '';
    const longName = (row.route_long_name as string) || '';

    const line: TransitLine = {
      id: routeId,
      name: shortName || longName || routeId,
      displayName: longName || shortName || routeId,
      code: shortName || undefined,
      description: longName || undefined,
      city: GTFS_CONFIG.cityName,
      createdAt: null,
      updatedAt: null,
    };

    lines.set(routeId, line);
  });

  console.log(`Routes parsed: ${lines.size}`);

  const colRef = db.collection('lines');
  const docs: { ref: FirebaseFirestore.DocumentReference; data: any }[] = [];

  for (const line of lines.values()) {
    const ref = colRef.doc(line.id);
    docs.push({ ref, data: line });
  }

  await writeInBatches(docs);
  console.log('Lines written to Firestore');

  return lines;
}

/**
 * stops.csv → stops koleksiyonu
 */
async function importStops(): Promise<Map<string, TransitStop>> {
  console.log('--- Importing stops.csv → stops ---');

  const stops = new Map<string, TransitStop>();

  await streamCsv(GTFS_PATHS.stops, (row) => {
    const stopId = row.stop_id as string;
    if (!stopId) return;

    const stopName = (row.stop_name as string) || '';
    const lat = parseFloat(row.stop_lat);
    const lon = parseFloat(row.stop_lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      console.warn('[importStops] Geçersiz lat/lon, durağı atlıyorum:', stopId, stopName);
      return;
    }

    const stop: TransitStop = {
      id: stopId,
      name: stopName,
      displayName: stopName,
      code: (row.stop_code as string) || undefined,
      addressDescription: (row.stop_desc as string) || undefined,
      city: GTFS_CONFIG.cityName,
      latitude: lat,
      longitude: lon,
      lineIds: [],
      createdAt: null,
      updatedAt: null,
    };

    stops.set(stopId, stop);
  });

  console.log(`Stops parsed: ${stops.size}`);

  const colRef = db.collection('stops');
  const docs: { ref: FirebaseFirestore.DocumentReference; data: any }[] = [];

  for (const stop of stops.values()) {
    const ref = colRef.doc(stop.id);
    docs.push({ ref, data: stop });
  }

  await writeInBatches(docs);
  console.log('Stops written to Firestore');

  return stops;
}

/**
 * trips + stop_times → lineStops koleksiyonu
 */
async function importLineStops(
  lines: Map<string, TransitLine>,
  stops: Map<string, TransitStop>
) {
  console.log('--- Importing trips+stop_times → lineStops ---');

  const tripToRoute = new Map<string, string>();

  // 1) trips.csv: trip_id -> route_id
  await streamCsv(GTFS_PATHS.trips, (row) => {
    const tripId = row.trip_id as string;
    const routeId = row.route_id as string;
    if (!tripId || !routeId) return;
    if (!lines.has(routeId)) return;
    tripToRoute.set(tripId, routeId);
  });

  console.log(`Trips parsed: ${tripToRoute.size}`);

  // 2) stop_times.csv: trip_id + stop_id + stop_sequence
  type RouteStopSeq = { stopId: string; sequence: number };
  const routeStopsMap = new Map<string, RouteStopSeq[]>();

  await streamCsv(GTFS_PATHS.stopTimes, (row) => {
    const tripId = row.trip_id as string;
    const stopId = row.stop_id as string;
    const seqStr = row.stop_sequence as string;

    if (!tripId || !stopId) return;
    const routeId = tripToRoute.get(tripId);
    if (!routeId) return;
    if (!stops.has(stopId)) return;

    const sequence = parseInt(seqStr, 10);
    if (Number.isNaN(sequence)) return;

    const arr = routeStopsMap.get(routeId) ?? [];
    arr.push({ stopId, sequence });
    routeStopsMap.set(routeId, arr);
  });

  console.log(`Route → stop sequence entries: ${routeStopsMap.size}`);

  const lineStopsDocs: {
    ref: FirebaseFirestore.DocumentReference;
    data: TransitLineStop;
  }[] = [];

  const lineStopsCol = db.collection('lineStops');
  const stopsCol = db.collection('stops');

  for (const [routeId, seqList] of routeStopsMap.entries()) {
    const byStop = new Map<string, number>();

    for (const item of seqList) {
      const current = byStop.get(item.stopId);
      if (current == null || item.sequence < current) {
        byStop.set(item.stopId, item.sequence);
      }
    }

    const compacted = Array.from(byStop.entries())
      .map(([stopId, sequence]) => ({ stopId, sequence }))
      .sort((a, b) => a.sequence - b.sequence);

    compacted.forEach(({ stopId }, index) => {
      const id = `${routeId}_${stopId}`;
      const ref = lineStopsCol.doc(id);

      const data: TransitLineStop = {
        id,
        lineId: routeId,
        stopId,
        order: index + 1,
        createdAt: null,
        updatedAt: null,
      };

      lineStopsDocs.push({ ref, data });

      const stop = stops.get(stopId);
      if (stop) {
        if (!stop.lineIds) stop.lineIds = [];
        if (!stop.lineIds.includes(routeId)) {
          stop.lineIds.push(routeId);
        }
      }
    });
  }

  console.log(
    `LineStops documents to write: ${lineStopsDocs.length} (this may take a while)`
  );

  await writeInBatches(lineStopsDocs);
  console.log('lineStops written to Firestore');

  // 4) stops koleksiyonunu lineIds ile tekrar güncelle
  const stopDocs: { ref: FirebaseFirestore.DocumentReference; data: any }[] = [];
  for (const stop of stops.values()) {
    const ref = stopsCol.doc(stop.id);
    stopDocs.push({ ref, data: { lineIds: stop.lineIds ?? [] } });
  }
  await writeInBatches(stopDocs);
  console.log('stops updated with lineIds');
}


function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

/**
 * Firestore batch helper – 500 sınırına takılmamak için
 */
async function writeInBatches(
  docs: { ref: FirebaseFirestore.DocumentReference; data: any }[],
  batchSize = 400
) {
  console.log(`Writing ${docs.length} docs in batches of ${batchSize}...`);

  let batch = db.batch();
  let count = 0;

  for (const { ref, data } of docs) {
    // Firestore'a gitmeden önce undefined alanları temizle
    const cleanedData = removeUndefinedFields(data);

    batch.set(ref, cleanedData, { merge: true });
    count++;

    if (count >= batchSize) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log('Batches committed');
}

/**
 * Main
 */
async function main() {
  try {
    console.log('=== GTFS → Firestore import started ===');

    console.log('Step 1/3: Import lines (routes.csv)');
    const lines = await importLines();

    console.log('Step 2/3: Import stops (stops.csv)');
    const stops = await importStops();

    console.log('Step 3/3: Import lineStops (trips + stop_times)');
    await importLineStops(lines, stops);

    console.log('=== GTFS → Firestore import finished successfully ===');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

main();
