# Changelog

Tüm önemli değişiklikler bu dosyada listelenir.

Format: [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/).

---

## [1.0.0] — RC

### Eklenen

- Durak yaklaşım alarmı: Hedef durağa veya özel noktaya yaklaşınca bildirim.
- Favori duraklar ve alarm geçmişi.
- Arka planda konum takibi (yalnızca alarm aktifken); alarm iptal/bitince tamamen durur.
- Onboarding: 3 slayt + izin ekranı, geri butonu, fade geçişleri.
- Boş ekranlar için EmptyState bileşeni (kayıtlı duraklar, alarm geçmişi).
- Toast/snackbar geri bildirimi (alarm kuruldu, çevrimdışı, izin reddi).
- Haptics (dokunsal geri bildirim) butonlarda.
- ActiveAlarm ekranında mesafe değişiminde kısa scale animasyonu.
- Erişilebilirlik: ikon butonlara accessibilityLabel, minimum dokunma alanı.
- Hesap ve veri silme (Ayarlar üzerinden).

### Değişen

- Konum ve bildirim yalnızca alarm aktifken kullanılır; alarm kapalıyken takip yapılmaz (uygulama içi metin ve davranış).
- CUSTOM hedef koordinatları Firestore’da yaklaşık (3 ondalık) saklanır; gereksiz hassas veri tutulmaz.
- Android production build: AAB (app-bundle); EAS production autoIncrement (versionCode/buildNumber).

### Düzeltmeler

- Alarm tetiklenince ses çalma (Android content.sound, device profili).
- Beyaz zemin üzerinde buton metni kontrastı (Login, ActiveAlarm, token kullanımı).
- Pipeline: npm test + typecheck PASS.

---

## Not

- **1.0.0** ilk mağaza adayı (RC) sürümüdür.
- Her yayından sonra bu dosyada yeni sürüm başlığı ekleyin.
