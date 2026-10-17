import { formatMoney } from '@/components/Money';

/**
 * Naira arithmetic for the pay sheet. Every amount is an integer number of
 * kobo (100 kobo = ₦1). Nothing here rounds or multiplies by a fraction:
 * totals and shortfalls are integer sums and differences. Display goes
 * through the shared `Money` component and its `formatMoney`.
 */

export type PayFeeLine = {
  /** What the charge is, as the user reads it ("Bank charge", "WAWU's fee"). */
  label: string;
  /** Integer kobo. Zero is valid and is shown as ₦0. */
  amountKobo: number;
};

export function assertKobo(kobo: number, what: string): void {
  if (!Number.isSafeInteger(kobo) || kobo < 0) {
    throw new RangeError(`${what} must be a whole, non-negative number of kobo (got ${kobo})`);
  }
}

/** What the payer pays: the amount plus every fee line, in kobo. */
export function payTotalKobo(amountKobo: number, fees: readonly PayFeeLine[]): number {
  assertKobo(amountKobo, 'amount');
  let total = amountKobo;
  for (const fee of fees) {
    assertKobo(fee.amountKobo, `fee "${fee.label}"`);
    total += fee.amountKobo;
  }
  assertKobo(total, 'total');
  return total;
}

/** Every fee line added together (the "Fees" row when there are two or more parts). */
export function feesTotalKobo(fees: readonly PayFeeLine[]): number {
  return payTotalKobo(0, fees);
}

/** How much more the wallet needs to cover the total. Zero when it already does. */
export function shortfallKobo(totalKobo: number, balanceKobo: number): number {
  assertKobo(totalKobo, 'total');
  assertKobo(balanceKobo, 'balance');
  return totalKobo > balanceKobo ? totalKobo - balanceKobo : 0;
}

/**
 * "₦2,523.25", for copy and button labels; on-screen figures use `Money`.
 * With `decimals: 'auto'` (prices, fees, totals, buttons) a whole amount drops
 * its ".00" ("₦2,500", "₦0"), as the canvas draws prices; a part-naira amount
 * keeps its kobo. `'always'` keeps two decimals, as the canvas draws balances.
 */
export function formatNaira(kobo: number, decimals: 'auto' | 'always' = 'auto'): string {
  assertKobo(kobo, 'amount');
  return formatMoney(kobo, { decimals: decimals === 'always' || kobo % 100 !== 0 });
}
