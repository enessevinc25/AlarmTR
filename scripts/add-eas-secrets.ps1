# EAS Secrets Ekleme Scripti
# Bu script EAS secrets'ları ekler veya günceller

Write-Host "EAS Secrets ekleniyor..." -ForegroundColor Cyan

# Firebase API Key
Write-Host "`n1. EXPO_PUBLIC_FIREBASE_API_KEY ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIzaSyCS75soGEExQaePqbblpEDIBaB43bePIDs" --type string --visibility secret

# Firebase Storage Bucket
Write-Host "`n2. EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "laststop-alarm-tr-38d76.firebasestorage.app" --type string --visibility secret

# Google Maps API Key Android
Write-Host "`n3. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value "AIzaSyAVU7hqKkF7p3yHIFn_ykwJG2PTTIMyg2g" --type string --visibility secret

# Google Maps API Key iOS
Write-Host "`n4. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value "AIzaSyDsm7bYfryNWjJppXCYGHGvYBhFjcMXR0w" --type string --visibility secret

# Environment
Write-Host "`n5. EXPO_PUBLIC_ENVIRONMENT ekleniyor..." -ForegroundColor Yellow
npx eas env:create --scope project --name EXPO_PUBLIC_ENVIRONMENT --value "production" --type string --visibility secret

Write-Host "`n✅ Tüm secrets ekleme işlemi tamamlandı!" -ForegroundColor Green
Write-Host "`nSecrets'ları kontrol etmek için: npx eas env:list --scope project" -ForegroundColor Cyan

