/**
 * Naira arithmetic for the pay sheet. Every amount is an integer number of
 * kobo (100 kobo = ₦1). Nothing here divides, multiplies by a fraction or
 * rounds: totals and shortfalls are integer sums and differences, and the
 * display splits naira from kobo with an exact integer remainder.
 */

export type PayFeeLine = {
  /** What the charge is, as the user reads it ("Fintava's charge", "WAWU's fee"). */
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

/** How much more the wallet needs to cover the total. Zero when it already does. */
export function shortfallKobo(totalKobo: number, balanceKobo: number): number {
  assertKobo(totalKobo, 'total');
  assertKobo(balanceKobo, 'balance');
  return totalKobo > balanceKobo ? totalKobo - balanceKobo : 0;
}

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** "₦2,523" and "25" for 252325 kobo. Integer remainder only, no float division. */
export function nairaParts(kobo: number): { naira: string; kobo: string } {
  assertKobo(kobo, 'amount');
  const rest = kobo % 100;
  const whole = (kobo - rest) / 100;
  return { naira: `₦${group(String(whole))}`, kobo: String(rest).padStart(2, '0') };
}

/**
 * "₦2,523.25". With `decimals: 'auto'` (prices, fees, totals, buttons) a whole
 * amount drops its ".00" ("₦2,500", "₦0"), as the canvas draws prices.
 * `'always'` keeps two decimals, as the canvas draws wallet balances.
 */
export function formatNaira(kobo: number, decimals: 'auto' | 'always' = 'auto'): string {
  const parts = nairaParts(kobo);
  if (decimals === 'auto' && parts.kobo === '00') return parts.naira;
  return `${parts.naira}.${parts.kobo}`;
}
