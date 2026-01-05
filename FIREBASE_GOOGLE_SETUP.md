# Firebase ve Google Console Kurulum Rehberi

Bu rehber, production release için Firebase Console ve Google Cloud Console'da yapılması gereken işlemleri detaylandırır.

---

## 🔥 Firebase Console İşlemleri

### 1. Firestore Index Oluşturma

**Durum**: ✅ **TÜM INDEX'LER MEVCUT VE ENABLED!**

**Mevcut Index'ler** (Firebase Console'da görünen):
- ✅ `userAlarmProfiles`: userId (asc), createdAt (desc), __name__ (desc) - **Enabled**
- ✅ `alarmSessions`: userId (asc), deletedAt (asc), createdAt (desc), __name__ (desc) - **Enabled**
- ✅ `userSavedStops`: userId (asc), stopId (asc), __name__ (asc) - **Enabled**

**Kodda Kullanılan Query'ler ve Index'ler**:
1. ✅ `userAlarmProfiles`: `where('userId', '==', userId), orderBy('createdAt', 'desc')` → Index mevcut
2. ✅ `alarmSessions`: `where('userId', '==', userId), where('deletedAt', '==', null), orderBy('createdAt', 'desc')` → Index mevcut
3. ✅ `userSavedStops`: `where('userId', '==', userId), where('stopId', '==', stop.id)` → Index mevcut (userId + stopId)
4. ✅ `userSavedStops`: `where('userId', '==', userId), orderBy('createdAt', 'desc')` → Index mevcut (userId + createdAt + __name__)

**Doğrulama**:
- ✅ Tüm index'ler Firebase Console'da görünüyor
- ✅ Status: **Enabled** 
- ✅ Toplam 3 index mevcut ve aktif
- ✅ `firestore.indexes.json` dosyası güncel (4 index tanımlı, Firebase'de 3 tanesi aktif)

---

### 2. Firestore Security Rules Deploy

**Adımlar**:

1. Firebase Console'da **Firestore Database** > **Rules** sekmesine gidin
2. `firestore.rules` dosyasının içeriğini kopyalayın
3. Rules editörüne yapıştırın
4. **Publish** butonuna tıklayın

**Test**:
- Rules sekmesinde **Test** butonunu kullanarak test edebilirsiniz
- Veya `npm run test:rules` komutu ile local test yapabilirsiniz

**Doğrulama**:
- Rules başarıyla publish edildi
- Test senaryoları geçti

---

### 3. Firebase Authentication Ayarları

**Adımlar**:

1. Firebase Console'da **Authentication** > **Sign-in method** sekmesine gidin
2. **Email/Password** provider'ını kontrol edin:
   - ✅ **Enabled** olmalı
   - ✅ **Email link (passwordless sign-in)** opsiyonel (şu an kullanılmıyor)

**Doğrulama**:
- Email/Password sign-in aktif
- Test hesabı ile giriş yapılabiliyor

---

### 4. Firebase Project Settings Kontrolü

**Adımlar**:

1. Firebase Console'da **Project Settings** (⚙️) açın
2. **General** sekmesinde:
   - Project ID kontrol edin
   - Project number kontrol edin
3. **Your apps** sekmesinde:
   - Android app: `com.laststop.alarmtr` mevcut mu?
   - iOS app: `com.laststop.alarmtr` mevcut mu?
   - Her ikisi için de `google-services.json` (Android) ve `GoogleService-Info.plist` (iOS) dosyaları mevcut mu?

**Not**: Expo kullanıldığı için bu dosyalar doğrudan kullanılmaz, ama Firebase config doğru olmalı.

---

## 🗺️ Google Cloud Console İşlemleri

### 1. Google Maps API Key Oluşturma

#### Android API Key

**Adımlar**:

1. [Google Cloud Console](https://console.cloud.google.com/) açın
2. Firebase projenizle aynı projeyi seçin (veya yeni proje oluşturun)
3. **APIs & Services** > **Credentials** sekmesine gidin
4. **+ CREATE CREDENTIALS** > **API key** seçin
5. Oluşturulan API key'i kopyalayın
6. API key'i düzenlemek için üzerine tıklayın
7. **Application restrictions** bölümünde:
   - **Android apps** seçin
   - **+ ADD AN ITEM** tıklayın
   - Package name: `com.laststop.alarmtr`
   - SHA-1 certificate fingerprint: (EAS Build için gerekli değil, ama eklenebilir)
8. **API restrictions** bölümünde:
   - **Restrict key** seçin
   - Şu API'leri seçin:
     - ✅ Maps SDK for Android
     - ✅ Places API (eğer kullanılıyorsa)
     - ✅ Geocoding API (eğer kullanılıyorsa)
9. **SAVE** butonuna tıklayın

**EAS Secrets'a Ekleme**:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value "your-android-api-key"
```

#### iOS API Key

**Adımlar**:

1. Google Cloud Console'da yeni bir API key oluşturun (veya mevcut birini kullanın)
2. API key'i düzenleyin
3. **Application restrictions** bölümünde:
   - **iOS apps** seçin
   - **+ ADD AN ITEM** tıklayın
   - Bundle ID: `com.laststop.alarmtr`
4. **API restrictions** bölümünde:
   - **Restrict key** seçin
   - Şu API'leri seçin:
     - ✅ Maps SDK for iOS
     - ✅ Places API (eğer kullanılıyorsa)
     - ✅ Geocoding API (eğer kullanılıyorsa)
5. **SAVE** butonuna tıklayın

**EAS Secrets'a Ekleme**:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value "your-ios-api-key"
```

---

### 2. Google Maps API'leri Aktifleştirme

**Adımlar**:

1. Google Cloud Console'da **APIs & Services** > **Library** sekmesine gidin
2. Şu API'leri arayın ve **ENABLE** butonuna tıklayın:
   - ✅ **Maps SDK for Android** (Android için)
   - ✅ **Maps SDK for iOS** (iOS için)
   - ✅ **Places API** (eğer kullanılıyorsa)
   - ✅ **Geocoding API** (eğer kullanılıyorsa)

**Doğrulama**:
- Tüm API'ler **Enabled** durumunda
- API key'ler bu API'lere erişebiliyor

---

### 3. Google Maps API Billing

**ÖNEMLİ**: Google Maps API ücretli bir servistir (ücretsiz quota var ama limit aşılınca ücretlendirme başlar).

**Adımlar**:

1. Google Cloud Console'da **Billing** sekmesine gidin
2. Billing account bağlı mı kontrol edin
3. Billing account yoksa:
   - **LINK A BILLING ACCOUNT** tıklayın
   - Billing account oluşturun veya mevcut birini bağlayın
   - Kredi kartı bilgilerini girin

**Ücretsiz Quota** (Aylık):
- Maps SDK for Android: $200 kredi (yaklaşık 28,000 map load)
- Maps SDK for iOS: $200 kredi (yaklaşık 28,000 map load)
- Places API: $200 kredi
- Geocoding API: $200 kredi

**Not**: Küçük-orta ölçekli uygulamalar için ücretsiz quota yeterli olabilir.

**Doğrulama**:
- Billing account bağlı
- API kullanımı izleniyor
- Quota limitleri ayarlandı (opsiyonel)

---

## 🔐 EAS Secrets Kontrolü

### Tüm Secrets Listesi

```bash
# Firebase Config
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS

# Sentry
EXPO_PUBLIC_SENTRY_DSN

# Environment
EXPO_PUBLIC_ENVIRONMENT=production
```

### Secrets Kontrolü

```bash
# Tüm secrets'ları listele
eas secret:list

# Belirli bir secret'ı kontrol et
eas secret:view EXPO_PUBLIC_FIREBASE_API_KEY
```

### Secrets Ekleme (Eksikse)

**Not**: `eas secret:create` komutu deprecated. Yeni komut `eas env:create` kullanılmalı.

**Yöntem 1: Otomatik Script (Önerilen)**

Proje kök dizininde `scripts/add-eas-secrets.ps1` scriptini çalıştırın:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/add-eas-secrets.ps1
```

Bu script tüm eksik secrets'ları otomatik olarak ekler.

**Yöntem 2: Manuel Komutlar**

Her secret için ayrı ayrı çalıştırın (interaktif prompt çıkacak):

```bash
# Firebase Config
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-value" --type string --visibility secret
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-value" --type string --visibility secret

# Google Maps
npx eas env:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value "your-android-key" --type string --visibility secret
npx eas env:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value "your-ios-key" --type string --visibility secret

# Environment
npx eas env:create --scope project --name EXPO_PUBLIC_ENVIRONMENT --value "production" --type string --visibility secret

# Sentry (Opsiyonel)
npx eas env:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "your-sentry-dsn" --type string --visibility secret
```

**Yöntem 3: EAS Web UI**

1. [Expo Dashboard](https://expo.dev/) açın
2. Projenizi seçin
3. **Secrets** sekmesine gidin
4. **Create Secret** butonuna tıklayın
5. Name ve Value girin
6. **Create** butonuna tıklayın

---

## ✅ Kontrol Listesi

### Firebase Console
- [ ] Firestore index oluşturuldu (`alarmSessions` - userId, deletedAt, createdAt)
- [ ] Firestore security rules deploy edildi
- [ ] Authentication (Email/Password) aktif
- [ ] Project settings kontrol edildi

### Google Cloud Console
- [ ] Google Maps API key (Android) oluşturuldu
- [ ] Google Maps API key (iOS) oluşturuldu
- [ ] API key restrictions ayarlandı (Android package, iOS bundle ID)
- [ ] Maps SDK for Android aktif
- [ ] Maps SDK for iOS aktif
- [ ] Billing account bağlı

### EAS Secrets
- [ ] Tüm Firebase config secrets eklendi
- [ ] Google Maps API key secrets eklendi
- [ ] Sentry DSN secret eklendi
- [ ] Environment secret eklendi (production)
- [ ] Tüm secrets doğrulandı (`eas secret:list`)

---

## 🐛 Troubleshooting

### Index Oluşturma Sorunları
- **Sorun**: Index oluşturulmuyor
- **Çözüm**: 
  - Collection'da veri var mı kontrol edin
  - Field isimleri doğru mu kontrol edin
  - Index oluşturma işlemi birkaç dakika sürebilir

### API Key Sorunları
- **Sorun**: Google Maps çalışmıyor
- **Çözüm**:
  - API key doğru mu kontrol edin
  - API restrictions doğru mu kontrol edin
  - Billing aktif mi kontrol edin
  - API'ler enable mi kontrol edin

### EAS Secrets Sorunları
- **Sorun**: Build sırasında secrets yüklenmiyor
- **Çözüm**:
  - `eas secret:list` ile secrets'ları kontrol edin
  - Secret isimleri doğru mu kontrol edin (büyük/küçük harf duyarlı)
  - Scope doğru mu kontrol edin (`--scope project`)

---

## 📚 İlgili Dokümantasyon

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)

---

**Son Güncelleme**: 2024-12-XX

