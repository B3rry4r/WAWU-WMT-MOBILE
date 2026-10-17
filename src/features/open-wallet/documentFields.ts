import type { ChoiceOption } from './ChoiceField';
import type { IdType, ProofType } from './draft';

/**
 * The four fields the open call needs that the boards do not draw (KYC-06,
 * G-820; owner, 17 Oct 2026): the ID's type and number on A26, the bill's type
 * and the postal code on A27. The rules are the Hub's own (`OpenNairaWalletDto`
 * on backend main); the words under a field say what to fix.
 */

export const ID_TYPES: readonly ChoiceOption<IdType>[] = [
  { value: 'national_id', label: 'National ID (NIN slip)' },
  { value: 'international_passport', label: 'International passport' },
  { value: 'drivers_license', label: "Driver's licence" },
];

export const PROOF_TYPES: readonly ChoiceOption<ProofType>[] = [
  { value: 'utility_bill', label: 'Utility bill' },
  { value: 'bank_statement', label: 'Bank statement' },
];

export const ID_TYPE_NEEDS = 'Choose the type of your ID.';
export const ID_NUMBER_NEEDS = 'Enter the number on your ID: 5 to 30 letters, numbers or dashes.';
export const PROOF_TYPE_NEEDS = 'Choose the type of document.';
export const POSTAL_NEEDS = 'Enter your postal code: letters, numbers, spaces or dashes.';

export const labelOf = <T extends string>(options: readonly ChoiceOption<T>[], value: T | null): string | null =>
  options.find((option) => option.value === value)?.label ?? null;

const tidy = (value: string) => value.replace(/\s+/g, ' ').trim();

/** The ID number as printed: 5 to 30 letters, digits or dashes. */
export function idNumberProblem(value: string): string | null {
  return /^[A-Za-z0-9][A-Za-z0-9-]{4,29}$/.test(value.trim()) ? null : ID_NUMBER_NEEDS;
}

/** The postal code: 1 to 20 letters, digits, spaces or dashes. */
export function postalProblem(value: string): string | null {
  return /^[A-Za-z0-9][A-Za-z0-9 -]{0,19}$/.test(tidy(value)) ? null : POSTAL_NEEDS;
}

/** A passport has one side; every other ID taken here has two. */
export const isOneSided = (type: IdType | null): boolean => type === 'international_passport';
