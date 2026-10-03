/**
 * How A26 writes the numbers it shows and takes. Nothing here keeps a BVN or
 * NIN: each function returns a new string and the caller decides how long it
 * lives (the screen's own field, until the check answers).
 */

/** A BVN and a NIN are each 11 digits (the contract's `BvnCheckDto`). */
export const ID_DIGITS = 11;

/** The groups A3 draws a BVN in ("2234 5678 901"); the NIN is drawn the same way (A18, "5621 8834 902"). */
const ID_GROUPS = [4, 4, 3] as const;

/**
 * Digits only, at most 11: what a paste or a typed space leaves. The fields
 * set no `maxLength`: the platform would cut a pasted "2223 - 4567 - 812"
 * before the separators are stripped, so the digits are taken first and
 * capped here.
 */
export function idDigits(typed: string): string {
  return typed.replace(/\D+/g, '').slice(0, ID_DIGITS);
}

/** The digits typed so far, spaced as the design draws them: "2234 5678 901". */
export function groupIdNumber(typed: string): string {
  const digits = idDigits(typed);
  const parts: string[] = [];
  let at = 0;
  for (const size of ID_GROUPS) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  return parts.join(' ');
}

/** True when the field holds a whole number: exactly 11 digits. */
export function isWholeIdNumber(typed: string): boolean {
  return idDigits(typed).length === ID_DIGITS && typed.replace(/[\d\s]/g, '') === '';
}

/**
 * Shows only the last 4 digits the server answered, the way the canvas masks
 * a BVN and a NIN on review (auth.js `kyc4`, "•••• ••• 8901").
 */
export function maskedIdNumber(last4: string): string {
  return `•••• ••• ${last4}`;
}

/**
 * The account's phone as A3 draws it, "0803 123 4412". The server keeps it as
 * +234 and 10 digits (contract CONVENTIONS section 2); any other number is
 * shown as stored.
 */
export function localPhone(stored: string): string {
  const match = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(stored.replace(/\s+/g, ''));
  if (!match) return stored;
  return `0${match[1]} ${match[2]} ${match[3]}`;
}
