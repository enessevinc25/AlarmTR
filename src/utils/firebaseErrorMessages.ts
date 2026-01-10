/**
 * Firebase Auth hata mesajlarını Türkçe'ye çevirir
 */

export function getFirebaseErrorMessage(error: any): string {
  if (!error || !error.code) {
    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }

  const code = error.code;

  // Firebase Auth hata kodları
  switch (code) {
    // Giriş hataları
    case 'auth/user-not-found':
      return 'Bu e-posta adresi ile kayıtlı bir hesap bulunamadı.';
    case 'auth/wrong-password':
      return 'Şifre hatalı. Lütfen tekrar deneyin.';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi. Lütfen geçerli bir e-posta adresi girin.';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmış. Lütfen destek ekibi ile iletişime geçin.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme. Lütfen bir süre sonra tekrar deneyin.';
    case 'auth/operation-not-allowed':
      return 'Bu işlem şu anda devre dışı. Lütfen daha sonra tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.';
    case 'auth/invalid-credential':
      return 'E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
    case 'auth/invalid-verification-code':
      return 'Geçersiz doğrulama kodu.';
    case 'auth/invalid-verification-id':
      return 'Geçersiz doğrulama kimliği.';

    // Kayıt hataları
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanılıyor. Giriş yapmayı deneyin.';
    case 'auth/weak-password':
      return 'Şifre çok zayıf. En az 6 karakter olmalı.';
    case 'auth/invalid-password':
      return 'Geçersiz şifre. Şifre en az 6 karakter olmalı.';

    // Şifre sıfırlama hataları
    // Note: 'auth/user-not-found' already handled above
    case 'auth/invalid-action-code':
      return 'Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.';

    // Genel hatalar
    case 'auth/requires-recent-login':
      return 'Bu işlem için tekrar giriş yapmanız gerekiyor.';
    case 'auth/credential-already-in-use':
      return 'Bu kimlik bilgisi zaten başka bir hesap tarafından kullanılıyor.';
    case 'auth/account-exists-with-different-credential':
      return 'Bu e-posta adresi farklı bir giriş yöntemi ile kayıtlı.';

    default:
      // Bilinmeyen hata kodları için genel mesaj
      if (__DEV__) {
        console.warn('[firebaseErrorMessages] Bilinmeyen Firebase hata kodu:', code, error.message);
      }
      return error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
}

