# Android Production Build Test Rehberi

Bu rehber, uygulamayı Android'de production build olarak test etmek için adım adım talimatlar içerir.

## 📋 Ön Gereksinimler

- ✅ EAS hesabı ve giriş yapılmış olmalı
- ✅ Tüm EAS Secrets mevcut (kontrol edildi ✅)
- ✅ Firebase index'ler aktif (kontrol edildi ✅)
- ✅ Android cihaz veya emülatör hazır

---

## 🚀 Adım Adım Production Build Oluşturma

### 1. EAS CLI ile Giriş Yapın

```bash
eas login
```

Eğer zaten giriş yaptıysanız bu adımı atlayabilirsiniz.

### 2. Build Öncesi Kontroller

```bash
# TypeScript kontrolü
npm run typecheck

# Lint kontrolü
npm run lint

# Expo config kontrolü
npx expo config --type public
```

### 3. Production Build Oluşturma (APK Format)

**Önemli**: Store'dan indirilmiş gibi test etmek için `standalone` profili kullanıyoruz. Bu profil:
- ✅ Production environment kullanır
- ✅ APK formatında oluşturur (direkt yüklenebilir)
- ✅ Tüm production secrets'ları içerir

```bash
# Standalone profil ile production build (APK)
eas build --profile standalone --platform android
```

**Alternatif**: Eğer AAB formatında test etmek isterseniz (Play Store formatı):

```bash
# Production profil ile build (AAB format)
eas build --profile production --platform android
```

**Not**: AAB formatını direkt yükleyemezsiniz, Play Store Internal Testing kullanmanız gerekir.

### 4. Build Durumunu Takip Etme

Build başladıktan sonra:

```bash
# Build listesini görüntüle
eas build:list

# Veya Expo Dashboard'dan takip edin
# https://expo.dev/accounts/[your-account]/projects/laststop-alarm-tr/builds
```

Build süresi genellikle **15-30 dakika** sürer.

### 5. Build İndirme

Build tamamlandığında:

**Yöntem 1: EAS CLI ile**
```bash
# Build ID'yi bulun (eas build:list çıktısından)
eas build:download --id [BUILD_ID]

# Veya son build'i indirin
eas build:download --latest
```

**Yöntem 2: Expo Dashboard**
1. [Expo Dashboard](https://expo.dev/) açın
2. Projenizi seçin
3. **Builds** sekmesine gidin
4. Tamamlanan build'in yanındaki **Download** butonuna tıklayın

### 6. Android Cihaza Yükleme

**Yöntem 1: ADB ile (Önerilen)**
```bash
# Android cihazınızı USB ile bilgisayara bağlayın
# USB debugging açık olmalı

# Cihazı kontrol edin
adb devices

# APK'yı yükleyin
adb install -r path/to/your-app.apk
```

**Yöntem 2: Manuel Yükleme**
1. APK dosyasını Android cihazınıza kopyalayın (USB, email, cloud storage)
2. Cihazda **Ayarlar > Güvenlik > Bilinmeyen Kaynaklardan Uygulama Yükleme** seçeneğini açın
3. APK dosyasına tıklayın ve yüklemeyi onaylayın

**Yöntem 3: QR Kod ile (EAS Build tamamlandığında)**
- Build tamamlandığında terminal'de QR kod görünecek
- Android cihazınızla QR kodu tarayın
- APK otomatik olarak indirilir ve yüklenir

---

## 🧪 Test Checklist

Production build'i yükledikten sonra şunları test edin:

### Temel Fonksiyonlar
- [ ] Uygulama açılıyor mu?
- [ ] Splash screen görünüyor mu?
- [ ] Dark mode çalışıyor mu?

### Authentication
- [ ] Kayıt olma çalışıyor mu?
- [ ] Giriş yapma çalışıyor mu?
- [ ] Şifre sıfırlama çalışıyor mu?

### Durak ve Harita
- [ ] Durak arama çalışıyor mu?
- [ ] Harita görünüyor mu?
- [ ] Konum izni isteniyor mu?
- [ ] Haritada duraklar gösteriliyor mu?

### Alarm Özellikleri
- [ ] Alarm kurma çalışıyor mu?
- [ ] Favori duraklar ekleniyor mu?
- [ ] Alarm geçmişi görünüyor mu?
- [ ] Alarm profilleri çalışıyor mu?

### Bildirimler ve Konum
- [ ] Bildirim izni isteniyor mu?
- [ ] Arka plan konum izni isteniyor mu?
- [ ] Alarm tetiklendiğinde bildirim geliyor mu?
- [ ] Arka planda konum takibi çalışıyor mu?

### Ayarlar
- [ ] Ayarlar ekranı açılıyor mu?
- [ ] Privacy Policy linki çalışıyor mu?
- [ ] Terms of Service linki çalışıyor mu?
- [ ] Hesap silme çalışıyor mu?

### Performans
- [ ] Uygulama hızlı açılıyor mu?
- [ ] Harita yüklenirken donma var mı?
- [ ] Bildirimler zamanında geliyor mu?
- [ ] Crash var mı? (Diagnostics ekranından kontrol edin)

---

## 🔍 Sorun Giderme

### Build Başarısız Olursa

1. **Build loglarını kontrol edin:**
```bash
eas build:view --id [BUILD_ID]
```

2. **Yaygın sorunlar:**
   - **Secrets eksik**: EAS Secrets kontrol edin
   - **Firebase config hatası**: `app.config.ts` kontrol edin
   - **Google Maps API key hatası**: API key restrictions kontrol edin

### Uygulama Çalışmıyorsa

1. **Crash loglarını kontrol edin:**
   - Settings > Diagnostics ekranından "Last Crash" bölümüne bakın

2. **Firebase bağlantısını kontrol edin:**
   - Giriş yapabiliyor musunuz?
   - Firestore bağlantısı çalışıyor mu?

3. **Google Maps çalışmıyorsa:**
   - API key restrictions kontrol edin
   - Billing aktif mi kontrol edin

---

## 📝 Notlar

- **Production build** production environment kullanır, bu yüzden:
  - Production Firebase projesine bağlanır
  - Production API'ye bağlanır
  - Production secrets kullanır

- **APK vs AAB:**
  - **APK**: Direkt yüklenebilir, test için ideal
  - **AAB**: Play Store formatı, Internal Testing ile test edilebilir

- **Build ID**: Her build'in benzersiz bir ID'si vardır, build:list ile görebilirsiniz

---

## ✅ Sonraki Adımlar

Production build test edildikten ve her şey çalıştığından emin olduktan sonra:

1. **Store Assets hazırlayın** (`STORE_ASSETS_GUIDE.md`)
2. **Play Store Console'da listing oluşturun** (`DEPLOYMENT.md`)
3. **Production build'i Play Store'a yükleyin** (`DEPLOYMENT.md`)

---

**Son Güncelleme**: 2024-12-18
