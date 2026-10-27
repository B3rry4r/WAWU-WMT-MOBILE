import { formatMoney } from '@/components/Money';
import { formatPoints } from '@/components/PointsFigure';

import type { PackPurchase, PackQuote, PackView } from './buyApi';

/** The copy of PT4 that is the design's own words (no figure in any of it: every figure is the Hub's). */
export const BUY_WORDS = {
  title: 'Buy points',
  blurb: 'For AI tools.',
  payWith: 'Pay with',
  wallet: 'Who Made This? wallet',
  transfer: 'Bank transfer',
  transferSub: 'From any bank',
  paying: 'Paying...',
  done: 'Done',
} as const;

/** "₦2,500", or "₦2,523.25" when kobo are in it: money is whole kobo on the wire, never a float. */
export const naira = (kobo: number): string => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

/** How long bought points last, from the Hub's own days: "12 months" for a year's worth, else the days. */
export function lastsText(days: number): string {
  const months = Math.round(days / 30.4375);
  if (months >= 2 && Math.abs(months * 30.4375 - days) < 6) return `${months} months`;
  return days === 1 ? '1 day' : `${days} days`;
}

/** The line under PT4's title: "For AI tools. Points you buy never expire." Bought points never end (R-101 point 7), so it needs no quote. */
export const blurbFor = (): string => `${BUY_WORDS.blurb} Points you buy never expire.`;

/** The chip on a pack for a person whose tier adds points to every pack: "Founding +10%" (the tier's first word, the Hub's percent). */
export function bonusChip(tierName: string | null, percent: number): string | null {
  if (percent <= 0) return null;
  const first = tierName?.trim().split(/\s+/)[0];
  return first ? `${first} +${percent}%` : `+${percent}%`;
}

/** The pack to start on: the middle one when there are three or more (the board's), else the first. Never a figure of the design's. */
export const startingPack = (packs: readonly PackView[]): PackView | null => (packs.length === 0 ? null : (packs[packs.length >= 3 ? 1 : 0] ?? null));

/** What the pay button says: the total the payer pays, the Bank charge included (BRIEF rule 5). */
export const payLabel = (totalKobo: number): string => `Pay ${naira(totalKobo)}`;

/** "₦2,500 + ₦23.25 Bank charge": the parts of the total, so every part is visible before the person pays (BRIEF rule 3, R-53). */
export function feeLine(quote: Pick<PackQuote, 'payment'>): string {
  const p = quote.payment;
  return `${naira(p.priceKobo)} + ${naira(p.fee.totalFeeKobo)} Bank charge`;
}

/** The PIN sheet's line: "Approve ₦2,523.25 for buying 2,750 points". */
export const pinPurpose = (quote: Pick<PackQuote, 'totalPoints'>): string => `buying ${formatPoints(quote.totalPoints)}`;

/** When the figures the person was shown are not the figures the Hub has now. */
export function quoteMoved(a: PackQuote, b: PackQuote): boolean {
  return a.payment.totalKobo !== b.payment.totalKobo || a.totalPoints !== b.totalPoints || a.packMinor !== b.packMinor;
}

export const CHANGED_LINE = 'The price changed. Check the new total before you pay.';
export const NOT_READY_LINE = 'We could not get this payment ready. Try again.';
export const SHORT_LINE = 'There is not enough in your wallet for this.';

/** The words for a purchase that did not go through: the Hub's own sentence when it sent one. Nothing is promised about the money. */
export const failedLine = (p: Pick<PackPurchase, 'statusMessage' | 'status'>): string =>
  p.statusMessage?.trim() || (p.status === 'expired' ? 'The bank transfer did not arrive in time.' : 'This purchase did not go through.');
