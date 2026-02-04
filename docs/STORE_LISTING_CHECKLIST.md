# Store Listing Checklist — LastStop Alarm TR

Play Store ve (varsa) App Store yayını öncesi kontrol listesi. Repo içi referanslar tek kaynak olarak kullanılabilir.

---

## Versiyonlama

- **Android:** `app.config.ts` → `android.versionCode`. Her production yüklemeden önce artırın (örn. 2 → 3).
- **iOS:** `app.config.ts` → `ios.buildNumber`. Her store yüklemeden önce artırın (örn. 2 → 3).
- **Sürüm (version):** `app.config.ts` → `version` (örn. 1.1.0). Büyük özellik veya mağaza gereksinimi olduğunda güncelleyin.

---

## Android (Play Store)

### Build

- Production build **AAB** (App Bundle): `eas.json` → production → android → `buildType: "app-bundle"`.
- Komut: `eas build --profile production --platform android`.

### Mağaza Bilgileri

- **Uygulama adı:** LastStop Alarm TR.
- **Kısa açıklama (80 karakter):** `STORE_DESCRIPTION.md` → “Kısa Açıklama”.
- **Uzun açıklama:** `STORE_DESCRIPTION.md` → “Uzun Açıklama”.
- **Gizlilik politikası linki:** Yayınlanmış `PRIVACY_POLICY.md` veya `docs/privacy-policy.html` için public URL (host gerekir; repo içinde `PRIVACY_POLICY.md` ve `docs/privacy-policy.html` hazır).

### Görseller ve Varlıklar

- **App icon:** `assets/icon.png` (1024x1024 önerilir).
- **Splash:** `assets/splash.png`, `app.config.ts` splash ayarları.
- **Feature graphic (Android):** 1024x500 px — `STORE_ASSETS_GUIDE.md` referans.
- **Screenshots (5–8 adet önerilir):** `STORE_ASSETS_GUIDE.md` içindeki önerilen ekran listesi:
  1. Ana ekran (HomeLandingScreen)
  2. Durak arama (StopSearchScreen)
  3. Alarm detay (AlarmDetailsScreen)
  4. Favori duraklar (SavedStopsScreen)
  5. Alarm geçmişi (AlarmHistoryScreen)
  6. Harita (HomeMapScreen)
  7. Ayarlar
  8. Aktif alarm (ActiveAlarmScreen)

### İçerik ve Beyanlar

- **Data safety:** `docs/PLAY_DATA_SAFETY.md` ile formu doldurun.
- **Arka plan konum:** `docs/PLAY_BACKGROUND_LOCATION.md` metinlerini kullanın.
- **Foreground service:** `docs/ANDROID_FOREGROUND_SERVICE.md` ve Play Console beyan adımları.

---

## iOS (App Store, varsa)

- **App Privacy:** `docs/APPLE_APP_PRIVACY.md` ile App Store Connect formunu doldurun.
- **İzin metinleri:** `app.config.ts` → `ios.infoPlist` (NSLocationWhenInUseUsageDescription, NSLocationAlwaysAndWhenInUseUsageDescription).
- **Gizlilik politikası URL:** Aynı public URL (host gerekir).

---

## Gizlilik Politikası (Repo İçi)

- **PRIVACY_POLICY.md:** Proje kökünde; toplanan veriler, kullanım, paylaşım, şifreleme, silme, iletişim.
- **docs/privacy-policy.html:** Web/mağaza linki için HTML sürümü.
- Mağazada kullanılacak link için bu dosyaları bir web sunucusunda veya GitHub Pages’te yayınlamanız gerekir.

---

## Hızlı Kontrol

- [ ] `versionCode` / `buildNumber` artırıldı mı?
- [ ] Production build AAB (Android) alındı mı?
- [ ] Gizlilik politikası URL’i hazır mı?
- [ ] Data safety / App Privacy formları dolduruldu mu?
- [ ] Arka plan konum ve (varsa) foreground service beyanları yapıldı mı?
- [ ] Screenshot ve feature graphic yüklendi mi?
