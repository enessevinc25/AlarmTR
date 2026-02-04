# EAS Secrets Güncelleme Script
# Bu script, EAS Secrets'ları güncellemek için kullanılır.
# NOT: EAS CLI interactive prompt gerektirdiği için, bu script sadece komutları gösterir.

Write-Host "`n=== EAS Secrets Güncelleme ===" -ForegroundColor Cyan
Write-Host "`n⚠️  NOT: EAS CLI interactive prompt gerektirdiği için," -ForegroundColor Yellow
Write-Host "     secrets'ları manuel olarak EAS Web Arayüzünden güncellemeniz gerekiyor.`n" -ForegroundColor Yellow

Write-Host "✅ Mevcut Secrets Durumu:" -ForegroundColor Green
Write-Host "   • EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID - VAR (güncellenmeli)" -ForegroundColor White
Write-Host "   • EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS - VAR (güncellenmeli)" -ForegroundColor White
Write-Host "   • EXPO_PUBLIC_FIREBASE_API_KEY - VAR (güncellenmeli)`n" -ForegroundColor White

Write-Host "📝 Güncellenecek Değerler:" -ForegroundColor Cyan
 

Write-Host "🌐 EAS Web Arayüzü Adımları:" -ForegroundColor Cyan
Write-Host "   1. https://expo.dev adresine gidin" -ForegroundColor White
Write-Host "   2. Projenizi seçin: laststop-alarm-tr" -ForegroundColor White
Write-Host "   3. Sol menüden 'Secrets' sekmesine tıklayın" -ForegroundColor White
Write-Host "   4. Her secret için:" -ForegroundColor White
Write-Host "      a. Secret'ı bulun ve 'Edit' butonuna tıklayın" -ForegroundColor Gray
Write-Host "      b. Yeni değeri yapıştırın" -ForegroundColor Gray
Write-Host "      c. 'Save' butonuna tıklayın`n" -ForegroundColor Gray

Write-Host "📋 Güncellenecek Secrets:" -ForegroundColor Cyan
 
Write-Host "✅ Tamamlandığında, 'eas secret:list' komutu ile kontrol edebilirsiniz.`n" -ForegroundColor Green

