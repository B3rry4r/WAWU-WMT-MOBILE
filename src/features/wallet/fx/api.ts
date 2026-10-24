import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError, isApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { credentialHeader, type Credential } from '@/features/device-approval';

import type { FxChain, FxCode, QuoteCode } from './amount';

/**
 * The calls behind the currency accounts, the swap and the crypto send (WALLET-21: W1's tabs, W2, W3, W20 to W23), as the Hub's contract
 * types them. Everything is under `/api/hub/money/fx`:
 *
 * - `GET /currencies`: what can be opened, the decimals of each currency's smallest unit, and the three products an admin can switch off.
 * - `GET /accounts`, `POST /accounts`, `GET /accounts/{id}`, `GET /accounts/{id}/transactions`: the person's accounts with the provider's
 *   balance and the details payers use.
 * - `POST /quotes`: the provider's rate, both amounts, the fees and the real expiry (`expiresAt`). `POST /swaps` takes the quote's id.
 * - `GET /sends/quote`, `POST /sends`, `GET /sends/{id}`: a stablecoin sent to an outside address.
 *
 * A figure that is not naira is an integer in the currency's smallest unit (`...Minor`), beside a currency and its `decimals`.
 * The PIN is the `X-Transaction-Pin` header, or the phone's fingerprint or face approval is `X-Device-Approval` in its place; one
 * `Idempotency-Key` per payment intent travels again, unchanged, on every retry (exactly as Send in naira does).
 */
export type FxCurrencies = components['schemas']['FxCurrenciesView'];
export type FxCurrency = components['schemas']['FxCurrencyView'];
export type FxAccount = components['schemas']['FxAccountView'];
export type FxDetails = components['schemas']['FxReceivingDetailsView'];
export type FxTransaction = components['schemas']['FxTransactionView'];
export type FxTransactionPage = components['schemas']['FxTransactionPage'];
export type FxQuote = components['schemas']['FxQuoteView'];
export type FxSwap = components['schemas']['FxSwapView'];
export type FxSendQuote = components['schemas']['FxSendQuoteView'];
export type FxSend = components['schemas']['FxSendView'];

type Envelope<T> = { statusCode: number; message: string; data: T | null };

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isInt = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
const isMinor = (value: unknown): value is number => isInt(value) && value >= 0;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

const dataOf = <T>(body: unknown): T | null => (body as Envelope<T> | null)?.data ?? null;

/* ----------------------------------- reads ----------------------------------- */

export async function fetchCurrencies(): Promise<FxCurrencies> {
  const data = dataOf<FxCurrencies>(await unwrap(api.GET('/api/hub/money/fx/currencies')));
  if (!data || !Array.isArray(data.currencies) || !data.products || !data.currencies.every((c) => filled(c?.code) && isMinor(c?.decimals))) {
    throw unreadable('currencies');
  }
  return data;
}

export function readAccount(value: unknown): FxAccount {
  const a = value as Partial<FxAccount> | null;
  const ok =
    a &&
    typeof a === 'object' &&
    filled(a.id) &&
    filled(a.currency) &&
    isMinor(a.decimals) &&
    (a.status === 'opening' || a.status === 'open' || a.status === 'frozen') &&
    (a.balance === null || a.balance === undefined || (isInt(a.balance.availableMinor) && isInt(a.balance.bookedMinor)));
  if (!ok) throw unreadable('accounts');
  return { ...(a as FxAccount), balance: a.balance ?? null, details: a.details ?? null, chain: a.chain ?? null };
}

export async function fetchAccounts(): Promise<FxAccount[]> {
  const data = dataOf<{ accounts: unknown[] }>(await unwrap(api.GET('/api/hub/money/fx/accounts')));
  if (!data || !Array.isArray(data.accounts)) throw unreadable('accounts');
  return data.accounts.map(readAccount);
}

export async function fetchTransactions(accountId: string, cursor?: string): Promise<FxTransactionPage> {
  const data = dataOf<FxTransactionPage>(
    await unwrap(api.GET('/api/hub/money/fx/accounts/{id}/transactions', { params: { path: { id: accountId }, query: { limit: 20, ...(cursor ? { cursor } : {}) } } })),
  );
  if (!data || !Array.isArray(data.items) || !data.items.every((t) => filled(t?.id) && isInt(t?.amountMinor))) throw unreadable('activity');
  return { items: data.items, nextCursor: data.nextCursor ?? null };
}

/** What the person's open accounts and the Hub's switches say now. Never held: every screen that draws a balance asks again. */
export const currenciesQuery = (owner: string | null, enabled = true) =>
  ({ queryKey: ['money', 'fx', 'currencies', owner ?? ''] as const, queryFn: fetchCurrencies, staleTime: 60_000, retry: false, enabled: Boolean(owner) && enabled }) as const;

export const accountsQuery = (owner: string | null, enabled = true) =>
  ({ queryKey: ['money', 'fx', 'accounts', owner ?? ''] as const, queryFn: fetchAccounts, staleTime: 0, retry: false, enabled: Boolean(owner) && enabled }) as const;

export const transactionsQuery = (owner: string | null, accountId: string | null) =>
  ({
    queryKey: ['money', 'fx', 'transactions', owner ?? '', accountId ?? ''] as const,
    queryFn: () => fetchTransactions(accountId as string),
    staleTime: 0,
    retry: false,
    enabled: Boolean(owner && accountId),
  }) as const;

/* --------------------------------- open account ---------------------------------- */

/**
 * POST /accounts: opens an account in one currency (a stablecoin with its chain). Asking again for one the person has returns it.
 * Rejects with an `ApiError`: `fx_switched_off` and `provider_declined` carry the Hub's own words in the message.
 */
export async function openAccount(currency: FxCode, chain?: FxChain): Promise<FxAccount> {
  const data = dataOf<FxAccount>(
    await unwrap(api.POST('/api/hub/money/fx/accounts', { body: { currency, ...(chain ? { chain } : {}) } })),
  );
  return readAccount(data);
}

/* ------------------------------------ quote ------------------------------------- */

export type QuoteAsk = {
  fromCurrency: QuoteCode;
  toCurrency: QuoteCode;
  fromAccountId: string | null;
  toAccountId: string | null;
  /** In the smallest unit of `fromCurrency` (kobo for naira). */
  amountFromMinor: number;
};

export function readQuote(value: unknown): FxQuote {
  const q = value as Partial<FxQuote> | null;
  const ok =
    q &&
    typeof q === 'object' &&
    filled(q.id) &&
    filled(q.fromCurrency) &&
    filled(q.toCurrency) &&
    isMinor(q.amountFromMinor) &&
    isMinor(q.amountToMinor) &&
    isMinor(q.fromDecimals) &&
    isMinor(q.toDecimals) &&
    isMinor(q.wawuFeeMinor) &&
    isMinor(q.totalFromMinor) &&
    (q.providerFeeMinor === null || isMinor(q.providerFeeMinor)) &&
    filled(q.rate) &&
    filled(q.expiresAt);
  if (!ok) throw unreadable('rate');
  return q as FxQuote;
}

/** POST /quotes: the provider's rate for this amount, held until `expiresAt` and used once. */
export async function fetchQuote(ask: QuoteAsk): Promise<FxQuote> {
  const body = {
    fromCurrency: ask.fromCurrency,
    toCurrency: ask.toCurrency,
    amountFromMinor: ask.amountFromMinor,
    ...(ask.fromAccountId ? { fromAccountId: ask.fromAccountId } : {}),
    ...(ask.toAccountId ? { toAccountId: ask.toAccountId } : {}),
  };
  return readQuote(dataOf(await unwrap(api.POST('/api/hub/money/fx/quotes', { body }))));
}

/** GET /sends/quote: what a send costs before the PIN. */
export async function fetchSendQuote(accountId: string, chain: FxChain, amountMinor: number): Promise<FxSendQuote> {
  const data = dataOf<FxSendQuote>(
    await unwrap(api.GET('/api/hub/money/fx/sends/quote', { params: { query: { accountId, chain, amountMinor } } })),
  );
  if (!data || !isMinor(data.wawuFeeMinor) || !isMinor(data.availableMinor) || !isMinor(data.decimals)) throw unreadable('fees');
  return data;
}

/* ------------------------------------ swap -------------------------------------- */

const OPERATION_STATUSES = ['pending', 'completed', 'failed'];

export function readSwap(value: unknown): FxSwap {
  const s = value as Partial<FxSwap> | null;
  const ok =
    s &&
    typeof s === 'object' &&
    filled(s.id) &&
    OPERATION_STATUSES.includes(s.status as string) &&
    filled(s.fromCurrency) &&
    filled(s.toCurrency) &&
    isMinor(s.amountFromMinor) &&
    isMinor(s.amountToMinor) &&
    isMinor(s.fromDecimals) &&
    isMinor(s.toDecimals) &&
    isMinor(s.wawuFeeMinor) &&
    filled(s.createdAt);
  if (!ok) throw unreadable('receipt');
  return { ...(s as FxSwap), providerFeeMinor: s.providerFeeMinor ?? null, failureReason: s.failureReason ?? null, completedAt: s.completedAt ?? null };
}

export function readSend(value: unknown): FxSend {
  const s = value as Partial<FxSend> | null;
  const ok =
    s &&
    typeof s === 'object' &&
    filled(s.id) &&
    OPERATION_STATUSES.includes(s.status as string) &&
    filled(s.currency) &&
    filled(s.chain) &&
    filled(s.address) &&
    isMinor(s.amountMinor) &&
    isMinor(s.decimals) &&
    isMinor(s.wawuFeeMinor) &&
    filled(s.createdAt);
  if (!ok) throw unreadable('receipt');
  return { ...(s as FxSend), providerFeeMinor: s.providerFeeMinor ?? null, failureReason: s.failureReason ?? null, completedAt: s.completedAt ?? null };
}

export async function fetchSwap(id: string): Promise<FxSwap> {
  return readSwap(dataOf(await unwrap(api.GET('/api/hub/money/fx/swaps/{id}', { params: { path: { id } } }))));
}

export async function fetchSend(id: string): Promise<FxSend> {
  return readSend(dataOf(await unwrap(api.GET('/api/hub/money/fx/sends/{id}', { params: { path: { id } } }))));
}

export const swapQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['money', 'fx', 'swap', owner ?? '', id ?? ''] as const, queryFn: () => fetchSwap(id as string), staleTime: 0, enabled: Boolean(owner && id) }) as const;

export const sendQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['money', 'fx', 'send', owner ?? '', id ?? ''] as const, queryFn: () => fetchSend(id as string), staleTime: 0, enabled: Boolean(owner && id) }) as const;

/**
 * Why the Hub did not take a swap or a send, in the shapes the screen branches on (the same ones Send in naira uses, plus the
 * provider's own refusals, which are drawn as the plain refusal they are and never hidden).
 */
export type FxOutcome<T> =
  | { kind: 'done'; value: T }
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  | { kind: 'pin_not_set' }
  | { kind: 'no_wallet' }
  /** `402 insufficient_funds`: nothing moved. */
  | { kind: 'insufficient_funds' }
  /** `409 quote_expired` (or the quote changed): ask for a new rate. Nothing moved. */
  | { kind: 'quote_expired' }
  /** `423 account_frozen` or `wallet_frozen`. Nothing moved. */
  | { kind: 'frozen' }
  /** `409 fx_switched_off`: an admin turned this off. */
  | { kind: 'switched_off' }
  /** `409 provider_declined`: Nuvion will not take it, in its own words. Nothing moved. */
  | { kind: 'declined'; message: string }
  /** `422 address_invalid` or `chain_mismatch`, before the PIN. */
  | { kind: 'bad_address'; message: string }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME key again. */
  | { kind: 'unanswered' }
  | { kind: 'approval_cancelled' }
  | { kind: 'approval_failed' }
  | { kind: 'refused'; code: string | null; message: string };

type Reason = { code?: unknown; message?: unknown; triesLeft?: unknown; lockedUntil?: unknown };

function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { reason, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;

function outcomeOf<T>(result: { data?: unknown; error?: unknown; response: Response }, read: (value: unknown) => T): FxOutcome<T> {
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', value: read(dataOf(data)) };
    } catch {
      // The Hub said created and the answer cannot be read: the operation may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  if (response.status >= HTTP_SERVER_MIN) return { kind: 'unanswered' };
  const { reason, message } = reasonOf(error);
  const code = typeof reason.code === 'string' ? reason.code : null;
  switch (code) {
    case 'pin_incorrect':
      return { kind: 'pin_incorrect', triesLeft: typeof reason.triesLeft === 'number' ? reason.triesLeft : 0 };
    case 'pin_locked':
      return filled(reason.lockedUntil) ? { kind: 'pin_locked', lockedUntil: reason.lockedUntil } : { kind: 'unanswered' };
    case 'pin_not_set':
      return { kind: 'pin_not_set' };
    case 'wallet_not_open':
    case 'wallet_opening':
      return { kind: 'no_wallet' };
    case 'device_approval_refused':
      return { kind: 'approval_failed' };
    case 'idempotency_in_progress':
      return { kind: 'unanswered' };
    case 'insufficient_funds':
      return { kind: 'insufficient_funds' };
    case 'quote_expired':
    case 'quote_changed':
      return { kind: 'quote_expired' };
    case 'account_frozen':
    case 'wallet_frozen':
      return { kind: 'frozen' };
    case 'fx_switched_off':
      return { kind: 'switched_off' };
    case 'provider_declined':
      return { kind: 'declined', message: message || 'The provider did not take this. Nothing moved.' };
    case 'address_invalid':
    case 'chain_mismatch':
      return { kind: 'bad_address', message: message || 'This address does not look right for this network.' };
    default:
      return { kind: 'refused', code, message: message || 'This was not taken. Nothing moved.' };
  }
}

export type SwapInput = { quoteId: string; key: string } & Credential;

/**
 * POST /swaps. Never rejects: whatever came back (or did not) is an `FxOutcome`. A request that got no answer is `unanswered`, and so
 * is every 5xx: money may have moved, so only the SAME key is safe to send again.
 */
export async function swapAtQuote(input: SwapInput): Promise<FxOutcome<FxSwap>> {
  const body = { quoteId: input.quoteId };
  const headed = await credentialHeader(input, { method: 'POST', path: '/api/hub/money/fx/swaps', body });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/money/fx/swaps', { params: { header: { ...headed.header, 'Idempotency-Key': input.key } }, body, fetch: resendsUnderKey });
  } catch {
    return { kind: 'unanswered' };
  }
  return outcomeOf(result, readSwap);
}

export type SendCoinInput = { accountId: string; chain: FxChain; address: string; amountMinor: number; key: string } & Credential;

/** POST /sends: a stablecoin to an outside address. Same rules as `swapAtQuote`. */
export async function sendCoin(input: SendCoinInput): Promise<FxOutcome<FxSend>> {
  const body = { accountId: input.accountId, chain: input.chain, address: input.address, amountMinor: input.amountMinor };
  const headed = await credentialHeader(input, { method: 'POST', path: '/api/hub/money/fx/sends', body });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/money/fx/sends', { params: { header: { ...headed.header, 'Idempotency-Key': input.key } }, body, fetch: resendsUnderKey });
  } catch {
    return { kind: 'unanswered' };
  }
  return outcomeOf(result, readSend);
}

export { isApiError };
