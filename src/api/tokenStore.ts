import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Where the signed-in tokens live between launches: the phone's secure store
 * (Keychain on iOS, Keystore-backed storage on Android). The browser build used
 * for development and screenshots has no secure store, so it keeps them in
 * localStorage; store builds never take that path.
 */
export type StoredTokens = { accessToken: string; refreshToken: string };

export const ACCESS_KEY = 'wawu.session.access';
export const REFRESH_KEY = 'wawu.session.refresh';

const onWeb = Platform.OS === 'web';

async function read(key: string): Promise<string | null> {
  if (onWeb) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
  if (onWeb) return globalThis.localStorage?.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  if (onWeb) return globalThis.localStorage?.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([read(ACCESS_KEY), read(REFRESH_KEY)]);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([write(ACCESS_KEY, tokens.accessToken), write(REFRESH_KEY, tokens.refreshToken)]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([remove(ACCESS_KEY), remove(REFRESH_KEY)]);
}
