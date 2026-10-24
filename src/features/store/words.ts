import type { PurchaseResult } from './buy';
import type { Os } from './iap';
import { NOT_OPEN_LINE, PAUSED_LINE, storeUnavailableLine } from './model';

/** How a screen shows what came of a buy: a plain sentence for the real cause, and how loud to be. Nothing here is a price. */
export type Said = { tone: 'neutral' | 'warning' | 'danger'; line: string };

export const STILL_CONFIRMING = 'The store has taken your payment and we are still confirming it. Do not buy again. It is added as soon as we have it: open this screen again in a moment.';

/** The sentence for a result that is not a grant. `subscription` is true for a tier or a pass, which Restore purchases brings back. */
export function said(result: PurchaseResult, os: Os | null, subscription: boolean): Said | null {
  switch (result.kind) {
    case 'granted':
      return null;
    case 'cancelled':
      return { tone: 'neutral', line: 'Cancelled. You were not charged.' };
    case 'store_pending':
      return { tone: 'warning', line: 'Your payment is waiting for the store to finish. It is added as soon as the store confirms it. Do not buy again.' };
    case 'already_owned':
      return {
        tone: 'warning',
        line: subscription ? 'You already have this on your store account. Tap Restore purchases to bring it back.' : 'The store still has an earlier purchase of this to finish. Try again in a moment.',
      };
    case 'network':
      return { tone: 'danger', line: 'We could not reach the store. Check your connection and try again. You were not charged.' };
    case 'store_unavailable':
      return { tone: 'danger', line: storeUnavailableLine(os) };
    case 'item_unavailable':
      return { tone: 'danger', line: 'The store does not have this right now. Please try again later.' };
    case 'not_open':
      return { tone: 'warning', line: result.why === 'disabled' ? PAUSED_LINE : NOT_OPEN_LINE };
    case 'unreachable':
      return { tone: 'warning', line: STILL_CONFIRMING };
    case 'taken':
      return { tone: 'danger', line: 'This purchase is already used on another account.' };
    case 'pass_unavailable':
      return { tone: 'danger', line: result.message };
    case 'unknown_product':
      return { tone: 'danger', line: 'This is not on sale any more. Pick another.' };
    case 'invalid':
      return { tone: 'danger', line: result.message };
    case 'refused':
      return { tone: 'danger', line: result.message };
    case 'failed':
      return { tone: 'danger', line: 'That did not go through. Please try again.' };
  }
}
