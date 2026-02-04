# CI/CD Rehberi — GitHub Actions + EAS Build/Submit

Bu doküman, repo’daki GitHub Actions workflow’larını ve EAS Build/Submit otomasyonunu açıklar.

---

## 1) Workflow özeti

| Workflow | Tetikleyici | Ne yapar |
|----------|-------------|----------|
| **CI** (`.github/workflows/ci.yml`) | Her `pull_request`; `push` → `main` veya `master` | `npm ci` → `npm test` → `npm run typecheck`. Lint opsiyonel (workflow’da yorum satırı). |
| **Release Build** (`.github/workflows/release-build.yml`) | `push` tags `v*` (örn. `v1.0.0`, `v1.0.0-rc.1`); veya **workflow_dispatch** (manuel) | Test + typecheck, ardından `eas build` Android (AAB) ve iOS production. |
| **Release Submit** (`.github/workflows/release-submit.yml`) | Sadece **workflow_dispatch** (manuel) | Android: build + `--auto-submit` (Play Internal). iOS: build + `--auto-submit` (TestFlight). |

---

## 2) Gerekli GitHub Secrets

**Repo** → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Zorunlu | Açıklama |
|--------|---------|----------|
| **EXPO_TOKEN** | Evet | Expo hesabına ait [Personal Access Token](https://expo.dev/accounts/[account]/settings/access-tokens). EAS build ve submit’in non-interactive çalışması için gerekli. |

**Not:** `EXPO_TOKEN` olmadan Release Build ve Release Submit job’ları EAS login adımında başarısız olur.

### Ne demek? / Ne yapmanız gerekiyor?

- **EXPO_TOKEN**, GitHub Actions'ın EAS ile konuşması için kullandığı bir şifre gibidir; **sizin Expo hesabınızdan** alınır ve **GitHub repo ayarlarında** secret olarak saklanır. Release Build veya Release Submit çalışırken EAS'a bu token ile giriş yapılır; token yoksa workflow hata verir.
- **Bu adımı sizin yerinize kimse yapamaz:** Token'ı sadece siz (Expo hesabı sahibi) oluşturabilir, GitHub secret'ı sadece repo'ya erişimi olan siz ekleyebilirsiniz.

**Adım adım:**

1. **Expo'da token:** [expo.dev](https://expo.dev) → giriş → hesap adı → **Access tokens** → **Create token** → isim verin (örn. "GitHub Actions") → token'ı kopyalayın (sayfadan çıkınca tekrar gösterilmez).
2. **GitHub'da secret:** Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → Name: `EXPO_TOKEN`, Secret: yapıştır → **Add secret**.

Bundan sonra Release Build (tag atınca) ve Release Submit (manuel) EAS'a bu token ile bağlanır. **CI** (PR/push'ta test + typecheck) EXPO_TOKEN olmadan da çalışır.

---

## 3) Android submit önkoşulları

- **İlk yükleme:** Play Console politikası gereği **en az bir kez** AAB’in Play Console’a manuel yüklenmiş olması gerekir. Bunu yaptıktan sonra EAS Submit / auto-submit kullanılabilir.
- **EAS Credentials:** Google Service Account JSON anahtarı, EAS tarafında Android credentials’a yüklenmiş olmalı (`eas credentials` veya Expo dashboard). CI’da ayrıca ek bir secret gerekmez; EAS, hesaba bağlı credential’ları kullanır.

---

## 4) iOS submit

- **EXPO_TOKEN:** EAS Submit, CI’da `EXPO_TOKEN` ile non-interactive çalışır. Apple tarafı (App Store Connect API Key veya app-specific password) EAS’e önceden bağlanmış olmalı (`eas credentials` veya ilk interaktif `eas submit` sırasında).
- **Release Submit workflow:** iOS için `eas build ... --auto-submit` kullanılır; build bittiğinde EAS otomatik olarak TestFlight’a gönderir. Ayrı bir `eas submit` adımı gerekmez.

---

## 5) Tag ile release prosedürü

1. **Sadece build (store’a göndermeden):**
   - Tag atın: `git tag v1.0.0-rc.1` (veya `v1.0.0`)
   - Push: `git push origin v1.0.0-rc.1`
   - **Release Build** workflow’u tetiklenir: test + typecheck + Android AAB + iOS build.

2. **Build + otomatik submit (Play Internal + TestFlight):**
   - GitHub → **Actions** → **Release Submit** → **Run workflow**
   - Workflow, Android ve iOS için production build alır ve `--auto-submit` ile sırasıyla Play Internal ve TestFlight’a gönderir (credentials hazırsa).

---

## 6) transit-api ve test kapsamı

- Kök `npm test`, Jest’in `testPathIgnorePatterns` (veya eşdeğer) ayarı ile **transit-api** altını çalıştırmaz. CI pipeline’ı yalnızca uygulama testlerini çalıştırır; transit-api testleri ayrı kalır.

---

## 7) Lint

- CI workflow’da **Lint** adımı yorum satırındadır. Açmak için `.github/workflows/ci.yml` içinde ilgili blokları kaldırıp `npm run lint` çalıştırın.
