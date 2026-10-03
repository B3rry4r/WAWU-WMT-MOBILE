import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * The sign-up that is waiting for its texted code: the phone WAWU ID stored
 * and the `attempt` secret `POST /auth/signup` returned (SHARED-CHANGES
 * AUTH-05 F1). Both live in the secure store, so quitting the app between A3 and A4 does
 * not lose them; the `attempt` is never written to a log, a URL or a route
 * parameter. The browser build (a development and preview target) keeps them in
 * sessionStorage: for the tab only, so a reload resumes and a closed tab forgets.
 *
 * Cleared when the code is confirmed, when the server says the sign-up is gone,
 * when a new sign-up starts, and when someone signs in (`clearSignup`).
 */
export type HeldSignup = { phone: string; attempt: string };

export const SIGNUP_PHONE_KEY = 'wawu.signup.phone';
export const SIGNUP_ATTEMPT_KEY = 'wawu.signup.attempt';

const onWeb = Platform.OS === 'web';
/** The browser build keeps the secret for the tab only (sessionStorage): it survives a reload, not a closed tab, and is not shared with other tabs. */
const webStore = () => globalThis.sessionStorage;

async function read(key: string): Promise<string | null> {
  if (onWeb) return webStore()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function write(key: string, value: string): Promise<void> {
  if (onWeb) return webStore()?.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}
async function remove(key: string): Promise<void> {
  if (onWeb) return webStore()?.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export async function saveSignup(held: HeldSignup): Promise<void> {
  await Promise.all([write(SIGNUP_PHONE_KEY, held.phone), write(SIGNUP_ATTEMPT_KEY, held.attempt)]);
  memory = held;
}

export async function loadSignup(): Promise<HeldSignup | null> {
  try {
    const [phone, attempt] = await Promise.all([read(SIGNUP_PHONE_KEY), read(SIGNUP_ATTEMPT_KEY)]);
    memory = phone && attempt ? { phone, attempt } : null;
  } catch {
    memory = null;
  }
  return memory;
}

export async function clearSignup(): Promise<void> {
  memory = null;
  startedState = null;
  try {
    await Promise.all([remove(SIGNUP_PHONE_KEY), remove(SIGNUP_ATTEMPT_KEY)]);
  } catch {
    // The vault refused: the memory copy is already gone, and the next start's resume call ends a sign-up the server no longer holds.
  }
}

let memory: HeldSignup | null = null;

/** What the code screen needs besides the secret: the server's figures at the moment it answered. */
export type StartedState = { emailCodeRequired: boolean; resendIn: number; expiresIn: number; at: number };
let startedState: StartedState | null = null;

export function heldSignup(): HeldSignup | null {
  return memory;
}
export function setStarted(next: { emailCodeRequired: boolean; resendIn: number; expiresIn: number }) {
  startedState = { ...next, at: Date.now() };
}
export function started(): StartedState | null {
  return startedState;
}
