/**
 * The text of an amount being typed on a keypad (W9, and INBOX-19's send in
 * chat), and the kobo it stands for. The text is what the person typed: digits
 * and at most one ".", with at most two digits after it. The kobo come from
 * that text by whole-number arithmetic only; nothing here uses a float, so
 * ₦0.10 is 10 kobo and ₦1,234.56 is 123456 (R-21).
 */

/** The most whole-naira digits one amount takes: ₦999,999,999 is 99,999,999,900 kobo, well inside a safe integer. */
export const AMOUNT_MAX_WHOLE_DIGITS = 9;
/** Digits after the point: kobo. */
export const AMOUNT_DECIMALS = 2;

const KOBO_PER_NAIRA = 100;

/**
 * The text after one key. A digit or ".", anything else is ignored. A key that would break a rule (a second ".", a
 * third decimal, a tenth whole digit) leaves the text as it was, so the keypad never shows an amount it cannot send.
 */
export function pressKey(text: string, key: string): string {
  if (key === '.') {
    if (text.includes('.')) return text;
    return text === '' ? '0.' : `${text}.`;
  }
  if (!/^[0-9]$/.test(key)) return text;
  const point = text.indexOf('.');
  if (point >= 0) return text.length - point - 1 >= AMOUNT_DECIMALS ? text : text + key;
  if (text === '0') return key === '0' ? text : key;
  return text.length >= AMOUNT_MAX_WHOLE_DIGITS ? text : text + key;
}

/** The text after Delete: the last key goes. */
export function deleteLast(text: string): string {
  return text.slice(0, -1);
}

/** The kobo a typed text stands for; 0 for no text. Whole numbers only. */
export function koboOfText(text: string): number {
  if (text === '' || text === '.') return 0;
  const [whole = '', fraction = ''] = text.split('.');
  const kobo = fraction.padEnd(AMOUNT_DECIMALS, '0').slice(0, AMOUNT_DECIMALS);
  return Number(whole === '' ? '0' : whole) * KOBO_PER_NAIRA + Number(kobo);
}

/** The text that shows `kobo` (a quick amount tapped): "5000", or "5000.5" when there are kobo. */
export function textOfKobo(kobo: number): string {
  if (!Number.isSafeInteger(kobo) || kobo <= 0) return '';
  const whole = Math.floor(kobo / KOBO_PER_NAIRA);
  const rest = kobo % KOBO_PER_NAIRA;
  if (rest === 0) return String(whole);
  return `${whole}.${String(rest).padStart(AMOUNT_DECIMALS, '0').replace(/0$/, '')}`;
}
