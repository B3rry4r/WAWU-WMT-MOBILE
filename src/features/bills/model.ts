import { formatMoney } from '@/components/Money';

import type { ElectricityBiller } from './api';

/**
 * The meter box asks for a check once the person has stopped typing for this long and has typed at least
 * `METER_CHECK_MIN_DIGITS` digits. Both are the app's own: they only stop a check for every key. The Hub and Fintava decide
 * what a number is (Fintava answers 400 for one it does not know, which is S10).
 */
export const METER_CHECK_DELAY_MS = 600;
export const METER_CHECK_MIN_DIGITS = 5;
/** The Hub takes up to 20 digits. */
export const METER_MAX_DIGITS = 20;
/** Whole naira, up to the ten digits the biggest listed maximum needs. */
export const AMOUNT_MAX_DIGITS = 10;

const KOBO_PER_NAIRA = 100;

/** What a person typed or pasted into the meter box, as digits: "0412 3456 789" is 04123456789. */
export function meterDigits(typed: string): string {
  return typed.replace(/\D/g, '').slice(0, METER_MAX_DIGITS);
}

/** Digits in groups of four, as S4 draws a meter number ("0412 3456 789"). */
export function groupMeter(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** What a person typed or pasted into the amount box, as whole naira with no leading zero. */
export function amountDigits(typed: string): string {
  return typed.replace(/\D/g, '').replace(/^0+/, '').slice(0, AMOUNT_MAX_DIGITS);
}

/** The amount box's words: "₦10,000", or nothing before the first digit. */
export function amountField(digits: string): string {
  return digits === '' ? '' : `₦${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** Whole naira typed, in kobo; null when nothing is typed. */
export function amountKobo(digits: string): number | null {
  return digits === '' ? null : Number(digits) * KOBO_PER_NAIRA;
}

export type AmountProblem = { kind: 'below'; minimumKobo: number } | { kind: 'above'; maximumKobo: number };

/** Whether an amount is within the company's own minimum and maximum, as Fintava lists them. Nothing typed is no problem yet, and no amount. */
export function amountProblem(biller: Pick<ElectricityBiller, 'minimumKobo' | 'maximumKobo'>, kobo: number | null): AmountProblem | null {
  if (kobo === null) return null;
  if (kobo < biller.minimumKobo) return { kind: 'below', minimumKobo: biller.minimumKobo };
  if (kobo > biller.maximumKobo) return { kind: 'above', maximumKobo: biller.maximumKobo };
  return null;
}

/** The words under the amount box when it is outside the company's limits. */
export function amountProblemWords(problem: AmountProblem): string {
  return problem.kind === 'below'
    ? `The least you can pay is ${formatMoney(problem.minimumKobo, { decimals: false })}.`
    : `The most you can pay is ${formatMoney(problem.maximumKobo, { decimals: false })}.`;
}

/** An amount that can be paid: typed, positive and inside the limits. */
export function amountOk(biller: Pick<ElectricityBiller, 'minimumKobo' | 'maximumKobo'>, digits: string): boolean {
  const kobo = amountKobo(digits);
  return kobo !== null && kobo > 0 && amountProblem(biller, kobo) === null;
}

export const planWord = (plan: ElectricityBiller['plan']): string => (plan === 'prepaid' ? 'Prepaid' : 'Postpaid');

/** "Ikeja Electric · Prepaid", the biller chip on S4. */
export const billerChipWords = (biller: Pick<ElectricityBiller, 'name' | 'plan'>): string => `${biller.name} · ${planWord(biller.plan)}`;

/** The badge on S3's rows: the first letters of the first two words ("Ikeja Electric" is IE). */
export function billerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** "Chidinma Okoro · 14 Admiralty Way": the name and the address when Fintava gave them, the name alone, or just that the meter was found. */
export function meterOwnerWords(preview: { name: string | null; address: string | null }): string {
  if (preview.name && preview.address) return `${preview.name} · ${preview.address}`;
  return preview.name ?? preview.address ?? 'Meter found';
}

/** Which presets a typed amount equals, so that chip shows as chosen. */
export const presetChosen = (digits: string, presetKobo: number): boolean => amountKobo(digits) === presetKobo;

/** A preset tapped: its whole-naira digits. */
export const presetDigits = (presetKobo: number): string => String(Math.round(presetKobo / KOBO_PER_NAIRA));

/** What sits under the meter box on S4 (S10 is `not_found`), decided from what has been typed and what the check answered. */
export type MeterLine =
  | { kind: 'none' }
  | { kind: 'checking' }
  | { kind: 'found'; words: string }
  | { kind: 'not_found' }
  | { kind: 'problem'; message: string };

type CheckState = {
  isFetching: boolean;
  isError: boolean;
  error: { code?: string; message: string } | null;
  data: { name: string | null; address: string | null } | undefined;
};

/**
 * The line under the meter box. A check counts only for the digits it was made for: while the person is still typing
 * (`digits` is not yet `settled`) or has typed too few, nothing is said, and an answer for an earlier number is never shown.
 */
export function meterLine(digits: string, settled: string, check: CheckState): MeterLine {
  if (digits.length < METER_CHECK_MIN_DIGITS || digits !== settled) return { kind: 'none' };
  if (check.data) return { kind: 'found', words: meterOwnerWords(check.data) };
  if (check.isError && check.error) {
    return check.error.code === 'meter_not_found' ? { kind: 'not_found' } : { kind: 'problem', message: check.error.message };
  }
  return check.isFetching ? { kind: 'checking' } : { kind: 'none' };
}
