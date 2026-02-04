# Google Play Data Safety Formu — LastStop Alarm TR

Bu doküman, Play Console **Data safety** bölümünü doldurmak için tek kaynak olarak kullanılabilir. Toplanan veriler, paylaşım, şifreleme ve silme politikası özetlenmiştir.

---

## Toplanan Veriler

### Konum (Location)

- **Amaç:** Uygulama işlevselliği — durağa/hedefe yaklaşma alarmı.
- **Ne zaman:** Yalnızca kullanıcı bir alarm başlattığında (alarm aktifken).
- **Nasıl:** Konum, cihazda mesafe hesaplamak için kullanılır; sürekli ham konum akışı sunucuya gönderilmez. Hedef koordinatları (durak/özel hedef) yaklaşık hassasiyetle Firestore’da saklanabilir.
- **Kullanıcı kontrolü:** Alarmı kapatınca takip durur; konum toplama sonlanır.

### Kimlik ve Hesap

- **Firebase Authentication:** E-posta, kullanıcı ID (UID). Hesap oluşturma, giriş ve hesap yönetimi için.
- **Veri yeri:** Firebase (Google). Şifreleme: transit ve at rest (Firebase varsayılan).

### Uygulama Verileri

- **Alarm geçmişi, favori duraklar, alarm profilleri:** Firestore’da, kullanıcıya özel (userId ile kapsüllenmiş).
- **Amaç:** Uygulama işlevselliği ve kişiselleştirme.

### Tanılama / Crash

- **Sentry:** Hata raporları, crash logları. Anonimleştirilmiş; e-posta veya konum koordinatı loglanmaz.
- **Crash log (yerel):** Cihazda sınırlı sayıda son crash; uygulama içi teşhis için. Production’da PII ve konum koordinatı loglanmaz.

---

## Paylaşılan Veriler (3. taraflar)

- **Firebase (Google):** Hesap bilgileri, alarm oturumları, favori duraklar, kullanıcı ayarları — hizmet sağlayıcı olarak.
- **Sentry:** Hata/crash verileri — anonimleştirilmiş.
- **Google Maps / Places API:** Harita ve yer araması — istekler API’ye gider; kalıcı kullanıcı konum geçmişi paylaşılmaz.
- **Transit API (backend):** Durak/hat araması — sorgu ve yanıt; kişisel konum akışı gönderilmez.

Formda “Veri 3. taraflarla paylaşılıyor mu?” sorusuna bu servisleri ve amaçlarını (hizmet sağlama, hata analizi, harita/arama) belirterek cevap verin.

---

## Şifreleme

- **Transit:** HTTPS.
- **At rest:** Firebase (Firestore, Auth) varsayılan şifreleme.

---

## Veri Silme

- **Hesap silme:** Uygulama içi “Hesabı Sil” ile kullanıcı hesabı ve ilişkili veriler (alarm geçmişi, favoriler, profiller) Firebase’den silinir.
- **Detay:** `authService.deleteAccountAndData()` ve ilgili Firestore temizliği. Konum geçmişi uygulama tarafında saklanmadığı için ayrıca silinmez.

---

## 3. Taraf SDK’lar (package.json’dan — Data safety notu)

| SDK / Paket | Amaç | Veri / Not |
|-------------|------|-------------|
| Firebase (auth, firestore) | Hesap, veri depolama | E-posta, UID, kullanıcı verileri; Google’a gider. |
| Sentry (sentry-expo) | Hata raporlama | Crash/error; anonimleştirilmiş, konum/e-posta eklenmez. |
| Expo (expo-location, task-manager) | Konum, arka plan görev | Konum cihazda işlenir; uygulama koordinatı dışarı loglamaz. |
| React Native / Expo çekirdek | Uygulama çerçevesi | Veri toplamaz; cihaz bilgisi (model, OS) telemetri için kullanılabilir (anonim). |
| @react-native-async-storage/async-storage | Yerel depolama | Sadece cihazda; sunucuya gönderilmez. |

Formda her “data type” için toplama amacını ve paylaşımı bu tabloya uygun şekilde işaretleyin.
