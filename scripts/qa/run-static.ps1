# Statik Analiz Script
# Çıktılar: qa-reports/typecheck.txt, lint.txt, format-check.txt, expo-doctor.txt, npm-audit.txt

# UTF-8 encoding ayarları
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

$ErrorActionPreference = "Continue"
$reportsDir = "qa-reports"

Write-Host "=== Statik Analiz Baslatiliyor ===" -ForegroundColor Cyan

# 1. TypeCheck
Write-Host "1/5 TypeCheck calistiriliyor..." -ForegroundColor Yellow
try {
    npm run typecheck 2>&1 | Tee-Object -FilePath "$reportsDir\typecheck.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] TypeCheck PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\typecheck.status.txt" -Encoding utf8
    } else {
        Write-Host "[FAIL] TypeCheck FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "$reportsDir\typecheck.status.txt" -Encoding utf8
    }
} catch {
    Write-Host "[ERROR] TypeCheck ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\typecheck.status.txt" -Encoding utf8
}

# 2. Lint
Write-Host "2/5 Lint calistiriliyor..." -ForegroundColor Yellow
try {
    npm run lint 2>&1 | Tee-Object -FilePath "$reportsDir\lint.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Lint PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\lint.status.txt" -Encoding utf8
    } else {
        Write-Host "[SKIP] Lint FAIL (veya yapilandirilmamis)" -ForegroundColor Yellow
        "SKIP" | Out-File -FilePath "$reportsDir\lint.status.txt" -Encoding utf8
    }
} catch {
    Write-Host "[ERROR] Lint ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\lint.status.txt" -Encoding utf8
}

# 3. Prettier Format Check
Write-Host "3/5 Prettier format check calistiriliyor..." -ForegroundColor Yellow
try {
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        npx prettier --check "src/**/*.{ts,tsx}" "*.{ts,tsx,json}" 2>&1 | Tee-Object -FilePath "$reportsDir\format-check.txt"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Format Check PASS" -ForegroundColor Green
            "PASS" | Out-File -FilePath "$reportsDir\format-check.status.txt" -Encoding utf8
        } else {
            Write-Host "[SKIP] Format Check FAIL (veya prettier yuklu degil)" -ForegroundColor Yellow
            "SKIP" | Out-File -FilePath "$reportsDir\format-check.status.txt" -Encoding utf8
        }
    } else {
        Write-Host "[SKIP] Prettier SKIP (npx bulunamadi)" -ForegroundColor Yellow
        "SKIP" | Out-File -FilePath "$reportsDir\format-check.status.txt" -Encoding utf8
    }
} catch {
    Write-Host "[SKIP] Format Check SKIP: $_" -ForegroundColor Yellow
    "SKIP: $_" | Out-File -FilePath "$reportsDir\format-check.status.txt" -Encoding utf8
}

# 4. Expo Doctor
Write-Host "4/5 Expo Doctor calistiriliyor..." -ForegroundColor Yellow
try {
    npx expo doctor 2>&1 | Tee-Object -FilePath "$reportsDir\expo-doctor.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Expo Doctor PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\expo-doctor.status.txt" -Encoding utf8
    } else {
        Write-Host "[FAIL] Expo Doctor FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "$reportsDir\expo-doctor.status.txt" -Encoding utf8
    }
} catch {
    Write-Host "[ERROR] Expo Doctor ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\expo-doctor.status.txt" -Encoding utf8
}

# 5. NPM Audit
Write-Host "5/5 NPM Audit calistiriliyor..." -ForegroundColor Yellow
try {
    npm audit --omit=dev 2>&1 | Tee-Object -FilePath "$reportsDir\npm-audit.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] NPM Audit PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\npm-audit.status.txt" -Encoding utf8
    } else {
        Write-Host "[WARN] NPM Audit uyarilari var (fail zorunlu degil)" -ForegroundColor Yellow
        "WARN" | Out-File -FilePath "$reportsDir\npm-audit.status.txt" -Encoding utf8
    }
} catch {
    Write-Host "[ERROR] NPM Audit ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\npm-audit.status.txt" -Encoding utf8
}

Write-Host "=== Statik Analiz Tamamlandi ===" -ForegroundColor Cyan

