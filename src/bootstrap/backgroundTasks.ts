/**
 * Background Tasks Bootstrap
 * 
 * Bu dosya app cold start'ta background task'ları register etmek için kullanılır.
 * TaskManager.defineTask çağrıları locationService.ts içinde modül seviyesinde yapılıyor,
 * bu yüzden bu dosyayı import etmek yeterli (side-effect).
 * 
 * App.tsx'in en üstünde import edilmelidir.
 */

// Side-effect: locationService.ts içindeki TaskManager.defineTask çağrıları
// LASTSTOP_LOCATION_TASK ve LASTSTOP_GEOFENCE_TASK'ı register eder
import '../services/locationService';
