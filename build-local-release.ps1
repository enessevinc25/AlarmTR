# Local Release Build Script
# Production environment ile release APK build

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Local Release Build Başlatılıyor..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Environment variables set et (Production ayarları)
# Transit API URL artık hardcoded (src/utils/env.ts), env değişkeni gerekmez
$env:EXPO_PUBLIC_ENVIRONMENT = "production"

# API Key kontrolü (environment variable'lardan okunur)
# Local build için bu değerleri PowerShell'de set edin veya .env dosyası kullanın
# Örnek: $env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID = "your-key"
$mapsKeyAndroid = if ($env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID) { "SET" } else { "NOT SET" }
$mapsKeyIOS = if ($env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS) { "SET" } else { "NOT SET" }
$firebaseKey = if ($env:EXPO_PUBLIC_FIREBASE_API_KEY) { "SET" } else { "NOT SET" }

Write-Host "Environment Variables:" -ForegroundColor Yellow
Write-Host "  Transit API URL = hardcoded (production)"
Write-Host "  EXPO_PUBLIC_ENVIRONMENT = $env:EXPO_PUBLIC_ENVIRONMENT"
Write-Host "  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID = $mapsKeyAndroid" -ForegroundColor $(if ($mapsKeyAndroid -eq "SET") { "Green" } else { "Yellow" })
Write-Host "  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS = $mapsKeyIOS" -ForegroundColor $(if ($mapsKeyIOS -eq "SET") { "Green" } else { "Yellow" })
Write-Host "  EXPO_PUBLIC_FIREBASE_API_KEY = $firebaseKey" -ForegroundColor $(if ($firebaseKey -eq "SET") { "Green" } else { "Yellow" })
Write-Host ""

if ($mapsKeyAndroid -eq "NOT SET" -or $mapsKeyIOS -eq "NOT SET" -or $firebaseKey -eq "NOT SET") {
    Write-Host "⚠️  UYARI: API key'ler eksik!" -ForegroundColor Yellow
    Write-Host "   Build devam edecek ama Maps/Firebase çalışmayabilir." -ForegroundColor Yellow
    Write-Host "   Local build için environment variable'ları set edin:" -ForegroundColor Yellow
    Write-Host "     `$env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID = 'your-key'" -ForegroundColor Cyan
    Write-Host "     `$env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS = 'your-key'" -ForegroundColor Cyan
    Write-Host "     `$env:EXPO_PUBLIC_FIREBASE_API_KEY = 'your-key'" -ForegroundColor Cyan
    Write-Host ""
}

# 1. Prebuild (temiz build için --clean flag'i)
Write-Host "1/3: Expo prebuild çalıştırılıyor..." -ForegroundColor Green
npx expo prebuild --clean --platform android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prebuild başarısız!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prebuild tamamlandı" -ForegroundColor Green
Write-Host ""

# 2. Gradle ile Release APK build
Write-Host "2/3: Gradle release build başlatılıyor..." -ForegroundColor Green
Write-Host "   Bu işlem birkaç dakika sürebilir..." -ForegroundColor Yellow
Write-Host "   Not: minSdkVersion 24 olarak ayarlandı (Hermes tooling gereksinimi)" -ForegroundColor Yellow
Write-Host ""

Push-Location android
.\gradlew.bat assembleRelease --no-daemon
$buildExitCode = $LASTEXITCODE
Pop-Location

if ($buildExitCode -ne 0) {
    Write-Host "❌ Gradle build başarısız!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Gradle build tamamlandı" -ForegroundColor Green
Write-Host ""

# 3. APK dosyasının konumunu göster
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $apkInfo = Get-Item $apkPath
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ BUILD BAŞARILI!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "APK Dosyası:" -ForegroundColor Yellow
    Write-Host "  Konum: $($apkInfo.FullName)" -ForegroundColor White
    Write-Host "  Boyut: $([math]::Round($apkInfo.Length / 1MB, 2)) MB" -ForegroundColor White
    Write-Host ""
    Write-Host "APK'yı cihaza kurmak için:" -ForegroundColor Cyan
    Write-Host "  adb install $($apkInfo.FullName)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ APK dosyası bulunamadı!" -ForegroundColor Red
    Write-Host "   Beklenen konum: $apkPath" -ForegroundColor Yellow
    exit 1
}

