import { formatNaira } from '@/components/pay-sheet';

/**
 * What the tip sheet decides, kept apart from the drawing so each rule is tested on its own. Every figure the payer pays is the
 * Hub's quote; nothing here adds a fee or a total.
 */

/**
 * H26's four quick amounts, in kobo, and the one that is chosen when the sheet opens. The Hub serves no tip presets (BACKEND_GAPS
 * G-1721), so they are the board's own, as R-53 keeps W9's for a send: they are suggestions the payer taps, never a price or a
 * rule, and any other whole-naira amount can be typed.
 * PROVISIONAL(TIP-QUICK-AMOUNTS, owner=HOME-13, why=H26 draws them and the Hub serves none; R-53 keeps the send's the same way)
 */
export const QUICK_AMOUNTS_KOBO = [50_000, 100_000, 200_000, 500_000] as const;
export const DEFAULT_QUICK_KOBO = 200_000;

/** The message that goes with a tip: 500 characters at most (the contract's `TipWalletDto.note`). */
export const NOTE_MAX = 500;

/** The wallet the tip is paid from, as H26 names it. */
export const WALLET_NAME = 'Naira wallet';

/** The most digits a typed amount takes: 10 digits is more naira than the Hub's own ceiling, which it checks and answers in words. */
const MAX_DIGITS = 10;

/**
 * What a person typed or pasted in "Other amount", as whole-naira digits only. The field is a number pad, so the only way a "." gets in
 * is a paste, and a tip takes no kobo: everything from the first "." on is dropped, so "12.50" and "12.5" are 12 (never 1250 or 125) and
 * "0.99" is nothing to send. A comma or a space is a thousands separator and is ignored, as before: "1,250" is 1250.
 */
export function cleanAmountText(text: string): string {
  const wholeNaira = text.split('.')[0] ?? '';
  return wholeNaira.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_DIGITS);
}

/** The typed amount in kobo, or null when nothing usable is typed. A tip is a whole number of naira (the Hub's quote takes no kobo). */
export function koboOfTyped(text: string): number | null {
  const digits = cleanAmountText(text);
  if (!digits) return null;
  const naira = Number(digits);
  return Number.isSafeInteger(naira) && naira > 0 ? naira * 100 : null;
}

/** The amount on the sheet: a typed one wins; else the chosen quick amount; else none. */
export function amountOf(chosenKobo: number | null, typed: string): number | null {
  return typed.trim() ? koboOfTyped(typed) : chosenKobo;
}

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
