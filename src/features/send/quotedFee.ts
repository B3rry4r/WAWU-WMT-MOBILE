/**
 * What a Hub quote says of its fee (R-139 point 5), and what the app does when it says nothing.
 *
 * A Hub on Nuvion adds `feeMinor`, `vatMinor`, `vatOn`, `totalMinor` and `receiveMinor` to every quote. A Hub on Fintava, or one rolled
 * back, does not. A quote without them is never a dead end: the screens draw it as they did before R-139 (their old rows, from the
 * quote's `parts` or its `fee` breakdown), and a quote with them draws one Fee, VAT only when on, and the Total. Nothing here is a
 * figure of ours: each is a field of the quote.
 */
export type QuotedFields = {
  feeMinor?: number | null;
  vatMinor?: number | null;
  vatOn?: boolean | null;
  totalMinor?: number | null;
  receiveMinor?: number | null;
};

const whole = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

/** True when the quote carries the whole set of fields; a partial set is treated as none, so a screen never mixes the two. */
export function hasQuotedFee<Q extends QuotedFields>(q: Q): q is Q & { feeMinor: number; vatMinor: number; vatOn: boolean; totalMinor: number; receiveMinor: number } {
  return whole(q.feeMinor) && whole(q.vatMinor) && typeof q.vatOn === 'boolean' && whole(q.totalMinor) && whole(q.receiveMinor);
}

/** What leaves the wallet: the quote's `totalMinor` when it says one, else its `totalKobo`. Read this everywhere a total is shown or compared. */
export const totalOf = (q: QuotedFields & { totalKobo: number }): number => (hasQuotedFee(q) ? q.totalMinor : q.totalKobo);

/** What the other person gets: the quote's `receiveMinor` when it says one, else the amount asked for. */
export const receiveOf = (q: QuotedFields & { amountKobo: number }): number => (hasQuotedFee(q) ? q.receiveMinor : q.amountKobo);
