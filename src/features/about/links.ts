import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

/** The app's version, from the app config (`app.json`), never typed in a screen. Null when the build carries none. */
export function appVersion(): string | null {
  const version = Constants.expoConfig?.version;
  return typeof version === 'string' && version.trim() !== '' ? version.trim() : null;
}

/** The address a person writes to. Only an address that looks like one is used. */
export function mailtoUrl(email: string | null | undefined): string | null {
  const address = email?.trim();
  return address && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? `mailto:${address}` : null;
}

/**
 * Where "Rate the app" goes: the app's own page on Google Play, built from the
 * package id in the app config. Null where there is no store page to send a person to
 * (an iPhone, until the App Store id is known; BACKEND_GAPS.md G-142).
 */
export function rateUrl(): string | null {
  if (Platform.OS === 'ios') return null;
  const id = Constants.expoConfig?.android?.package;
  return id ? `https://play.google.com/store/apps/details?id=${encodeURIComponent(id)}` : null;
}

/** Opens a link the app built itself. Resolves false when nothing on the phone can open it. */
export async function openLink(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
