# Emulator Entegrasyon Testleri (Auth+Firestore)
# Cikti: qa-reports/emulator-integration.txt

# UTF-8 encoding ayarlari
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

$ErrorActionPreference = "Continue"
$reportsDir = "qa-reports"

Write-Host "=== Emulator Entegrasyon Testleri Baslatiliyor ===" -ForegroundColor Cyan

# Firebase emulators:exec kullanarak testleri calistir (emulator otomatik baslar/kapanir)
Write-Host "Firebase emulators:exec ile emulator integration testleri calistiriliyor..." -ForegroundColor Yellow

try {
    # firebase emulators:exec kullanarak testleri calistir
    # Bu komut emulator'lari otomatik baslatir, testleri calistirir ve kapatir
    npx firebase emulators:exec --only firestore,auth --project alarmtr-test "npm run test:emu" 2>&1 | Tee-Object -FilePath "$reportsDir\emulator-integration.txt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Emulator Integration Tests PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\emulator-integration.status.txt" -Encoding utf8
        exit 0
    } else {
        Write-Host "[FAIL] Emulator Integration Tests FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "$reportsDir\emulator-integration.status.txt" -Encoding utf8
        exit 1
    }
} catch {
    Write-Host "[FAIL] Emulator Integration Tests ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\emulator-integration.status.txt" -Encoding utf8
    exit 1
}

Write-Host "=== Emulator Entegrasyon Testleri Tamamlandi ===" -ForegroundColor Cyan
