import { useState } from 'react';

import { BottomSheet } from '@/components/BottomSheet';

import { PinEntry } from './PinEntry';
import type { PinSheetProps } from './types';

/**
 * The transaction PIN sheet (W11). Every payment opens this same sheet: send
 * (W11), unlock (H15), the professional tick (M13), tickets, school fees.
 *
 * It shows what the server answers and never decides anything itself. See
 * `PinSheetProps` for the contract. The frame, motion and dismissal are the
 * shared `BottomSheet` (UI-02).
 */
export function PinSheet({ visible, onClose, ...entry }: PinSheetProps) {
  // While a PIN is being checked the payment is in flight: the sheet stays
  // open so the person sees how it ended.
  const [busy, setBusy] = useState(false);

  return (
    <BottomSheet visible={visible} onClose={onClose} label="Enter your PIN" dismissible={!busy}>
      <PinEntry {...entry} onBusyChange={setBusy} />
    </BottomSheet>
  );
}
