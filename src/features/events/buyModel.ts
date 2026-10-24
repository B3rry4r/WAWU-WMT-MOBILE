import { formatMoney } from '@/components/Money';
import type { PayFeeLine } from '@/components/pay-sheet';

import type { TicketType } from './api';
import type { OrderLine, PaymentQuote, WalletOrder } from './buyApi';
import { MAX_TICKETS_PER_ORDER, maxQuantity, quantityOf, watOf, type Basket } from './format';

/** The provider's part of a fee reads "Bank charge" (R-53, DV2-COPY); WAWU's own part keeps its name (R-37). */
export const BANK_CHARGE = 'Bank charge';
export const WAWU_FEE = "WAWU's fee";

/** The wallet the tickets are paid from, as E3 names it. */
export const WALLET_NAME = 'Naira wallet';

export const CONFIRMING_TITLE = 'Paid, still confirming';
export const CONFIRMING_LINE = "Don't pay again. Your ticket shows up in a minute.";
export const FAILED_TITLE = "Your payment didn't go through";
export const OVER_LIMIT_TITLE = 'Over your limit for today';
export const ORDER_LIMIT_TITLE = 'Order limit reached';
export const NO_TOTAL_TITLE = "We couldn't work out the total";
export const NOT_READY_LINE = "We couldn't keep a record of this payment on your phone, so it was not sent. Try again.";
export const PRICE_CHANGED_LINE = 'The price changed. Check the new total before you pay.';

/** The tickets picked, one line per tier, as the Hub's order takes them. A tier at none is left out. */
export function orderLines(tiers: readonly TicketType[], basket: Basket): OrderLine[] {
  return tiers.filter((t) => quantityOf(basket, t.id) > 0).map((t) => ({ ticketTypeId: t.id, quantity: quantityOf(basket, t.id) }));
}

/**
 * The most of this tier the person can add: what is left, and what an order can still hold. The Hub's cap is on the whole
 * order's tickets (BACKEND_GAPS G-273), so what the other tiers already hold comes off it.
 */
export function roomFor(tier: TicketType, basket: Basket): number {
  const others = Object.entries(basket).reduce((sum, [id, n]) => (id === tier.id ? sum : sum + n), 0);
  return Math.max(0, Math.min(maxQuantity(tier), MAX_TICKETS_PER_ORDER - others));
}

/** "1 × Regular", or "1 × Regular, 2 × VIP". */
export const linesText = (lines: readonly Pick<WalletOrder['lines'][number], 'quantity' | 'tierName'>[]) =>
  lines.map((l) => `${l.quantity} × ${l.tierName}`).join(', ');

/** The line under the event's name on the pay sheet: "1 × Regular · Sun 12 Oct". */
export function sheetSubtitle(order: Pick<WalletOrder, 'lines' | 'event'>): string {
  const w = watOf(order.event.startsAt, order.event);
  return `${linesText(order.lines)} · ${w.weekday} ${w.day} ${w.month}`;
}

/** The fee parts as the sheet's rows: the bank's charge, and WAWU's own fee when it has one. */
export function feeLines(fee: PaymentQuote['fee']): PayFeeLine[] {
  const lines: PayFeeLine[] = [{ label: BANK_CHARGE, amountKobo: fee.providerFeeKobo }];
  if (fee.wawuFeeKobo > 0) lines.push({ label: WAWU_FEE, amountKobo: fee.wawuFeeKobo });
  return lines;
}

/** True when the quote's total is the price plus its fee parts (whole kobo), so the button, the PIN line and the payment agree. */
export const quoteAddsUp = (quote: Pick<PaymentQuote, 'priceKobo' | 'fee' | 'totalKobo'>): boolean =>
  quote.priceKobo + quote.fee.providerFeeKobo + quote.fee.wawuFeeKobo === quote.totalKobo;

/** When a quote can no longer be used, as the Hub gave it. A quote with no readable time is treated as spent. */
export function quoteSpent(quote: Pick<PaymentQuote, 'expiresAt'>, now: number): boolean {
  const ends = Date.parse(quote.expiresAt);
  return !Number.isFinite(ends) || ends <= now;
}

/** The sentence the sheet shows when today's limit is the reason the payment cannot go (the quote's own figures; the Hub's check is the authority). */
export function limitLine(quote: Pick<PaymentQuote, 'withinDailyLimit' | 'remainingTodayKobo'>): string | null {
  if (quote.withinDailyLimit) return null;
  if (quote.remainingTodayKobo === null || quote.remainingTodayKobo === undefined) return 'This purchase is over your limit for today.';
  const left = formatMoney(quote.remainingTodayKobo, { decimals: quote.remainingTodayKobo % 100 !== 0 });
  return `This purchase is over your limit for today. You can spend ${left} more today.`;
}

/** The sentence under a failed order: the Hub's own reason, in the words it chose. */
export function failedLine(order: Pick<WalletOrder, 'failureReason'>): string {
  return order.failureReason?.trim() || 'The tickets could not be issued.';
}
