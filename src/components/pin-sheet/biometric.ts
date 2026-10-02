import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { IconName } from '@/components/icon';

import type { BiometricKind } from './types';

/*
 * Which biometric this phone can approve a payment with (owner, 2 Oct 2026):
 * whatever the phone has, not only Face ID. Android phones mostly have a
 * fingerprint reader.
 *
 * - no hardware, or nothing enrolled: no biometric key at all;
 * - a fingerprint reader: fingerprint;
 * - face only: face (Face ID on iOS, face unlock on Android);
 * - both: fingerprint on Android, face on iOS.
 */
export async function detectBiometric(os: string = Platform.OS): Promise<BiometricKind | null> {
  try {
    const [hardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    if (!hardware || !enrolled) return null;
    const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    if (finger && face) return os === 'android' ? 'fingerprint' : 'face';
    if (finger) return 'fingerprint';
    if (face) return 'face';
    return null;
  } catch {
    return null;
  }
}

/** The detected kind; `null` until known and when there is none. A `known` kind skips detection. */
export function useBiometricKind(enabled: boolean, known?: BiometricKind): BiometricKind | null {
  const [detected, setDetected] = useState<BiometricKind | null>(null);
  useEffect(() => {
    if (!enabled || known) return;
    let live = true;
    detectBiometric().then((kind) => {
      if (live) setDetected(kind);
    });
    return () => {
      live = false;
    };
  }, [enabled, known]);
  if (!enabled) return null;
  return known ?? detected;
}

type BiometricLook = {
  icon: IconName;
  /** The key's label for screen readers. */
  label: string;
  /** The name in "<Name> failed. Use your PIN." */
  name: string;
};

/** The key's icon and words for a kind, on this platform. */
export function biometricLook(kind: BiometricKind, os: string = Platform.OS): BiometricLook {
  if (kind === 'fingerprint') return { icon: 'Fingerprint', label: 'Use fingerprint', name: 'Fingerprint' };
  if (os === 'ios') return { icon: 'ScanFace', label: 'Use Face ID', name: 'Face ID' };
  return { icon: 'ScanFace', label: 'Use face unlock', name: 'Face unlock' };
}

/** The owner's failure line (2 Oct 2026): "Fingerprint failed. Use your PIN." */
export function biometricFailedLine(kind: BiometricKind, os: string = Platform.OS): string {
  return `${biometricLook(kind, os).name} failed. Use your PIN.`;
}
