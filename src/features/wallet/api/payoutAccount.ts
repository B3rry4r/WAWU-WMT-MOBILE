import { api, unwrap } from '@/api/client';
import { ApiError, isApiError } from '@/api/errors';
import type { MoneyErrorCode } from '@/api/money';
import type { components } from '@/api/schema.generated';

/**
 * A21's calls, as the backend contract types them.
 *
 * - `PayoutAccount`: the saved payout account (WALLET-14, served). The account
 *   name is the bank's, never typed; `matchesBvnName` is true, false (saved and
 *   flagged) or null (nothing to compare with). wawu-backend
 *   docs/contract/CONVENTIONS.md section 10.
 * - `Bank`: one row of Fintava's bank list, keyed on `code` (some names repeat).
 * - `AccountName`: whose account a bank code and number are, from the bank.
 *
 * `GET /money/banks` and `POST /money/banks/name-check` are declared by
 * MONEY-04 and served by WALLET-09 (BACKEND_GAPS G-57): until then the Hub
 * answers them 404 and the screen shows each one's error state.
 */
export type PayoutAccount = components['schemas']['PayoutAccountView'];
export type Bank = components['schemas']['BankView'];
export type AccountName = components['schemas']['AccountNameView'];
export type PayoutAccountInput = components['schemas']['PayoutAccountDto'];

/** The Hub's success body; the contract types only its `data` (SHARED-CHANGES.md row 11). */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

/** The contract's account number: `^[0-9]{10}$` (PayoutAccountDto, NameCheckDto). */
export const ACCOUNT_NUMBER_LENGTH = 10;

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your payout account could not be read. Try again.');
}

const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

function readPayoutAccount(value: unknown): PayoutAccount {
  const v = value as Partial<PayoutAccount> | null;
  if (
    !v ||
    typeof v !== 'object' ||
    !isText(v.bankCode) ||
    !isText(v.bankName) ||
    !isText(v.accountNumber) ||
    !isText(v.accountName) ||
    !(v.matchesBvnName === true || v.matchesBvnName === false || v.matchesBvnName === null)
  ) {
    throw unreadable();
  }
  return v as PayoutAccount;
}

/** GET /money/payout-account: the saved account, or null when none is saved yet. */
export async function fetchPayoutAccount(): Promise<PayoutAccount | null> {
  const body = (await unwrap(api.GET('/api/hub/money/payout-account'))) as unknown as Envelope<PayoutAccount>;
  if (!body || typeof body !== 'object' || !('data' in body)) throw unreadable();
  return body.data === null ? null : readPayoutAccount(body.data);
}

/**
 * PUT /money/payout-account. The server checks the account with the bank and
 * saves the bank's name for it; the answer says whether that name is the BVN
 * name. Rejects with an ApiError: `name_check_failed` (422) when the bank does
 * not confirm the account, `provider_unreachable` (503) when it does not answer.
 */
export async function savePayoutAccount(input: PayoutAccountInput): Promise<PayoutAccount> {
  const body = (await unwrap(
    api.PUT('/api/hub/money/payout-account', { body: { bankCode: input.bankCode, accountNumber: input.accountNumber } }),
  )) as unknown as Envelope<PayoutAccount>;
  return readPayoutAccount(body?.data);
}

/** GET /money/banks (WALLET-09). Rows without a code or a name are dropped; nothing is made up for them. */
export async function fetchBanks(): Promise<Bank[]> {
  const body = (await unwrap(api.GET('/api/hub/money/banks'))) as unknown as Envelope<Bank[]>;
  const rows = body?.data;
  if (!Array.isArray(rows)) throw new ApiError('unknown', 200, 'The bank list could not be read. Try again.');
  return rows.filter((row): row is Bank => !!row && isText(row.code) && isText(row.name));
}

/** POST /money/banks/name-check (WALLET-09): the bank's name for this account. */
export async function checkAccountName(input: PayoutAccountInput): Promise<AccountName> {
  const body = (await unwrap(
    api.POST('/api/hub/money/banks/name-check', { body: { bankCode: input.bankCode, accountNumber: input.accountNumber } }),
  )) as unknown as Envelope<AccountName>;
  const v = body?.data;
  if (!v || !isText(v.accountName) || v.accountNumber !== input.accountNumber) {
    throw new ApiError('unknown', 200, 'The bank’s answer could not be read. Try again.');
  }
  return v;
}

/**
 * The queries A21 reads through. None is retried by itself: the payout account
 * is answered `no-store`, and the name check is a call to the bank, so a retry
 * is the user's "Try again", never a loop.
 */
export const payoutAccountQuery = {
  queryKey: ['money', 'payout-account'] as const,
  queryFn: fetchPayoutAccount,
  staleTime: 0,
  retry: false,
};

export const banksQuery = {
  queryKey: ['money', 'banks'] as const,
  queryFn: fetchBanks,
  retry: false,
};

export const nameCheckQuery = (input: PayoutAccountInput) => ({
  queryKey: ['money', 'name-check', input.bankCode, input.accountNumber] as const,
  queryFn: () => checkAccountName(input),
  retry: false,
});

/**
 * Why A21 cannot show the form:
 * - `no_wallet`: nobody has a wallet until they open one (R-6); the payout
 *   account is kept with the wallet (409 `wallet_not_open`);
 * - `opening`: the wallet is still being made (409 `wallet_opening`);
 * - `other`: anything else (no connection, the bank, a server fault).
 */
export type PayoutProblem = 'no_wallet' | 'opening' | 'other';

export function payoutProblem(error: unknown): PayoutProblem {
  if (!isApiError(error)) return 'other';
  const code = error.code as MoneyErrorCode | undefined;
  if (code === 'wallet_not_open') return 'no_wallet';
  if (code === 'wallet_opening') return 'opening';
  return 'other';
}

/**
 * The sentence a screen shows for a failure. A money refusal carries its own
 * sentence written for people (`reason.code` set), and so do a lost
 * connection and an answer this file could not read (status 200); anything else (a route the Hub does not serve, a server fault)
 * carries a framework message such as "Cannot GET ...", which is never shown.
 */
export function failureMessage(error: unknown): string {
  if (isApiError(error) && (error.code || error.kind === 'network' || error.status === 200)) return error.message;
  return 'Something went wrong. Try again.';
}

/** The bank did not confirm the account (422 `name_check_failed`): the number or the bank is wrong. */
export function isUnconfirmedAccount(error: unknown): boolean {
  return isApiError(error) && error.code === 'name_check_failed';
}

/**
 * A refusal the person fixes by changing the account, read on the account number field (R-51, WALLET-37):
 * - 422 `name_check_failed`: the bank did not confirm the account;
 * - 409 `account_not_in_your_name`: the account is not in the name on their wallet (the sentence names both);
 * - 429 `name_check_rate_limited`: too many name checks this hour (the sentence gives the minutes left).
 * Each carries its own sentence written for people, so the screen shows `message` as it is.
 */
export function isRefusedAccount(error: unknown): boolean {
  return isUnconfirmedAccount(error) || (isApiError(error) && (error.code === 'account_not_in_your_name' || error.code === 'name_check_rate_limited'));
}
