# Play Console — Arka Plan Konum İzni Beyanı

Bu doküman, Google Play’deki **Location permissions** / **Background location** declaration formunu doldurmak için kısa ve uzun açıklama metinlerini içerir. Formda istenen alanlara bu metinleri uyarlayarak kopyalayabilirsiniz.

---

## Çekirdek Özellik (Core feature)

**Kısa:** Durak yaklaşım alarmı.

**Uzun:** Uygulama, kullanıcının seçtiği toplu taşıma durağına veya özel hedefe yaklaşmasını tespit edip alarm çalar. Kullanıcı durağa yaklaştığında bildirim ve ses/titreşim ile uyarılır.

---

## Neden Arka Plan Konum Şart? (Why is background location required?)

**Kısa:** Alarm, uygulama kapalı veya arka plandayken de tetiklenebilsin diye.

**Uzun:** Kullanıcı alarmı kurduktan sonra ekranı kapatabilir veya uygulamadan çıkabilir. Durağa yaklaşma anının kaçırılmaması için konum takibinin arka planda (background) sürdürülmesi gerekir. Arka plan konum izni olmadan alarm yalnızca uygulama açıkken çalışır; bu da temel kullanım senaryosunu (yolculuk sırasında uyandırma) karşılamaz.

---

## Kullanıcı Kontrolü (User control)

**Kısa:** Alarmı kapatınca konum takibi durur.

**Uzun:** Konum takibi yalnızca kullanıcı bir alarm başlattığında başlar. Kullanıcı alarmı iptal ettiğinde veya alarm tetiklenip kullanıcı alarmı kapattığında konum takibi tamamen durdurulur. Uygulama, alarm dışında arka planda konum kullanmaz.

---

## Veri Minimizasyonu / Gizlilik

**Kısa:** Konum yalnızca alarm aktifken kullanılır; koordinatlar kullanıcı cihazında işlenir, sunucuya ham konum gönderilmez.

**Uzun:** Konum verisi, alarm aktifken mesafe hesaplamak için kullanılır. Hedef koordinatları (durak veya özel hedef) Firestore’da yaklaşık (approx.) hassasiyetle saklanabilir; kullanıcının anlık konumu sürekli olarak sunucuya gönderilmez. Alarm geçmişi ve tekil olaylar (tetiklenme zamanı, mesafe) senkronize edilebilir; ham konum akışı 3. taraflarla paylaşılmaz.

---

## Uygulama İçi Açıklamalar (Play in-app review)

Uygulama içinde izin ekranları (AlarmPreflightScreen ve izin yardım ekranları) şu mesajları verir:

- Alarm **aktifken** arka planda konum gerekir.
- Alarm **aktif değilken** konum kullanılmaz.
- Örnek: “Seçtiğin durağa yaklaşınca uyarı.”

Bu metinler, Play in-app review ekibi için net ve tutarlı olacak şekilde tasarlanmıştır.

---

## Kod Tarafı Garanti

- Alarm durumu **ACTIVE** veya **TRIGGERED** değilken background location tracking başlatılmaz.
- `stopAlarmLocationTracking()` ve ilgili servisler alarm iptal/tamamlandığında çağrılır; takip tamamen kapatılır.
- Bu davranış `locationService`, `alarmSurvivalService` ve `AlarmContext` akışında uygulanmıştır.
