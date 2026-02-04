# Google Maps API Keys Güncelleme Scripti
# Bu script EAS secrets'taki Google Maps API key'lerini günceller

Write-Host "Google Maps API Keys güncelleniyor..." -ForegroundColor Cyan

# Google Maps API Key Android (Maps SDK for Android)
Write-Host "`n1. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID güncelleniyor..." -ForegroundColor Yellow
Write-Host "   Key: 1" -ForegroundColor Gray
Write-Host "   Package: com.laststop.alarmtr" -ForegroundColor Gray
Write-Host "   APIs: Maps SDK for Android, Places API, Places API (New)" -ForegroundColor Gray
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value "1" --environment production --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value "1" --environment preview --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value "1" --environment development --type string --visibility secret --non-interactive

# Google Maps API Key iOS (Maps SDK for iOS)
Write-Host "`n2. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS güncelleniyor..." -ForegroundColor Yellow
Write-Host "   Key:  " -ForegroundColor Gray
Write-Host "   Bundle ID: com.laststop.alarmtr" -ForegroundColor Gray
Write-Host "   APIs: Maps SDK for iOS, Places API, Places API (New)" -ForegroundColor Gray
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value "1" --environment production --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value "1" --environment preview --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value "1" --environment development --type string --visibility secret --non-interactive

# Google Maps API Key Web (Places API only - NOT for native maps)
Write-Host "`n3. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (Web - Places API only) güncelleniyor..." -ForegroundColor Yellow
Write-Host "   Key:  " -ForegroundColor Gray
Write-Host "   APIs: Places API, Places API (New) - NOT Maps SDK" -ForegroundColor Gray
Write-Host "   NOT: Bu key native harita için kullanılmaz!" -ForegroundColor Red
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "1" --environment production --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "1" --environment preview --type string --visibility secret --non-interactive
npx eas env:update --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "1" --environment development --type string --visibility secret --non-interactive

Write-Host "`n✅ Tüm Google Maps API key'leri güncellendi!" -ForegroundColor Green
Write-Host "`nÖNEMLİ:" -ForegroundColor Yellow
Write-Host "  - Android key: Maps SDK for Android aktif ✅" -ForegroundColor Green
Write-Host "  - iOS key: Maps SDK for iOS aktif ✅" -ForegroundColor Green
Write-Host "  - Web key: Sadece Places API (native harita için kullanılmaz) ⚠️" -ForegroundColor Yellow
Write-Host "`nSecrets'ları kontrol etmek için: npx eas env:list --scope project" -ForegroundColor Cyan
