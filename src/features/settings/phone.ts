/**
 * A phone number as Z2's header card shows it: the first four and the last four digits, the middle hidden. A Nigerian
 * number reads the way it is dialled at home, "0803 ••• 4412"; any other keeps only its last four, "••• 4412".
 * The first four are the network prefix, not the person's number, and Z2 draws exactly "0803 ••• 4412": the canvas
 * is the authority for what the card shows (SETTINGS-01 round 2, Phone mask: kept as drawn, owner may override).
 */
const DOT = '•';
const NIGERIA = '234';
const NATIONAL_LENGTH = 11;
const KEEP_FIRST = 4;
const KEEP_LAST = 4;

export function maskPhone(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D+/g, '');
  if (digits.length < KEEP_LAST) return '';
  const last = digits.slice(-KEEP_LAST);
  if (digits.startsWith(NIGERIA) && digits.length === NIGERIA.length + NATIONAL_LENGTH - 1) {
    const national = `0${digits.slice(NIGERIA.length)}`;
    return `${national.slice(0, KEEP_FIRST)} ${DOT.repeat(3)} ${last}`;
  }
  if (digits.length === NATIONAL_LENGTH && digits.startsWith('0')) return `${digits.slice(0, KEEP_FIRST)} ${DOT.repeat(3)} ${last}`;
  return `${DOT.repeat(3)} ${last}`;
}
