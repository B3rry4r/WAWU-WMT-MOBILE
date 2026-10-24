import { useCallback, useEffect, useState } from 'react';

import { detectBiometric, type BiometricKind } from '@/components/pin-sheet';

import { canApproveHere, usableKind } from './approve';

/**
 * The biometric a payment sheet may offer: the kind this account's stored key was made for, or null when there is no key to use
 * (not turned on at W35, another account's, dropped by the system, or switched off at the Hub). Read once when the screen opens.
 */
export function useApprovalKind(): BiometricKind | null {
  const [kind, setKind] = useState<BiometricKind | null>(null);
  useEffect(() => {
    let current = true;
    void usableKind().then(
      (found) => {
        if (current) setKind(found);
      },
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, []);
  return kind;
}

/**
 * W35's view of the switch: what this phone can approve with (null: draw no row), and whether it is on. `reload` reads both again
 * after a change; so does a new `refreshKey` (W35 passes the time its wallet read last came in, so a PIN reset, which turns the
 * phone off at the Hub, is seen when the screen is shown again).
 */
export function useApprovalSwitch(refreshKey?: unknown): { support: BiometricKind | null; on: boolean; loaded: boolean; reload: () => void } {
  const [state, setState] = useState<{ support: BiometricKind | null; on: boolean; loaded: boolean }>({ support: null, on: false, loaded: false });
  const [round, setRound] = useState(0);
  useEffect(() => {
    let current = true;
    void (async () => {
      const support = canApproveHere() ? await detectBiometric() : null;
      const registered = support === null ? null : await usableKind();
      if (current) setState({ support, on: registered !== null, loaded: true });
    })().catch(() => {
      if (current) setState({ support: null, on: false, loaded: true });
    });
    return () => {
      current = false;
    };
  }, [round, refreshKey]);
  const reload = useCallback(() => setRound((n) => n + 1), []);
  return { ...state, reload };
}
