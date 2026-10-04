import type { BvnPrefill } from '@/api/walletIdentity';

import type { HomeAddress } from './keptCheck';

/**
 * A5's rules, kept apart from the screen so they can be tested on their own.
 * Nothing here keeps anything: each function takes what the person typed (or
 * the BVN check answered) and returns a new value.
 */

/**
 * The states of Nigeria and the Federal Capital Territory, the choices of A5's
 * State picker (the canvas's "State you live in", now the state part of the
 * home address, BRIEF A5). Constitution of the Federal Republic of Nigeria
 * 1999, section 3 and the First Schedule, Part I. Alphabetical, as a picker
 * lists them.
 */
export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Federal Capital Territory',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

/**
 * The longest street and town the fields take. With the longest state name
 * and the two separators, the address stays inside the 200 characters the
 * account opening takes in one line (contract `OpenNairaWalletDto.address`).
 */
export const STREET_MAX = 120;
export const CITY_MAX = 50;
/** The opening's own limits on the one-line address: 5 to 200 characters with a letter in it. */
const ADDRESS_MIN = 5;
const ADDRESS_MAX = 200;
/** The occupation the server keeps: 2 to 80 characters with at least one letter (contract `IdentityOccupationDto`). */
export const OCCUPATION_MAX = 80;
const OCCUPATION_MIN = 2;

const hasLetter = (value: string) => /\p{L}/u.test(value);
/** Runs of spaces (and line breaks a paste brings) become one space. */
const tidy = (value: string) => value.replace(/\s+/g, ' ').trim();

/** The address in the one line the account opening takes: "14 Admiralty Way, Lekki, Lagos". */
export function addressLine(address: HomeAddress): string {
  return [address.street, address.city, address.state].map(tidy).join(', ');
}

export type DetailsInput = { street: string; city: string; state: string | null; occupation: string; agreed: boolean };
export type DetailsProblems = Partial<Record<'street' | 'city' | 'state' | 'occupation' | 'agreed', string>>;

/**
 * What is missing or cannot be used, field by field, in words the person can
 * act on. Checked before anything is sent: the address goes to the bank only
 * after a charged selfie match, so a bad one must be caught here, not there.
 */
export function detailsProblems(input: DetailsInput): DetailsProblems {
  const problems: DetailsProblems = {};
  const street = tidy(input.street);
  const city = tidy(input.city);
  const occupation = tidy(input.occupation);
  if (!street) problems.street = 'Enter your street address.';
  else if (!hasLetter(street)) problems.street = 'Enter your street address with the street name.';
  if (!city) problems.city = 'Enter your city or town.';
  else if (!hasLetter(city)) problems.city = 'Enter the name of your city or town.';
  if (!input.state || !(NIGERIAN_STATES as readonly string[]).includes(input.state)) problems.state = 'Choose your state.';
  if (!occupation) problems.occupation = 'Enter your occupation.';
  else if (occupation.length < OCCUPATION_MIN || !hasLetter(occupation)) problems.occupation = 'Enter your occupation in words.';
  else if (occupation.length > OCCUPATION_MAX) problems.occupation = `Keep your occupation to ${OCCUPATION_MAX} characters.`;
  if (!input.agreed) problems.agreed = 'Tick the box to agree before you continue.';
  if (!problems.street && !problems.city && !problems.state && input.state) {
    const line = addressLine({ street, city, state: input.state });
    if (line.length < ADDRESS_MIN || line.length > ADDRESS_MAX) problems.street = 'Enter a shorter street address.';
  }
  return problems;
}

/** The typed details, tidied, once `detailsProblems` found nothing. */
export function tidyDetails(input: DetailsInput & { state: string }): { address: HomeAddress; occupation: string } {
  return {
    address: { street: tidy(input.street), city: tidy(input.city), state: input.state },
    occupation: tidy(input.occupation),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** The BVN's date of birth as A5 draws it: "1994-03-14" reads "14 Mar 1994". Anything else is shown as answered. */
export function birthDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || !month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

/** The BVN's name as A5 draws it, first, middle and last ("Lennox Chukwuemeka Emmanuel"). */
export function fullName(prefill: BvnPrefill): string {
  return [prefill.firstName, prefill.middleName, prefill.lastName].filter((part): part is string => Boolean(part?.trim())).join(' ');
}

/** "Male" or "Female", as A5 draws it; null when the BVN gave none (the row is left out). */
export function genderWord(gender: BvnPrefill['gender']): string | null {
  if (gender === 'male') return 'Male';
  if (gender === 'female') return 'Female';
  return null;
}

/**
 * What the account opening needs from the BVN check (contract
 * `OpenNairaWalletDto`: first name, last name, date of birth), or null when
 * the BVN did not give one of them in a form the server reads. Then the
 * account cannot open from this check (BACKEND_GAPS G-72), and the person is
 * told so on A5, before a selfie is taken and charged.
 */
export function openingName(prefill: BvnPrefill): { firstName: string; lastName: string; dateOfBirth: string } | null {
  const firstName = prefill.firstName?.trim();
  const lastName = prefill.lastName?.trim();
  const dateOfBirth = prefill.dateOfBirth?.trim();
  if (!firstName || !lastName || !dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  return { firstName, lastName, dateOfBirth };
}
