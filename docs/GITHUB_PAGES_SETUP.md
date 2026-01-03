# GitHub Pages Kurulum Rehberi

Bu rehber, legal dokümanları GitHub Pages üzerinden yayınlamak için gerekli adımları içerir.

## 📋 Ön Gereksinimler

- GitHub hesabı
- Repository'ye push yetkisi
- `docs/` klasörü hazır (✅ Tamamlandı)

## 🚀 Kurulum Adımları

### 1. GitHub Repository'ye Push

```bash
# Değişiklikleri commit edin
git add docs/
git commit -m "Add legal documents for GitHub Pages"
git push origin main
```

### 2. GitHub Pages'i Aktifleştir

1. GitHub repository'nize gidin
2. **Settings** sekmesine tıklayın
3. Sol menüden **Pages** seçeneğine tıklayın
4. **Source** bölümünde:
   - **Branch**: `main` (veya `master`)
   - **Folder**: `/docs` seçin
5. **Save** butonuna tıklayın

### 3. URL'leri Not Edin

GitHub Pages aktifleştirildikten sonra, dokümanlarınız şu URL'lerde yayınlanacak:

**Format**: `https://[username].github.io/[repository-name]/[file-name]`

**Örnek URL'ler**:
- Privacy Policy: `https://[username].github.io/[repository-name]/privacy-policy.html`
- Terms of Service: `https://[username].github.io/[repository-name]/terms-of-service.html`

**Not**: İlk yayınlama 1-2 dakika sürebilir. URL'ler hazır olduğunda GitHub size bildirim gönderecektir.

### 4. Settings Ekranını Güncelle

`src/screens/settings/SettingsHomeScreen.tsx` dosyasındaki placeholder URL'leri gerçek GitHub Pages URL'leriyle değiştirin:

```typescript
// Satır 166 civarı
const privacyPolicyUrl = 'https://[username].github.io/[repository-name]/privacy-policy.html';

// Satır 184 civarı
const termsUrl = 'https://[username].github.io/[repository-name]/terms-of-service.html';
```

## ✅ Doğrulama

1. GitHub Pages URL'lerini tarayıcıda açın
2. Privacy Policy ve Terms of Service sayfalarının düzgün göründüğünü kontrol edin
3. Mobil cihazlarda da test edin (responsive tasarım)
4. Dark mode'da da test edin (otomatik dark mode desteği var)

## 🔧 Sorun Giderme

### Sayfalar görünmüyor
- GitHub Pages'in aktifleştirildiğinden emin olun
- Repository'nin public olduğundan emin olun (private repo'lar için GitHub Pro gerekir)
- Birkaç dakika bekleyin (ilk yayınlama zaman alabilir)

### URL'ler çalışmıyor
- URL formatını kontrol edin: `https://[username].github.io/[repository-name]/privacy-policy.html`
- Repository adında büyük harf varsa küçük harfe çevirin
- `docs/` klasörünün root'ta olduğundan emin olun

### Stil sorunları
- Tarayıcı cache'ini temizleyin
- HTML dosyalarındaki CSS'in doğru yüklendiğini kontrol edin

## 📝 Notlar

- GitHub Pages ücretsizdir ve HTTPS desteği sunar
- Dokümanlar otomatik olarak güncellenir (push sonrası birkaç dakika içinde)
- Custom domain ekleyebilirsiniz (opsiyonel)
- Dark mode desteği otomatik olarak çalışır (tarayıcı ayarlarına göre)

## 🔗 İlgili Dosyalar

- `docs/privacy-policy.html` - Gizlilik Politikası HTML dosyası
- `docs/terms-of-service.html` - Kullanım Şartları HTML dosyası
- `docs/index.html` - Ana sayfa (opsiyonel)
- `src/screens/settings/SettingsHomeScreen.tsx` - Settings ekranı (URL'ler burada güncellenmeli)

