import type { PayFeeLine } from '@/components/pay-sheet';

import { BANK_CHARGE, WAWU_FEE } from './refusal';

/**
 * A fee quote's parts as the lines a breakdown draws (R-10, R-53): the bank's charge, then WAWU's fee. The bank's charge always shows,
 * even at zero, as it is what the provider takes; WAWU's fee shows when there is one. Several parts of one source are added into one line.
 */
export function feeLinesFromParts(parts: readonly { source: 'wawu' | 'provider'; amountKobo: number }[]): PayFeeLine[] {
  const provider = parts.filter((p) => p.source === 'provider').reduce((sum, p) => sum + p.amountKobo, 0);
  const wawu = parts.filter((p) => p.source === 'wawu').reduce((sum, p) => sum + p.amountKobo, 0);
  const lines: PayFeeLine[] = [{ label: BANK_CHARGE, amountKobo: provider }];
  if (wawu > 0) lines.push({ label: WAWU_FEE, amountKobo: wawu });
  return lines;
}
