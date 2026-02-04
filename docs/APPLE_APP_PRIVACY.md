# Apple App Store — App Privacy (Gizlilik Ayrıntıları)

Bu doküman, App Store Connect **App Privacy** sorularına yanıt vermek için kullanılabilir. iOS uygulaması yayınlanacaksa bu özet üzerinden form doldurulabilir.

---

## Veri Türleri ve Kullanım

### Konum (Location)

- **Tür:** Coarse location / Precise location (uygulama harita ve mesafe için hassas konum kullanır).
- **Kullanım:** Uygulama işlevselliği — durağa/hedefe yaklaşma alarmı.
- **Takip (tracking) için kullanılıyor mu?** Hayır. Reklam veya veri brokering için kullanılmaz.
- **Açıklama:** Konum yalnızca kullanıcı bir alarm başlattığında kullanılır; alarm kapalıyken toplanmaz.

### Tanımlayıcılar (Identifiers)

- **Tür:** User ID (Firebase UID).
- **Kullanım:** Hesap yönetimi, verilerin kullanıcıya özel saklanması.
- **Takip için?** Hayır.

### Tanılama (Diagnostics)

- **Tür:** Crash verileri, performans verileri (Sentry).
- **Kullanım:** Uygulama stabilitesi, hata çözümü.
- **Takip için?** Hayır. Konum veya e-posta loglanmaz.

### E-posta adresi

- **Tür:** Hesap bilgisi (Firebase Auth).
- **Kullanım:** Giriş ve hesap kurtarma.
- **Takip için?** Hayır.

---

## Takip (Tracking) ve ATT

- Uygulama **reklam takibi** veya **3. taraf veri brokering** yapmaz.
- **App Tracking Transparency (ATT)** gerektiren veri toplama yok.
- Formda “Do you or your third-party partners use data for tracking?” sorusuna **Hayır** denebilir (mevcut kullanımımıza göre).

---

## Info.plist / Expo İzin Metinleri

Expo `app.config.ts` içinde iOS izin açıklamaları kısa ve net olmalı; inceleme ekibine uygun:

- **NSLocationWhenInUseUsageDescription:** “Konumunuza yakın durakları ve varış noktanızı gösterebilmek için konum erişimine ihtiyaç duyuyoruz.”
- **NSLocationAlwaysAndWhenInUseUsageDescription:** “Varış durağınıza yaklaştığınızda alarm çalabilmek için arka planda konumunuzu takip etmemiz gerekiyor.”

Bu metinler mevcut `app.config.ts` ile uyumludur; gerekirse sadece küçük düzenlemeler yapılabilir.
