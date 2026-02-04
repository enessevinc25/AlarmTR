import { ConfigContext, ExpoConfig } from '@expo/config';

// Node built-ins; app.config runs in Node during Expo config.
const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = process.cwd();

export default ({ config }: ConfigContext): ExpoConfig => {
  // Build-time environment validation (production için)
  const isProduction = (process.env.EXPO_PUBLIC_ENVIRONMENT ?? config?.extra?.environment) === 'production';
  
  // Platform-specific Google Maps API keys (P0: 3-key model)
  // Native key'ler ASLA genel key'e fallback yapmamalı (Places-only key harita blank yapar)
  // EAS Secrets'ta platform-specific secret'lar kullanılmalı:
  // - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID (Maps SDK for Android)
  // - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS (Maps SDK for iOS)
  // - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (Web services - Places vb, native'de kullanılmaz)
  // 
  // FALLBACK: Eğer platform-specific key yoksa, web key'i kullan (önceki APK'larda bu şekilde çalışıyordu)
  const googleWebKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const googleMapsKeyAndroid = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ?? googleWebKey;
  const googleMapsKeyIOS = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ?? googleWebKey;
  
  // Build-time guard: Production build'lerde native key kontrolü
  // NOT: EAS Build'de key'ler EAS Secrets'tan gelir, bu yüzden local'de key yoksa bile build başarılı olmalı
  // Key kontrolü sadece warning olarak yapılıyor (build fail etmiyor)
  // EAS Build'de key'ler secrets'tan geldiği için kontrol yapmaya gerek yok
  const isProductionBuild = (process.env.EXPO_PUBLIC_ENVIRONMENT ?? config?.extra?.environment) === 'production';
  
  // EAS build kontrolü: EAS Build'de key'ler EAS Secrets'tan gelir
  // EAS Build'de process.env.EAS_BUILD_PLATFORM set edilir (ama npx expo config çalıştırıldığında henüz set olmayabilir)
  // Bu yüzden key kontrolü sadece warning olarak yapılıyor, build fail etmiyor
  const isEASBuild = !!(process.env.EAS_BUILD_PLATFORM || process.env.EAS_BUILD_ID || process.env.EAS_BUILD);
  
  // P0.1: Plugin path check — app.plugin.js yoksa production build'de net WARNING
  const pluginPath = path.join(PROJECT_ROOT, 'app.plugin.js');
  if (!fs.existsSync(pluginPath)) {
    const msg = `[app.config] ⚠️  WARNING: app.plugin.js bulunamadı (${pluginPath}). Google Maps API Key gradle/AndroidManifest inject yapılamaz.`;
    if (isProduction) {
      console.warn(msg + ' Production build\'de harita blank kalabilir.');
    } else {
      console.warn(msg);
    }
  }

  // Key kontrolü: Sadece warning (build fail etmiyor)
  // EAS Build'de key'ler secrets'tan gelir, bu yüzden kontrol yapmaya gerek yok
  // Local build'de key yoksa warning verilir ama build devam eder
  {
    const isLocalDev = !process.env.EAS_BUILD_PLATFORM;
    const keySource = isLocalDev ? '.env dosyasına' : 'EAS Secrets\'a';
    const envVarsAndroid = 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID (veya app.config extra.googleMapsApiKeyAndroid)';
    const envVarsIOS = 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS (veya app.config extra.googleMapsApiKeyIOS)';

    if (!googleMapsKeyAndroid && process.env.EAS_BUILD_PLATFORM !== 'ios') {
      if (isProduction) {
        console.warn(
          `[app.config] ⚠️  WARNING: android.config.googleMaps.apiKey boş. Harita blank olur. ` +
          `Kaynak: ${envVarsAndroid}. ${keySource} ekleyin.`
        );
      } else {
        console.warn(
          `⚠️  WARNING: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID eksik. Harita blank olabilir. ` +
          `${keySource} ekleyin: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID`
        );
      }
    }
    if (!googleMapsKeyIOS && process.env.EAS_BUILD_PLATFORM !== 'android') {
      if (isProduction) {
        console.warn(
          `[app.config] ⚠️  WARNING: ios.config.googleMapsApiKey boş. Harita blank olur. ` +
          `Kaynak: ${envVarsIOS}. ${keySource} ekleyin.`
        );
      } else {
        console.warn(
          `⚠️  WARNING: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS eksik. Harita blank olabilir. ` +
          `${keySource} ekleyin: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS`
        );
      }
    }
  }

  // P1.1: New Architecture — varsayılan false (stabilite > performans); env ile açılabilir
  const newArchEnabledEnv = process.env.EXPO_PUBLIC_NEW_ARCH_ENABLED === 'true';
  const newArchEnabled = newArchEnabledEnv;
  if (newArchEnabled && isProduction) {
    console.warn(
      '[app.config] ⚠️  WARNING: EXPO_PUBLIC_NEW_ARCH_ENABLED=true production build\'de. ' +
      'react-native-maps regression riski; sadece dev/preview\'da önerilir.'
    );
  }

  // P1.3: Google Services dosyaları opsiyonel — varsa otomatik bağlanır, yoksa referans verilmez
  const hasGoogleServicesJson = fs.existsSync(path.join(PROJECT_ROOT, 'google-services.json'));
  const hasGoogleServiceInfoPlist = fs.existsSync(path.join(PROJECT_ROOT, 'GoogleService-Info.plist'));

  return {
    ...config,
    name: 'LastStop Alarm TR',
    slug: 'laststop-alarm-tr',
    scheme: 'laststopalarmtr',
  version: '1.0.0',
  runtimeVersion: '1.0.0', // OTA updates için - store build'lerde değişmemeli
  orientation: 'portrait',
  icon: './assets/icon.png',
  newArchEnabled, // Varsayılan false. Açmak için EXPO_PUBLIC_NEW_ARCH_ENABLED=true (sadece dev/preview önerilir; production'da maps regression riski)
  userInterfaceStyle: 'automatic', // Dark mode otomatik sistem ayarına göre
  // Store assets: 1024x1024px PNG, transparent background önerilir
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#EAF3FF', // Soft blue background - splash screen arka plan rengi
    // Store assets: 1242x2436px PNG (iPhone ratio), uygulama adı ve logo içermeli
  },
  assetBundlePatterns: ['**/*'], // Tüm asset'ler bundle'a dahil edilir
  updates: {
    fallbackToCacheTimeout: 0, // OTA update başarısız olursa cache'den yükle
    url: 'https://u.expo.dev/81c19e04-5e78-48b6-9c52-387540a1a839', // EAS project URL
  },
  ios: {
    supportsTablet: false,
    ...(hasGoogleServiceInfoPlist && { googleServicesFile: './GoogleService-Info.plist' }),
    // NOT: Bu bundle identifier, store yayına çıkarken değişmeyecek şekilde sabit kalmalı.
    bundleIdentifier: 'com.laststop.alarmtr',
    buildNumber: '2', // Production build'lerde artırılmalı
    config: {
      googleMapsApiKey: googleMapsKeyIOS,
      // Google Maps API key iOS için
      // EAS Secrets: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
      // Production build'de mutlaka set edilmelidir
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Konumunuza yakın durakları ve varış noktanızı gösterebilmek için konum erişimine ihtiyaç duyuyoruz.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Varış durağınıza yaklaştığınızda alarm çalabilmek için arka planda konumunuzu takip etmemiz gerekiyor.',
      UIBackgroundModes: ['location'],
    },
  },
  android: {
    ...(hasGoogleServicesJson && { googleServicesFile: './google-services.json' }),
    // NOT: Bu package name, store yayına çıkarken değişmeyecek şekilde sabit kalmalı.
    package: 'com.laststop.alarmtr',
    versionCode: 2, // Production build'lerde artırılmalı
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION', // Arka planda alarm için gerekli
      'android.permission.POST_NOTIFICATIONS', // Android 13+ için bildirim izni
      'android.permission.VIBRATE', // Alarm titreşimi için
      'android.permission.FOREGROUND_SERVICE', // Android 14+ foreground service için
      'android.permission.FOREGROUND_SERVICE_LOCATION', // Android 14+ location foreground service için
      // Not: SCHEDULE_EXACT_ALARM kaldırıldı - time-interval trigger kullanıldığı için exact alarm gerekmiyor
      // İleride belirli bir zamana planlı bildirim eklenirse geri eklenebilir
    ],
    // NOT: usesCleartextTraffic ayarı expo-build-properties plugin ile yapılıyor (plugins array'inde)
    config: {
      googleMaps: {
        apiKey: googleMapsKeyAndroid,
        // Google Maps API key Android için
        // EAS Secrets: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
        // Production build'de mutlaka set edilmelidir
      },
    },
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-foreground.png',
      backgroundColor: '#EAF3FF', // Soft blue background (backgroundImage yerine backgroundColor kullanılıyor)
      // Store assets: 1024x1024px PNG, içerik merkeze yerleştirilmeli (kenarlarda %20 safe area)
    },
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          // Android 9+ (API 28+) için HTTP (cleartext) trafiği
          // Production'da kapalı, dev/preview'da açık (local network için)
          usesCleartextTraffic: (process.env.EXPO_PUBLIC_ENVIRONMENT ?? config?.extra?.environment ?? 'development') !== 'production',
          // Minimum Android SDK version - Android 7.0 (API 24) ve üzeri desteklenir
          // Hermes tooling gereksinimi nedeniyle 24'e yükseltildi
          minSdkVersion: 24,
          // Target SDK version - Android 14 (API 34) - tüm yeni özellikler için
          targetSdkVersion: 34,
          // Compile SDK version - androidx.core:core:1.16.0 gereksinimi nedeniyle 35'e yükseltildi
          compileSdkVersion: 35,
        },
        ios: {
          // Minimum iOS version - iOS 15.1 ve üzeri desteklenir (expo-doctor recommendation)
          deploymentTarget: '15.1',
        },
      },
    ],
    [
      'expo-location',
      {
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        locationAlwaysAndWhenInUsePermission:
          'LastStop Alarm TR, durağa yaklaşmanızı tespit edebilmek için arka planda konumunuza erişir.',
      },
    ],
    [
      'expo-notifications',
      {
        sounds: [
          './assets/sounds/alarm_default.wav',
          './assets/sounds/alarm_soft.wav',
          './assets/sounds/alarm_loud.wav',
        ],
      },
    ],
    ['sentry-expo', {}],
    ['expo-font', {}],
    // Custom plugin: Google Maps API Key'i gradle.properties'e yaz
    ['./app.plugin.js'],
  ],
  extra: {
    // Firebase Client Configuration
    // Öncelik sırası: .env (EXPO_PUBLIC_*) > app.json (config.extra.firebase)
    // src/services/firebase.ts bu değerleri Constants.expoConfig.extra.firebase üzerinden okur
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? config?.extra?.firebase?.apiKey ?? '',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? config?.extra?.firebase?.authDomain ?? '',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? config?.extra?.firebase?.projectId ?? '',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? config?.extra?.firebase?.storageBucket ?? '',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? config?.extra?.firebase?.messagingSenderId ?? '',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? config?.extra?.firebase?.appId ?? '',
    },
    // NOT: Production build'lerde EXPO_PUBLIC_ENVIRONMENT=production değeri EAS Secrets üzerinden verilmeli.
    // EAS build sırasında eas.json'daki env değişkenleri process.env'e geçer
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT ?? config?.extra?.environment ?? 'development',
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? config?.extra?.sentryDsn ?? '',
    // EAS build'lerde eas.json'daki env değişkenleri build-time'da process.env'e geçer
    // Runtime'da Constants.expoConfig.extra üzerinden erişilir
    // Development'da env yoksa '' (env.ts zaten hata fırlatıyor)
    // Production'da env yoksa Cloud Run fallback olabilir (ama production build'de mutlaka env set edilmeli)
    transitApiBaseUrl: process.env.EXPO_PUBLIC_TRANSIT_API_BASE_URL ?? 'https://laststop-alarm-tr-599735223710.europe-west1.run.app', // Override: EXPO_PUBLIC_TRANSIT_API_BASE_URL
    // Platform-specific Google Maps API keys (P0: 3-key model)
    // Runtime'da Platform.OS'a göre seçilir (src/utils/env.ts)
    googleMapsApiKeyAndroid: googleMapsKeyAndroid,
    googleMapsApiKeyIOS: googleMapsKeyIOS,
    googleMapsWebApiKey: googleWebKey, // Web services (Places vb) - native'de kullanılmaz
    // Diagnostics için boolean flag'ler (key değerini göstermeden durum kontrolü)
    hasGoogleMapsAndroidKey: !!googleMapsKeyAndroid,
    hasGoogleMapsIOSKey: !!googleMapsKeyIOS,
    hasGoogleWebKey: !!googleWebKey,
    eas: {
      projectId: '81c19e04-5e78-48b6-9c52-387540a1a839',
    },
  },
  };
};

