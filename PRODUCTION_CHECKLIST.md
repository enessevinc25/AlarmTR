# Production Release Checklist

Bu checklist, uygulamayı Play Store ve App Store'a yayınlamadan önce kontrol edilmesi gereken tüm maddeleri içerir.

## ✅ Kod ve Teknik Hazırlık

### Build ve Versiyon
- [ ] `app.config.ts` içinde version: "1.1.0" doğru mu?
- [ ] iOS buildNumber artırıldı mı? (Şu an: 1)
- [ ] Android versionCode artırıldı mı? (Şu an: 1)
- [ ] runtimeVersion store build'lerde değişmeyecek şekilde sabit mi?

### EAS Build
- [ ] `eas.json` production profile doğru mu?
- [ ] EAS Secrets ayarlandı mı?
  - [ ] EXPO_PUBLIC_FIREBASE_API_KEY
  - [ ] EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  - [ ] EXPO_PUBLIC_FIREBASE_PROJECT_ID
  - [ ] EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  - [ ] EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - [ ] EXPO_PUBLIC_FIREBASE_APP_ID
  - [ ] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
  - [ ] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
  - [ ] EXPO_PUBLIC_SENTRY_DSN
  - [ ] EXPO_PUBLIC_ENVIRONMENT=production

### Production Build Test
- [ ] Production build oluşturuldu mu? (`eas build --profile production`)
- [ ] Android APK/AAB test edildi mi?
- [ ] iOS build test edildi mi? (TestFlight veya gerçek cihaz)
- [ ] Tüm özellikler production build'de çalışıyor mu?
  - [ ] Giriş/Kayıt
  - [ ] Durak arama
  - [ ] Alarm kurma
  - [ ] Favori duraklar
  - [ ] Alarm geçmişi
  - [ ] Harita
  - [ ] Bildirimler
  - [ ] Konum takibi

### API ve Servisler
- [ ] Firebase config production'da doğru mu?
- [ ] Google Maps API key'leri çalışıyor mu?
- [ ] Sentry DSN production'da aktif mi?
- [ ] Transit API production URL'i doğru mu?

---

## 🔒 Güvenlik ve Privacy

### Legal Dokümanlar
- [ ] Privacy Policy hazırlandı mı? (`PRIVACY_POLICY.md`)
- [ ] Terms of Service hazırlandı mı? (`TERMS_OF_SERVICE.md`)
- [ ] Privacy Policy URL'i hazır mı? (GitHub Pages veya web sitesi)
- [ ] Terms of Service URL'i hazır mı?
- [ ] Uygulama içinde Privacy Policy linki var mı?
- [ ] Uygulama içinde Terms of Service linki var mı?

### Veri Güvenliği
- [ ] Firestore security rules production'da aktif mi?
- [ ] Tüm collection'lar korumalı mı?
- [ ] Hardcoded secret yok mu? (kod taraması yapıldı mı?)
- [ ] API key'ler environment variables'da mı?

### GDPR/KVKK Uyumluluğu
- [ ] Privacy Policy GDPR uyumlu mu?
- [ ] Privacy Policy KVKK uyumlu mu?
- [ ] Kullanıcı veri silme özelliği çalışıyor mu?
- [ ] Veri export özelliği var mı? (opsiyonel ama önerilir)

---

## 📱 Store Assets

### Play Store (Google Play)
- [ ] 512x512 px app icon hazır mı?
- [ ] 1024x500 px feature graphic hazır mı?
- [ ] En az 2 screenshot hazır mı? (önerilen 5-8)
- [ ] Tablet screenshot'ları hazır mı? (opsiyonel)
- [ ] Kısa açıklama yazıldı mı? (80 karakter)
- [ ] Uzun açıklama yazıldı mı? (4000 karakter)
- [ ] Store listing görselleri yüksek kaliteli mi?

### App Store (iOS)
- [ ] 1024x1024 px app icon hazır mı?
- [ ] iPhone screenshot'ları hazır mı? (en az 3, önerilen 5-10)
  - [ ] 6.7" iPhone (1290x2796)
  - [ ] 6.5" iPhone (1242x2688)
  - [ ] 5.5" iPhone (1242x2208)
  - [ ] 4.7" iPhone (750x1334)
- [ ] iPad screenshot'ları hazır mı? (opsiyonel)
- [ ] App Preview Video hazır mı? (opsiyonel ama önerilir)
- [ ] Kısa açıklama yazıldı mı? (170 karakter)
- [ ] Uzun açıklama yazıldı mı? (4000 karakter)
- [ ] Keywords belirlendi mi? (100 karakter)

### Genel Store Metadata
- [ ] App Store category seçildi mi? (Navigation/Travel)
- [ ] Content rating belirlendi mi? (4+)
- [ ] Support URL hazır mı?
- [ ] Marketing URL hazır mı? (opsiyonel)
- [ ] Privacy Policy URL hazır mı?

---

## 🧪 Test ve Kalite Kontrolü

### Fonksiyonel Testler
- [ ] Tüm ekranlar test edildi mi?
- [ ] Tüm özellikler test edildi mi?
- [ ] Offline mod test edildi mi?
- [ ] Dark mode test edildi mi?
- [ ] Farklı cihaz boyutları test edildi mi?

### Performans Testleri
- [ ] Uygulama başlangıç süresi kabul edilebilir mi?
- [ ] Memory leak var mı?
- [ ] Battery drain normal mi?
- [ ] Network kullanımı optimize mi?

### Hata Kontrolü
- [ ] Crash log'ları kontrol edildi mi?
- [ ] Sentry'de kritik hata var mı?
- [ ] Console log'ları temizlendi mi? (production build'de)
- [ ] Debug ekranları production'da kapalı mı?

---

## 📋 Dokümantasyon

### Kod Dokümantasyonu
- [ ] README.md güncel mi?
- [ ] Setup instructions var mı?
- [ ] Development guide var mı?
- [ ] Deployment guide var mı?

### Kullanıcı Dokümantasyonu
- [ ] Store description hazır mı?
- [ ] Privacy Policy hazır mı?
- [ ] Terms of Service hazır mı?
- [ ] Support documentation hazır mı?

---

## 🚀 Deployment

### Pre-Release
- [ ] CHANGELOG.md güncellendi mi?
- [ ] Version number artırıldı mı?
- [ ] Build number artırıldı mı?
- [ ] Git tag oluşturuldu mu? (v1.1.0)

### EAS Build
- [ ] Production build başlatıldı mı?
- [ ] Build başarılı mı?
- [ ] Build test edildi mi?

### Store Submission
- [ ] Play Store Console'da listing hazır mı?
- [ ] App Store Connect'te listing hazır mı?
- [ ] Tüm metadata dolduruldu mu?
- [ ] Screenshot'lar yüklendi mi?
- [ ] Privacy Policy URL eklendi mi?
- [ ] Support URL eklendi mi?

### Post-Release
- [ ] Store listing yayınlandı mı?
- [ ] İlk kullanıcı feedback'leri takip ediliyor mu?
- [ ] Crash report'ları izleniyor mu?
- [ ] Analytics kuruldu mu? (opsiyonel)

---

## ⚠️ Kritik Kontroller

### Mutlaka Yapılması Gerekenler
1. **Production build test**: Mutlaka gerçek cihazda test edin
2. **API key kontrolü**: Tüm API key'lerin production'da çalıştığından emin olun
3. **Privacy Policy**: Store'a yayınlamadan önce mutlaka hazır olmalı
4. **Screenshot'lar**: Gerçek uygulama ekranları olmalı
5. **Version/Build**: Her release'te artırılmalı

### Önerilenler
1. **App Preview Video**: Conversion rate'i artırır
2. **Dark Mode Screenshot'ları**: Dark mode özelliği varsa eklenmeli
3. **Tablet Screenshot'ları**: Tablet desteği varsa eklenmeli
4. **Analytics**: Kullanıcı davranışlarını takip etmek için

---

## 📝 Notlar

- Bu checklist'i her release öncesi kontrol edin
- Tamamlanan maddeleri işaretleyin
- Eksik maddeleri öncelik sırasına göre tamamlayın
- Kritik maddeler (⚠️) mutlaka tamamlanmalı

---

**Son Güncelleme**: 2024-12-XX

