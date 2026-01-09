# Store Assets - SVG Template'lerden PNG'ye Çevirme Rehberi

## Oluşturulan Template Dosyaları

1. `icon-template.svg` - Ana icon taslağı (1024x1024px)
2. `splash-template.svg` - Splash screen taslağı (2048x2048px)
3. `adaptive-icon-template.svg` - Android adaptive icon taslağı (1024x1024px)
4. `scripts/generate-assets.html` - Browser'da PNG oluşturma aracı

## Yöntem 1: HTML Generator (Önerilen - En Kolay)

1. `scripts/generate-assets.html` dosyasını tarayıcıda açın
2. Her asset için "İndir" butonuna tıklayın
3. PNG dosyaları otomatik olarak indirilecek
4. Dosyaları `assets/` klasörüne kopyalayın:
   - `icon.png` → `assets/icon.png`
   - `splash.png` → `assets/splash.png`
   - `adaptive-icon.png` → `assets/adaptive-icon.png`

## Yöntem 2: SVG'den PNG'ye Online Converter

### CloudConvert (Önerilen)
1. https://cloudconvert.com/svg-to-png adresine gidin
2. SVG dosyasını yükleyin
3. Output format: PNG
4. Width/Height ayarları:
   - `icon-template.svg` → 1024x1024
   - `splash-template.svg` → 2048x2048
   - `adaptive-icon-template.svg` → 1024x1024
5. Convert butonuna tıklayın
6. PNG'yi indirin

### Convertio
1. https://convertio.co/svg-png/ adresine gidin
2. Benzer şekilde SVG'yi PNG'ye çevirin

## Yöntem 3: Inkscape (Desktop Uygulaması)

1. Inkscape'i indirin: https://inkscape.org
2. SVG dosyasını açın
3. File > Export PNG Image
4. Boyutları ayarlayın:
   - Icon: 1024x1024
   - Splash: 2048x2048
   - Adaptive Icon: 1024x1024
5. Export butonuna tıklayın

## Yöntem 4: Node.js Script (Geliştiriciler İçin)

```bash
# svg2png-cli kurulumu
npm install -g svg2png-cli

# Dönüştürme
svg2png icon-template.svg --output icon.png --width 1024 --height 1024
svg2png splash-template.svg --output splash.png --width 2048 --height 2048
svg2png adaptive-icon-template.svg --output adaptive-icon.png --width 1024 --height 1024
```

## Yöntem 5: ImageMagick (Command Line)

```bash
# Windows (Chocolatey ile)
choco install imagemagick

# Mac (Homebrew ile)
brew install imagemagick

# Linux
sudo apt-get install imagemagick

# Dönüştürme
convert -background none -size 1024x1024 assets/icon-template.svg assets/icon.png
convert -background none -size 2048x2048 assets/splash-template.svg assets/splash.png
convert -background none -size 1024x1024 assets/adaptive-icon-template.svg assets/adaptive-icon.png
```

## Dosya Yerleştirme

PNG dosyalarını oluşturduktan sonra:

1. `icon.png` → `assets/icon.png` (1024x1024px)
2. `splash.png` → `assets/splash.png` (2048x2048px)
3. `adaptive-icon.png` → `assets/adaptive-icon.png` (1024x1024px)

**Önemli:** Mevcut placeholder dosyaların üzerine yazın veya önce yedekleyin.

## Template Özelleştirme

SVG dosyalarını düzenleyerek:
- Renkleri değiştirebilirsiniz (`#0E7490` → başka renk)
- İkonları değiştirebilirsiniz (emoji yerine SVG path kullanabilirsiniz)
- Metinleri değiştirebilirsiniz
- Boyutları ayarlayabilirsiniz

## Kontrol Listesi

- [ ] HTML generator ile PNG'ler oluşturuldu VEYA SVG'ler PNG'ye çevrildi
- [ ] `icon.png` (1024x1024px) `assets/` klasörüne yerleştirildi
- [ ] `splash.png` (2048x2048px) `assets/` klasörüne yerleştirildi
- [ ] `adaptive-icon.png` (1024x1024px) `assets/` klasörüne yerleştirildi
- [ ] `app.config.ts` güncellendi (zaten yapıldı)
- [ ] Build testi yapıldı: `eas build --profile standalone --platform android`

## Notlar

- Icon'lar küçük boyutlarda da okunabilir olmalı
- Android adaptive icon için kenarlarda %20 safe area bırakılmalı (template'de zaten yapıldı)
- Splash screen yükleme sırasında gösterilir, hızlı yüklenmeli
- Tüm asset'ler PNG formatında olmalı (transparent background önerilir)
- Emoji'ler (🚌) bazı sistemlerde farklı görünebilir, profesyonel tasarım için SVG path kullanılabilir

## Icon Oturma Sorunu (Düzeltildi)

Eğer icon'lar kırpılmış veya ortalı değilse, `scripts/generate-assets.mjs` içindeki `fit` parametresini kontrol edin:
- **`fit: 'cover'`**: Icon'u kırpar, tüm alanı doldurur (eski yöntem, kırpma yapabilir)
- **`fit: 'contain'`**: Icon'u kırpmadan, ortalayarak gösterir (yeni yöntem, önerilen)
- Icon için: `fit: 'contain'` + şeffaf arka plan kullanılır
- Adaptive icon foreground için: `fit: 'contain'` + şeffaf arka plan kullanılır

## Hızlı Başlangıç

**En kolay yöntem:**
1. `scripts/generate-assets.html` dosyasını tarayıcıda açın
2. Her asset için "İndir" butonuna tıklayın
3. PNG dosyalarını `assets/` klasörüne kopyalayın
4. Build testi yapın

**Tamamlandı!** 🎉

