# Expo Config + Prebuild Testleri
# Çıktı: qa-reports/expo-config-public.json, prebuild.txt

# UTF-8 encoding ayarları
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

$ErrorActionPreference = "Continue"
$reportsDir = "qa-reports"
$tempDir = "qa-temp"

Write-Host "=== Expo Config + Prebuild Testleri Baslatiliyor ===" -ForegroundColor Cyan

# 1. Expo Config
Write-Host "1/2 Expo config ciktisi aliniyor..." -ForegroundColor Yellow
try {
    if (Test-Path "node_modules\.bin\expo.cmd") {
        & "node_modules\.bin\expo.cmd" config --type public | Out-File -FilePath "$reportsDir\expo-config-public.json" -Encoding utf8
    } else {
        npx --yes expo config --type public | Out-File -FilePath "$reportsDir\expo-config-public.json" -Encoding utf8
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Expo Config PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "$reportsDir\expo-config.status.txt" -Encoding utf8
    } else {
        Write-Host "[FAIL] Expo Config FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "$reportsDir\expo-config.status.txt" -Encoding utf8
    }
} catch {
    Write-Host "[ERROR] Expo Config ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\expo-config.status.txt" -Encoding utf8
}

# 2. Prebuild (temp kopya)
Write-Host "2/2 Prebuild test (temp kopya)..." -ForegroundColor Yellow
$prebuildLocation = $null
try {
    # Temp dizini temizle ve oluştur
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Repo'yu temp'e kopyala (sadece gerekli dosyalar)
    Write-Host "  Temp repo kopyalaniyor..." -ForegroundColor Gray
    $excludeDirs = @('node_modules', '.git', 'coverage', 'dist', 'android', 'ios', 'qa-reports', 'qa-temp')
    Get-ChildItem -Path . -Exclude $excludeDirs | Copy-Item -Destination $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    
    Push-Location $tempDir
    $prebuildLocation = Get-Location
    
    # npm ci
    Write-Host "  npm ci calistiriliyor..." -ForegroundColor Gray
    npm ci 2>&1 | Out-File -FilePath "..\$reportsDir\prebuild-npm-ci.txt" -Encoding utf8
    
    # Prebuild
    Write-Host "  Prebuild calistiriliyor..." -ForegroundColor Gray
    npx expo prebuild --clean --no-install 2>&1 | Tee-Object -FilePath "..\$reportsDir\prebuild.txt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Prebuild PASS" -ForegroundColor Green
        "PASS" | Out-File -FilePath "..\$reportsDir\prebuild.status.txt" -Encoding utf8
    } else {
        Write-Host "[FAIL] Prebuild FAIL" -ForegroundColor Red
        "FAIL" | Out-File -FilePath "..\$reportsDir\prebuild.status.txt" -Encoding utf8
    }
    
    Pop-Location
    $prebuildLocation = $null
    
} catch {
    Write-Host "[ERROR] Prebuild ERROR: $_" -ForegroundColor Red
    "ERROR: $_" | Out-File -FilePath "$reportsDir\prebuild.status.txt" -Encoding utf8
} finally {
    if ($prebuildLocation -ne $null) {
        Pop-Location -ErrorAction SilentlyContinue
    }
}

Write-Host "=== Expo Config + Prebuild Testleri Tamamlandi ===" -ForegroundColor Cyan

