# QA Report Generator
# QA_REPORT.md dosyasini olusturur

param(
    [hashtable]$Results,
    [hashtable]$RepoMap
)

# UTF-8 encoding ayarları
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

$reportsDir = "qa-reports"
$reportPath = "$reportsDir\QA_REPORT.md"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$report = @"
# QA Test Report - AlarmTR

**Tarih**: $timestamp  
**Proje**: AlarmTR (Expo RN + TS + Firebase) + transit-api (Node/TS)

---

## 0. Repo Map

- **Root**: $($RepoMap.Root)
- **Transit-API**: $($RepoMap.TransitApi)
- **Firestore Rules**: $($RepoMap.FirestoreRules)
- **Firestore Indexes**: $($RepoMap.FirestoreIndexes)

---

## 1. Statik Analiz

| Test | Durum | Dosya |
|------|-------|-------|
| TypeCheck | $($Results.Static.TypeCheck) | `qa-reports/typecheck.txt` |
| Lint | $($Results.Static.Lint) | `qa-reports/lint.txt` |
| Format Check | $($Results.Static.Format) | `qa-reports/format-check.txt` |
| Expo Doctor | $($Results.Static.ExpoDoctor) | `qa-reports/expo-doctor.txt` |
| NPM Audit | $($Results.Static.NpmAudit) | `qa-reports/npm-audit.txt` |

**Komutlar**:
\`\`\`bash
npm run typecheck
npm run lint
npx prettier --check "src/**/*.{ts,tsx}"
npx expo doctor
npm audit --omit=dev
\`\`\`

---

## 2. Jest Testleri

| Test | Durum | Dosya |
|------|-------|-------|
| Jest Tests | $($Results.Jest.Tests) | `qa-reports/jest.txt` |
| Jest Coverage | $($Results.Jest.Coverage) | `qa-reports/jest-coverage.txt` |

**Komutlar**:
\`\`\`bash
npm run test
npm run test:coverage
\`\`\`

**Coverage Özeti**: `coverage/` klasörüne bakın.

**Coverage Detayları**:
\`\`\`bash
# Coverage raporunu görüntüle
cat coverage/lcov-report/index.html
\`\`\`

**Not**: Coverage yüzdesi `qa-reports/jest-coverage.txt` dosyasında bulunabilir.

---

## 3. Firebase Rules Testleri

| Test | Durum | Dosya |
|------|-------|-------|
| Firestore Rules | $($Results.Rules) | `qa-reports/rules-tests.txt` |

**Komutlar**:
\`\`\`bash
npm run test:rules
# veya
npm run qa:rules
\`\`\`

**Test Kapsamı**:
- Anonymous access DENY
- UserA own data ALLOW
- UserA other user data DENY
- alarmSessions deletedAt==null read ALLOW
- alarmSessions deletedAt set read DENY

---

## 4. Emulator Entegrasyon Testleri

| Test | Durum | Dosya |
|------|-------|-------|
| Emulator Integration | $($Results.EmulatorIntegration) | `qa-reports/emulator-integration.txt` |

**Komutlar**:
\`\`\`bash
npm run test:emu
# veya
npm run qa:emu
\`\`\`

**Test Kapsamı**:
- deleteAccountAndData flow (seed -> delete -> verify)
- Tüm kullanıcı verilerinin silindiğini doğrula
- Auth kullanıcısının silindiğini doğrula

---

## 5. Transit-API Testleri

| Test | Durum | Dosya |
|------|-------|-------|
| Build | $($Results.TransitApi.Build) | `qa-reports/transit-api-build.txt` |
| Tests | $($Results.TransitApi.Tests) | `qa-reports/transit-api-tests.txt` |
| Docker Build | $($Results.TransitApi.Docker) | `qa-reports/transit-api-docker-build.txt` |

**Komutlar**:
\`\`\`bash
cd transit-api
npm ci
npm run build
npm test
docker build -t alarmtr-transit-api:qa .
\`\`\`

---

## 6. Expo Config + Prebuild

| Test | Durum | Dosya |
|------|-------|-------|
| Expo Config | $($Results.Expo.Config) | `qa-reports/expo-config-public.json` |
| Prebuild | $($Results.Expo.Prebuild) | `qa-reports/prebuild.txt` |

**Komutlar**:
\`\`\`bash
npx expo config --type public > qa-reports/expo-config-public.json
npx expo prebuild --clean --no-install
\`\`\`

---

## 7. EAS Build

| Test | Durum | Dosya |
|------|-------|-------|
| EAS Build | $($Results.EasBuild) | `qa-reports/eas-build-*.txt` |

**Not**: Default SKIP. \`--RunEasBuild\` flag ile çalıştırılabilir.

---

## 8. E2E (Maestro)

| Test | Durum | Dosya |
|------|-------|-------|
| E2E Tests | $($Results.E2E) | - |

**Not**: Şimdilik SKIP. Gelecekte eklenebilir.

---

## Test Matrisi Özeti

| Kategori | Durum | Detay |
|----------|-------|-------|
| Statik Analiz | [Bakınız: 1. Statik Analiz bölümü] | TypeCheck, Lint, Format, Expo Doctor, NPM Audit |
| Jest | [Bakınız: 2. Jest Testleri bölümü] | Tests, Coverage |
| Firebase Rules | $($Results.Rules) | Firestore security rules unit tests |
| Emulator Integration | $($Results.EmulatorIntegration) | deleteAccountAndData flow integration test |
| Transit-API | [Bakınız: 5. Transit-API Testleri bölümü] | Build, Tests, Docker Build |
| Expo | [Bakınız: 6. Expo Config + Prebuild bölümü] | Config, Prebuild |
| EAS Build | $($Results.EasBuild) | Default SKIP, --RunEasBuild flag ile çalıştırılabilir |
| E2E | $($Results.E2E) | Şimdilik SKIP |

---

## Bulunan Sorunlar ve Fix'ler

### Yüksek Öncelik
- (Yok)

### Orta Öncelik
- (Yok)

### Düşük Öncelik
- (Yok)

---

## Manuel Smoke Checklist (10 dakika)

- [ ] Uygulama başlatılıyor mu?
- [ ] Login/SignUp çalışıyor mu?
- [ ] Harita görüntüleniyor mu?
- [ ] Durak arama çalışıyor mu?
- [ ] Alarm kurulabiliyor mu?
- [ ] Alarm tetikleniyor mu?
- [ ] Offline durumda çalışıyor mu?
- [ ] Dark mode çalışıyor mu?

---

## Release'e Hazır mı?

**Durum**: [EVET/HAYIR - Test sonuçlarına göre belirlenecek]

**Gerekçe**:
- [Test sonuçlarına göre gerekçe buraya yazılacak]
- Tüm kritik testlerin PASS olması gerekmektedir
- Statik analiz, Jest testleri, Firebase Rules ve Transit-API testleri başarılı olmalıdır

---

**Rapor Oluşturulma**: $timestamp  
**QA Script Versiyonu**: 1.0.0

"@

$report | Out-File -FilePath $reportPath -Encoding utf8

Write-Host "QA_REPORT.md oluşturuldu: $reportPath" -ForegroundColor Green

