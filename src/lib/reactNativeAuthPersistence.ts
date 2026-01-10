// Minimal AsyncStorage persistence adapter for Firebase Auth on React Native

export interface ReactNativeAsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export function getReactNativePersistence(storage: ReactNativeAsyncStorage): any {
  const STORAGE_AVAILABLE_KEY = '__laststop_auth_check';

  return class Persistence {
    static type = 'LOCAL' as const;
    readonly type = 'LOCAL' as const;

    async _isAvailable(): Promise<boolean> {
      try {
        await storage.setItem(STORAGE_AVAILABLE_KEY, '1');
        await storage.removeItem(STORAGE_AVAILABLE_KEY);
        return true;
      } catch {
        return false;
      }
    }

    async _set(key: string, value: unknown): Promise<void> {
      await storage.setItem(key, JSON.stringify(value));
    }

    async _get(key: string): Promise<unknown | null> {
      const json = await storage.getItem(key);
      return json ? JSON.parse(json) : null;
    }

    async _remove(key: string): Promise<void> {
      await storage.removeItem(key);
    }

    _addListener() {
      // React Native AsyncStorage does not support change listeners
    }

    _removeListener() {
      // no-op
    }
  };
}

