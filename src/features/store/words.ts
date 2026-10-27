import type { PurchaseResult } from './buy';
import type { Os } from './iap';
import { NOT_OPEN_LINE, PAUSED_LINE, storeUnavailableLine } from './model';

/** How a screen shows what came of a buy: a plain sentence for the real cause, and how loud to be. Nothing here is a price. */
export type Said = { tone: 'neutral' | 'warning' | 'danger'; line: string };

export const STILL_CONFIRMING = 'The store has taken your payment and we are still confirming it. Do not buy again. It is added as soon as we have it: open this screen again in a moment.';

export const GRANT_FAILED = 'The store has your payment and we could not finish adding it yet. It is safe: open this screen again in a moment and we will finish it. Do not buy again.';

export const CREDITED_LINE = 'This purchase could not be finished in time. You have a store credit to use on Who Made This.';

/**
 * What a refused intent is told as (R-101). The Hub's own sentence leads where it names the cause (a piece that is free, a creator who is
 * not taking questions, one question already waiting); the app's words stand in when it sent none, and for the codes the app knows by heart.
 * Nothing was charged on any of these: the store sheet had not opened.
 */
export function intentRefusal(code: string, message: string): string {
  switch (code) {
    case 'price_not_on_list':
      return 'That price is not on the list any more. Pick a price from the list and try again.';
    case 'store_intent_price_changed':
      return 'The price changed. Check the new price, then try again. You were not charged.';
    case 'store_intent_target_not_found':
      return 'This is not available any more. You were not charged.';
    case 'store_product_unknown':
      return 'This price is not on sale in the store. You were not charged.';
    case 'store_credit_insufficient':
    case 'store_credit_unavailable':
      return 'That credit can not pay for this. Pay in the store instead.';
    case 'store_intent_not_payable':
      return message || 'This can not be bought right now. You were not charged.';
    default:
      return message || 'This could not be started. You were not charged.';
  }
}

/** The sentence for a result that is not a grant. `subscription` is true for a tier, which Restore purchases brings back. */
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
      return { tone: 'danger', line: 'Another WAWU account already uses this store purchase or subscription. Sign in to that account, or cancel it in the store.' };
    case 'room_mismatch':
      return { tone: 'danger', line: 'That payment was already used for a different room. To join this one, buy its pass again.' };
    case 'earlier_room':
      return { tone: 'warning', line: 'A payment you made earlier for another room was still waiting, and it has now been added to that room. Tap Buy to get a pass for this one.' };
    case 'update_app':
      return { tone: 'danger', line: 'This version of the app can not take this purchase. Update the app, then try again.' };
    case 'grant_failed':
      return { tone: 'warning', line: GRANT_FAILED };
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
    case 'credited':
      return { tone: 'warning', line: result.purchase.credit?.message || CREDITED_LINE };
    case 'intent_refused':
      return { tone: 'danger', line: intentRefusal(result.code, result.message) };
    case 'not_started':
      return { tone: 'danger', line: 'We could not start this. Check your connection and try again. You were not charged.' };
    case 'earlier_purchase':
      return { tone: 'warning', line: 'A payment you made earlier was still waiting, and it has now been finished. Tap to buy this one.' };
  }
}
