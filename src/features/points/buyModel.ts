import { formatMoney } from '@/components/Money';

import type { PackView } from './buyApi';

/** The copy of PT4 that is the design's own words (no figure in any of it: every count is the Hub's and every price is the store's). */
export const BUY_WORDS = {
  title: 'Buy points',
  blurb: 'For AI tools.',
  paying: 'Buying...',
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

/** The chip on a pack for a person whose tier adds points to every pack: "Founding +10%" (the tier's first word, the Hub's percent). */
export function bonusChip(tierName: string | null, percent: number): string | null {
  if (percent <= 0) return null;
  const first = tierName?.trim().split(/\s+/)[0];
  return first ? `${first} +${percent}%` : `+${percent}%`;
}

/** The pack to start on: the middle one when there are three or more (the board's), else the first. Never a figure of the design's. */
export const startingPack = (packs: readonly Pick<PackView, 'id'>[]): Pick<PackView, 'id'> | null => (packs.length === 0 ? null : (packs[packs.length >= 3 ? 1 : 0] ?? null));

export const CHANGED_LINE = 'The price changed. Check the new total before you pay.';
export const NOT_READY_LINE = 'We could not get this payment ready. Try again.';
export const SHORT_LINE = 'There is not enough in your wallet for this.';
