import { ACCOUNT_NUMBER_LENGTH, type AccountName, type Bank, type PayoutAccount } from './api/payoutAccount';

/**
 * What A21's form holds and what it may do next, kept apart from the screen so
 * each rule is tested on its own (src/features/wallet/__tests__).
 */
export type PayoutForm = {
  /** The chosen bank, from the saved account or the bank list. */
  bank: Pick<Bank, 'code' | 'name'> | null;
  /** Digits only, at most ten. */
  accountNumber: string;
};

/** The form as a saved account fills it, or empty when nothing is saved. */
export function formFrom(saved: PayoutAccount | null): PayoutForm {
  if (!saved) return { bank: null, accountNumber: '' };
  return { bank: { code: saved.bankCode, name: saved.bankName }, accountNumber: saved.accountNumber };
}

/** What the account number field keeps of what was typed or pasted: digits, at most ten. */
export function digitsOnly(typed: string): string {
  return typed.replace(/\D+/g, '').slice(0, ACCOUNT_NUMBER_LENGTH);
}

export function isComplete(form: PayoutForm): form is { bank: Pick<Bank, 'code' | 'name'>; accountNumber: string } {
  return form.bank !== null && form.accountNumber.length === ACCOUNT_NUMBER_LENGTH;
}

/** The form holds exactly the saved account: nothing to check and nothing to save. */
export function isSaved(form: PayoutForm, saved: PayoutAccount | null): boolean {
  return !!saved && form.bank?.code === saved.bankCode && form.accountNumber === saved.accountNumber;
}

/** Where the bank's name check stands for what the form holds (TanStack Query's own statuses). */
export type NameCheck =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; data: AccountName }
  | { status: 'error'; unconfirmed: boolean; message: string };

/**
 * The line under the account number (A21: "Lennox Emmanuel · matches your BVN").
 * - `resolved`: the bank's name. `match` is the server's `matchesBvnName` for a
 *   saved account; before saving it is null, because the name check does not
 *   compare with the BVN (BACKEND_GAPS G-58).
 * - `checking`: the bank is being asked.
 * - `unconfirmed`: the bank did not confirm the account; the server's sentence.
 * - `unchecked`: the bank could not be asked; saving asks it again.
 * - `none`: nothing to say yet (no bank, or fewer than ten digits).
 */
export type NameLine =
  | { kind: 'none' }
  | { kind: 'checking' }
  | { kind: 'resolved'; name: string; match: boolean | null }
  | { kind: 'unconfirmed'; message: string }
  | { kind: 'unchecked' };

export function nameLine(form: PayoutForm, saved: PayoutAccount | null, check: NameCheck): NameLine {
  if (saved && isSaved(form, saved)) return { kind: 'resolved', name: saved.accountName, match: saved.matchesBvnName };
  if (!isComplete(form)) return { kind: 'none' };
  switch (check.status) {
    case 'pending':
      return { kind: 'checking' };
    case 'success':
      return { kind: 'resolved', name: check.data.accountName, match: null };
    case 'error':
      return check.unconfirmed ? { kind: 'unconfirmed', message: check.message } : { kind: 'unchecked' };
    default:
      return { kind: 'none' };
  }
}

/** Ask the bank whose account this is: a complete form that is not the saved account. */
export function shouldCheckName(form: PayoutForm, saved: PayoutAccount | null): boolean {
  return isComplete(form) && !isSaved(form, saved);
}

/**
 * Save is open for a complete form that differs from the saved account, once
 * the bank has answered or could not be asked (the server checks again on
 * save), and never for an account the bank refused or while a save is running.
 */
export function canSave(form: PayoutForm, saved: PayoutAccount | null, line: NameLine, saving: boolean): boolean {
  if (saving || !isComplete(form) || isSaved(form, saved)) return false;
  return line.kind === 'resolved' || line.kind === 'unchecked';
}

/** The bank list narrowed by what was typed in the sheet's search, in the order the API sent it. */
export function filterBanks(banks: readonly Bank[], query: string): Bank[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...banks];
  return banks.filter((bank) => bank.name.toLowerCase().includes(needle));
}
