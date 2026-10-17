import { formatMoney } from '@/components/Money';
import type { PayFeeLine } from '@/components/pay-sheet';
import { BANK_CHARGE, WAWU_FEE } from '@/features/money-attempt/refusal';

import type { CreditPack, PackId, PackQuote } from './api';

/** The word on I28's title. The instrument's name stays "WAWU Credits" (R-37, "where WAWU stays"). */
export const SHEET_TITLE = 'Buy WAWU Credits';
/**
 * I28's line. The 16 Oct board also says what each kind of message costs ("A photo is 1 credit, a video or voice note 3") and that text is
 * free; the Hub charges one credit for any message until INBOX-22 serves the costs by kind (R-47, R-62), so only what is always true is said.
 */
export const SHEET_LINE = 'Credits don’t expire and can’t be cashed out.';
/** I27's words. The 16 Oct board says "Text and emoji stay free ... photos, video and voice notes"; today the Hub charges every message (INBOX-22). */
export const OUT_TITLE = 'You’re out of credits';
export const OUT_LINE = 'Reading stays free. Buy credits to send messages here.';

export const PRICE_CHANGED_LINE = 'The price changed. Check the new total before you buy.';
export const STILL_CONFIRMING_LINE = 'We’re still confirming this purchase. Don’t buy again. Your credits show here when it is done.';

/** "50", "1,250": a count, never naira. */
export const creditCount = (credits: number): string => String(Math.max(0, Math.floor(credits))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** "Popular", "Best value": the Hub's badge, in the board's words. */
export function badgeWords(badge: CreditPack['badge']): string | null {
  if (badge === 'popular') return 'Popular';
  if (badge === 'best_value') return 'Best value';
  return null;
}

/** The pack drawn selected when the sheet opens: the one the Hub marks popular, else the first on sale. */
export function defaultPack(packs: readonly CreditPack[]): PackId | null {
  return (packs.find((pack) => pack.badge === 'popular') ?? packs[0])?.pack ?? null;
}

/** I28's breakdown from the quote: the bank's charge, WAWU's fee only when there is one, then the total. Every figure is the Hub's. */
export function breakdownOf(quote: Pick<PackQuote['payment'], 'fee'>): PayFeeLine[] {
  const lines: PayFeeLine[] = [{ label: BANK_CHARGE, amountKobo: quote.fee.providerFeeKobo }];
  if (quote.fee.wawuFeeKobo > 0) lines.push({ label: WAWU_FEE, amountKobo: quote.fee.wawuFeeKobo });
  return lines;
}

/** True when the quote's total is the price plus its fees (whole kobo), so the button, the PIN line and the purchase agree. */
export function quoteAddsUp(payment: Pick<PackQuote['payment'], 'priceKobo' | 'fee' | 'totalKobo'>): boolean {
  return payment.priceKobo + payment.fee.providerFeeKobo + payment.fee.wawuFeeKobo === payment.totalKobo;
}

/** When a quote can no longer be used, as the Hub gave it. A quote with no readable time is treated as spent. */
export function quoteSpent(quote: Pick<PackQuote['payment'], 'expiresAt'>, now: number): boolean {
  const at = Date.parse(quote.expiresAt);
  return Number.isNaN(at) || at <= now;
}

/** "Buy 120 credits · ₦1,023.25": the total, fees included (rule 5). */
export function buyLabel(credits: number, totalKobo: number): string {
  return `Buy ${creditCount(credits)} credits · ${formatMoney(totalKobo, { decimals: totalKobo % 100 !== 0 })}`;
}

/** I29's line: what was paid, from the wallet, and what the person has now. The total is the Hub's, fees included (BRIEF I29). */
export function addedLine(totalKobo: number, balance: number | null): string {
  const paid = `Paid ${formatMoney(totalKobo, { decimals: totalKobo % 100 !== 0 })} from your Naira wallet.`;
  return balance === null ? paid : `${paid} You have ${creditCount(balance)} ${balance === 1 ? 'credit' : 'credits'}.`;
}
