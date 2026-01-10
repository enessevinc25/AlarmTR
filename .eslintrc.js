module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es6: true,
    node: true,
  },
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-var-requires': ['error', { allow: ['sentry-expo'] }], // Allow require for conditional imports
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }], // Allow console.log for debugging
    'no-debugger': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',
    
    // React/React Native
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    
    // Import resolution (disable for functions directory - Firebase Functions has different module resolution)
    'import/no-unresolved': ['error', { ignore: ['firebase-functions'] }],
    'import/namespace': 'off', // Disable for functions directory
  },
  ignorePatterns: [
    'node_modules/',
    'transit-api/',
    '*.config.js',
    '*.config.ts',
    'coverage/',
    '.expo/',
    'dist/',
    'build/',
    'scripts/',
    'functions/', // Firebase Functions has different module resolution
  ],
};
