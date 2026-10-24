import { api, unwrap } from '@/api/client';
import { ApiError, isApiError } from '@/api/errors';
import { walletBalanceQuery } from '@/api/money';
import type { components } from '@/api/schema.generated';

/**
 * The three reads behind the Wallet tab (W1, W4, W5, W6):
 *
 * - `GET /money/wallet` (MONEY-12): where the wallet stands and, once open,
 *   the account the bank gave (number, holder, bank name). It never asks the
 *   bank and never carries a balance; `not_open` is how the tab learns there
 *   is no wallet yet (R-6, MONEY-13).
 * - `GET /money/wallet/balance` (MONEY-11): the bank's own figure, asked for
 *   on every visit (`@/api/money`). `503 provider_unreachable` is W6.
 * - `GET /money/transactions?limit=3` (MONEY-15): W1's recent rows, the first
 *   page of the history, read from the ledger.
 *
 * Every key starts with `money`, so the end of Open your wallet (A10, which
 * asks every `['money']` read again) brings the tab straight to W5.
 */
type WalletView = components['schemas']['WalletView'];
type WalletAccount = components['schemas']['WalletAccountView'];
type TransactionPage = components['schemas']['TransactionPage'];
export type WalletState = WalletView['state'];
export type WalletTransaction = components['schemas']['TransactionView'];

/** The Hub's success body; the contract types only its `data` (SHARED-CHANGES.md row 11). */
export type Envelope<T> = { statusCode: number; message: string; data: T | null };

/** W1 draws three recent rows; the contract names the first page with limit 3 as W1's (MONEY-15). */
export const RECENT_ROWS = 3;

/** The wallet as the tab needs it: its state and, when open, the account to show and share. */
export type WalletHome = {
  state: WalletState;
  account: Pick<WalletAccount, 'accountNumber' | 'accountName' | 'bankName'> | null;
  /** Whether the transaction PIN is set, as the Hub says; undefined when the answer carries none (no nudge then). */
  pinIsSet?: boolean;
};

const states: readonly WalletState[] = ['not_open', 'opening', 'open', 'frozen'];
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

function readAccount(value: unknown): WalletHome['account'] {
  if (value === null || value === undefined) return null;
  const v = value as Partial<WalletAccount>;
  if (typeof v !== 'object' || !filled(v.accountNumber) || !filled(v.accountName) || !filled(v.bankName)) throw unreadable('wallet');
  return { accountNumber: v.accountNumber, accountName: v.accountName, bankName: v.bankName };
}

/** GET /money/wallet. An open wallet without its account is refused, never drawn half empty. */
export async function fetchWalletHome(): Promise<WalletHome> {
  const body = (await unwrap(api.GET('/api/hub/money/wallet'))) as unknown as Envelope<WalletView>;
  const view = body?.data;
  if (!view || typeof view !== 'object' || !states.includes(view.state)) throw unreadable('wallet');
  const account = readAccount(view.account);
  if ((view.state === 'open' || view.state === 'frozen') && account === null) throw unreadable('wallet');
  const pin = view.pin as { isSet?: unknown } | undefined;
  return { state: view.state, account, ...(typeof pin?.isSet === 'boolean' ? { pinIsSet: pin.isSet } : {}) };
}

const directions: readonly WalletTransaction['direction'][] = ['in', 'out'];

export function readRow(value: unknown): WalletTransaction {
  const v = value as Partial<WalletTransaction> | null;
  if (
    !v ||
    typeof v !== 'object' ||
    !filled(v.id) ||
    !directions.includes(v.direction as WalletTransaction['direction']) ||
    !Number.isSafeInteger(v.totalKobo) ||
    typeof v.description !== 'string' ||
    typeof v.createdAt !== 'string'
  ) {
    throw unreadable('transactions');
  }
  return v as WalletTransaction;
}

/** GET /money/transactions?limit=3: the newest rows, as the ledger holds them. */
export async function fetchRecentTransactions(): Promise<WalletTransaction[]> {
  const body = (await unwrap(
    api.GET('/api/hub/money/transactions', { params: { query: { limit: RECENT_ROWS } } }),
  )) as unknown as Envelope<TransactionPage>;
  const items = body?.data?.items;
  if (!Array.isArray(items)) throw unreadable('transactions');
  return items.slice(0, RECENT_ROWS).map(readRow);
}

/** Retries left to the app's defaults, but a bank that did not answer is never asked again on its own: the server already waited, and W6 says so. */
const RETRY_LIMIT = 2;
function retryUnlessBankDown(failures: number, error: unknown): boolean {
  if (failures >= RETRY_LIMIT) return false;
  if (!isApiError(error)) return true;
  if (error.code === 'provider_unreachable') return false;
  return error.kind === 'network' || error.kind === 'server';
}

/**
 * The tab's queries. Keyed by the signed-in account as well (the app's cache
 * is emptied when a session ends, FIX-04; the key keeps one account's wallet
 * from ever answering another's even before that), and never fresh from the
 * cache: the tab reads again each time it is shown.
 */
export function walletHomeQuery(owner: string | null) {
  return { queryKey: ['money', 'wallet-home', owner ?? ''] as const, queryFn: fetchWalletHome, staleTime: 0, enabled: Boolean(owner) };
}

export function homeBalanceQuery(owner: string | null, open: boolean) {
  return {
    ...walletBalanceQuery,
    queryKey: [...walletBalanceQuery.queryKey, owner ?? ''] as const,
    retry: retryUnlessBankDown,
    enabled: Boolean(owner) && open,
  };
}

export function recentTransactionsQuery(owner: string | null, open: boolean) {
  return {
    queryKey: ['money', 'transactions', 'recent', owner ?? ''] as const,
    queryFn: fetchRecentTransactions,
    staleTime: 0,
    enabled: Boolean(owner) && open,
  };
}
