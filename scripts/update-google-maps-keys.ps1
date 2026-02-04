# Google Maps API Keys Guncelleme Scripti
# EAS secrets'taki Google Maps key'lerini gunceller.
# Degerler ortam degiskenlerinden okunur; repo'da API key SAKLANMAZ (Secret scanning uyumlu).
#
# Kullanim: Once ortam degiskenlerini set edin:
#   $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID = "your-android-key"
#   $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS = "your-ios-key"
#   $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = "your-web-places-key"
#   .\scripts\update-google-maps-keys.ps1

$ErrorActionPreference = "Stop"

$vars = @(
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID",
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS",
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
)

Write-Host "`nGoogle Maps API Keys guncelleniyor..." -ForegroundColor Cyan

$missing = @()
foreach ($name in $vars) {
    $v = [Environment]::GetEnvironmentVariable($name, "Process")
    if (-not $v) { $v = [Environment]::GetEnvironmentVariable($name, "User") }
    if (-not $v) { $v = [Environment]::GetEnvironmentVariable($name, "Machine") }
    if (-not $v) { $missing += $name }
}

if ($missing.Count -gt 0) {
    Write-Host "`nHATA: Asagidaki ortam degiskenleri set edilmemis:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`nOrnek: `$env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID = `"your-key`"; ... sonra scripti tekrar calistirin.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n1. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID guncelleniyor..." -ForegroundColor Yellow
Write-Host "   Package: com.laststop.alarmtr | APIs: Maps SDK for Android, Places API" -ForegroundColor Gray
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --environment production --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --environment preview --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --environment development --type string --visibility secret --non-interactive

Write-Host "`n2. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS guncelleniyor..." -ForegroundColor Yellow
Write-Host "   Bundle ID: com.laststop.alarmtr | APIs: Maps SDK for iOS, Places API" -ForegroundColor Gray
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --environment production --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --environment preview --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --environment development --type string --visibility secret --non-interactive

Write-Host "`n3. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (Web - Places only) guncelleniyor..." -ForegroundColor Yellow
Write-Host "   Sadece Places API; native harita icin kullanilmaz." -ForegroundColor Gray
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --environment production --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --environment preview --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --environment development --type string --visibility secret --non-interactive

Write-Host "`nTum Google Maps API key'leri guncellendi!" -ForegroundColor Green
Write-Host "Kontrol: npx eas env:list --scope project`n" -ForegroundColor Cyan
