/**
 * Background Task Registration Bootstrap
 * 
 * Bu dosya app entry'de (index.ts) en üstte import edilerek
 * TaskManager.defineTask çağrılarının her koşulda çalışmasını garanti eder.
 * 
 * locationService.ts içindeki TaskManager.defineTask tanımları
 * app açılışında register olsun diye side-effect import yapar.
 */

import '../services/locationService';

if (__DEV__) {
  console.log('[bootstrap] Background tasks registered');
}
