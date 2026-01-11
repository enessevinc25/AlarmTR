const { withGradleProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin: Google Maps API Key'i gradle.properties'e yaz
 * 
 * EAS Build sırasında app.config.ts'deki android.config.googleMaps.apiKey değerini
 * gradle.properties'e yazar, böylece build.gradle'daki getGoogleMapsApiKey() fonksiyonu
 * bu değeri okuyabilir.
 */
const withGoogleMapsApiKey = (config) => {
  return withGradleProperties(config, (config) => {
    const googleMapsApiKey = config.android?.config?.googleMaps?.apiKey;
    
    if (googleMapsApiKey) {
      // gradle.properties dosyasına GOOGLE_MAPS_API_KEY ekle
      config.modResults = config.modResults || [];
      
      // Mevcut GOOGLE_MAPS_API_KEY'i kaldır (varsa)
      config.modResults = config.modResults.filter(
        (item) => item.type !== 'property' || item.key !== 'GOOGLE_MAPS_API_KEY'
      );
      
      // Yeni GOOGLE_MAPS_API_KEY ekle
      config.modResults.push({
        type: 'property',
        key: 'GOOGLE_MAPS_API_KEY',
        value: googleMapsApiKey,
      });
      
      console.log('[app.plugin.js] Google Maps API Key gradle.properties\'e yazıldı (length: ' + googleMapsApiKey.length + ')');
    } else {
      console.warn('[app.plugin.js] WARNING: android.config.googleMaps.apiKey bulunamadı!');
    }
    
    return config;
  });
};

module.exports = withGoogleMapsApiKey;
