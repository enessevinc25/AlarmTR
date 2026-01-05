# EAS Secrets Manuel Kurulum Rehberi

EAS CLI komutları interaktif prompt gerektirdiği için, secrets'ları EAS Web UI üzerinden eklemeniz gerekiyor.

**Güncelleme**: Secrets'lar zaten EAS'ta mevcut! Sadece `EXPO_PUBLIC_ENVIRONMENT` için visibility düzeltildi (plaintext olmalı).

## 🔐 Eklenecek Secrets

Aşağıdaki secrets'ları [Expo Dashboard](https://expo.dev/) üzerinden ekleyin:

### 1. Firebase API Key
- **Name**: `EXPO_PUBLIC_FIREBASE_API_KEY`
- **Value**: `AIzaSyCS75soGEExQaePqbblpEDIBaB43bePIDs`
- **Type**: String
- **Visibility**: Secret

### 2. Firebase Storage Bucket
- **Name**: `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- **Value**: `laststop-alarm-tr-38d76.firebasestorage.app`
- **Type**: String
- **Visibility**: Secret

### 3. Google Maps API Key (Android)
- **Name**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID`
- **Value**: `AIzaSyAVU7hqKkF7p3yHIFn_ykwJG2PTTIMyg2g`
- **Type**: String
- **Visibility**: Secret

### 4. Google Maps API Key (iOS)
- **Name**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS`
- **Value**: `AIzaSyDsm7bYfryNWjJppXCYGHGvYBhFjcMXR0w`
- **Type**: String
- **Visibility**: Secret

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

## 🔄 Alternatif: eas.json ile Geçici Çözüm

Eğer EAS Secrets ekleyemiyorsanız, `eas.json` dosyasındaki `production` profili içindeki `env` bölümüne secrets'ları ekledim. Bu geçici bir çözümdür ve production build'lerde çalışacaktır.

**Not**: `eas.json` dosyasındaki secrets'lar git'e commit edilmemelidir (güvenlik riski). Ancak şu an için production build'lerin çalışması için ekledim. İleride EAS Secrets'a taşımanız önerilir.

## 📝 Notlar

- Secrets'lar production build'lerde otomatik olarak `process.env`'e yüklenir
- Development ve preview build'lerde farklı değerler kullanılabilir
- Sentry DSN opsiyoneldir (kod optional olarak handle ediyor)

