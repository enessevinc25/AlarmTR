# Secret tarama ve push koruması — kontrol listesi

Bu doküman, repoda gizli bilgilerin (API anahtarları, token’lar) yanlışlıkla commit edilmesini önlemek için GitHub ayarlarını ve proje kurallarını açıklar. **Bu ayarlar GitHub UI’dan yapılır** (kodla değil).

---

## 1) GitHub Settings → Security

**Repo** → **Settings** → **Security** (veya **Code security and analysis**):

| Ayar | Öneri | Açıklama |
|------|--------|----------|
| **Secret scanning** | Açık | Push edilen içerikte bilinen secret formatları (API key, token vb.) taranır. |
| **Push protection** | Açık | Secret tespit edildiğinde push **bloke** edilir; commit repoya girmeden engellenir. |

Bu iki özellik özellikle **Push protection** ile birlikte kullanıldığında, hassas değerlerin yanlışlıkla yüklenmesini büyük ölçüde engeller.

---

## 2) Secret’ların yönetimi

- **EXPO_TOKEN** ve diğer CI/mağaza secret’ları **yalnızca** şu yerlerde tutulmalıdır:
  - **GitHub:** Repo → **Settings** → **Secrets and variables** → **Actions**
  - **EAS:** Expo hesabı / proje → Environment Variables veya Credentials
- Secret’lar **asla** koda veya commit mesajına yazılmamalı; `.env` veya benzeri dosyalar repoda **olmamalı**.

---

## 3) .env dosyası

- **.env** ve **.env.\*** dosyaları repoda **bulunmamalı**; tüm hassas değerler ortam değişkeni veya secret ile verilmelidir.
- Bu projede **.gitignore** içinde `.env`, `.env.*`, `.env*.local` zaten yer alıyor; şablon için **.env.sample** (veya **env.sample**) repoda kalabilir.
- Yeni geliştiriciler `.env.sample`’ı kopyalayıp `.env` yaparak kendi değerlerini girer; `.env` asla commit edilmez.

---

## 4) Script'ler

- `scripts/add-eas-secrets.ps1`, `scripts/update-google-maps-keys.ps1`, `scripts/build-local-apk.ps1` artık API key içermiyor; değerler ortam değişkeni veya `.env` (repoda olmamalı) ile verilir. Secret scanning uyarıları tetiklenmez.

---

## 5) Doğrulama

- **Secret scanning** ve **Push protection** açıksa, bilinen secret formatlarında bir değer push edilmeye çalışıldığında GitHub uyarı verir veya push’ı reddeder.
- Periyodik olarak **Security** → **Secret scanning alerts** (varsa) bölümünü kontrol edin; uyarı varsa secret’ı rotate edin ve repodan kaldırın.
