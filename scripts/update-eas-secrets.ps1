# EAS Secrets Guncelleme Script
# Bu script, EAS Secrets guncelleme adimlarini gosterir.
# NOT: API key ve secret degerleri REPO'DA SAKLANMAZ; degerleri .env veya EAS Web arayuzunden girin.

Write-Host "`n=== EAS Secrets Guncelleme ===" -ForegroundColor Cyan
Write-Host "`nNOT: EAS CLI interactive prompt gerektirdigi icin," -ForegroundColor Yellow
Write-Host "     secrets'lari manuel olarak EAS Web Arayuzunden guncellemeniz gerekiyor.`n" -ForegroundColor Yellow

Write-Host "Mevcut Secrets Durumu:" -ForegroundColor Green
Write-Host "   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID - VAR (guncellenmeli)" -ForegroundColor White
Write-Host "   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS - VAR (guncellenmeli)" -ForegroundColor White
Write-Host "   EXPO_PUBLIC_FIREBASE_API_KEY - VAR (guncellenmeli)`n" -ForegroundColor White

Write-Host "Guncellenecek Degerler:" -ForegroundColor Cyan
Write-Host "   Degerleri .env dosyanizdan veya Google Cloud Console / Firebase Console'dan alin." -ForegroundColor Gray
Write-Host "   Repo'da API key SAKLAMAYIN (Secret scanning uyumlulugu).`n" -ForegroundColor Gray

Write-Host "EAS Web Arayuzu Adimlari:" -ForegroundColor Cyan
Write-Host "   1. https://expo.dev adresine gidin" -ForegroundColor White
Write-Host "   2. Projenizi secin: laststop-alarm-tr" -ForegroundColor White
Write-Host "   3. Sol menuden 'Secrets' sekmesine tiklayin" -ForegroundColor White
Write-Host "   4. Her secret icin: Edit -> yeni degeri yapistirin -> Save`n" -ForegroundColor White

Write-Host "Guncellenecek Secret Isimleri:" -ForegroundColor Cyan
Write-Host "   1. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID" -ForegroundColor White
Write-Host "   2. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS" -ForegroundColor White
Write-Host "   3. EXPO_PUBLIC_FIREBASE_API_KEY`n" -ForegroundColor White

Write-Host "Tamamlandiginda: npx eas env:list --scope project ile kontrol edin.`n" -ForegroundColor Green
