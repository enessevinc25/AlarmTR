# Branch protection ÔÇö kontrol listesi

Bu dok├╝man, **main** ve **master** gibi ana branchÔÇÖler i├ğin ├Ânerilen GitHub branch protection ayarlar─▒n─▒ listeler. **Bu ayarlar GitHub UIÔÇÖdan yap─▒l─▒r** (Settings ÔåÆ Branches ÔåÆ Branch protection rules).

> **PR nas─▒l a├ğ─▒l─▒r:** De─şi┼şiklikleri yeni bir branchÔÇÖte yap─▒n, push edin; GitHubÔÇÖda **Pull requests** ÔåÆ **Compare & pull request** veya **base: main**, **compare: sizin-branch** se├ğip **Create pull request** deyin.

---

## ├ûnerilen ayarlar (main / master)

| Ayar | ├ûneri | A├ğ─▒klama |
|------|--------|----------|
| **Require a pull request before merging** | A├ğ─▒k | Do─şrudan push yerine PR ile merge zorunlu. |
| **Require approvals** | 1 (veya daha fazla) | En az bir onay gerekir; tek geli┼ştirici olsan─▒z bile ileride tak─▒m b├╝y├╝d├╝─ş├╝nde haz─▒r olur. |
| **Require status checks to pass** | A├ğ─▒k | A┼şa─ş─▒daki checkÔÇÖlerin ge├ğmesi zorunlu. |
| **Require conversation resolution** | A├ğ─▒k (├Ânerilir) | PRÔÇÖdaki t├╝m yorumlar ├ğ├Âz├╝lmeden merge edilemez. |
| **Dismiss stale approvals when new commits are pushed** | ─░ste─şe ba─şl─▒ | Yeni commit sonras─▒ onaylar iptal edilir; tekrar onay gerekir. |
| **Restrict force pushes** | A├ğ─▒k | Force push engellenir (veya sadece belirli roller). |
| **Do not allow bypassing the above settings** / **Prevent deletion** | ├ûnerilir | Branch silinmesi ve kurallar─▒ atlama engellenir. |
| **Require linear history** | ─░ste─şe ba─şl─▒ | Merge commit yerine rebase/linear history zorunlu. |

---

## Status checkÔÇÖler (Require status checks)

MergeÔÇÖden ├Ânce **ge├ğmesi gereken** workflowÔÇÖlar ├Ârnek olarak:

| Check | A├ğ─▒klama |
|-------|----------|
| **CI** (test + typecheck) | `.github/workflows/ci.yml` ÔÇö npm test, npm run typecheck. |
| **PR Title** | `.github/workflows/pr-title.yml` ÔÇö Conventional Commits format─▒. |
| **Dependency Review** (├Ânerilir) | `.github/workflows/dependency-review.yml` ÔÇö PRÔÇÖda high/critical vulnerability engeli. |
| **CodeQL** (iste─şe ba─şl─▒) | `.github/workflows/codeql.yml` ÔÇö g├╝venlik taramas─▒. |

Branch protection rule olu┼ştururken ÔÇ£Require status checksÔÇØ k─▒sm─▒nda bu job isimlerini (├Âr. `test`, `title`, `review`, `analyze`) se├ğin. WorkflowÔÇÖlar ilk kez ├ğal─▒┼şt─▒ktan sonra listede g├Âr├╝n├╝r.

**Actions SHA politikas─▒ (├Ânerilir):** **Settings** ÔåÆ **Actions** ÔåÆ **General** ÔåÆ (Policies) ÔåÆ **Require actions to be pinned to a full-length commit SHA** ÔÇö A├ğ─▒n. Bu repoÔÇÖdaki t├╝m workflowÔÇÖlar zaten tam SHA ile pinÔÇÖlendi; ayar a├ğ─▒ld─▒─ş─▒nda pipeline bozulmaz.

---

## Uygulama ad─▒mlar─▒ (ekrandan ad─▒m ad─▒m)

┼Şu an **Settings ÔåÆ Code and automation ÔåÆ Branches** sayfas─▒ndas─▒n─▒z ve ÔÇ£Classic branch protections have not been configuredÔÇØ yaz─▒yor. A┼şa─ş─▒dakileri s─▒rayla yap─▒n.

### 1) Kural olu┼şturmay─▒ ba┼şlat─▒n

- **ÔÇ£Add classic branch protection ruleÔÇØ** butonuna t─▒klay─▒n.  
  (Ruleset daha yeni bir yap─▒; klasik kural bu senaryo i├ğin yeterli ve aray├╝z daha tan─▒d─▒k.)

### 2) Branch ad─▒ (pattern)

- **ÔÇ£Branch name patternÔÇØ** alan─▒na **tam olarak** korumak istedi─şiniz branch ad─▒n─▒ yaz─▒n.
- GitHubÔÇÖda repo ana sayfas─▒nda hangi branch varsay─▒lan g├Âr├╝n├╝yorsa onu kullan─▒n:
  - ├ço─şu yeni repo i├ğin: **`main`** yaz─▒n.
  - Eski / farkl─▒ kullan─▒yorsan─▒z: **`master`** yaz─▒n.
- Sadece bir branchÔÇÖi koruyacaksan─▒z tek isim yeterli (├Ârn. sadece `main`). Hem `main` hem `master` korumak isterseniz ├Ânce `main` i├ğin bu kural─▒ olu┼şturup kaydedin; sonra ikinci bir kural ekleyip pattern olarak `master` yaz─▒n.

### 3) Temel kurallar─▒ i┼şaretleyin

A┼şa─ş─▒ kayd─▒rarak ┼şu kutucuklar─▒ a├ğ─▒n:

- **Require a pull request before merging** ÔÇö A├ğ─▒n.  
  (─░sterseniz ÔÇ£Require approvalsÔÇØ say─▒s─▒n─▒ 1 yap─▒n.)
- **Require status checks to pass before merging** ÔÇö **Mutlaka a├ğ─▒n.**  
  A├ğt─▒─ş─▒n─▒zda hemen alt─▒nda **ÔÇ£Status checks that are requiredÔÇØ** b├Âl├╝m├╝ ├ğ─▒kar.

### 4) Zorunlu status checkÔÇÖleri ekleyin (Dependency Review dahil)

- **ÔÇ£Status checks that are requiredÔÇØ** kutusunda **ÔÇ£Search for status checks in the last week for this repositoryÔÇØ** yazan bir arama alan─▒ vard─▒r.
- **Arama kutusunda hi├ğbir ┼şey ├ğ─▒km─▒yorsa:** GitHub, sadece **son bir hafta i├ğinde bu repoÔÇÖda bir PR ├╝zerinde ├ğal─▒┼şm─▒┼ş** status checkÔÇÖleri listeler. Hen├╝z PR a├ğ─▒lmad─▒ysa veya workflowÔÇÖlar hi├ğ PRÔÇÖda ko┼şmad─▒ysa liste **bo┼ş** olur; bu normaldir.
- **Ne yapmal─▒ (iki a┼şamal─▒ kurulum):**
  1. **┼Şimdilik status check eklemeden** kural─▒ kaydedin: ÔÇ£Require status checks to passÔÇØ kutusunu **a├ğ─▒k b─▒rak─▒n** ama arama kutusuna hi├ğbir ┼şey eklemeyin; altta ÔÇ£No required checksÔÇØ kalabilir. Di─şer t├╝m istedi─şiniz se├ğenekleri i┼şaretleyip **Create** ile kaydedin.
  2. **Bir Pull Request a├ğ─▒n:** `main` (veya korudu─şunuz branch) hedefli bir PR a├ğ─▒n (k├╝├ğ├╝k bir de─şi┼şiklik veya ÔÇ£docs: branch protectionÔÇØ gibi bir commit yeterli). PR a├ğ─▒l─▒nca CI, Dependency Review, PR Title (ve varsa CodeQL) workflowÔÇÖlar─▒ ├ğal─▒┼ş─▒r.
  3. **WorkflowÔÇÖlar bitsin:** Actions sekmesinde bu checkÔÇÖlerin tamamlanmas─▒n─▒ bekleyin (ye┼şil/k─▒rm─▒z─▒ olmas─▒ yeterli).
  4. **Kural─▒ d├╝zenleyin:** Settings ÔåÆ Branches ÔåÆ az ├Ânce olu┼şturdu─şunuz kural─▒n yan─▒ndaki **Edit**ÔÇÖe t─▒klay─▒n. ÔÇ£Require status checksÔÇØ b├Âl├╝m├╝ndeki arama kutusuna bu kez t─▒klay─▒n; listede **test**, **title**, **review** (Dependency Review) ve iste─şe ba─şl─▒ **analyze** (CodeQL) g├Âr├╝necektir. Bunlar─▒ tek tek se├ğip ekleyin, sonra **Save changes** deyin.
- **Aramada aranacak isimler:** Workflow job adlar─▒na g├Âre genelde ┼şunlar ├ğ─▒kar: **test** (CI), **title** (PR Title), **review** (Dependency Review), **analyze** (CodeQL). Tam isimler GitHubÔÇÖ─▒n workflowÔÇÖdan ├╝retti─şi ┼şekilde olabilir; listeye bak─▒p ilgili olanlar─▒ se├ğin.

### 5) Di─şer alanlar (ekran─▒n geri kalan─▒)

A┼şa─ş─▒ kayd─▒rd─▒─ş─▒n─▒zda g├Ârd├╝─ş├╝n├╝z se├ğenekler:

| Se├ğenek | ├ûneri | A├ğ─▒klama |
|--------|--------|----------|
| **Require conversation resolution before merging** | A├ğ─▒k (├Ânerilir) | PRÔÇÖdaki t├╝m yorumlar ├ğ├Âz├╝lmeden merge edilemez. |
| **Require signed commits** | Kapal─▒ | ─░sterseniz ileride a├ğabilirsiniz; ┼şimdilik gerek yok. |
| **Require linear history** | Kapal─▒ | ─░sterseniz rebase zorunlu yapars─▒n─▒z. |
| **Require deployments to succeed** | Kapal─▒ | Bu repo i├ğin gerek yok. |
| **Lock branch** | Kapal─▒ | A├ğarsan─▒z branch tamamen kilitlenir; normalde kapal─▒. |
| **Do not allow bypassing the above settings** | **A├ğ─▒k** | Admin dahil herkes bu kurallara uyar; a├ğman─▒z iyi olur. |
| **Allow force pushes** | **Kapal─▒** | Force pushÔÇÖa izin vermeyin. |
| **Allow deletions** | **Kapal─▒** | Branch silinmesin; kapal─▒ b─▒rak─▒n. |

**Require review from Code Owners:** CODEOWNERS kulland─▒─ş─▒n─▒z i├ğin isterseniz **a├ğabilirsiniz**. A├ğarsan─▒z, `.github/workflows/`, `app.config.ts`, `eas.json` vb. CODEOWNERSÔÇÖta tan─▒ml─▒ dosyalara dokunan PRÔÇÖlar i├ğin sizin (owner) onay─▒n─▒z gerekir.

### 6) Kaydedin

- Sayfan─▒n alt─▒ndaki **ÔÇ£CreateÔÇØ** (yeni kural) veya **ÔÇ£Save changesÔÇØ** (d├╝zenleme) butonuna t─▒klay─▒n.

---

## Dependency Review checkÔÇÖi listede yoksa

ÔÇ£reviewÔÇØ veya ÔÇ£Dependency ReviewÔÇØ status checkÔÇÖi arama kutusunda ├ğ─▒km─▒yorsa:

1. Bu branchÔÇÖe (├Ârn. `main`) **bir Pull Request a├ğ─▒n** (k├╝├ğ├╝k bir de─şi┼şiklik yeterli).
2. PR a├ğ─▒ld─▒ktan sonra **Actions** sekmesinde ÔÇ£Dependency ReviewÔÇØ workflowÔÇÖunun ├ğal─▒┼şt─▒─ş─▒n─▒ g├Âr├╝n; bir kez ye┼şil/ k─▒rm─▒z─▒ bitmesi yeterli.
3. Ard─▒ndan **Settings ÔåÆ Branches** ÔåÆ ilgili branch kural─▒na girip **Edit** deyin.
4. ÔÇ£Require status checksÔÇØ b├Âl├╝m├╝ndeki aramada art─▒k **ÔÇ£reviewÔÇØ** (veya ÔÇ£Dependency ReviewÔÇØ) g├Âr├╝n├╝r; onu da ekleyip **Save changes** deyin.

Bundan sonra her PRÔÇÖda Dependency Review ge├ğmeden merge yap─▒lamaz.

---

Not: Branch protection kurallar─▒n─▒ yaln─▒zca **Admin** veya uygun yetkisi olan kullan─▒c─▒lar de─şi┼ştirebilir.
