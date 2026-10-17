import type { ChoiceOption } from './ChoiceField';

/**
 * What the details step asks for under the review opening (KYC-07). The Hub has no BVN check there to read a name,
 * date of birth and gender from (it answers `step_not_used`; BACKEND_GAPS G-460), and its open call takes all
 * three, so the person types them. The rules are the open call's own (`OpenNairaWalletDto` on backend main).
 */

export type Gender = 'male' | 'female';

export const GENDERS: readonly ChoiceOption<Gender>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const NAME_MAX = 50;
/** A name: starts with a letter, then letters, marks, apostrophes, spaces, dots and dashes (the open call's own pattern). */
const NAME = /^\p{L}[\p{L}\p{M}' .-]{0,49}$/u;

const tidy = (value: string) => value.replace(/\s+/g, ' ').trim();

export type PersonInput = { firstName: string; lastName: string; birth: string; gender: Gender | null };
export type PersonProblems = Partial<Record<'firstName' | 'lastName' | 'birth' | 'gender', string>>;

/** Digits typed so far as day, month and year: "14031994" reads "14/03/1994". */
export function groupBirth(typed: string): string {
  const digits = typed.replace(/\D+/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

/** "14/03/1994" as `1994-03-14` when it is a real date from 1900 up to today; null otherwise. */
export function birthToIso(typed: string, now: Date = new Date()): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(typed.trim());
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  if (year < 1900 || date.getTime() > now.getTime()) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** The typed form of an ISO date, for a field that comes back filled in. */
export function isoToBirth(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/** What is missing or cannot be used, field by field, in words the person can act on. */
export function personProblems(input: PersonInput, now: Date = new Date()): PersonProblems {
  const problems: PersonProblems = {};
  const first = tidy(input.firstName);
  const last = tidy(input.lastName);
  if (!first) problems.firstName = 'Enter your first name.';
  else if (!NAME.test(first)) problems.firstName = 'Use letters only for your first name.';
  if (!last) problems.lastName = 'Enter your last name.';
  else if (!NAME.test(last)) problems.lastName = 'Use letters only for your last name.';
  if (!input.birth.trim()) problems.birth = 'Enter your date of birth.';
  else if (birthToIso(input.birth, now) === null) problems.birth = 'Enter a real date of birth, like 14/03/1994.';
  if (!input.gender) problems.gender = 'Choose your gender.';
  return problems;
}

/** The typed name, tidied, once `personProblems` found nothing. */
export function tidyPerson(input: PersonInput & { gender: Gender }, now: Date = new Date()) {
  return { firstName: tidy(input.firstName), lastName: tidy(input.lastName), dateOfBirth: birthToIso(input.birth, now) as string, gender: input.gender };
}
