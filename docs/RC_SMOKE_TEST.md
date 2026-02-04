# RC Smoke Test — Gerçek cihaz kontrol listesi

Release Candidate (RC) build’i gerçek cihazda hızlıca doğrulamak için adımlar. Her madde geçilmeli.

---

## Ortam

- **Cihaz:** Gerçek Android ve/veya iOS cihaz (emülatör/simülatör arka plan konum / FGS davranışı için yeterli olmayabilir).
- **Build:** Production AAB (Android) veya TestFlight build (iOS).
- **Hesap:** Test için e-posta/şifre ile giriş yapılmış olmalı.

---

## 1) Giriş

- [ ] Uygulama açılıyor.
- [ ] Giriş ekranından e-posta/şifre ile giriş yapılabiliyor.
- [ ] Giriş sonrası ana ekran (harita / ana sayfa) görünüyor.

---

## 2) Durak arama ve seçim

- [ ] Durak arama ekranına gidiliyor.
- [ ] Arama yapılıyor; sonuçlar listeleniyor.
- [ ] Bir durak seçiliyor; detay / alarm kurma ekranına geçiliyor.

---

## 3) Alarm başlatma ve izin akışı

- [ ] Alarm başlatılmak isteniyor (AlarmPreflightScreen).
- [ ] Konum izni (önce “uygulama kullanımında”, gerekirse “her zaman”) isteniyor ve onaylanıyor.
- [ ] Bildirim izni isteniyor ve onaylanıyor.
- [ ] “Konum ve bildirim yalnızca alarm aktifken kullanılır; alarm kapalıyken takip yapılmaz.” metni görünüyor.
- [ ] Alarm başlatıldığında toast/geri bildirim alınıyor (örn. “Alarm kuruldu”).

---

## 4) Arka plan ve tetiklenme

- [ ] Alarm aktifken uygulama arka plana atılıyor (uygulama kapatılmıyor, sadece başka uygulamaya geçiliyor veya ekran kapatılıyor).
- [ ] Konum hareketi: Hedefe doğru yürüme veya konum simülasyonu ile hedefe yaklaşma sağlanıyor.
- [ ] Yaklaşma sonrası bildirim geliyor.
- [ ] Bildirime tıklanınca uygulama açılıyor ve TRIGGERED / “Tetiklenen alarm” durumu görünüyor.

---

## 5) Alarm bitirme ve takip kapanması

- [ ] Alarm iptal ediliyor veya “Alarmı bitir” ile sonlandırılıyor.
- [ ] Arka planda konum takibi tamamen duruyor (sistem ayarlarında “son kullanım” veya uygulama davranışı ile doğrulanabilir; uygulama konum kullanmıyor olmalı).

---

## 6) Çevrimdışı senaryo

- [ ] Uçak modu veya Wi‑Fi ve mobil veri kapatılarak çevrimdışı yapılıyor.
- [ ] Alarm kurulmaya çalışıldığında veya senkron gerektiğinde kullanıcıya net bir mesaj gösteriliyor (örn. “İnternet bağlantısı gerekli” / çevrimdışı toast).

---

## Özet

- Tüm maddeler geçildiyse smoke test **PASS**.
- Bir madde başarısızsa build RC olarak gönderilmeden önce düzeltme yapılmalı.
- Bu liste docs ile tutarlıdır; Play arka plan konum ve FGS politikaları (Sprint-4 dokümanları) ayrıca Console’da beyan edilmelidir.
