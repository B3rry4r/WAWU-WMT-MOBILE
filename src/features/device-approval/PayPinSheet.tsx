import { PinSheet, type PinSheetProps } from '@/components/pin-sheet';
import { approvalLine } from '@/components/pin-sheet/format';

import { approveRequest } from './approve';
import type { Credential } from './credential';
import { asBiometricResult, asPinResult, type Settled } from './settle';
import { useApprovalKind } from './useDeviceApproval';

/**
 * The PIN sheet of every payment that can be approved by the phone's fingerprint or face (FIX-108 wired the sends, FIX-112 the rest).
 * The screen gives it `run`, its one path for a payment: it sends the request with the credential it is handed (the PIN as typed, or the
 * phone's approval of exactly that request) and answers what became of it. The sheet shows the key only when this account has an
 * approval key on this phone, and the fingerprint or face prompt reads `approval` as its text.
 */
export type PayPinSheetProps = Omit<PinSheetProps, 'onSubmit' | 'biometric'> & { run: (credential: Credential) => Promise<Settled> };

export function PayPinSheet({ run, ...sheet }: PayPinSheetProps) {
  const kind = useApprovalKind();
  const prompt = approvalLine(sheet.approval);
  return (
    <PinSheet
      {...sheet}
      onSubmit={async (pin) => asPinResult(await run({ pin }))}
      biometric={kind ? { kind, onPress: async () => asBiometricResult(await run({ approve: (signed) => approveRequest(signed, prompt) })) } : undefined}
    />
  );
}
