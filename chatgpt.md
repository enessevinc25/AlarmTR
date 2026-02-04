# CURSOR MEGA PROMPT — Yapılan İşlemler Özeti

Bu dosya, "LastStop Alarm TR | Tek seferde toplu düzeltme paketi" kapsamında yapılan tüm değişikliklerin ve nedenlerin özetini içerir.

---

## P0.4 — Firebase init: dummy config kaldır, lazy + ConfigErrorScreen

### Yapılanlar

1. **`src/services/firebase.ts`**
   - Module-level `auth`/`db` export’ları kaldırıldı; yalnızca getter’lar export ediliyor:
     - `validateFirebaseConfig(): { ok: true } | throws` — eksik alanlar ve nereden set edileceği mesajında
     - `getFirebaseApp()`, `getFirebaseAuth()`, `getFirestoreDb()` lazy + memoized
   - Dummy/minimal config tamamen kaldırıldı. Zorunlu alanlar: `apiKey`, `projectId`, `appId`.

2. **Tüm Firebase tüketicileri getter kullanacak şekilde güncellendi**
   - `auth`/`db` import’u yerine `getFirebaseAuth()` / `getFirestoreDb()` kullanılıyor.
   - Güncellenen dosyalar:
     - `src/services/authService.ts`
     - `src/services/alarmBackgroundSync.ts`
     - `src/services/alarmProfilesService.ts`
     - `src/services/userSettingsService.ts`
     - `src/services/savedStopsService.ts`
     - `src/services/stopsService.ts`
     - `src/services/featureFlags.ts`
     - `src/services/userTargetsService.ts`
     - `src/services/firestoreService.ts`
     - `src/context/AuthContext.tsx`
     - `src/context/AlarmContext.tsx`
     - `src/screens/settings/AlarmHistoryScreen.tsx`
     - `src/screens/home/HomeLandingScreen.tsx`
     - `src/screens/home/ActiveAlarmScreen.tsx`

3. **`src/components/common/ConfigErrorScreen.tsx` (yeni)**
   - Firebase/config eksik olduğunda gösterilen ekran.
   - Eksik alanlar, “Nasıl düzeltilir?” ve EXPO_PUBLIC_FIREBASE_* / app.config.ts yönlendirmesi metinle anlatılıyor.

4. **`App.tsx`**
   - Açılışta `validateFirebaseConfig()` çağrılıyor (useEffect).
   - Durumlar: `pending` → kısa “Yükleniyor...” UI, `error` → `ConfigErrorScreen`, `ok` → mevcut uygulama ağacı.
   - Böylece import-time crash yerine kontrollü config hatası ekranı gösteriliyor.

5. **Test mock’ları**
   - `src/__tests__/authService.test.ts`: `auth`/`db` mock’ları `getFirebaseAuth`/`getFirestoreDb` (sabit mock objeler dönen) ile değiştirildi; assertion’larda `getFirebaseAuth()`/`getFirestoreDb()` kullanılıyor.
   - `src/__tests__/alarmBackgroundSync.test.ts`, `src/__tests__/integration.backgroundAlarm.test.ts`: `db: {}` mock’ları `getFirestoreDb: jest.fn(() => ({}))` olacak şekilde güncellendi.

### Neden

- Dummy config ile “yarım çalışan” durum engellendi.
- Eksik config’te kullanıcıya anlaşılır bir ekran gösteriliyor; hangi env’lerin/extra’nın set edilmesi gerektiği yazıyor.
- Firebase kullanımı ilk erişimde (lazy) başlıyor; config kontrolü uygulama açılışında yapılıyor.

---

## P1.1 — RN New Architecture kararı

### Yapılanlar

1. **`app.config.ts`**
   - `newArchEnabled` değeri `EXPO_PUBLIC_NEW_ARCH_ENABLED === 'true'` ile üretiliyor; aksi halde `false`.
   - Production build’de bu env `true` ise net WARNING log’u basılıyor (react-native-maps regression riski, sadece dev/preview önerilir).

2. **`README.md`**
   - Build bölümüne kısa not eklendi: varsayılanın `newArchEnabled: false` olduğu, nedeninin react-native-maps uyumsuzluğu olduğu ve `EXPO_PUBLIC_NEW_ARCH_ENABLED=true` ile dev/preview’da açılabileceği; production’da açılmasının önerilmediği.

### Neden

- Varsayılan false: stabilite ve mevcut react-native-maps uyumluluğu korunuyor.
- İsteyenler env ile dev/preview’da deneyebiliyor; production’da bilinçli kullanım için uyarı veriliyor.

---

## P1.3 — google-services.json / GoogleService-Info.plist opsiyonel

### Yapılanlar

1. **`app.config.ts`**
   - `fs.existsSync` ile proje kökünde `google-services.json` ve `GoogleService-Info.plist` kontrol ediliyor.
   - Varsa:
     - `android.googleServicesFile: './google-services.json'`
     - `ios.googleServicesFile: './GoogleService-Info.plist'`
   - Yoksa bu alanlar set edilmiyor (referans verilmez).

2. **`FIREBASE_GOOGLE_SETUP.md`**
   - Başa not eklendi: Bu dosyalar opsiyoneldir; repo’da yoksa proje normal çalışır. İleride native Firebase/FCM kullanılacaksa dosyalar köke eklendiğinde `app.config.ts` bu path’leri otomatik kullanır.

### Neden

- Dosyalar yokken build ve config bozulmuyor.
- Dosyalar eklendiğinde manuel config değişikliği yapmadan otomatik devreye giriyor.

---

## P1.5 — Doküman dosya adı standardizasyonu

### Yapılanlar

1. **`GUNCEL.md`**
   - `güncel.md` içeriği birebir bu dosyaya kopyalandı (Copy-Item ile).

2. **`güncel.md`**
   - Silinmedi; içeriği kısa yönlendirme ile değiştirildi: “Bu dosya taşındı → [GUNCEL.md](GUNCEL.md)”. CI/Windows ve link paylaşımı için ASCII isim olarak `GUNCEL.md` ana kaynak.

### Neden

- Unicode dosya adı (`güncel.md`) CI ve bazı Windows araçlarında sorun çıkarabildiği için ASCII alternatif sunuldu.
- Eski linkler ve alışkanlık için `güncel.md` yerinde bırakılıp yönlendirme ile yeni dosyaya işaret edildi.

---

## Özet tablo

| Madde | Durum   | Ana dosyalar / etki |
|-------|---------|----------------------|
| P0.4  | Tamamlandı | firebase.ts, ConfigErrorScreen, App.tsx, auth/db tüketicileri, test mock’ları |
| P1.1  | Tamamlandı | app.config.ts, README.md |
| P1.3  | Tamamlandı | app.config.ts, FIREBASE_GOOGLE_SETUP.md |
| P1.5  | Tamamlandı | GUNCEL.md (yeni), güncel.md (yönlendirme) |
| P1.2  | Tamamlandı | layout.ts, colors.ts, Card, SectionHeader, Skeleton, ekranlar |
| İY-1  | Tamamlandı | alarmBackgroundCore.ts (heartbeat buffer, diag örnekleme) |
| İY-2  | Tamamlandı | AlarmContext.tsx (roundCoordForFirestore, CUSTOM target) |
| İY-3  | Tamamlandı | OnboardingPermissionsScreen, AlarmContext clearActiveAlarm |
| Backend transit-api | Tamamlandı | index.ts CORS/rate/Cache-Control, cache.ts async+Redis, clients, env.sample |
| Beyaz/zemin kontrast | Tamamlandı | ActiveAlarmScreen, DebugInfo, HomeStackNavigator, LoginScreen |

---

## Test / QA notları

- **authService.test.ts**, **alarmBackgroundSync.test.ts**: Geçti.
- **transit-api**: `npm run build` ve `npm test` (39 test) geçti.
- **integration.backgroundAlarm.test.ts**: Tüm 7 test geçiyor. Düzeltmeler: (1) `scheduleAlarmNotification` 3 argümanla çağrılıyor — assertion güncellendi; (2) `handleBackgroundLocationUpdate` core'u çağrı anında `require('./alarmBackgroundCore')` ile alıyor ki testte mock/spy çalışsın; (3) snapshot TRIGGERED kontrolü için son `ACTIVE_ALARM_STORAGE_KEY` setItem çağrısı kullanılıyor. (Eski not: 2 test fail — kaldırıldı.)
- Root’ta `npm test` ile auth, alarmBackgroundSync ve integration.backgroundAlarm testleri çalıştırılabilir.

---

## Tamamlanan ek maddeler (P1.2, İY-1/2/3, Backend, Kontrast)

- **P1.2** — theme/colors kaldır, layout.ts, token’lara geçiş
- **İY-1** — Background yazma throttle (heartbeat/diag)
- **İY-2** — CUSTOM hedef koordinat approx (3 decimal)
- **İY-3** — Arka plan konum + foreground service policy
- **Backend transit-api** — CORS, cache provider, rate limit
- **“Beyaz zeminde beyaz yazı”** — Kontrast + token kullanımı

**Hepsi tamamlandı.** Özet tabloda P1.2, İY-1/2/3, Backend transit-api, Beyaz/zemin kontrast satırları eklendi. Kısa notlar: P1.2 layout.ts + tokens; İY-1 heartbeat/diag throttle; İY-2 roundCoordForFirestore CUSTOM; İY-3 onboarding arka plan kaldırıldı + clearActiveAlarm’da stopLocationTracking; Backend CORS/env.sample, async cache+Redis, rate limit /lines/:id/stops, Cache-Control; Kontrast theme renkleri + LoginScreen warnIfLowContrast. Bilinen sınır: ErrorBoundary theme yok; HomeMapScreen import-fail fallback theme kullanmıyor.

---

## CURSOR MEGA PROMPT — Uygulanan kalan işler (Ocak 2026)

- **P1.2**: `rg "theme/colors" src` => 0 (zaten tamamlanmıştı). layout.ts mevcut; tokens.text.danger eklendi.
- **Beyaz yazı kök çözüm**: AppText.tsx (variant: body/title/caption/muted/danger/onPrimary/onSurface), getTextColorForBg(contrastAudit), tokens.text.onPrimary kullanımı (LoginScreen, ActiveAlarmScreen butonları), HomeMapScreenFallback theme-aware (tokens.bg.default, tokens.text.primary/muted/danger). ErrorBoundary #fff buton metni kasıtlı (primary üzerinde kontrast).
- **İY-1**: Doğrulandı — alarmBackgroundCore'da HEARTBEAT_PERSIST_INTERVAL_MS, HEARTBEAT_MIN_DISTANCE_DELTA_M, DIAG_SAMPLE_EVERY_NTH zaten var.
- **İY-2**: src/utils/geoPrivacy.ts eklendi (approxCoord, approxLatLon); AlarmContext roundCoordForFirestore => approxCoord(_, 3) kullanıyor.
- **İY-3**: locationService: ensureAlarmLocationPermissions(), stopAlarmLocationTracking() (foreground + background + geofence idempotent), stopBackgroundLocationTracking / alarmSurvivalService stopLocationTrackingForAlarm TaskNotFoundException yutuluyor. AlarmPreflightScreen alarm başlatmadan önce ensureAlarmLocationPermissions; denied/blocked ise Alert + "Ayarları Aç". ActiveAlarmScreen cleanup/cancel => stopAlarmLocationTracking() tek çağrı.
- **Test**: integration.backgroundAlarm, authService, alarmBackgroundSync, permissionFlow, locationService.interval => 29 test PASS. Genel npm test'te transit-api setup, ExpoApplication, Firebase emulator, geofencing testleri gibi mevcut fail'ler değişmedi.
- **Lint/Typecheck**: Mevcut uyarılar ve firebase.ts tip hataları bu değişikliklerden kaynaklanmıyor.

---

## Pipeline Green (Ocak 2026) — Typecheck + Root npm test PASS

- **Typecheck**: src/services/firebase.ts — getFirebaseConfigFromEnv() içinde `extra` tipi `Partial<FirebaseConfig>`, env erişimi `process.env` type-safe cast ile; typecheck 0 error.
- **Jest**: testPathIgnorePatterns ile transit-api/, emulator.deleteAccountAndData, firestore.rules.test root koşusundan çıkarıldı. jest.setup.ts: expo-application, expo-device, expo-constants, expo-task-manager, expo-location (Accuracy dahil) mock’ları eklendi; alarmService, locationService, alarmBackgroundCore testleri geçiyor.
- **Test düzeltmeleri**: alarmService (setNotificationChannelAsync ≥18, getNotificationConfigForSettings Android’de iosSound null); locationService.geofencing (stopGeofencing önce startGeofencing); alarmBackgroundCore “should log heartbeat” (İY-1 throttle + haversine distance); SkeletonLoader (ThemeProvider wrap + UNSAFE_getByType(View)).
- **Sonuç**: Root `npm test` 86 test PASS, `npm run typecheck` PASS.

---

## Alarm tetiklenince ses çalmıyor (Ocak 2026)

### Sorun
Alarm tetiklendiğinde bildirim gösteriliyor ancak ses çalmıyordu.

### Yapılanlar (`src/services/alarmService.ts`)

1. **`playSound` mantığı**
   - Önceden: `playSound: soundUri !== null` — "Cihaz zil sesi" (device) profili `sound: null` olduğu için ses hiç açılmıyordu.
   - Şimdi: Sadece **"Sessiz"** profilde ses kapalı; **device** dahil diğer tüm profillerde `playSound: true` (device için sistem varsayılan sesi kullanılır).

2. **Android: content.sound**
   - Expo/Android dokümanı: Sesin çalması için hem **kanalda** hem **bildirim content'inde** `sound` belirtilmeli.
   - Önceden: `content.sound` sadece iOS için set ediliyordu (`config.iosSound`).
   - Şimdi: Android için de `content.sound` set ediliyor (`config.androidSound`); böylece varsayılan/soft/loud/custom sesleri content üzerinden de kullanılıyor, device profili `undefined` ile kanal varsayılanına bırakılıyor.

### Doğrulama
- `alarmService.test.ts` (getNotificationConfigForSettings default/silent, scheduleAlarmNotification) — 6 test PASS.
- Ses dosyaları: `assets/sounds/alarm_default.wav`, `alarm_soft.wav`, `alarm_loud.wav` mevcut; `app.config.ts` expo-notifications plugin'inde `sounds` ile tanımlı; Android `res/raw/` içinde kopyalanıyor.

---

## UI Polish Sprint-2 (Onboarding + Empty State + Toast + Haptics + Accessibility)

Amaç: App-store seviyesinde ilk izlenim, boş ekranların profesyonel görünmesi, micro-feedback, erişilebilirlik. Mevcut theme/tokens/AppText korundu; pipeline green (npm test + typecheck PASS).

### Yapılanlar

1. **Storage key merkezi**
   - `src/constants/storageKeys.ts`: `ONBOARDING_DONE_KEY = 'onboarding_done_v1'`.
   - `onboardingService.ts`: Bu key kullanılıyor; eski key (`HAS_COMPLETED_ONBOARDING_V1`) ile geriye dönük uyumluluk (migration: legacy true ise yeni key’e yazıp true dönüyor).

2. **Onboarding**
   - Mevcut 3 slayt + izin ekranı korundu.
   - **Geri** butonu: Slayt 2–3’te “Geri” ile önceki slayta dönüş.
   - **Step geçişi**: Slayt değişiminde kısa fade animasyonu (Animated, ~220ms).

3. **Empty state**
   - `EmptyState.tsx` (title, description, icon?, ctaLabel?, onCta?) zaten vardı; SavedStopsScreen ve AlarmHistoryScreen’de kullanımı önceki sprint’te yapıldı.
   - StopSearch “sonuç yok” mevcut inline metinle bırakıldı.

4. **Toast**
   - ToastContext + ToastHost + useToast() önceki sprint’te eklendi; AlarmPreflightScreen (alarm kuruldu / çevrimdışı), OnboardingPermissionsScreen (izin reddedildi) kullanıyor.

5. **Haptics**
   - `src/utils/haptics.ts`: expo-haptics yoksa no-op; varsa impact/notification. PrimaryButton’da `triggerHaptic('light')` kullanılıyor.

6. **ActiveAlarmScreen micro-animasyon**
   - “Hedefe kalan mesafe” değeri anlamlı değişince (≥20 m veya ilk set) kısa scale animasyonu: 1 → 1.03 → 1 (75ms + 150ms, useNativeDriver).

7. **Erişilebilirlik**
   - Icon-only butonlara accessibilityLabel (aramayı temizle, yer aramasını temizle, Atla, Geri); dokunma alanı min ~44dp.

8. **Testler**
   - `src/__tests__/onboardingFlow.test.ts`: setOnboardingCompleted → setItem(ONBOARDING_DONE_KEY, 'true'); hasCompletedOnboarding true/false ve legacy migration.
   - `src/__tests__/EmptyState.test.tsx`: Title/description render; CTA render ve onCta çağrısı; CTA yok when onCta missing.

### Dosyalar (Sprint-2’de eklenen / güncellenen)

- `src/constants/storageKeys.ts` (yeni)
- `src/services/onboardingService.ts` (ONBOARDING_DONE_KEY + legacy migration)
- `src/screens/onboarding/OnboardingIntroScreen.tsx` (Geri, fade)
- `src/screens/home/ActiveAlarmScreen.tsx` (mesafe scale animasyonu)
- `src/__tests__/onboardingFlow.test.ts` (yeni)
- `src/__tests__/EmptyState.test.tsx` (yeni)
- `chatgpt.md` (bu bölüm)

---

## Store / Release Readiness (Android + iOS)

Amaç: Play Store ve (varsa) App Store yüklemesi için AAB, versiyonlama, izin beyanları, Data Safety / Privacy dokümanları ve mağaza listesi hazırlığı. Pipeline green korundu.

### Yapılanlar

1. **Android production build: AAB**
   - `eas.json` → production → android → `buildType: "app-bundle"` (önceden apk idi).

2. **Versiyonlama**
   - `app.config.ts` içinde `android.versionCode` ve `ios.buildNumber` zaten mevcut; her store yüklemeden önce artırılmalı (dokümanda belirtildi).

3. **Dokümanlar (docs/)**
   - **ANDROID_FOREGROUND_SERVICE.md:** Foreground service neden kullanılıyor, ne zaman çalışıyor, nasıl kapanıyor; Play Console’da foreground service (ve full-screen intent) beyan adımları.
   - **PLAY_BACKGROUND_LOCATION.md:** Play “Location permissions” / arka plan konum formu için kısa-uzun açıklama metinleri (çekirdek özellik, neden gerekli, kullanıcı kontrolü, veri minimizasyonu); uygulama içi açıklamalar ve kod garantisi özeti.
   - **PLAY_DATA_SAFETY.md:** Toplanan veriler (konum, kimlik, tanılama), 3. taraflarla paylaşım, şifreleme, silme; package.json’dan 3. taraf SDK listesi ve kısa data safety notu.
   - **APPLE_APP_PRIVACY.md:** App Store Connect App Privacy soruları için veri türleri (konum, tanımlayıcılar, tanılama); takip/ATT yok; iOS izin metinleri referansı.
   - **STORE_LISTING_CHECKLIST.md:** Versiyonlama, Android/iOS build ve mağaza alanları, görseller, Data safety/App Privacy, PRIVACY_POLICY ve STORE_DESCRIPTION/STORE_ASSETS_GUIDE referansları, hızlı kontrol listesi.

4. **Gizlilik politikası**
   - **PRIVACY_POLICY.md** proje kökünde zaten mevcut; güncelleme yapılmadı.

5. **Uygulama içi izin açıklaması (Play review-friendly)**
   - **AlarmPreflightScreen:** “Alarmı Başlatmadan Önce” altına şu cümle eklendi: “Konum ve bildirim yalnızca alarm aktifken kullanılır; alarm kapalıyken takip yapılmaz.”

### Yapılmayanlar (kısıt / tercih)

- AndroidManifest veya plugin’de ek FGS type değişikliği yok (expo-location ve mevcut izinler yeterli kabul edildi).
- .env.example: `env.sample` zaten güncel; ayrı .env.example eklenmedi.
- Sentry/crashLog için ek PII kısıtı kodu yazılmadı (mevcut telemetry PII-free; dokümanda belirtildi).
- Store build smoke test checklist sadece dokümanda (STORE_LISTING_CHECKLIST) yer alıyor; otomasyon yok.

---

## Sprint-4 Form Copy Pack

Play Console / App Store Connect için kopyala-yapıştır metinler ve mağaza/gizlilik dokümanları. Repo gerçeklerine (izinler, SDK’lar, veri akışı) uyumlu; admin yok; alarm aktif değilken tracking yok; CUSTOM koordinatlar Firestore’da approx (3 decimal). Pipeline green korundu.

### Dosya listesi (docs/)

| Dosya | İçerik |
|-------|--------|
| **ANDROID_FOREGROUND_SERVICE.md** | FGS neden/ne zaman, Play Console beyan adımları |
| **PLAY_BACKGROUND_LOCATION.md** | Arka plan konum formu: tek özellik (durak yaklaşım alarmı), neden gerekli, kullanıcı kontrolü, veri minimizasyonu, review kanıtı |
| **PLAY_DATA_SAFETY.md** | Data Safety cevapları: toplanan veriler (konum, kimlik, tanılama), paylaşım, güvenlik, silme, Firebase notu |
| **APPLE_APP_PRIVACY.md** | App Privacy: veri türleri, konum/tanımlayıcı/tanılama, takip yok |
| **STORE_LISTING_CHECKLIST.md** | Versiyonlama, build, mağaza alanları, Data safety/Privacy, kontrol listesi |

### Diğer referanslar

- **PRIVACY_POLICY.md** (kök): Gizlilik politikası; Store Readiness’te güncelleme yapılmadı.
- **AlarmPreflightScreen:** “Konum ve bildirim yalnızca alarm aktifken kullanılır; alarm kapalıyken takip yapılmaz.” cümlesi eklendi (Play review-friendly).
- **eas.json:** production Android `buildType: "app-bundle"`.

### Son kontroller

- `npm test`: 93 test PASS
- `npm run typecheck`: PASS
- docs/ klasöründe Form Copy Pack dosyaları mevcut

---

## Release Candidate (RC) + Store Submit

Amaç: RC sürümü (1.0.0), production build (AAB / TestFlight) ve mağaza gönderimine hazırlık. Pipeline green; Sprint-4 dokümanları ile tutarlı; transit-api’ye dokunulmadı.

### Yapılanlar

1. **Versiyonlama**
   - `app.config.ts`: `version` ve `runtimeVersion` = `1.0.0` (user-facing RC).
   - `eas.json` → production: `autoIncrement: true` (Android versionCode / iOS buildNumber EAS tarafından otomatik artar).
   - Android production: `buildType: "app-bundle"` (zaten vardı).

2. **Release notes ve changelog**
   - **CHANGELOG.md:** 1.0.0 RC için eklenen/değişen/düzeltilen maddeler.
   - **RELEASE_NOTES.md:** TR + EN kopyala-yapıştır metinleri (kısa açıklama, “Ne yeni?”, önemli notlar, bug fixes).

3. **Pre-submit ve store dokümanları**
   - **docs/RC_SMOKE_TEST.md:** Gerçek cihaz smoke test adımları (giriş, durak ara/seç, alarm başlat/izin, arka plan, tetiklenme, alarm bitir/takip kapanması, çevrimdışı).
   - **docs/PLAY_INTERNAL_TESTING_STEPS.md:** Play Console Internal testing track (AAB yükleme, release notes, tester listesi); isteğe bağlı EAS Submit komutu.

4. **Policy uyumu**
   - Arka plan konum: tek core feature “Durak yaklaşım alarmı” (docs/PLAY_BACKGROUND_LOCATION.md).
   - Android 14+ FGS: FOREGROUND_SERVICE_LOCATION ve dokümanlar (docs/ANDROID_FOREGROUND_SERVICE.md) ile uyumlu.

### Git tag önerisi

- `v1.0.0-rc.1` veya `v1.0.0` (ilk resmi RC için).

### Pre-submit kalite kapıları (RC checklist)

- `npm test` — PASS
- `npm run typecheck` — PASS
- `npm run lint` — (varsa) PASS
- `npx expo-doctor` — (varsa) uyarısız

### DoD (Definition of Done)

- [x] version = 1.0.0 (app.config.ts)
- [x] production autoIncrement aktif (eas.json)
- [x] npm test PASS, npm run typecheck PASS
- [x] docs: RC_SMOKE_TEST.md, PLAY_INTERNAL_TESTING_STEPS.md
- [x] CHANGELOG.md, RELEASE_NOTES.md güncel
- [ ] Android AAB üretildi (EAS build — `eas build --platform android --profile production`; kullanıcı çalıştırır)
- [ ] (Opsiyonel) eas submit: `eas submit --platform android|ios --profile production --latest`; CI için EXPO_TOKEN dokümanda

---

## CI/CD — GitHub Actions + EAS Build/Submit

Amaç: PR/push’ta test + typecheck; tag (v*) ile production AAB + iOS build; isteğe bağlı auto-submit (Play Internal / TestFlight). transit-api root test’ten ayrı (jest.config.js testPathIgnorePatterns); pipeline green.

### Workflow’lar

- **CI** (`.github/workflows/ci.yml`): `pull_request` ve `push` → main/master. Tek job: npm ci → npm test → npm run typecheck. Lint yorum satırında (opsiyonel).
- **Release Build** (`.github/workflows/release-build.yml`): Tetikleyici: `push` tags `v*` veya workflow_dispatch. expo/expo-github-action@v8, EXPO_TOKEN. Adımlar: install → test → typecheck → eas build android (AAB) → eas build ios (production, non-interactive).
- **Release Submit** (`.github/workflows/release-submit.yml`): Sadece workflow_dispatch. Android: build + --auto-submit. iOS: build + --auto-submit (TestFlight). EXPO_TOKEN gerekli.

### Dokümantasyon

- **docs/CI_CD.md:** Hangi workflow ne zaman çalışır; gerekli GitHub secret (EXPO_TOKEN); Android submit önkoşulları (1 kez manuel upload, service account EAS’te); iOS submit (EXPO_TOKEN); tag ile release prosedürü; transit-api test kapsamı.

### DoD

- [x] PR/push’ta CI workflow koşuyor (test + typecheck)
- [x] v* tag push’ta Release Build çalışıyor
- [x] Release Submit workflow_dispatch ile mevcut
- [x] docs/CI_CD.md tamam
