# EAS Secrets Ekleme Scripti
# Bu script EAS secrets'lari ekler. Degerler ortam degiskenlerinden okunur;
# repo'da API key SAKLANMAZ (Secret scanning uyumlu).
#
# Kullanim: .env dosyasini doldurup asagidaki env'leri set edin veya:
#   $env:EXPO_PUBLIC_FIREBASE_API_KEY = "your-key"
#   $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID = "your-key"
#   ... vb.
#   .\scripts\add-eas-secrets.ps1

$ErrorActionPreference = "Stop"

$required = @(
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID",
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS",
    "EXPO_PUBLIC_ENVIRONMENT"
)

Write-Host "`n=== EAS Secrets Ekleme ===" -ForegroundColor Cyan

$missing = @()
foreach ($name in $required) {
    $val = [Environment]::GetEnvironmentVariable($name, "Process")
    if (-not $val) { $val = [Environment]::GetEnvironmentVariable($name, "User") }
    if (-not $val) { $val = [Environment]::GetEnvironmentVariable($name, "Machine") }
    if (-not $val) { $missing += $name }
}

if ($missing.Count -gt 0) {
    Write-Host "`nHATA: Asagidaki ortam degiskenleri set edilmemis:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`nOrnek (PowerShell): .env dosyasindan okuyup set edin veya:" -ForegroundColor Yellow
    Write-Host '  $env:EXPO_PUBLIC_FIREBASE_API_KEY = "your-firebase-api-key"' -ForegroundColor Gray
    Write-Host '  $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID = "your-android-maps-key"' -ForegroundColor Gray
    Write-Host '  $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS = "your-ios-maps-key"' -ForegroundColor Gray
    Write-Host "  ... sonra bu scripti tekrar calistirin.`n" -ForegroundColor Gray
    exit 1
}

Write-Host "EAS Secrets ekleniyor (degerler ortam degiskenlerinden okunuyor)..." -ForegroundColor Cyan

Write-Host "`n1. EXPO_PUBLIC_FIREBASE_API_KEY ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value $env:EXPO_PUBLIC_FIREBASE_API_KEY --type string --visibility secret

Write-Host "`n2. EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value $env:EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --type string --visibility secret

Write-Host "`n3. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --type string --visibility secret

Write-Host "`n4. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --type string --visibility secret

Write-Host "`n5. EXPO_PUBLIC_ENVIRONMENT ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_ENVIRONMENT --value $env:EXPO_PUBLIC_ENVIRONMENT --type string --visibility secret

Write-Host "`nTum secrets ekleme islemi tamamlandi!" -ForegroundColor Green
Write-Host "Kontrol: npx eas env:list --scope project`n" -ForegroundColor Cyan
