import * as SecureStore from 'expo-secure-store';

import type { BiometricKind } from '@/components/pin-sheet';

/**
 * What the phone keeps for a biometric approval (FIX-108):
 *
 * - the private key, in a secure-store item that only the phone's biometric opens (`requireAuthentication`: Android's
 *   Keystore requires the prompt for every read; on iOS the keychain item is bound to the current biometrics and to this
 *   phone). Reading it IS the fingerprint or face prompt. A change of the enrolled biometrics makes the system drop the
 *   key (a read gives null): the person is on the PIN until they turn the switch on again.
 * - which person and which Hub device it belongs to, in a second item that needs no prompt, so a screen can decide whether
 *   to offer the key without asking for a fingerprint.
 */
const KEY_ITEM = 'wawu.approval.key';
const META_ITEM = 'wawu.approval.device';

export type StoredDevice = {
  /** The account (WAWU ID `sub`) the key was made for: another account on this phone never uses it. */
  owner: string;
  /** The Hub's id for this phone's key (`PUT /money/device` answer); a challenge names it. */
  deviceId: string;
  biometric: BiometricKind;
};

/** True when this phone can keep a key behind a biometric (Android and iOS with a biometric enrolled; never the web). */
export function canKeepKey(): boolean {
  try {
    return SecureStore.canUseBiometricAuthentication() === true;
  } catch {
    return false;
  }
}

/** The key's item, readable only through the prompt. */
function lockedOptions(prompt?: string): SecureStore.SecureStoreOptions {
  return {
    requireAuthentication: true,
    ...(prompt ? { authenticationPrompt: prompt } : {}),
    keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  };
}

export async function writeKey(secretKeyHex: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_ITEM, secretKeyHex, lockedOptions());
}

/** The private key, hex, after the phone's biometric prompt (`prompt` is its text). Null when the system dropped the key. Rejects when the prompt fails or is cancelled. */
export async function readKey(prompt: string): Promise<string | null> {
  const value = await SecureStore.getItemAsync(KEY_ITEM, lockedOptions(prompt));
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** A prompt the person closed, on Android or iOS (expo-secure-store words both the same way). */
export function wasCancelled(error: unknown): boolean {
  const text = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return /cancel/i.test(text);
}

export async function writeDevice(device: StoredDevice): Promise<void> {
  await SecureStore.setItemAsync(META_ITEM, JSON.stringify(device));
}

/** Who and which Hub device the stored key is for, or null when there is none. Never prompts. */
export async function readDevice(): Promise<StoredDevice | null> {
  try {
    const raw = await SecureStore.getItemAsync(META_ITEM);
    if (typeof raw !== 'string') return null;
    const v = JSON.parse(raw) as Partial<StoredDevice> | null;
    const ok = v && typeof v.owner === 'string' && v.owner && typeof v.deviceId === 'string' && v.deviceId && (v.biometric === 'fingerprint' || v.biometric === 'face');
    return ok ? { owner: v.owner as string, deviceId: v.deviceId as string, biometric: v.biometric as BiometricKind } : null;
  } catch {
    return null;
  }
}

/** Drops the key and what names it. Each is tried on its own: one failing never keeps the other. */
export async function clearDevice(): Promise<void> {
  await Promise.allSettled([SecureStore.deleteItemAsync(KEY_ITEM, lockedOptions()), SecureStore.deleteItemAsync(META_ITEM)]);
}
