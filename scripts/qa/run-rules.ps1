# Firebase Emulator Suite + Firestore Rules Tests
# Cikti: qa-reports/rules-tests.txt

# UTF-8 encoding ayarlari
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

$ErrorActionPreference = "Continue"
$reportsDir = "qa-reports"

Write-Host "=== Firebase Rules Testleri Baslatiliyor ===" -ForegroundColor Cyan

# Firebase emulators:exec kullanarak testleri calistir (emulator otomatik baslar/kapanir)
Write-Host "Firebase emulators:exec ile rules testleri calistiriliyor..." -ForegroundColor Yellow

try {
    # firebase emulators:exec kullanarak testleri calistir
    # Bu komut emulator'lari otomatik baslatir, testleri calistirir ve kapatir
    npx firebase emulators:exec --only firestore --project alarmtr-test "npm run test:rules" 2>&1 | Tee-Object -FilePath "$reportsDir\rules-tests.txt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Rules Tests PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\rules-tests.status.txt" -Encoding utf8
        exit 0
    } else {
        Write-Host "[FAIL] Rules Tests FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "$reportsDir\rules-tests.status.txt" -Encoding utf8
        exit 1
    }
} catch {
    Write-Host "[FAIL] Rules Tests ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\rules-tests.status.txt" -Encoding utf8
    exit 1
}

Write-Host "=== Firebase Rules Testleri Tamamlandi ===" -ForegroundColor Cyan
