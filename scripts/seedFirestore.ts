/**
 * Seed Firestore Script
 * 
 * Bu script örnek veri içindir. Gerçek belediye verileriyle doldurmalı ve
 * çalıştırmadan önce Firebase Admin SDK ayarlarını tamamlamalısın.
 * 
 * 🔐 Service Account Authentication:
 * - Service account key dosyası repoya KONULMAMALIDIR
 * - GOOGLE_APPLICATION_CREDENTIALS ortam değişkeni ile dışarıdan verilir
 * - Örnek: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
 * - applicationDefault() credential bu ortam değişkenini otomatik okur
 */

import admin from 'firebase-admin';

// NOT: Service account key, GOOGLE_APPLICATION_CREDENTIALS ortam değişkeniyle dışarıdan verilir.
// Bu projede JSON dosyası repoya konulmaz.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

const sampleLines = [
  {
    id: 'line_34AS',
    name: '34AS',
    displayName: '34AS Zincirlikuyu - Avcılar',
    code: '34AS',
    city: 'İstanbul',
    description: 'Metrobüs hattı örneği',
  },
  {
    id: 'line_F4',
    name: 'F4',
    displayName: 'F4 Kadıköy - Karaköy Vapuru',
    code: 'F4',
    city: 'İstanbul',
    description: 'Vapur hattı örneği',
  },
  {
    id: 'line_M2',
    name: 'M2',
    displayName: 'M2 Yenikapı - Hacıosman',
    code: 'M2',
    city: 'İstanbul',
    description: 'Metro hattı örneği',
  },
] as const;

const sampleStops = [
  {
    id: 'stop_1',
    name: 'Zincirlikuyu Metrobüs',
    city: 'İstanbul',
    addressDescription: 'Zincirlikuyu Köprüsü yanı',
    latitude: 41.0671,
    longitude: 29.0089,
    radiusMeters: 400,
    lineIds: ['line_34AS'],
  },
  {
    id: 'stop_2',
    name: 'Kadıköy Rıhtım',
    city: 'İstanbul',
    addressDescription: 'Kadıköy vapur iskelesi',
    latitude: 40.9919,
    longitude: 29.0251,
    radiusMeters: 350,
    lineIds: ['line_F4'],
  },
  {
    id: 'stop_3',
    name: 'Levent Metro',
    city: 'İstanbul',
    addressDescription: 'Levent meydanı',
    latitude: 41.0849,
    longitude: 29.014,
    radiusMeters: 300,
    lineIds: ['line_M2'],
  },
] as const;

const sampleLineStops = [
  { id: 'linestop_34AS_1', lineId: 'line_34AS', stopId: 'stop_1', order: 5, direction: 'INBOUND' },
  { id: 'linestop_F4_1', lineId: 'line_F4', stopId: 'stop_2', order: 1, direction: 'BOTH' },
  { id: 'linestop_M2_1', lineId: 'line_M2', stopId: 'stop_3', order: 8, direction: 'INBOUND' },
] as const;

async function upsertDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await db.collection(collectionName).doc(docId).set(data, { merge: true });
}

async function seed() {
  console.log('Örnek duraklar yazılıyor...');
  for (const stop of sampleStops) {
    await upsertDocument('stops', stop.id, stop as unknown as Record<string, unknown>);
  }

  console.log('Örnek hatlar yazılıyor...');
  for (const line of sampleLines) {
    await upsertDocument('lines', line.id, line as unknown as Record<string, unknown>);
  }

  console.log('Hat durak bağlantıları yazılıyor...');
  for (const lineStop of sampleLineStops) {
    await upsertDocument('lineStops', lineStop.id, lineStop as unknown as Record<string, unknown>);
  }

  console.log('Seed işlemi tamamlandı. Gerçek verilerle güncellemeyi unutma.');
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed işlemi başarısız oldu:', error);
    process.exit(1);
  });

