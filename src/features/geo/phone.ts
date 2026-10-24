import { AsYouType, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max';

import type { GeoCountry } from './geoApi';

/**
 * Phone numbers for every country (GEO-03, R-85). The app reads a number the way WAWU ID does (`normalisePhone` in WAWU ID,
 * GEO-01) so a number the field accepts is one the sign-up accepts, and always sends it in full international form (E.164,
 * `+2348031234412`):
 *   - a number written with its country code (`+` or `00`) is read on its own; Nigeria's code means a Nigerian number, which
 *     is ten digits after +234 starting 7, 8 or 9 (wider than the library's rule, as WAWU ID's is);
 *   - a number written the way people write it at home is read in the country chosen in the field. A Nigerian number typed
 *     with its leading 0 (`0803 123 4412`) works when Nigeria is chosen.
 * Every other country's rule is libphonenumber-js (Google's data), the same package and version as the Hub and WAWU ID.
 */

/** Nigerian mobile numbers: 10 digits after the country code, starting 7, 8 or 9 (WAWU ID `NG_NATIONAL`). */
const NG_NATIONAL = /^[789]\d{9}$/;

export type PhoneRead = { ok: true; e164: string } | { ok: false; reason: 'empty' | 'invalid' };

const invalid: PhoneRead = { ok: false, reason: 'invalid' };
const found = (e164: string): PhoneRead => ({ ok: true, e164 });

/** The digits after +234, with the stray 0 that is a common slip (+234 0803...) dropped. */
function nigerian(afterCode: string): PhoneRead {
  const digits = afterCode.length === 11 && afterCode.startsWith('0') ? afterCode.slice(1) : afterCode;
  return NG_NATIONAL.test(digits) ? found(`+234${digits}`) : invalid;
}

const isCountry = (code: string | null): code is CountryCode => Boolean(code) && /^[A-Z]{2}$/.test(code as string);

/** What was typed as a number in E.164, or why it cannot be one. `country` is the one chosen in the field (ISO alpha-2). */
export function readPhone(text: string, country: string | null): PhoneRead {
  const stripped = text.trim().replace(/[\s\-().]/g, '');
  if (stripped === '' || stripped === '+') return { ok: false, reason: 'empty' };
  if (!/^\+?\d+$/.test(stripped)) return invalid;

  if (stripped.startsWith('+') || stripped.startsWith('00')) {
    const plus = stripped.startsWith('+') ? stripped : `+${stripped.slice(2)}`;
    if (plus.startsWith('+234')) return nigerian(plus.slice(4));
    const parsed = parsePhoneNumberFromString(plus);
    return parsed?.isValid() ? found(parsed.number) : invalid;
  }

  if (country === 'NG') {
    if (stripped.startsWith('234')) return nigerian(stripped.slice(3));
    return nigerian(stripped.startsWith('0') ? stripped.slice(1) : stripped);
  }
  if (!isCountry(country)) return invalid;
  const parsed = parsePhoneNumberFromString(stripped, country);
  return parsed?.isValid() ? found(parsed.number) : invalid;
}

/** True while the text is written with a country code (`+` or `00`) and so names its own country. */
export function isInternational(text: string): boolean {
  const t = text.trim();
  return t.startsWith('+') || (t.startsWith('00') && t.length > 2);
}

/** The digits of what was typed, with a leading `+` kept (a `00` start becomes `+`, the way the world dials abroad). */
function keys(text: string): string {
  const plus = text.trim().startsWith('+');
  const digits = text.replace(/\D+/g, '');
  if (plus) return `+${digits}`;
  return digits.startsWith('00') && digits.length > 2 ? `+${digits.slice(2)}` : digits;
}

/** What the field shows for what was typed: grouped the way the chosen country writes its numbers (`0803 123 4412`). */
export function formatTyped(text: string, country: string | null): string {
  const typed = keys(text);
  if (typed.startsWith('+')) return new AsYouType().input(typed);
  return new AsYouType(isCountry(country) ? country : undefined).input(typed);
}

/**
 * The country a number written with its country code belongs to, among the countries the list holds: the one country that
 * uses the code, or (when several share it, like +1 and +44) the one the number's own digits name. Null while it is not clear.
 */
export function countryFollowing(text: string, listed: readonly Pick<GeoCountry, 'code' | 'dialCode'>[]): string | null {
  const typed = keys(text);
  if (!typed.startsWith('+')) return null;
  const reader = new AsYouType();
  reader.input(typed);
  const calling = reader.getCallingCode();
  if (!calling) return null;
  const sharing = listed.filter((c) => c.dialCode === `+${calling}`);
  if (sharing.length === 1) return sharing[0].code;
  const named = reader.getCountry();
  return named && sharing.some((c) => c.code === named) ? named : null;
}

/** The sentence under the field for a number that cannot be used: names the country and shows how its numbers are written. */
export function phoneProblem(read: PhoneRead, country: Pick<GeoCountry, 'name' | 'exampleNational'> | null): string | undefined {
  if (read.ok) return undefined;
  if (read.reason === 'empty') return 'Enter your phone number.';
  if (!country) return 'Enter a valid phone number.';
  const like = country.exampleNational ? `, like ${country.exampleNational}` : '';
  return `Enter a valid ${country.name} number${like}.`;
}

const DOT = '•';
const KEEP_FIRST = 4;
const KEEP_LAST = 4;
const NIGERIA = '234';
const NIGERIAN_LENGTH = NIGERIA.length + 10;

/**
 * A phone number with its middle hidden. A Nigerian number reads the way it is dialled at home, "0803 ••• 4412", as Z2 and A4
 * draw it; any other keeps its own country code and its last four digits, "+44 ••• 3456". A number with no `+` and no way
 * to tell its country keeps only its last four.
 */
export function maskedNumber(phone: string | null | undefined): string {
  const text = (phone ?? '').trim();
  const digits = text.replace(/\D+/g, '');
  if (digits.length < KEEP_LAST) return '';
  const last = digits.slice(-KEEP_LAST);
  const hidden = DOT.repeat(3);
  if (digits.startsWith(NIGERIA) && digits.length === NIGERIAN_LENGTH) {
    return `0${digits.slice(NIGERIA.length, NIGERIA.length + KEEP_FIRST - 1)} ${hidden} ${last}`;
  }
  if (!text.startsWith('+') && digits.length === 11 && digits.startsWith('0')) return `${digits.slice(0, KEEP_FIRST)} ${hidden} ${last}`;
  if (text.startsWith('+')) {
    const calling = parsePhoneNumberFromString(text)?.countryCallingCode;
    if (calling) return `+${calling} ${hidden} ${last}`;
  }
  return `${hidden} ${last}`;
}
