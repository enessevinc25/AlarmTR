# Jest Test Script
# Çıktı: qa-reports/jest.txt + coverage/ korunur

# UTF-8 encoding ayarları
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

$ErrorActionPreference = "Continue"
$reportsDir = "qa-reports"

Write-Host "=== Jest Testleri Baslatiliyor ===" -ForegroundColor Cyan

# Jest Test
Write-Host "Jest test calistiriliyor..." -ForegroundColor Yellow
try {
    npx jest 2>&1 | Tee-Object -FilePath "$reportsDir\jest.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Jest Test PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\jest.status.txt" -Encoding utf8
    } else {
        Write-Host "[FAIL] Jest Test FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "$reportsDir\jest.status.txt" -Encoding utf8
    }
} catch {
    Write-Host "[ERROR] Jest Test ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\jest.status.txt" -Encoding utf8
}

# Jest Coverage
Write-Host "Jest coverage calistiriliyor..." -ForegroundColor Yellow
try {
    npx jest --coverage 2>&1 | Tee-Object -FilePath "$reportsDir\jest-coverage.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Jest Coverage PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\jest-coverage.status.txt" -Encoding utf8
    } else {
        Write-Host "[FAIL] Jest Coverage FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "$reportsDir\jest-coverage.status.txt" -Encoding utf8
    }
} catch {
    Write-Host "[ERROR] Jest Coverage ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\jest-coverage.status.txt" -Encoding utf8
}

Write-Host "=== Jest Testleri Tamamlandi ===" -ForegroundColor Cyan

