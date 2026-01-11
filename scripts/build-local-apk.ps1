# Local APK Build Script
# Bu script local'de release APK build eder

Write-Host "Local APK Build başlatılıyor..." -ForegroundColor Cyan

# Environment variables set et
$env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID = "AIzaSyAVU7hqKkF7p3yHIFn_ykwJG2PTTIMyg2g"
$env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS = "AIzaSyDsm7bYfryNWjJppXCYGHGvYBhFjcMXR0w"
$env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = "AIzaSyALEHjwVi3HGBYVQvWFHSYOYJTLefczc9A"
$env:EXPO_PUBLIC_ENVIRONMENT = "staging"

Write-Host "`nEnvironment variables set edildi:" -ForegroundColor Green
Write-Host "  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID: $($env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS: $($env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "  EXPO_PUBLIC_ENVIRONMENT: $env:EXPO_PUBLIC_ENVIRONMENT" -ForegroundColor Gray

# Prebuild çalıştır (clean olmadan - android klasörü kilitli olabilir)
Write-Host "`nPrebuild çalıştırılıyor..." -ForegroundColor Yellow
cd $PSScriptRoot\..
npx expo prebuild --platform android

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Prebuild başarısız!" -ForegroundColor Red
    exit 1
}

# gradle.properties kontrolü
Write-Host "`ngradle.properties kontrol ediliyor..." -ForegroundColor Yellow
$gradlePropsPath = "android\gradle.properties"
if (Test-Path $gradlePropsPath) {
    $gradleProps = Get-Content $gradlePropsPath
    $hasGoogleMapsKey = $gradleProps | Select-String -Pattern "GOOGLE_MAPS_API_KEY"
    if ($hasGoogleMapsKey) {
        Write-Host "  ✅ GOOGLE_MAPS_API_KEY gradle.properties'te bulundu" -ForegroundColor Green
        Write-Host "  $hasGoogleMapsKey" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  GOOGLE_MAPS_API_KEY gradle.properties'te bulunamadı" -ForegroundColor Yellow
        Write-Host "  app.plugin.js çalışmamış olabilir" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  gradle.properties dosyası bulunamadı" -ForegroundColor Yellow
}

# AndroidManifest.xml kontrolü
Write-Host "`nAndroidManifest.xml kontrol ediliyor..." -ForegroundColor Yellow
$manifestPath = "android\app\src\main\AndroidManifest.xml"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw
    if ($manifest -match "com\.google\.android\.geo\.API_KEY") {
        Write-Host "  ✅ Google Maps API Key meta-data tag'i bulundu" -ForegroundColor Green
        $match = [regex]::Match($manifest, 'android:name="com\.google\.android\.geo\.API_KEY"[^>]*android:value="([^"]*)"')
        if ($match.Success) {
            $keyValue = $match.Groups[1].Value
            if ($keyValue -match '\$\{GOOGLE_MAPS_API_KEY\}') {
                Write-Host "  ✅ Placeholder doğru: `${GOOGLE_MAPS_API_KEY}" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  Key değeri: $keyValue" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ❌ Google Maps API Key meta-data tag'i bulunamadı!" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ AndroidManifest.xml bulunamadı!" -ForegroundColor Red
}

# Gradle daemon durdur ve cache temizle
Write-Host "`nGradle daemon durduruluyor ve cache temizleniyor..." -ForegroundColor Yellow
cd android
.\gradlew --stop
.\gradlew clean

# Gradle build
Write-Host "`nGradle build başlatılıyor..." -ForegroundColor Yellow
Write-Host "  Bu işlem birkaç dakika sürebilir..." -ForegroundColor Gray

.\gradlew assembleRelease --no-daemon

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ APK build başarılı!" -ForegroundColor Green
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        $apkInfo = Get-Item $apkPath
        Write-Host "`nAPK bilgileri:" -ForegroundColor Cyan
        Write-Host "  Konum: $($apkInfo.FullName)" -ForegroundColor Gray
        Write-Host "  Boyut: $([math]::Round($apkInfo.Length / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "`nAPK'yı test edebilirsiniz!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  APK dosyası beklenen konumda bulunamadı" -ForegroundColor Yellow
        Write-Host "  Arama yapılıyor..." -ForegroundColor Gray
        $foundApk = Get-ChildItem -Path . -Filter "*.apk" -Recurse | Where-Object { $_.FullName -match "release" } | Select-Object -First 1
        if ($foundApk) {
            Write-Host "  Bulundu: $($foundApk.FullName)" -ForegroundColor Green
        }
    }
} else {
    Write-Host "`n❌ Gradle build başarısız!" -ForegroundColor Red
    Write-Host "  Hata log'larını kontrol edin" -ForegroundColor Yellow
    exit 1
}

cd ..
