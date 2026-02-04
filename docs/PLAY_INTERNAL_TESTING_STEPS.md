# Play Console — Internal testing track adımları

Android production AAB’i aldıktan sonra Play Console’da Internal testing track’e yükleme ve tester’lara gönderme adımları.

---

## Ön koşul

- **AAB dosyası:** `eas build --platform android --profile production` ile üretilmiş `.aab` dosyası.
- **Play Console erişimi:** Uygulama için yayıncı hesabı ve uygulama oluşturulmuş olmalı.

---

## 1) Internal testing track oluşturma

1. [Play Console](https://play.google.com/console) → Uygulamanızı seçin.
2. Sol menüden **Testing** → **Internal testing**.
3. **Create new release** (veya mevcut “Internal testing” sürümüne yeni release ekleyin).
4. Sürüm adı önerisi: `1.0.0 (RC)` veya `Internal test 1`.

---

## 2) AAB yükleme

1. **App bundles** bölümünde **Upload** ile `.aab` dosyasını yükleyin.
2. Play Console AAB’i işler; hata yoksa sürüm “Ready to publish” veya benzeri duruma geçer.
3. Gerekirse **Version details** altında versionCode’un bir önceki yüklemeden büyük olduğundan emin olun (EAS `autoIncrement` bunu otomatik yapar).

---

## 3) Release notes girme

1. **Release notes** alanına dil seçin (Türkçe / English).
2. **RELEASE_NOTES.md** dosyasındaki “Kısa” veya “Ne yeni?” maddelerini kopyalayıp yapıştırın.
3. Birden fazla dil destekliyorsanız her dil için release notes ekleyin.

---

## 4) Tester’lara gönderme

1. **Testers** sekmesinde e-posta listesi tanımlayın (Internal testing için e-posta listesi gerekir).
2. **Save** → **Review release** → **Start rollout to Internal testing**.
3. Tester’lar e-posta ile davet alır; davet linkinden veya Play Store’dan “Internal test” sürümünü yükleyebilir.

---

## 5) İsteğe bağlı: EAS Submit ile yükleme

AAB’i komut satırından yüklemek için:

```bash
eas submit --platform android --profile production --latest
```

- `--latest`: Son EAS build çıktısını kullanır.
- İlk seferde Play Console’da “App signing” ve gerekli izinler tamamlanmış olmalı.
- CI’da kullanım: `EXPO_TOKEN` env ile non-interactive çalıştırma (Expo dokümanlarına bakın).

---

## Referanslar

- **Sprint-4:** `docs/PLAY_BACKGROUND_LOCATION.md`, `docs/ANDROID_FOREGROUND_SERVICE.md`, `docs/PLAY_DATA_SAFETY.md` — Console’daki form ve beyanlar bu dokümanlarla doldurulmalı.
- **Release notes:** Proje kökündeki `RELEASE_NOTES.md`.
