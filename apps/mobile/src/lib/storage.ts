import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Small secrets (participation tokens) go to the keychain on native, localStorage on web. */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return void globalThis.localStorage?.setItem(key, value);
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') return void globalThis.localStorage?.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};

/** Auth session storage adapter for @supabase/auth-js (sessions exceed the keychain size limit). */
export const sessionStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

const participationKey = (sessionId: string) => `merak.participation.${sessionId}`;
export const participationStore = {
  get: (sessionId: string) => secureStorage.get(participationKey(sessionId)),
  set: (sessionId: string, token: string) => secureStorage.set(participationKey(sessionId), token),
  clear: (sessionId: string) => secureStorage.remove(participationKey(sessionId)),
};
