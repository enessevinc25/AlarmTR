module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-clone-referenced-element|@react-native-community|@expo|expo(nent)?|expo-.*|@expo-google-fonts|@unimodules|unimodules|sentry-expo|@sentry|native-base|react-navigation|@react-navigation|@testing-library)/)',
  ],
};

