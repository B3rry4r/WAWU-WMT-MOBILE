import * as SecureStore from 'expo-secure-store';
import { Appearance, Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

/**
 * Z2's Theme and Sound rows are choices about this phone, not about the account, so they are
 * kept on the phone and never sent anywhere: Theme is System, Light or Dark, and Sound is the
 * "Taps and alerts" switch. The browser build used for development keeps them in localStorage.
 * Nothing here is a secret; the secure store is simply the one store the app already ships.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

export const THEME_CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark'];
export const THEME_LABEL: Record<ThemeChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' };

export type DevicePrefs = { theme: ThemeChoice; sound: boolean };

/** Nobody has chosen yet: follow the phone, and sound off as Z2 draws it. */
export const DEFAULT_PREFS: DevicePrefs = { theme: 'system', sound: false };

export const THEME_KEY = 'wmt.pref.theme';
export const SOUND_KEY = 'wmt.pref.sound';

const onWeb = Platform.OS === 'web';

async function read(key: string): Promise<string | null> {
  if (onWeb) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
  if (onWeb) return globalThis.localStorage?.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** What the phone remembers, falling back to the defaults for anything unset or unreadable. */
export async function loadPrefs(): Promise<DevicePrefs> {
  try {
    const [theme, sound] = await Promise.all([read(THEME_KEY), read(SOUND_KEY)]);
    return { theme: isThemeChoice(theme) ? theme : DEFAULT_PREFS.theme, sound: sound === 'on' };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Makes the app follow `choice`: `light` or `dark` pins it, `system` hands it back to the phone.
 * The browser build cannot pin a scheme, so there it does nothing.
 */
export function applyTheme(choice: ThemeChoice): void {
  if (typeof Appearance.setColorScheme !== 'function') return;
  Appearance.setColorScheme(choice === 'system' ? 'unspecified' : choice);
}

/** Reads the saved theme and applies it. Called once when the app starts (SHARED-CHANGES.md, SETTINGS-01 #3). */
export async function applyStoredTheme(): Promise<void> {
  applyTheme((await loadPrefs()).theme);
}

let current: DevicePrefs = DEFAULT_PREFS;
let loaded: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: DevicePrefs) {
  current = next;
  listeners.forEach((listener) => listener());
}

/** Reads the saved choices once; later calls share the first read. */
export function ensurePrefs(): Promise<void> {
  loaded ??= loadPrefs().then((prefs) => {
    publish(prefs);
  });
  return loaded;
}

export async function setTheme(choice: ThemeChoice): Promise<void> {
  publish({ ...current, theme: choice });
  applyTheme(choice);
  await write(THEME_KEY, choice);
}

export async function setSound(on: boolean): Promise<void> {
  publish({ ...current, sound: on });
  await write(SOUND_KEY, on ? 'on' : 'off');
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The saved choices for a screen, and what to call to change them. */
export function useDevicePrefs() {
  const prefs = useSyncExternalStore(subscribe, () => current, () => current);
  return { prefs, setTheme, setSound, ensurePrefs };
}

/** Forgets what was read. Tests only. */
export function resetPrefsForTests() {
  current = DEFAULT_PREFS;
  loaded = null;
}
