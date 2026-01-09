# QA Test Suite - Ana Script
# Tüm QA testlerini sırayla çalıştırır

# UTF-8 encoding ayarları
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

param(
    [switch]$RunEasBuild = $false
)

$ErrorActionPreference = "Continue"
$reportsDir = "qa-reports"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QA Test Suite Baslatiliyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# QA reports dizinini temizle ve oluştur
if (Test-Path $reportsDir) {
    Remove-Item -Path $reportsDir -Recurse -Force
}
New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null

$results = @{}

# 0. Repo Map (QA_REPORT.md'ye yazılacak)
Write-Host "0) Repo Map oluşturuluyor..." -ForegroundColor Yellow
$repoMap = @{
    Root = (Resolve-Path .).Path
    TransitApi = (Resolve-Path "transit-api").Path
    FirestoreRules = (Resolve-Path "firestore.rules").Path
    FirestoreIndexes = (Resolve-Path "firestore.indexes.json").Path
}
$repoMap | ConvertTo-Json | Out-File -FilePath "$reportsDir\repo-map.json" -Encoding utf8

# 1. Statik Analiz
Write-Host ""
Write-Host "1) Statik Analiz" -ForegroundColor Cyan
& "$scriptDir\run-static.ps1"
$results["Static"] = @{
    TypeCheck = if (Test-Path "$reportsDir\typecheck.status.txt") { Get-Content "$reportsDir\typecheck.status.txt" } else { "UNKNOWN" }
    Lint = if (Test-Path "$reportsDir\lint.status.txt") { Get-Content "$reportsDir\lint.status.txt" } else { "UNKNOWN" }
    Format = if (Test-Path "$reportsDir\format-check.status.txt") { Get-Content "$reportsDir\format-check.status.txt" } else { "UNKNOWN" }
    ExpoDoctor = if (Test-Path "$reportsDir\expo-doctor.status.txt") { Get-Content "$reportsDir\expo-doctor.status.txt" } else { "UNKNOWN" }
    NpmAudit = if (Test-Path "$reportsDir\npm-audit.status.txt") { Get-Content "$reportsDir\npm-audit.status.txt" } else { "UNKNOWN" }
}

# 2. Jest
Write-Host ""
Write-Host "2) Jest Testleri" -ForegroundColor Cyan
& "$scriptDir\run-jest.ps1"
$results["Jest"] = @{
    Tests = if (Test-Path "$reportsDir\jest.status.txt") { Get-Content "$reportsDir\jest.status.txt" } else { "UNKNOWN" }
    Coverage = if (Test-Path "$reportsDir\jest-coverage.status.txt") { Get-Content "$reportsDir\jest-coverage.status.txt" } else { "UNKNOWN" }
}

# 3. Firebase Rules
Write-Host ""
Write-Host "3) Firebase Rules Testleri" -ForegroundColor Cyan
& "$scriptDir\run-rules.ps1"
$results["Rules"] = if (Test-Path "$reportsDir\rules-tests.status.txt") { Get-Content "$reportsDir\rules-tests.status.txt" } else { "UNKNOWN" }

# 4. Emulator Integration
Write-Host ""
Write-Host "4) Emulator Integration Testleri" -ForegroundColor Cyan
& "$scriptDir\run-emu-integration.ps1"
$results["EmulatorIntegration"] = if (Test-Path "$reportsDir\emulator-integration.status.txt") { Get-Content "$reportsDir\emulator-integration.status.txt" } else { "UNKNOWN" }

# 5. Transit-API
Write-Host ""
Write-Host "5) Transit-API Testleri" -ForegroundColor Cyan
& "$scriptDir\run-transit-api.ps1"
$results["TransitApi"] = @{
    Build = if (Test-Path "$reportsDir\transit-api-build.status.txt") { Get-Content "$reportsDir\transit-api-build.status.txt" } else { "UNKNOWN" }
    Tests = if (Test-Path "$reportsDir\transit-api-tests.status.txt") { Get-Content "$reportsDir\transit-api-tests.status.txt" } else { "UNKNOWN" }
    Docker = if (Test-Path "$reportsDir\transit-api-docker-build.status.txt") { Get-Content "$reportsDir\transit-api-docker-build.status.txt" } else { "UNKNOWN" }
}

# 6. Expo Config + Prebuild
Write-Host ""
Write-Host "6) Expo Config + Prebuild" -ForegroundColor Cyan
& "$scriptDir\run-expo-config.ps1"
$results["Expo"] = @{
    Config = if (Test-Path "$reportsDir\expo-config.status.txt") { Get-Content "$reportsDir\expo-config.status.txt" } else { "UNKNOWN" }
    Prebuild = if (Test-Path "$reportsDir\prebuild.status.txt") { Get-Content "$reportsDir\prebuild.status.txt" } else { "UNKNOWN" }
}

# 7. EAS Build (opsiyonel)
Write-Host ""
Write-Host "7) EAS Build" -ForegroundColor Cyan
if ($RunEasBuild) {
    Write-Host "  EAS Build calistiriliyor..." -ForegroundColor Yellow
    # Android
    eas build --profile development --platform android 2>&1 | Tee-Object -FilePath "$reportsDir\eas-build-android.txt"
    # iOS
    eas build --profile development --platform ios 2>&1 | Tee-Object -FilePath "$reportsDir\eas-build-ios.txt"
    $results["EasBuild"] = "RUN"
} else {
    Write-Host "  SKIP (--RunEasBuild flag ile calistirilabilir)" -ForegroundColor Yellow
    $results["EasBuild"] = "SKIP"
}

# 8. E2E (Maestro) - SKIP
Write-Host ""
Write-Host "8) E2E (Maestro)" -ForegroundColor Cyan
Write-Host "  SKIP" -ForegroundColor Yellow
$results["E2E"] = "SKIP"

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QA Test Suite Tamamlandi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Sonuçları yazdır
$passCount = 0
$failCount = 0
$skipCount = 0

foreach ($key in $results.Keys) {
    $value = $results[$key]
    if ($value -is [Hashtable]) {
        foreach ($subKey in $value.Keys) {
            if ($value[$subKey] -eq "PASS") { $passCount++ }
            elseif ($value[$subKey] -eq "FAIL") { $failCount++ }
            elseif ($value[$subKey] -eq "SKIP") { $skipCount++ }
        }
    } else {
        if ($value -eq "PASS") { $passCount++ }
        elseif ($value -eq "FAIL") { $failCount++ }
        elseif ($value -eq "SKIP") { $skipCount++ }
    }
}

Write-Host "Özet:" -ForegroundColor Yellow
Write-Host "  PASS: $passCount" -ForegroundColor Green
Write-Host "  FAIL: $failCount" -ForegroundColor Red
Write-Host "  SKIP: $skipCount" -ForegroundColor Gray
Write-Host ""
Write-Host "Raporlar: $reportsDir\" -ForegroundColor Cyan

# QA_REPORT.md oluştur
& "$scriptDir\generate-qa-report.ps1" -Results $results -RepoMap $repoMap

Write-Host ""
Write-Host "QA_REPORT.md oluşturuldu: $reportsDir\QA_REPORT.md" -ForegroundColor Green

