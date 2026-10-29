import { ApiError } from '@/api/errors';
import { formatMoney } from '@/components/Money';

/**
 * The meter box asks for a check once the person has stopped typing for `METER_CHECK_DELAY_MS` and has typed at least
 * `METER_CHECK_MIN_DIGITS` digits; fewer digits show nothing at all (no "Checking", no red sentence). Both are the app's own:
 * they only stop a check for every key and a "not found" flashing while someone is still typing. The Hub and the provider decide
 * what a number is.
 * PROVISIONAL(BILLS-METER-MIN-DIGITS, owner=YOU, why=meter numbers are 11 or 13 digits and the provider gives no shortest so ten is a guess that no real meter is shorter than).
 */
export const METER_CHECK_DELAY_MS = 600;
export const METER_CHECK_MIN_DIGITS = 10;
/** The Hub takes up to 20 digits. */
export const METER_MAX_DIGITS = 20;
/** A Nigerian phone number is eleven digits ("0803 123 4412"): a check before then is for a number still being typed. */
export const PHONE_CHECK_MIN_DIGITS = 11;
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

/** What a person typed or pasted into the phone box, as digits: "0803 123 4412" is 08031234412, at most eleven. */
export function phoneDigits(typed: string): string {
  return typed.replace(/\D/g, '').slice(0, PHONE_CHECK_MIN_DIGITS);
}

/** A phone number as S8 draws it: "0803 123 4412". */
export function groupPhone(digits: string): string {
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)].filter((part) => part !== '').join(' ');
}

/** The person's own number as the box takes it: the account's "+2348031234412" is "08031234412". Anything that is not a Nigerian number gives nothing. */
export function ownPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) return `0${digits.slice(3)}`;
  return digits.length === PHONE_CHECK_MIN_DIGITS && digits.startsWith('0') ? digits : null;
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
 * Anything that is not a digit or a point is ignored (the commas it draws, a ₦, a stray letter); a paste that holds such a
 * thing is refused before it gets here (`takeAmountChange`). What the rule does not take
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

/** What a pasted amount may hold: ASCII digits, commas and points (a second point is refused by `takeAmount`). */
const PASTED_AMOUNT = /^[0-9,.]+$/;

/** What `typed` added to `before`: the text between what the two share at the start and at the end ("" when it only took some away). */
export function insertedText(before: string, typed: string): string {
  let start = 0;
  while (start < before.length && start < typed.length && before[start] === typed[start]) start += 1;
  let endBefore = before.length;
  let endTyped = typed.length;
  while (endBefore > start && endTyped > start && before[endBefore - 1] === typed[endTyped - 1]) {
    endBefore -= 1;
    endTyped -= 1;
  }
  return typed.slice(start, endTyped);
}

/**
 * What the amount box holds after the person changed it from `boxWords` (the words it showed) to `typed`. One key is read by
 * `takeAmount` as it always was: a letter or a ₦ typed is ignored. A paste (more than one character added at once) must hold
 * only ASCII digits, commas and at most one point, or it is refused whole and the box keeps what it held: a pasted `1e3` is
 * not ₦13, `10k` is not ₦10, `١٠٠٠` is not nothing (R2-3; D1 refuses a second point the same way).
 */
export function takeAmountChange(boxWords: string, typed: string, previous: string): string {
  const added = insertedText(boxWords, typed);
  if (added.length > 1 && !PASTED_AMOUNT.test(added)) return previous;
  return takeAmount(typed, previous);
}

const isSignificant = (char: string): boolean => char === '.' || (char >= '0' && char <= '9');

/** How many digits and points `text` holds (the commas the box draws do not count). */
export function countSignificant(text: string): number {
  let count = 0;
  for (const char of text) if (isSignificant(char)) count += 1;
  return count;
}

/** Where the caret goes in the box's `words` so that it sits after the same `count` digits and points: just after the key the person typed. */
export function caretAfter(words: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < words.length; i += 1) {
    if (isSignificant(words[i])) {
      seen += 1;
      if (seen === count) return i + 1;
    }
  }
  return words.length;
}

/**
 * What the amount box holds when only whole naira are taken (a bill's amount is a whole number of naira, the Hub's `init` refuses
 * anything else): digits only, no point, no leading zero. Past ten digits the box keeps what it held.
 */
export function takeNaira(typed: string, previous: string): string {
  const digits = typed.replace(/[^0-9]/g, '');
  if (digits.length > AMOUNT_MAX_DIGITS) return previous;
  return digits.replace(/^0+/, '');
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

/** What a bill may cost, in kobo: the Hub's own floor (₦50) and the company's limits when `validate` named them (0 is "none named"). */
export type Limits = { minimumKobo: number; maximumKobo: number };

/** The least the Hub takes for a bill: its `init` refuses less than ₦50. */
export const HUB_MINIMUM_NAIRA = 50;
/** No ceiling of its own: the Hub's is a blast-radius limit, not a product rule, so only a company's named maximum applies. */
export const NO_MAXIMUM = Number.MAX_SAFE_INTEGER;

/** The limits for a number `validate` checked: the Hub's floor, raised by the company's minimum and capped by its maximum when it named them (naira). */
export function limitsOf(validated: { minimum: number; maximum: number } | undefined): Limits {
  const minimumNaira = Math.max(HUB_MINIMUM_NAIRA, Math.ceil(validated?.minimum ?? 0));
  const maximumNaira = validated && validated.maximum > 0 ? Math.floor(validated.maximum) : null;
  return { minimumKobo: minimumNaira * KOBO_PER_NAIRA, maximumKobo: maximumNaira === null ? NO_MAXIMUM : maximumNaira * KOBO_PER_NAIRA };
}

/** Whether an amount is within the limits. Nothing typed is no problem yet, and no amount. */
export function amountProblem(biller: Limits, kobo: number | null): AmountProblem | null {
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
export function amountOk(biller: Limits, text: string): boolean {
  const kobo = amountKobo(text);
  return kobo !== null && kobo > 0 && amountProblem(biller, kobo) === null;
}

/** The badge on S3's rows: the first letters of the first two words ("Ikeja Electric" is IE). */
export function billerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** What the checker line says for a number the provider accepted without naming anyone (airtime and data numbers have no owner name). */
export const NUMBER_CONFIRMED = 'Number confirmed';

/** The name the provider holds for a number, or the neutral words when it names no one. A found number is never drawn as "found" without one or the other (D2). */
export const ownerWords = (name: string | null): string => (name !== null && name.trim() !== '' ? name : NUMBER_CONFIRMED);

/** Which presets a typed amount equals, so that chip shows as chosen. */
export const presetChosen = (text: string, presetKobo: number): boolean => amountKobo(text) === presetKobo;

/** A preset tapped: what the amount box then holds. The Hub's quick amounts are whole naira (its config refuses any other). */
export const presetText = (presetKobo: number): string => takeAmount(String(Math.floor(presetKobo / KOBO_PER_NAIRA)), '');

/**
 * The Hub passes the provider's refusal of a number through as `502` with the provider's own words, so any `502` that is not the Hub
 * saying it could not reach, or was not set up for, the provider is "no such number" (S10). Anything else (a limit, a fault, no
 * connection) is a try again and never S10.
 */
const UNREACHABLE = [/could not reach/i, /not configured/i, /temporar/i, /unavailable/i];
export function isNoSuchNumber(error: unknown): boolean {
  return error instanceof ApiError && error.status === 502 && !UNREACHABLE.some((re) => re.test(error.message));
}

/** What sits under the number box (S4; S10 is `not_found`), decided from what has been typed and what the check answered. */
export type MeterLine =
  | { kind: 'none' }
  | { kind: 'checking' }
  | { kind: 'found'; words: string }
  | { kind: 'not_found' }
  | { kind: 'problem'; message: string };

type CheckState = {
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  data: { name: string | null } | undefined;
};

/**
 * The line under the number box. A check counts only for the digits it was made for: while the person is still typing
 * (`digits` is not yet `settled`) or has typed too few, nothing is said, and an answer for an earlier number is never shown.
 */
export function meterLine(digits: string, settled: string, check: CheckState, minDigits: number = METER_CHECK_MIN_DIGITS): MeterLine {
  if (digits.length < minDigits || digits !== settled) return { kind: 'none' };
  if (check.data) return { kind: 'found', words: ownerWords(check.data.name) };
  if (check.isError && check.error) {
    if (isNoSuchNumber(check.error)) return { kind: 'not_found' };
    return { kind: 'problem', message: check.error instanceof Error ? check.error.message : 'We could not check this number. Try again.' };
  }
  return check.isFetching ? { kind: 'checking' } : { kind: 'none' };
}
