# Branch protection — kontrol listesi

Bu doküman, **main** ve **master** gibi ana branch’ler için önerilen GitHub branch protection ayarlarını listeler. **Bu ayarlar GitHub UI’dan yapılır** (Settings → Branches → Branch protection rules).

> **PR nasıl açılır:** Değişiklikleri yeni bir branch’te yapın, push edin; GitHub’da **Pull requests** → **Compare & pull request** veya **base: main**, **compare: sizin-branch** seçip **Create pull request** deyin.

---

## Önerilen ayarlar (main / master)

| Ayar | Öneri | Açıklama |
|------|--------|----------|
| **Require a pull request before merging** | Açık | Doğrudan push yerine PR ile merge zorunlu. |
| **Require approvals** | 1 (veya daha fazla) | En az bir onay gerekir; tek geliştirici olsanız bile ileride takım büyüdüğünde hazır olur. |
| **Require status checks to pass** | Açık | Aşağıdaki check’lerin geçmesi zorunlu. |
| **Require conversation resolution** | Açık (önerilir) | PR’daki tüm yorumlar çözülmeden merge edilemez. |
| **Dismiss stale approvals when new commits are pushed** | İsteğe bağlı | Yeni commit sonrası onaylar iptal edilir; tekrar onay gerekir. |
| **Restrict force pushes** | Açık | Force push engellenir (veya sadece belirli roller). |
| **Do not allow bypassing the above settings** / **Prevent deletion** | Önerilir | Branch silinmesi ve kuralları atlama engellenir. |
| **Require linear history** | İsteğe bağlı | Merge commit yerine rebase/linear history zorunlu. |

---

## Status check’ler (Require status checks)

Merge’den önce **geçmesi gereken** workflow’lar örnek olarak:

| Check | Açıklama |
|-------|----------|
| **CI** (test + typecheck) | `.github/workflows/ci.yml` — npm test, npm run typecheck. |
| **PR Title** | `.github/workflows/pr-title.yml` — Conventional Commits formatı. |
| **Dependency Review** (önerilir) | `.github/workflows/dependency-review.yml` — PR’da high/critical vulnerability engeli. |
| **CodeQL** (isteğe bağlı) | `.github/workflows/codeql.yml` — güvenlik taraması. |

Branch protection rule oluştururken “Require status checks” kısmında bu job isimlerini (ör. `test`, `title`, `review`, `analyze`) seçin. Workflow’lar ilk kez çalıştıktan sonra listede görünür.

**Actions SHA politikası (önerilir):** **Settings** → **Actions** → **General** → (Policies) → **Require actions to be pinned to a full-length commit SHA** — Açın. Bu repo’daki tüm workflow’lar zaten tam SHA ile pin’lendi; ayar açıldığında pipeline bozulmaz.

---

## Uygulama adımları (ekrandan adım adım)

Şu an **Settings → Code and automation → Branches** sayfasındasınız ve “Classic branch protections have not been configured” yazıyor. Aşağıdakileri sırayla yapın.

### 1) Kural oluşturmayı başlatın

- **“Add classic branch protection rule”** butonuna tıklayın.  
  (Ruleset daha yeni bir yapı; klasik kural bu senaryo için yeterli ve arayüz daha tanıdık.)

### 2) Branch adı (pattern)

- **“Branch name pattern”** alanına **tam olarak** korumak istediğiniz branch adını yazın.
- GitHub’da repo ana sayfasında hangi branch varsayılan görünüyorsa onu kullanın:
  - Çoğu yeni repo için: **`main`** yazın.
  - Eski / farklı kullanıyorsanız: **`master`** yazın.
- Sadece bir branch’i koruyacaksanız tek isim yeterli (örn. sadece `main`). Hem `main` hem `master` korumak isterseniz önce `main` için bu kuralı oluşturup kaydedin; sonra ikinci bir kural ekleyip pattern olarak `master` yazın.

### 3) Temel kuralları işaretleyin

Aşağı kaydırarak şu kutucukları açın:

- **Require a pull request before merging** — Açın.  
  (İsterseniz “Require approvals” sayısını 1 yapın.)
- **Require status checks to pass before merging** — **Mutlaka açın.**  
  Açtığınızda hemen altında **“Status checks that are required”** bölümü çıkar.

### 4) Zorunlu status check’leri ekleyin (Dependency Review dahil)

- **“Status checks that are required”** kutusunda **“Search for status checks in the last week for this repository”** yazan bir arama alanı vardır.
- **Arama kutusunda hiçbir şey çıkmıyorsa:** GitHub, sadece **son bir hafta içinde bu repo’da bir PR üzerinde çalışmış** status check’leri listeler. Henüz PR açılmadıysa veya workflow’lar hiç PR’da koşmadıysa liste **boş** olur; bu normaldir.
- **Ne yapmalı (iki aşamalı kurulum):**
  1. **Şimdilik status check eklemeden** kuralı kaydedin: “Require status checks to pass” kutusunu **açık bırakın** ama arama kutusuna hiçbir şey eklemeyin; altta “No required checks” kalabilir. Diğer tüm istediğiniz seçenekleri işaretleyip **Create** ile kaydedin.
  2. **Bir Pull Request açın:** `main` (veya koruduğunuz branch) hedefli bir PR açın (küçük bir değişiklik veya “docs: branch protection” gibi bir commit yeterli). PR açılınca CI, Dependency Review, PR Title (ve varsa CodeQL) workflow’ları çalışır.
  3. **Workflow’lar bitsin:** Actions sekmesinde bu check’lerin tamamlanmasını bekleyin (yeşil/kırmızı olması yeterli).
  4. **Kuralı düzenleyin:** Settings → Branches → az önce oluşturduğunuz kuralın yanındaki **Edit**’e tıklayın. “Require status checks” bölümündeki arama kutusuna bu kez tıklayın; listede **test**, **title**, **review** (Dependency Review) ve isteğe bağlı **analyze** (CodeQL) görünecektir. Bunları tek tek seçip ekleyin, sonra **Save changes** deyin.
- **Aramada aranacak isimler:** Workflow job adlarına göre genelde şunlar çıkar: **test** (CI), **title** (PR Title), **review** (Dependency Review), **analyze** (CodeQL). Tam isimler GitHub’ın workflow’dan ürettiği şekilde olabilir; listeye bakıp ilgili olanları seçin.

### 5) Diğer alanlar (ekranın geri kalanı)

Aşağı kaydırdığınızda gördüğünüz seçenekler:

| Seçenek | Öneri | Açıklama |
|--------|--------|----------|
| **Require conversation resolution before merging** | Açık (önerilir) | PR’daki tüm yorumlar çözülmeden merge edilemez. |
| **Require signed commits** | Kapalı | İsterseniz ileride açabilirsiniz; şimdilik gerek yok. |
| **Require linear history** | Kapalı | İsterseniz rebase zorunlu yaparsınız. |
| **Require deployments to succeed** | Kapalı | Bu repo için gerek yok. |
| **Lock branch** | Kapalı | Açarsanız branch tamamen kilitlenir; normalde kapalı. |
| **Do not allow bypassing the above settings** | **Açık** | Admin dahil herkes bu kurallara uyar; açmanız iyi olur. |
| **Allow force pushes** | **Kapalı** | Force push’a izin vermeyin. |
| **Allow deletions** | **Kapalı** | Branch silinmesin; kapalı bırakın. |

**Require review from Code Owners:** CODEOWNERS kullandığınız için isterseniz **açabilirsiniz**. Açarsanız, `.github/workflows/`, `app.config.ts`, `eas.json` vb. CODEOWNERS’ta tanımlı dosyalara dokunan PR’lar için sizin (owner) onayınız gerekir.

### 6) Kaydedin

- Sayfanın altındaki **“Create”** (yeni kural) veya **“Save changes”** (düzenleme) butonuna tıklayın.

---

## Dependency Review check’i listede yoksa

“review” veya “Dependency Review” status check’i arama kutusunda çıkmıyorsa:

1. Bu branch’e (örn. `main`) **bir Pull Request açın** (küçük bir değişiklik yeterli).
2. PR açıldıktan sonra **Actions** sekmesinde “Dependency Review” workflow’unun çalıştığını görün; bir kez yeşil/ kırmızı bitmesi yeterli.
3. Ardından **Settings → Branches** → ilgili branch kuralına girip **Edit** deyin.
4. “Require status checks” bölümündeki aramada artık **“review”** (veya “Dependency Review”) görünür; onu da ekleyip **Save changes** deyin.

Bundan sonra her PR’da Dependency Review geçmeden merge yapılamaz.

---

Not: Branch protection kurallarını yalnızca **Admin** veya uygun yetkisi olan kullanıcılar değiştirebilir.
