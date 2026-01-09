// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Expo SDK 53+ i�in baz� k�t�phaneler "exports" ile sorun ��karabiliyor.
// Bu sat�r, Metro'nun package exports'� zorlamas�n� kapat�yor.
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
