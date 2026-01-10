/**
 * Global type definitions for React Native and Expo
 */

// eslint-disable-next-line no-var
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

// eslint-disable-next-line no-var
declare var process: {
  env: NodeJS.ProcessEnv;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// eslint-disable-next-line no-var
declare var require: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (id: string): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  main: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extensions: any;
  resolve: (id: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// eslint-disable-next-line no-var
declare var global: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    captureException(error: Error, context?: any): void;
  }

  export function init(options: SentryOptions): void;
  export const Native: Native;
}

