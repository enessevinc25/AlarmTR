# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına uygundur,
ve bu proje [Semantic Versioning](https://semver.org/spec/v2.0.0.html) kullanır.

## [1.1.0] - 2024-12-XX

### Added
- Global crash logging sistemi (ErrorUtils ve unhandledRejection handlers)
- Diagnostics ekranında Last Crash görüntüleme
- Timestamp standardizasyonu (TimestampLike tipi ve formatDate helper)
- Type-safe nested navigation (NavigatorScreenParams)
- Network context optimizasyonu (gereksiz polling kaldırıldı)
- ESLint kurulumu ve CI entegrasyonu
- Dark mode tam tutarlılığı (AccountScreen, OnboardingPermissionsScreen)
- TextInputField component kullanımı
- Firestore security rules iyileştirmeleri
- Offline queue mekanizması (alarm kurma offline desteği)

### Changed
- Navigation service: `getParent()` yerine `NavigationContainer` ref kullanımı
- `firebase-admin` dependencies'ten devDependencies'e taşındı
- `transitCacheService.ts` kaldırıldı (kullanılmıyordu)
- NetworkContext: setInterval polling kaldırıldı, sadece NetInfo.addEventListener kullanılıyor
- AccountScreen: Hard-coded renkler theme colors ile değiştirildi
- OnboardingPermissionsScreen: Hard-coded renkler theme colors ile değiştirildi
- SavedStopsScreen: Render guards ve data validation iyileştirildi
- TextInput ve Modal görsel bugları düzeltildi (dark mode uyumluluğu)

### Fixed
- "Favori Duraklar" crash sorunu (render guards ve data validation ile)
- "Hızlı Alarm Kur" konum sorunu (getCurrentLocation entegrasyonu)
- TextInput text color dark mode'da görünürlük sorunu
- Modal background dark mode uyumluluğu
- TypeScript config hatası (moduleResolution customConditions uyumsuzluğu)
- Firebase Index eksikliği fallback mekanizması
- `deletedAt` field eksikliği yeni alarmSessions'da

### Security
- Firestore security rules güçlendirildi
- API key'ler environment variables ile yönetiliyor
- Hardcoded secret kontrolü yapıldı

### Performance
- NetworkContext gereksiz re-render'lar önlendi
- FlatList optimizasyonları (removeClippedSubviews, maxToRenderPerBatch)
- Location tracking interval optimizasyonu

## [1.0.0] - 2024-XX-XX

### Added
- İlk sürüm
- Temel alarm özellikleri
- Durak arama ve favorilere ekleme
- Özel hedef oluşturma
- Alarm geçmişi
- Alarm profilleri
- Karanlık mod desteği
- Offline çalışma desteği

---

## [Unreleased]

### Planned
- Privacy Policy ve Terms of Service uygulama içi linkleri
- Kullanıcı veri export özelliği (GDPR)
- App Store screenshots ve assets
- Analytics entegrasyonu (opsiyonel)
- Push notification improvements

