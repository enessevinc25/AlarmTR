# Deployment Guide

Bu rehber, LastStop Alarm TR uygulamasını production'a deploy etmek için adım adım talimatlar içerir.

## 📋 Ön Gereksinimler

### Gerekli Hesaplar
- [ ] Expo hesabı (EAS Build için)
- [ ] Google Play Console hesabı (Android)
- [ ] Apple Developer hesabı (iOS)
- [ ] Firebase Console erişimi
- [ ] Google Cloud Console erişimi (Google Maps API için)

### Gerekli Araçlar
- [ ] Node.js 20+ yüklü
- [ ] EAS CLI yüklü (`npm install -g eas-cli`)
- [ ] Git yüklü
- [ ] Expo CLI yüklü (`npm install -g expo-cli`)

---

## 🔧 1. EAS Secrets Ayarlama

### EAS CLI ile Giriş
```bash
eas login
```

### Secrets Ekleme
```bash
# Firebase Config
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-auth-domain"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-storage-bucket"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your-sender-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your-app-id"

# Google Maps API Keys
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value "your-android-key"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value "your-ios-key"

# Sentry
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "your-sentry-dsn"

# Environment
eas secret:create --scope project --name EXPO_PUBLIC_ENVIRONMENT --value "production"
```

### Secrets Kontrolü
```bash
eas secret:list
```

---

## 🏗️ 2. Production Build Oluşturma

### Android Build
```bash
# Production build (AAB format - Play Store için)
eas build --profile production --platform android

# APK format (test için)
eas build --profile standalone --platform android
```

### iOS Build
```bash
# Production build (App Store için)
eas build --profile production --platform ios
```

### Build Durumu Kontrolü
```bash
eas build:list
```

---

## 📱 3. Android - Play Store Deployment

### 3.1. Play Store Console Hazırlığı
1. [Google Play Console](https://play.google.com/console) açın
2. Yeni uygulama oluşturun veya mevcut uygulamayı seçin
3. Store listing sekmesine gidin

### 3.2. Store Listing Doldurma
- **App name**: LastStop Alarm TR
- **Short description**: `STORE_DESCRIPTION.md` içindeki kısa açıklama
- **Full description**: `STORE_DESCRIPTION.md` içindeki uzun açıklama
- **App icon**: 512x512 px PNG
- **Feature graphic**: 1024x500 px PNG
- **Screenshots**: En az 2 adet (önerilen 5-8)
- **Privacy Policy URL**: GitHub Pages veya web sitesi URL'i

### 3.3. Content Rating
1. Content rating sekmesine gidin
2. Anketi doldurun
3. Rating: **Everyone** (4+)

### 3.4. App Release
1. Production sekmesine gidin
2. "Create new release" tıklayın
3. AAB dosyasını yükleyin (EAS build'den indirilen)
4. Release notes yazın (`CHANGELOG.md`'den)
5. "Review release" tıklayın
6. "Start rollout to Production" tıklayın

### 3.5. Pre-launch Checklist
- [ ] Store listing tamamlandı mı?
- [ ] Screenshot'lar yüklendi mi?
- [ ] Privacy Policy URL eklendi mi?
- [ ] Content rating tamamlandı mı?
- [ ] AAB dosyası yüklendi mi?
- [ ] Release notes yazıldı mı?

---

## 🍎 4. iOS - App Store Deployment

### 4.1. App Store Connect Hazırlığı
1. [App Store Connect](https://appstoreconnect.apple.com) açın
2. "My Apps" > "+" > "New App"
3. App bilgilerini doldurun:
   - **Name**: LastStop Alarm TR
   - **Primary Language**: Turkish
   - **Bundle ID**: com.laststop.alarmtr
   - **SKU**: laststop-alarm-tr

### 4.2. App Information
- **Category**: Navigation (Primary), Travel (Secondary)
- **Privacy Policy URL**: GitHub Pages veya web sitesi URL'i
- **Support URL**: Destek URL'iniz

### 4.3. App Store Listing
- **Name**: LastStop Alarm TR
- **Subtitle**: Durağa yaklaştığında uyan
- **Description**: `STORE_DESCRIPTION.md` içindeki uzun açıklama
- **Keywords**: `STORE_DESCRIPTION.md` içindeki keywords
- **Support URL**: Destek URL'iniz
- **Marketing URL**: (Opsiyonel)

### 4.4. App Preview ve Screenshots
- **App Icon**: 1024x1024 px PNG
- **Screenshots**: 
  - iPhone 6.7": 1290x2796 px
  - iPhone 6.5": 1242x2688 px
  - iPhone 5.5": 1242x2208 px
  - iPhone 4.7": 750x1334 px
- **App Preview Video**: (Opsiyonel ama önerilir)

### 4.5. Build Upload
1. Xcode veya Transporter ile build yükleyin:
   ```bash
   # EAS Build'den indirilen .ipa dosyasını Transporter ile yükleyin
   # veya Xcode > Window > Organizer > Distribute App
   ```
2. App Store Connect'te build'i seçin
3. "Submit for Review" tıklayın

### 4.6. App Review Information
- **Contact Information**: İletişim bilgileriniz
- **Demo Account**: (Gerekirse test hesabı)
- **Notes**: Review için notlar

### 4.7. Pre-launch Checklist
- [ ] App Information tamamlandı mı?
- [ ] Store listing tamamlandı mı?
- [ ] Screenshot'lar yüklendi mi?
- [ ] Privacy Policy URL eklendi mi?
- [ ] Build yüklendi mi?
- [ ] App Review bilgileri dolduruldu mu?

---

## 🔍 5. Post-Deployment Kontroller

### 5.1. İlk 24 Saat
- [ ] Store listing'ler doğru görünüyor mu?
- [ ] Uygulama indirilebiliyor mu?
- [ ] İlk kullanıcı feedback'leri takip ediliyor mu?
- [ ] Crash report'ları kontrol ediliyor mu? (Sentry)

### 5.2. İlk Hafta
- [ ] Kullanıcı yorumları takip ediliyor mu?
- [ ] Rating'ler takip ediliyor mu?
- [ ] Crash rate normal mi?
- [ ] Performance sorunları var mı?

### 5.3. Sürekli İzleme
- [ ] Sentry crash report'ları düzenli kontrol
- [ ] Firebase Analytics (opsiyonel)
- [ ] Store review'ları takip
- [ ] Kullanıcı feedback'leri değerlendirme

---

## 🐛 Troubleshooting

### Build Hataları
```bash
# Build log'larını kontrol et
eas build:view [BUILD_ID]

# Local build test
eas build --profile production --platform android --local
```

### Store Rejection
- **Privacy Policy eksik**: Privacy Policy URL'i ekleyin
- **Screenshot eksik**: Gerekli screenshot'ları yükleyin
- **Content rating eksik**: Content rating anketini tamamlayın
- **Metadata eksik**: Tüm zorunlu alanları doldurun

### API Key Sorunları
- Google Maps API key'leri production'da aktif mi?
- Firebase config doğru mu?
- EAS Secrets doğru ayarlandı mı?

---

## 📚 Ek Kaynaklar

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Son Güncelleme**: 2024-12-XX

