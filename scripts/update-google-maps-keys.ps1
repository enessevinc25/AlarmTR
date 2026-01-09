# Google Maps API Keys - EAS Secrets Güncelleme Script
# Kullanım: .\scripts\update-google-maps-keys.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Maps API Keys - EAS Secrets Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# API Key'ler (güncel değerler - 2025 güncellemesi)
$ANDROID_KEY = "AIzaSyAVU7hqKkF7p3yHIFn_ykwJG2PTTIMyg2g"
$IOS_KEY = "AIzaSyDsm7bYfryNWjJppXCYGHGvYBhFjcMXR0w"
$SERVER_KEY = "AIzaSyALEHjwVi3HGBYVQvWFHSY0YJTLefczc9A"  # Backend (Cloud Run) için

# EAS CLI kontrolü
Write-Host "[1/4] EAS CLI kontrolü..." -ForegroundColor Yellow
try {
    $easVersion = eas --version 2>&1
    Write-Host "✅ EAS CLI bulundu: $easVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ EAS CLI bulunamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Lütfen önce EAS CLI'yı kurun:" -ForegroundColor Yellow
    Write-Host "  npm install -g eas-cli" -ForegroundColor White
    Write-Host "  eas login" -ForegroundColor White
    exit 1
}

# EAS login kontrolü
Write-Host ""
Write-Host "[2/4] EAS login kontrolü..." -ForegroundColor Yellow
try {
    $easWhoami = eas whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ EAS'e giriş yapılmamış!" -ForegroundColor Red
        Write-Host "Lütfen önce giriş yapın: eas login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ EAS'e giriş yapılmış: $easWhoami" -ForegroundColor Green
} catch {
    Write-Host "❌ EAS login kontrolü başarısız!" -ForegroundColor Red
    exit 1
}

# Android Key güncelleme
Write-Host ""
Write-Host "[3/4] Android API Key güncelleniyor..." -ForegroundColor Yellow
Write-Host "  Key: $($ANDROID_KEY.Substring(0, 20))..." -ForegroundColor Gray

try {
    # Mevcut secret'ı kontrol et
    $existingAndroid = eas secret:list --scope project 2>&1 | Select-String "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID"
    if ($existingAndroid) {
        # Mevcut secret var, önce sil sonra oluştur
        Write-Host "  Mevcut secret bulundu, güncelleniyor..." -ForegroundColor Gray
        eas secret:delete --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --force 2>&1 | Out-Null
        Start-Sleep -Seconds 1
    }
    
    # Yeni secret oluştur
    Write-Host "  Secret oluşturuluyor..." -ForegroundColor Gray
    echo $ANDROID_KEY | eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value-from-stdin 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Android API Key güncellendi/oluşturuldu" -ForegroundColor Green
    } else {
        Write-Host "❌ Android API Key oluşturulamadı!" -ForegroundColor Red
        Write-Host "   Manuel olarak EAS web arayüzünden güncelleyin: https://expo.dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Android API Key güncelleme hatası: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Manuel olarak EAS web arayüzünden güncelleyin: https://expo.dev" -ForegroundColor Yellow
}

# iOS Key güncelleme
Write-Host ""
Write-Host "[4/4] iOS API Key güncelleniyor..." -ForegroundColor Yellow
Write-Host "  Key: $($IOS_KEY.Substring(0, 20))..." -ForegroundColor Gray

try {
    # Mevcut secret'ı kontrol et
    $existingIOS = eas secret:list --scope project 2>&1 | Select-String "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS"
    if ($existingIOS) {
        # Mevcut secret var, önce sil sonra oluştur
        Write-Host "  Mevcut secret bulundu, güncelleniyor..." -ForegroundColor Gray
        eas secret:delete --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --force 2>&1 | Out-Null
        Start-Sleep -Seconds 1
    }
    
    # Yeni secret oluştur
    Write-Host "  Secret oluşturuluyor..." -ForegroundColor Gray
    echo $IOS_KEY | eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value-from-stdin 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ iOS API Key güncellendi/oluşturuldu" -ForegroundColor Green
    } else {
        Write-Host "❌ iOS API Key oluşturulamadı!" -ForegroundColor Red
        Write-Host "   Manuel olarak EAS web arayüzünden güncelleyin: https://expo.dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ iOS API Key güncelleme hatası: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Manuel olarak EAS web arayüzünden güncelleyin: https://expo.dev" -ForegroundColor Yellow
}

# Özet
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONRAKI ADIMLAR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Secret'ları kontrol edin:" -ForegroundColor White
Write-Host "   eas secret:list --scope project" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Yeni build yapın (secret'lar otomatik yüklenecek):" -ForegroundColor White
Write-Host "   eas build --profile production --platform android" -ForegroundColor Cyan
Write-Host "   eas build --profile production --platform ios" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. ⚠️ BACKEND İÇİN:" -ForegroundColor Yellow
Write-Host "   Cloud Run backend için ayrı bir SERVER-SIDE API key gerekiyor." -ForegroundColor Yellow
Write-Host "   Google Cloud Console'da 'Server key' oluşturun ve:" -ForegroundColor Yellow
Write-Host "   - IP restrictions: Cloud Run IP'leri" -ForegroundColor Yellow
Write-Host "   - API restrictions: Places API" -ForegroundColor Yellow
Write-Host "   Sonra deploy script'inde kullanın:" -ForegroundColor Yellow
Write-Host "   `$env:GOOGLE_MAPS_API_KEY='your-server-side-key'" -ForegroundColor Cyan
Write-Host "   cd transit-api" -ForegroundColor Cyan
Write-Host "   .\deploy-cloud-run.ps1" -ForegroundColor Cyan
Write-Host ""

