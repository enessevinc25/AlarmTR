# Store Assets Rehberi

Bu dosya, Play Store ve App Store için gerekli tüm görsel asset'lerin hazırlanması için rehberdir.

## 📱 Play Store (Google Play) Gereksinimleri

### 1. Uygulama İkonu
- **Boyut**: 512x512 px
- **Format**: PNG (transparent background önerilir)
- **Dosya**: `assets/icon.png`
- **Notlar**: 
  - Logo merkeze yerleştirilmeli
  - Kenarlarda %20 safe area bırakılmalı
  - Yuvarlak köşeler Play Store tarafından otomatik eklenir

### 2. Feature Graphic
- **Boyut**: 1024x500 px
- **Format**: PNG veya JPG
- **Kullanım**: Play Store'da üst banner
- **Notlar**:
  - Uygulama adı ve temel özellikler gösterilmeli
  - Text'ler kenarlardan uzak tutulmalı (safe area)
  - Mobil cihazlarda görünecek şekilde tasarlanmalı

### 3. Screenshots (Telefon)
- **Boyut**: En az 320px, en fazla 3840px (en/boy oranı 16:9 veya 9:16)
- **Format**: PNG veya JPG
- **Adet**: En az 2, önerilen 5-8 adet
- **Notlar**:
  - Gerçek uygulama ekran görüntüleri olmalı
  - Her screenshot farklı bir özelliği göstermeli
  - Frame/device mockup kullanılabilir (opsiyonel)

**Önerilen Screenshot'lar:**
1. Ana ekran (HomeLandingScreen) - Hızlı alarm kurma
2. Durak arama ekranı (StopSearchScreen)
3. Alarm detay ekranı (AlarmDetailsScreen)
4. Favori duraklar listesi (SavedStopsScreen)
5. Alarm geçmişi (AlarmHistoryScreen)
6. Harita ekranı (HomeMapScreen) - Özel hedef oluşturma
7. Ayarlar ekranı (SettingsHomeScreen)
8. Aktif alarm ekranı (ActiveAlarmScreen)

### 4. Screenshots (Tablet - Opsiyonel)
- **Boyut**: En az 320px, en fazla 3840px
- **Format**: PNG veya JPG
- **Notlar**: Tablet optimizasyonu varsa eklenebilir

### 5. Kısa Açıklama
- **Uzunluk**: 80 karakter
- **İçerik**: Uygulamanın kısa tanımı
- **Dosya**: `STORE_DESCRIPTION.md` içinde mevcut

### 6. Uzun Açıklama
- **Uzunluk**: 4000 karakter
- **İçerik**: Detaylı açıklama ve özellikler
- **Dosya**: `STORE_DESCRIPTION.md` içinde mevcut

---

## 🍎 App Store (iOS) Gereksinimleri

### 1. App Icon
- **Boyut**: 1024x1024 px
- **Format**: PNG (transparent background önerilir)
- **Dosya**: `assets/icon.png`
- **Notlar**:
  - Yuvarlak köşeler App Store tarafından otomatik eklenir
  - Gloss effect eklenmemeli (iOS 7+)
  - Alpha channel kullanılabilir

### 2. Screenshots (iPhone)
- **Boyut**: Cihaz boyutuna göre değişir
- **Format**: PNG veya JPG
- **Adet**: En az 3, önerilen 5-10 adet

**Gerekli Boyutlar:**
- **iPhone 6.7" (iPhone 14 Pro Max)**: 1290x2796 px
- **iPhone 6.5" (iPhone 11 Pro Max)**: 1242x2688 px
- **iPhone 5.5" (iPhone 8 Plus)**: 1242x2208 px
- **iPhone 4.7" (iPhone 8)**: 750x1334 px

**Önerilen Screenshot'lar:**
1. Ana ekran (HomeLandingScreen)
2. Durak arama ekranı (StopSearchScreen)
3. Alarm detay ekranı (AlarmDetailsScreen)
4. Favori duraklar listesi (SavedStopsScreen)
5. Alarm geçmişi (AlarmHistoryScreen)
6. Harita ekranı (HomeMapScreen)
7. Ayarlar ekranı (SettingsHomeScreen)
8. Aktif alarm ekranı (ActiveAlarmScreen)

### 3. Screenshots (iPad - Opsiyonel)
- **Boyut**: 
  - **12.9" iPad Pro**: 2048x2732 px
  - **11" iPad Pro**: 1668x2388 px
  - **10.5" iPad**: 1668x2224 px
- **Notlar**: Tablet desteği varsa eklenebilir

### 4. App Preview Video (Opsiyonel ama Önerilir)
- **Süre**: 15-30 saniye
- **Format**: MP4, MOV
- **Boyut**: Screenshot boyutlarıyla aynı
- **İçerik**: Uygulamanın temel özelliklerini gösteren kısa video

### 5. Kısa Açıklama
- **Uzunluk**: 170 karakter
- **İçerik**: Uygulamanın kısa tanımı
- **Dosya**: `STORE_DESCRIPTION.md` içinde mevcut

### 6. Uzun Açıklama
- **Uzunluk**: 4000 karakter
- **İçerik**: Detaylı açıklama ve özellikler
- **Dosya**: `STORE_DESCRIPTION.md` içinde mevcut

### 7. Keywords
- **Uzunluk**: 100 karakter
- **İçerik**: Virgülle ayrılmış anahtar kelimeler
- **Dosya**: `STORE_DESCRIPTION.md` içinde mevcut

---

## 🎨 Tasarım Önerileri

### Renkler
- **Primary**: #0E7490 (Mavi)
- **Background**: #EAF3FF (Açık mavi)
- **Text**: Koyu renkler (dark mode desteği için)

### Typography
- **Başlık**: Bold, büyük font
- **Açıklama**: Okunabilir, orta boyut
- **Call-to-Action**: Vurgulu renkler

### Screenshot İçerikleri
Her screenshot şunları içermeli:
1. **Başlık**: Ekranın ne gösterdiği (opsiyonel overlay text)
2. **Görsel**: Gerçek uygulama ekranı
3. **Vurgu**: Önemli özellikler (opsiyonel annotation)

---

## 📋 Screenshot Çekme Adımları

### Android için:
1. Android cihazda uygulamayı çalıştır
2. Her ekranı aç ve screenshot al
3. Gerekirse device frame ekle (opsiyonel)
4. PNG formatında kaydet

### iOS için:
1. iOS simulator veya gerçek cihazda uygulamayı çalıştır
2. Her ekranı aç ve screenshot al
3. Command+S (Mac) ile kaydet
4. Gerekirse device frame ekle (opsiyonel)

### Tool Önerileri:
- **Screenshot Tools**: 
  - Android: ADB, Device Screenshot
  - iOS: Simulator Screenshot, Xcode
- **Mockup Tools**:
  - Figma
  - Sketch
  - Canva
  - App Store Screenshot Generator (online tools)

---

## ✅ Checklist

### Play Store
- [ ] 512x512 px app icon
- [ ] 1024x500 px feature graphic
- [ ] En az 2 screenshot (telefon)
- [ ] Kısa açıklama (80 karakter)
- [ ] Uzun açıklama (4000 karakter)

### App Store
- [ ] 1024x1024 px app icon
- [ ] En az 3 screenshot (iPhone - farklı boyutlar)
- [ ] Kısa açıklama (170 karakter)
- [ ] Uzun açıklama (4000 karakter)
- [ ] Keywords (100 karakter)
- [ ] App Preview Video (opsiyonel)

### Genel
- [ ] Tüm screenshot'lar gerçek uygulama ekranları
- [ ] Her screenshot farklı özellik gösteriyor
- [ ] Text'ler okunabilir
- [ ] Renkler tutarlı
- [ ] Dark mode screenshot'ları (opsiyonel ama önerilir)

---

## 📝 Notlar

- Screenshot'lar gerçek uygulama ekranları olmalı (mockup değil)
- Her screenshot farklı bir özelliği göstermeli
- Text overlay'ler kullanılabilir ama abartılmamalı
- Dark mode screenshot'ları eklenebilir (özellikle dark mode özelliği varsa)
- App Preview Video eklemek conversion rate'i artırabilir

