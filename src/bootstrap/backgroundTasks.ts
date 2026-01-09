/**
 * Background Tasks Bootstrap (P0 - Critical)
 * 
 * Bu dosya app cold start'ta background task'ları register etmek için kullanılır.
 * TaskManager.defineTask çağrıları locationService.ts içinde modül seviyesinde (top-level) yapılıyor,
 * bu yüzden bu dosyayı import etmek yeterli (side-effect).
 * 
 * AMAÇ: App açılışında (cold start) TaskManager.defineTask tanımlarının %100 register olmasını garanti etmek.
 * Bu sayede OS background task tetiklediğinde task tanımı her zaman mevcut olur.
 * 
 * KULLANIM:
 * - App.tsx'in EN ÜSTÜNDE (diğer importlardan önce) import edilmelidir.
 * - Bu sayede app render edilmeden önce defineTask tanımları kayıt olur.
 * 
 * GÜVENLİK:
 * - Circular import yok: backgroundTasks.ts → locationService.ts (tek yönlü)
 * - locationService.ts bootstrap'i import ETMEZ
 * - Task isim sabitleri (LASTSTOP_LOCATION_TASK, LASTSTOP_GEOFENCE_TASK) aynı kalır
 */

// Side-effect import: locationService.ts içindeki TaskManager.defineTask çağrıları
// LASTSTOP_LOCATION_TASK ve LASTSTOP_GEOFENCE_TASK'ı register eder
// Bu import modül yüklendiğinde otomatik olarak çalışır (module top-level code execution)
import '../services/locationService';
