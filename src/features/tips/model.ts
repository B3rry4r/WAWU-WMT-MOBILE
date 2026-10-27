import { formatNaira } from '@/components/pay-sheet';

/**
 * What the tip sheet decides, kept apart from the drawing so each rule is tested on its own. Every figure the payer pays is the
 * Hub's quote; nothing here adds a fee or a total.
 */

/**
 * The tip a sheet opens on, in kobo: the sheet's own ₦2,000 (the payment path is unchanged, PRICE-PICKER). The tiles are the Hub's tip list (`GET /prices`, R-101); when
 * the admin's list lacks this one, the sheet opens on the list's nearest tip.
 */
export const DEFAULT_TIP_KOBO = 200_000;

/** The message that goes with a tip: 500 characters at most (the contract's `TipWalletDto.note`). */
export const NOTE_MAX = 500;

/** The wallet the tip is paid from, as H26 names it. */
export const WALLET_NAME = 'Naira wallet';

/** "Tife Adeola" gives "Tife": the board's "Tip Tife". */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? '';
}

/** H26's title: "Tip Tife"; "Tip this creator" when the person has no name to show. */
export const tipTitle = (name: string | null | undefined): string => (firstName(name) ? `Tip ${firstName(name)}` : 'Tip this creator');

/** H28's heading: "₦2,000 sent to Tife". The amount is the tip, not the total paid. */
export const sentHeading = (amountKobo: number, name: string | null | undefined): string =>
  firstName(name) ? `${formatNaira(amountKobo)} sent to ${firstName(name)}` : `${formatNaira(amountKobo)} sent`;

/** The note as H28 echoes it, or null when none was written. */
export const noteEcho = (note: string | null | undefined): string | null => (note?.trim() ? note.trim() : null);

export const NOTICE_NO_AMOUNT = 'Choose an amount to tip.';

/** The line under a tile's price: "Chidi gets", or "They get" when the creator has no name to show. */
export const getsWords = (name: string | null | undefined): string => (firstName(name) ? `${firstName(name)} gets` : 'They get');
