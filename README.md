# LastStop Alarm TR

Durağa yaklaştığında seni uyaran akıllı alarm uygulaması. Toplu taşıma kullanırken durağı kaçırmaktan korkma!

## 🎯 Özellikler

- **Akıllı Alarm Sistemi**: Durağa belirlediğin mesafeye yaklaştığında otomatik alarm çalar
- **Favori Duraklar**: Sık kullandığın durakları kaydet, tek tıkla alarm kur
- **Özel Hedefler**: Haritadan istediğin yeri seç, özel alarm hedefi oluştur
- **Alarm Geçmişi**: Geçmiş alarmlarını görüntüle, hızlı alarm kur
- **Alarm Profilleri**: Sık kullandığın ayarları kaydet, hızlı erişim
- **Karanlık Mod**: Sistem ayarına göre otomatik karanlık mod
- **Offline Çalışma**: İnternet olmadan alarm kurma

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 20+
- npm veya yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### Kurulum

```bash
# Dependencies yükle
npm install

# Development server başlat
npm start

# Android'de çalıştır
npm run android

# iOS'ta çalıştır (Mac gerekli)
npm run ios
```

### Environment Variables

`.env` dosyası oluşturun (veya EAS Secrets kullanın):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=your-android-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=your-ios-key
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
EXPO_PUBLIC_ENVIRONMENT=development
```

## 🏗️ Build

### Development Build

```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios
```

### Production Build

```bash
# Android (AAB - Play Store için)
eas build --profile production --platform android

# iOS (App Store için)
eas build --profile production --platform ios
```

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm test

# Coverage ile test
npm run test:coverage

# Firestore rules test
npm run test:rules

# TypeScript check
npm run typecheck

# Lint
npm run lint
```

## 📁 Proje Yapısı

```
src/
├── components/       # Reusable components
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── navigation/       # Navigation configuration
├── screens/          # Screen components
├── services/         # API and service layers
├── theme/            # Theme configuration
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## 🔧 Geliştirme

### Kod Standartları

- **TypeScript**: Strict mode aktif
- **ESLint**: Kurulu ve CI'da zorunlu
- **Prettier**: (Opsiyonel) Kod formatı için
- **Git Hooks**: (Opsiyonel) Pre-commit hooks

### Yeni Özellik Ekleme

1. Feature branch oluştur: `git checkout -b feature/yeni-ozellik`
2. Geliştirmeyi yap
3. Test et: `npm test && npm run lint`
4. Commit et: `git commit -m "feat: yeni özellik eklendi"`
5. Push et: `git push origin feature/yeni-ozellik`
6. Pull Request oluştur

### Debug

- **React Native Debugger**: React DevTools için
- **Flipper**: (Opsiyonel) Advanced debugging
- **Sentry**: Production error tracking
- **Diagnostics Screen**: Uygulama içi debug bilgileri

## 📚 Dokümantasyon

- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)
- [Store Description](./STORE_DESCRIPTION.md)
- [Changelog](./CHANGELOG.md)
- [Store Assets Guide](./STORE_ASSETS_GUIDE.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Production Status](./PRODUCTION_STATUS.md)

## 🔒 Güvenlik

- Firestore Security Rules aktif
- API key'ler environment variables ile yönetiliyor
- Hardcoded secret yok
- KVKK ve GDPR uyumlu

## 📱 Platform Desteği

- **Android**: 7.0+ (API 24+)
- **iOS**: 15.1+

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel bir projedir. Tüm hakları saklıdır.

## 📞 İletişim

Sorularınız için:
- **E-posta**: support@laststop.com
- **Issues**: GitHub Issues kullanın

## 🙏 Teşekkürler

- Expo ekibine harika framework için
- React Navigation ekibine navigation çözümü için
- Firebase ekibine backend servisleri için
- Tüm açık kaynak katkıda bulunanlara

---

**Versiyon**: 1.1.0  
**Son Güncelleme**: 2024-12-XX

