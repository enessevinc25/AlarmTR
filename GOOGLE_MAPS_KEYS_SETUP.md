# Google Maps API Keys Setup Guide

## 3-Key Model (P0)

LastStop Alarm TR uygulaması **3 ayrı Google Maps API key** kullanır:

1. **EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID** - Maps SDK for Android (native harita)
2. **EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS** - Maps SDK for iOS (native harita)
3. **EXPO_PUBLIC_GOOGLE_MAPS_API_KEY** - Web services (Places API vb) - native'de kullanılmaz

## Neden 3 Key?

- **Native key'ler platform-specific olmalı**: Android ve iOS Maps SDK'ları farklı key'ler gerektirir
- **Genel key fallback yapılmaz**: Genel key (Places-only) native harita için kullanılamaz → harita blank olur
- **Web key ayrı**: Places API vb web services için ayrı key (ileride proxy tarafında kullanılabilir)

## EAS Secrets Setup

### 1. Google Cloud Console'da Key Oluşturma

#### Android Key (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID)
1. Google Cloud Console → APIs & Services → Credentials
2. "Create Credentials" → "API Key"
3. Key'i kısıtla:
   - **Application restrictions**: Android apps
   - **Package name**: `com.laststop.alarmtr`
   - **SHA-1 certificate fingerprint**: APK signing key'in SHA-1'i (EAS build'de otomatik eklenir)
4. **API restrictions**: 
   - ✅ Maps SDK for Android
   - ✅ Places API (eğer Places kullanılıyorsa)
   - ✅ Geocoding API (eğer geocoding kullanılıyorsa)
5. Billing açık olmalı (Maps SDK ücretli)

#### iOS Key (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS)
1. Google Cloud Console → APIs & Services → Credentials
2. "Create Credentials" → "API Key"
3. Key'i kısıtla:
   - **Application restrictions**: iOS apps
   - **Bundle ID**: `com.laststop.alarmtr`
4. **API restrictions**:
   - ✅ Maps SDK for iOS
   - ✅ Places API (eğer Places kullanılıyorsa)
   - ✅ Geocoding API (eğer geocoding kullanılıyorsa)
5. Billing açık olmalı (Maps SDK ücretli)

#### Web Key (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
1. Google Cloud Console → APIs & Services → Credentials
2. "Create Credentials" → "API Key"
3. Key'i kısıtla:
   - **Application restrictions**: HTTP referrers (web sites)
   - Veya **IP addresses** (server IP'leri)
4. **API restrictions**:
   - ✅ Places API
   - ✅ Geocoding API
   - ❌ Maps SDK (web key native'de kullanılmaz)

### 2. EAS Secrets'a Ekleme

```bash
# Android key
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value YOUR_ANDROID_KEY

# iOS key
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value YOUR_IOS_KEY

# Web key (opsiyonel, şimdilik gerekli değil)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value YOUR_WEB_KEY
```

### 3. Local Development (.env)

Local development için `.env` dosyasına ekleyin:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=your_android_key_here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=your_ios_key_here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_web_key_here
```

## Build-Time Guard

Preview/Production build'lerde native key yoksa build **FAIL** eder:

- Android build: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID` yoksa → Build error
- iOS build: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS` yoksa → Build error

Bu sayede blank harita sessizce oluşmaz, build-time'da hata verir.

## "Harita Blank" Checklist

Harita yüklenmiyorsa şunları kontrol edin:

### 1. Key Build'e Gömüldü mü?
- Diagnostics ekranında "Google Maps API Key Durumu" bölümünü kontrol edin
- Android Maps Key: **Var** olmalı (Android'de)
- iOS Maps Key: **Var** olmalı (iOS'ta)

### 2. SHA-1 APK ile Aynı mı?
- Google Cloud Console → Credentials → Android key
- SHA-1 certificate fingerprint'leri kontrol edin
- EAS build'de otomatik eklenir, ama manuel build'de eklemeniz gerekebilir

### 3. Maps SDK Enabled + Billing Açık mı?
- Google Cloud Console → APIs & Services → Enabled APIs
- ✅ Maps SDK for Android (Android için)
- ✅ Maps SDK for iOS (iOS için)
- ✅ Places API (eğer Places kullanılıyorsa)
- Billing hesabı aktif ve yeterli kredi olmalı

### 4. Key Restrictions Doğru mu?
- Android key: Package name `com.laststop.alarmtr` olmalı
- iOS key: Bundle ID `com.laststop.alarmtr` olmalı
- API restrictions: Maps SDK enabled olmalı

## Diagnostics

Diagnostics ekranında (`Settings > Diagnostics`) "Google Maps API Key Durumu" bölümü:
- Key değerini **asla göstermez** (güvenlik)
- Sadece "Var/Yok" durumunu gösterir
- Android/iOS key yoksa uyarı mesajı gösterir

## Troubleshooting

### "Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID" Build Error
- EAS Secrets'a `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID` ekleyin
- Preview/Production build'de bu key zorunludur

### Harita Blank (APK'de)
1. Diagnostics'te Android Maps Key durumunu kontrol edin
2. Google Cloud Console'da key'in SHA-1'i APK signing key ile eşleşiyor mu?
3. Maps SDK for Android enabled mi?
4. Billing açık mı?

### Harita Blank (IPA'de)
1. Diagnostics'te iOS Maps Key durumunu kontrol edin
2. Google Cloud Console'da key'in Bundle ID'si `com.laststop.alarmtr` mi?
3. Maps SDK for iOS enabled mi?
4. Billing açık mı?

## Notlar

- **Genel key (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) native'de kullanılmaz**
- Native key'ler asla genel key'e fallback yapmaz (build-time guard)
- Web key şimdilik kullanılmıyor, ileride proxy tarafında kullanılabilir
- Development build'de key yoksa runtime'da hata fırlatılır (build-time guard sadece preview/production'da)
