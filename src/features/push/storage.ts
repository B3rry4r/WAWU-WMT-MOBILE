import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * What this phone remembers about push, in the secure store the app already
 * ships (the browser build used in development has no push and keeps nothing).
 *
 *   token   the Expo push token this phone last registered, so sign-out can remove it
 *           even after the app was closed since
 *   asked   the system permission prompt was shown once; it is never shown again
 */
export const PUSH_TOKEN_KEY = 'wmt.push.token';
export const PUSH_ASKED_KEY = 'wmt.push.asked';

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // A store that refuses leaves the phone unremembered: the next start asks the system again.
  }
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Nothing to do: a token left behind is registered again, or replaced, on the next start.
  }
}

export const rememberedToken = () => read(PUSH_TOKEN_KEY);
export const rememberToken = (token: string) => write(PUSH_TOKEN_KEY, token);
export const forgetToken = () => remove(PUSH_TOKEN_KEY);
export const wasAsked = async () => (await read(PUSH_ASKED_KEY)) === 'yes';
export const markAsked = () => write(PUSH_ASKED_KEY, 'yes');
