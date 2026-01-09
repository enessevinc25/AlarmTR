/**
 * Global type definitions for React Native and Expo
 */

declare var __DEV__: boolean;

// Node.js globals for build-time code
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    EXPO_PUBLIC_FIREBASE_API_KEY?: string;
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    EXPO_PUBLIC_FIREBASE_APP_ID?: string;
    EXPO_PUBLIC_ENVIRONMENT?: string;
    EXPO_PUBLIC_SENTRY_DSN?: string;
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID?: string;
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS?: string;
    EXPO_PUBLIC_TRANSIT_API_BASE_URL?: string;
    FIREBASE_EMULATOR_HOST?: string;
    FIREBASE_AUTH_EMULATOR_HOST?: string;
    FIREBASE_FIRESTORE_EMULATOR_HOST?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
  [key: string]: any;
};

declare var require: {
  (id: string): any;
  cache: any;
  main: any;
  extensions: any;
  resolve: (id: string) => string;
  [key: string]: any;
};

declare var global: {
  [key: string]: any;
};

declare namespace NodeJS {
  interface Timeout {
    ref(): Timeout;
    unref(): Timeout;
  }
}

// sentry-expo type declarations (optional module)
declare module 'sentry-expo' {
  interface SentryOptions {
    dsn?: string;
    enableInExpoDevelopment?: boolean;
    debug?: boolean;
    environment?: string;
  }

  export interface Native {
    captureException(error: Error, context?: any): void;
  }

  export function init(options: SentryOptions): void;
  export const Native: Native;
}

