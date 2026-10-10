import { formatMoney } from '@/components/Money';

import { billsCodes, type ElectricityBiller } from './api';

/**
 * The meter box asks for a check once the person has stopped typing for `METER_CHECK_DELAY_MS` and has typed at least
 * `METER_CHECK_MIN_DIGITS` digits; fewer digits show nothing at all (no "Checking", no red sentence). Both are the app's own:
 * they only stop a check for every key and a "not found" flashing while someone is still typing. The Hub and Fintava decide
 * what a number is.
 * PROVISIONAL(BILLS-METER-MIN-DIGITS, owner=YOU, why=meter numbers are 11 or 13 digits and Fintava gives no shortest so ten is a guess that no real meter is shorter than).
 */
export const METER_CHECK_DELAY_MS = 600;
export const METER_CHECK_MIN_DIGITS = 10;
/** The Hub takes up to 20 digits. */
export const METER_MAX_DIGITS = 20;
/** Whole naira, up to the ten digits the biggest listed maximum needs. */
export const AMOUNT_MAX_DIGITS = 10;
/** Kobo digits after the decimal point. */
export const AMOUNT_KOBO_DIGITS = 2;
/** The naira sign. Alan Sans has no ₦ (R-35), so the phone's own face draws it, beside the digits, never inside them. */
export const NAIRA_SIGN = '₦';

const KOBO_PER_NAIRA = 100;

/** What a person typed or pasted into the meter box, as digits: "0412 3456 789" is 04123456789. */
export function meterDigits(typed: string): string {
  return typed.replace(/\D/g, '').slice(0, METER_MAX_DIGITS);
}

/** Digits in groups of four, as S4 draws a meter number ("0412 3456 789"). */
export function groupMeter(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * What the amount box holds after the person typed or pasted `typed` into a box that held `previous`: naira with commas, at
 * most one decimal point and at most two kobo digits ("1,500.50" is ₦1,500.50, "10,000.00" is ₦10,000). The held text is
 * plain: digits, and a point once there is one ("1500.50", "1500.", "0.5").
 *
 * Anything that is not a digit or a point is ignored (the commas it draws, a ₦, a stray letter). What the rule does not take
 * is not cut to fit: a second point, a third kobo digit or an eleventh naira digit leaves the box as it was, so nothing the
 * person typed or pasted is ever floored, rounded or shortened into a different amount (D1: a point read as digits made
 * "10,000.00" a million).
 */
export function takeAmount(typed: string, previous: string): string {
  const plain = typed.replace(/[^\d.]/g, '');
  const parts = plain.split('.');
  if (parts.length > 2) return previous;
  const [naira, kobo] = parts;
  if (naira.length > AMOUNT_MAX_DIGITS || (kobo !== undefined && kobo.length > AMOUNT_KOBO_DIGITS)) return previous;
  const whole = naira.replace(/^0+/, '');
  if (kobo === undefined) return whole;
  return `${whole === '' ? '0' : whole}.${kobo}`;
}

/** The amount box's words: the naira with commas and the kobo as typed ("1,500.50"), or nothing before the first digit. The ₦ is drawn beside it. */
export function amountBoxText(text: string): string {
  const [naira, kobo] = text.split('.');
  const grouped = naira.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return kobo === undefined ? grouped : `${grouped}.${kobo}`;
}

/** The typed amount in kobo, whole: the naira times 100 plus the kobo as typed ("1500.5" is 150050); null when nothing is typed. */
export function amountKobo(text: string): number | null {
  if (text === '') return null;
  const [naira, kobo = ''] = text.split('.');
  return Number(naira === '' ? '0' : naira) * KOBO_PER_NAIRA + Number(kobo.padEnd(AMOUNT_KOBO_DIGITS, '0'));
}

export type AmountProblem = { kind: 'below'; minimumKobo: number } | { kind: 'above'; maximumKobo: number };

/** Whether an amount is within the company's own minimum and maximum, as Fintava lists them. Nothing typed is no problem yet, and no amount. */
export function amountProblem(biller: Pick<ElectricityBiller, 'minimumKobo' | 'maximumKobo'>, kobo: number | null): AmountProblem | null {
  if (kobo === null) return null;
  if (kobo < biller.minimumKobo) return { kind: 'below', minimumKobo: biller.minimumKobo };
  if (kobo > biller.maximumKobo) return { kind: 'above', maximumKobo: biller.maximumKobo };
  return null;
}

/** A company's limit as words: whole naira when it is whole ("₦1,000"), with its kobo when it has some ("₦1,000.50"), never rounded to the naira. */
const limitMoney = (kobo: number): string => formatMoney(kobo, { decimals: kobo % KOBO_PER_NAIRA !== 0 });

/** The words under the amount box when it is outside the company's limits. */
export function amountProblemWords(problem: AmountProblem): string {
  return problem.kind === 'below'
    ? `The least you can pay is ${limitMoney(problem.minimumKobo)}.`
    : `The most you can pay is ${limitMoney(problem.maximumKobo)}.`;
}

/** An amount that can be paid: typed, positive and inside the limits. */
export function amountOk(biller: Pick<ElectricityBiller, 'minimumKobo' | 'maximumKobo'>, text: string): boolean {
  const kobo = amountKobo(text);
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

/**
 * "Chidinma Okoro · 14 Admiralty Way": the name, and the address when Fintava gave one. A meter is found only with a name
 * (the Hub answers nothing else as found), so there are no words for a found meter that names no one (D2).
 */
export function meterOwnerWords(preview: { name: string; address: string | null }): string {
  return preview.address ? `${preview.name} · ${preview.address}` : preview.name;
}

/** Which presets a typed amount equals, so that chip shows as chosen. */
export const presetChosen = (text: string, presetKobo: number): boolean => amountKobo(text) === presetKobo;

/** A preset tapped: what the amount box then holds. The Hub's quick amounts are whole naira (its config refuses any other). */
export const presetText = (presetKobo: number): string => takeAmount(String(Math.floor(presetKobo / KOBO_PER_NAIRA)), '');

/** What sits under the meter box on S4 (S10 is `not_found`), decided from what has been typed and what the check answered. */
export type MeterLine =
  | { kind: 'none' }
  | { kind: 'checking' }
  | { kind: 'found'; words: string }
  | { kind: 'not_found' }
  /** The Hub got an answer it could not use: the meter is neither found nor refused. Try again. */
  | { kind: 'unconfirmed' }
  | { kind: 'problem'; message: string };

type CheckState = {
  isFetching: boolean;
  isError: boolean;
  error: { code?: string; message: string } | null;
  data: { name: string; address: string | null } | undefined;
};

/**
 * The line under the meter box. A check counts only for the digits it was made for: while the person is still typing
 * (`digits` is not yet `settled`) or has typed too few, nothing is said, and an answer for an earlier number is never shown.
 */
export function meterLine(digits: string, settled: string, check: CheckState): MeterLine {
  if (digits.length < METER_CHECK_MIN_DIGITS || digits !== settled) return { kind: 'none' };
  if (check.data) return { kind: 'found', words: meterOwnerWords(check.data) };
  if (check.isError && check.error) {
    if (check.error.code === billsCodes.meterNotFound) return { kind: 'not_found' };
    if (check.error.code === billsCodes.meterUnconfirmed) return { kind: 'unconfirmed' };
    return { kind: 'problem', message: check.error.message };
  }
  return check.isFetching ? { kind: 'checking' } : { kind: 'none' };
}
