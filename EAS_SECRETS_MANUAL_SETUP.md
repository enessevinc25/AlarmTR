# EAS Secrets Manuel Kurulum Rehberi

EAS CLI komutları interaktif prompt gerektirdiği için, secrets'ları EAS Web UI üzerinden eklemeniz gerekiyor.

**Güncelleme**: Secrets'lar zaten EAS'ta mevcut! Sadece `EXPO_PUBLIC_ENVIRONMENT` için visibility düzeltildi (plaintext olmalı).

## 🔐 Eklenecek Secrets

Aşağıdaki secrets'ları [Expo Dashboard](https://expo.dev/) üzerinden ekleyin:

### 1. Firebase API Key
- **Name**: `EXPO_PUBLIC_FIREBASE_API_KEY`
- **Value**: `AIzaSy...PIDs` (Firebase Console'dan alın)
- **Type**: String
- **Visibility**: Sensitive (EXPO_PUBLIC_ prefix'li değişkenler secret olamaz)

### 2. Firebase Storage Bucket
- **Name**: `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- **Value**: `your-project.firebasestorage.app` (Firebase Console'dan alın)
- **Type**: String
- **Visibility**: Sensitive

### 3. Google Maps API Key (Android)
- **Name**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID`
- **Value**: `AIzaSy...yg2g` (Google Cloud Console'dan alın - Maps SDK for Android)
- **Type**: String
- **Visibility**: Sensitive

### 4. Google Maps API Key (iOS)
- **Name**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS`
- **Value**: `AIzaSy...XR0w` (Google Cloud Console'dan alın - Maps SDK for iOS)
- **Type**: String
- **Visibility**: Sensitive

### 5. Environment
- **Name**: `EXPO_PUBLIC_ENVIRONMENT`
- **Value**: `production`
- **Type**: String
- **Visibility**: Plaintext (EXPO_PUBLIC_ prefix'li değişkenler secret olamaz)

## 📋 Adımlar

1. [Expo Dashboard](https://expo.dev/) açın ve giriş yapın
2. Projenizi seçin: **LastStop Alarm TR** (veya proje adınız)
3. Sol menüden **Secrets** sekmesine tıklayın
4. Her secret için:
   - **Create Secret** butonuna tıklayın
   - **Name** alanına yukarıdaki name'i girin
   - **Value** alanına yukarıdaki value'yu girin
   - **Type**: String seçin
   - **Visibility**: Secret seçin
   - **Create** butonuna tıklayın

## ✅ Doğrulama

Secrets'ları kontrol etmek için:

```bash
npx eas env:list --scope project
```

Veya Expo Dashboard'dan **Secrets** sekmesinde tüm secrets'ları görebilirsiniz.

## ✅ Durum

**Tüm secrets EAS'ta mevcut!** Production, preview ve development environment'lar için gerekli tüm değişkenler EAS Secrets'ta tanımlı.

**ÖNEMLİ:** `eas.json` dosyasında artık API key'ler yok. Tüm key'ler EAS Secrets'ta güvenli şekilde saklanıyor.

## 📝 Notlar

- Secrets'lar production build'lerde otomatik olarak `process.env`'e yüklenir
- Development ve preview build'lerde farklı değerler kullanılabilir
- Sentry DSN opsiyoneldir (kod optional olarak handle ediyor)

