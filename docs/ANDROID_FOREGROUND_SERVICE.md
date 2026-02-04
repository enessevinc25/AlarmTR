# Android Foreground Service — LastStop Alarm TR

Bu doküman, uygulamanın Android’de foreground service kullanımını ve Play Console beyan sürecini açıklar.

## Neden Foreground Service Kullanılıyor?

LastStop Alarm TR, **alarm aktifken** kullanıcının seçtiği durağa yaklaşmasını tespit etmek için **arka planda konum** takibi yapar. Android 8+ (Oreo) ve özellikle Android 14+ (API 34) ile arka planda konum sürdürmek için **foreground service** (konum tipi) kullanmak zorunludur. Böylece:

- Kullanıcı ekranı kapatsa bile alarm tetiklenebilir.
- Sistem uygulamayı gereksiz yere sonlandırmaz.
- Kullanıcı bildirim çekmecesinden “konum kullanılıyor” bilgisini görür.

## Ne Zaman Çalışıyor?

Foreground service **yalnızca kullanıcı bir alarm başlattığında** devreye girer:

- Alarm **aktif** veya **tetiklenmiş** durumda iken konum takibi (ve gerekirse foreground service) çalışır.
- Alarm **iptal edildiğinde** veya **tetiklenip kullanıcı kapatınca** takip durdurulur.
- Hiç alarm yokken veya alarm kapalıyken **konum takibi ve foreground service çalışmaz**.

## Nasıl Kapanıyor?

- `stopAlarmLocationTracking()` (ve ilgili servisler) alarm iptal/tamamlandığında çağrılır.
- Bu fonksiyon **idempotent**’tir: birden fazla çağrılsa bile güvenle kullanılabilir.
- Foreground service ve konum güncellemeleri tamamen durdurulur.

## Teknik Detaylar

- **Hedef SDK**: Android 14 (API 34). `app.config.ts` içinde `targetSdkVersion: 34`.
- **İzinler**: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION` (Android 14+), `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`.
- **Servis tipi**: Konum (location). Full-screen intent kullanılmıyor; sadece bildirim ile kullanıcı bilgilendirilir.

## Play Console Beyanı

Google Play, foreground service ve (varsa) full-screen intent kullanımı için Console üzerinden beyan ister.

1. **Play Console** → Uygulamanızı seçin.
2. **Politika ve programlar** (Policy and programs) veya **Uygulama içeriği** (App content) bölümüne gidin.
3. **Uygulama erişimleri** / **Özel erişimler** (Special app access) veya **Bildirimler ve veri erişimi** altında **Foreground service** / **Full-screen intent** ile ilgili formu bulun.
4. Formda:
   - Foreground service kullandığınızı belirtin.
   - Kullanım amacını kısaca yazın: “Durak yaklaşım alarmı; yalnızca alarm aktifken arka planda konum takibi.”
   - Full-screen intent kullanmıyorsanız ilgili alanı “Hayır” / “Kullanmıyorum” olarak işaretleyin.
5. Değişiklikleri kaydedin ve incelemeye gönderin.

*Not: Menü adları ve yerler Play Console güncellemeleriyle değişebilir; “foreground service” veya “special access” anahtar kelimeleriyle arama yapabilirsiniz.*
