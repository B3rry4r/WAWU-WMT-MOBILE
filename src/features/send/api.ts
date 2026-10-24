import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError, isApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { nameOrSomeone } from '@/features/feed/model';

/**
 * The calls behind Send to a WAWU user (WALLET-02: W7, W9, W10, W11, W12), as the backend contract types them.
 *
 * - `GET /money/recipients?q=` and `/money/recipients/recent` (WALLET-08): people with an open wallet, by name, @handle or
 *   phone; the last people this person sent to.
 * - `GET /money/transfers/presets` (WALLET-02): the quick amounts under the keypad and the note's length. Settings, never the
 *   design's figures.
 * - `GET /money/fees/quote?kind=wawu_transfer` (WALLET-15): Bank charge and WAWU's fee, each as its own part, the total
 *   and the signed quote the send must carry (R-10).
 * - `POST /money/transfers/wawu` (WALLET-07): the send. The PIN is the `X-Transaction-Pin` header and nothing else keeps it;
 *   the `Idempotency-Key` is one per payment intent and travels again, unchanged, on every retry.
 * - `GET /money/transfers/{id}` (WALLET-07): one send as it stands now: the receipt, and what the app polls after `pending`.
 * - `GET`, `POST /money/beneficiaries` and `DELETE /money/beneficiaries/{id}` (WALLET-14): W12's "Save as beneficiary".
 *
 * The Hub's refusals carry more than a code (`reason.triesLeft`, `balanceKobo`, `feeQuote`), and the shared `ApiError` keeps
 * only the code (SHARED-CHANGES WALLET-06 #2), so the send reads its own answer and hands the screen one of `SendOutcome`.
 */
export type Recipient = components['schemas']['RecipientView'];
export type FeeQuote = components['schemas']['FeeQuoteView'];
export type Transfer = components['schemas']['TransferView'];
export type TransferPresets = components['schemas']['TransferPresetsView'];
export type Beneficiary = components['schemas']['BeneficiaryView'];

/** The Hub's success body; the contract types only its `data` (SHARED-CHANGES.md row 11). */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isKobo = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

function readRecipient(value: unknown): Recipient {
  const v = value as Partial<Recipient> | null;
  if (!v || typeof v !== 'object' || !filled(v.wawuUserId)) throw unreadable('recipients');
  return {
    wawuUserId: v.wawuUserId,
    // A person with a wallet and no name is a valid recipient: named as the feed names them, and the rest of the list is read as usual.
    displayName: nameOrSomeone(v.displayName, v.handle),
    handle: filled(v.handle) ? v.handle : null,
    avatarUrl: filled(v.avatarUrl) ? v.avatarUrl : null,
    tick: v.tick === 'creator' || v.tick === 'professional' ? v.tick : null,
  };
}

function readRecipients(body: unknown): Recipient[] {
  const data = (body as Envelope<unknown[]> | null)?.data;
  if (!Array.isArray(data)) throw unreadable('recipients');
  return data.map(readRecipient);
}

/** The shortest search the Hub takes (`GET /money/recipients`, `q` minLength 2). A phone is found whole, so ten digits clear it. */
export const SEARCH_MIN_CHARS = 2;

/** GET /money/recipients?q=. */
export async function searchRecipients(q: string): Promise<Recipient[]> {
  return readRecipients(await unwrap(api.GET('/api/hub/money/recipients', { params: { query: { q } } })));
}

/** GET /money/recipients/recent: newest first. */
export async function fetchRecentRecipients(): Promise<Recipient[]> {
  return readRecipients(await unwrap(api.GET('/api/hub/money/recipients/recent')));
}

export const recentRecipientsQuery = (owner: string | null) =>
  ({ queryKey: ['money', 'recipients', 'recent', owner ?? ''] as const, queryFn: fetchRecentRecipients, staleTime: 0, enabled: Boolean(owner) }) as const;

export const searchRecipientsQuery = (owner: string | null, q: string) =>
  ({
    queryKey: ['money', 'recipients', 'search', owner ?? '', q] as const,
    queryFn: () => searchRecipients(q),
    staleTime: 0,
    enabled: Boolean(owner) && q.length >= SEARCH_MIN_CHARS,
  }) as const;

/** GET /money/transfers/presets. A list that is not whole-kobo amounts is refused, never drawn. */
export async function fetchPresets(): Promise<TransferPresets> {
  const body = (await unwrap(api.GET('/api/hub/money/transfers/presets'))) as unknown as Envelope<TransferPresets>;
  const data = body?.data;
  if (!data || !Array.isArray(data.quickAmounts) || !data.quickAmounts.every((q) => isKobo(q?.amountKobo))) throw unreadable('quick amounts');
  const max = data.noteMaxLength;
  if (!Number.isSafeInteger(max) || max <= 0) throw unreadable('note length');
  return { quickAmounts: data.quickAmounts.map((q) => ({ amountKobo: q.amountKobo })), noteMaxLength: max };
}

export const presetsQuery = (owner: string | null) =>
  ({ queryKey: ['money', 'transfers', 'presets', owner ?? ''] as const, queryFn: fetchPresets, staleTime: Infinity, enabled: Boolean(owner) }) as const;

/** What a quote must hold for a send to carry it: whole-kobo parts that add up, and the token. */
export function readQuote(value: unknown): FeeQuote {
  const q = value as Partial<FeeQuote> | null;
  const ok =
    q &&
    typeof q === 'object' &&
    isKobo(q.amountKobo) &&
    isKobo(q.totalKobo) &&
    Array.isArray(q.parts) &&
    q.parts.every((p) => isKobo(p?.amountKobo) && filled(p?.code)) &&
    filled(q.quoteToken) &&
    filled(q.expiresAt);
  if (!ok) throw unreadable('fees');
  return q as FeeQuote;
}

/** What a send goes to, as the fee quote names it: a WAWU user's wallet, or a bank account (WALLET-03). */
export type SendKind = 'wawu_transfer' | 'bank_transfer';

/** GET /money/fees/quote for a send of `amountKobo` (what the person gets; fees are on top). */
export async function fetchFeeQuote(amountKobo: number, kind: SendKind = 'wawu_transfer'): Promise<FeeQuote> {
  const body = (await unwrap(
    api.GET('/api/hub/money/fees/quote', { params: { query: { kind, amountKobo } } }),
  )) as unknown as Envelope<FeeQuote>;
  return readQuote(body?.data);
}

/** GET /money/transfers/{id}. */
export async function fetchTransfer(id: string): Promise<Transfer> {
  const body = (await unwrap(api.GET('/api/hub/money/transfers/{id}', { params: { path: { id } } }))) as unknown as Envelope<Transfer>;
  return readTransfer(body?.data);
}

export const transferQuery = (owner: string | null, id: string) =>
  ({ queryKey: ['money', 'transfers', owner ?? '', id] as const, queryFn: () => fetchTransfer(id), staleTime: 0, enabled: Boolean(owner) }) as const;

const STATUSES = ['pending', 'completed', 'failed', 'reversed'] as const;

/** A send as the screens read it: whole-kobo money, a known status, and a reference. Anything else is refused, never drawn half empty. */
export function readTransfer(value: unknown): Transfer {
  const t = value as Partial<Transfer> | null;
  const ok =
    t &&
    typeof t === 'object' &&
    filled(t.id) &&
    filled(t.reference) &&
    STATUSES.includes(t.status as (typeof STATUSES)[number]) &&
    isKobo(t.amountKobo) &&
    isKobo(t.totalKobo) &&
    t.fee &&
    isKobo(t.fee.providerFeeKobo) &&
    isKobo(t.fee.wawuFeeKobo) &&
    filled(t.createdAt);
  if (!ok) throw unreadable('receipt');
  return t as Transfer;
}

/** Why the Hub did not take the send, in the shapes the screen branches on. */
export type SendOutcome =
  /** The Hub took the request and answered with the send. Its `status` says how it ended: completed, pending, failed. */
  | { kind: 'done'; transfer: Transfer }
  /** `403 pin_incorrect`: no money moved, and no key is spent. */
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  /** `409 pin_not_set` (or `403 pin_required` with none set): A9 sets one, then this screen asks again. */
  | { kind: 'pin_not_set' }
  /** `402 insufficient_funds`: the bank's figures (MONEY-19, G-481). */
  | { kind: 'insufficient_funds'; balanceKobo: number; totalKobo: number; shortfallKobo: number }
  /** `409 quote_changed`: the fees moved; this is the quote as it stands now. */
  | { kind: 'quote_changed'; quote: FeeQuote }
  /** `409 wallet_not_open`: Open your wallet. */
  | { kind: 'no_wallet' }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME key again. */
  | { kind: 'unanswered' }
  /** Any other refusal, in the Hub's own sentence. Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

export type SendInput = {
  recipientWawuUserId: string;
  /** What the recipient gets, kobo. */
  amountKobo: number;
  quote: FeeQuote;
  note: string;
  /** One per payment intent, kept across retries of the same intent. */
  key: string;
  pin: string;
};

const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;

type Reason = { code?: unknown; message?: unknown; triesLeft?: unknown; lockedUntil?: unknown; balanceKobo?: unknown; totalKobo?: unknown; shortfallKobo?: unknown; feeQuote?: unknown };

/** The refusal's `reason`, read defensively: the Hub answers `{ statusCode, message, reason }`. */
function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { reason, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

/**
 * POST /money/transfers/wawu. Never rejects: whatever came back (or did not) is a `SendOutcome`, so the screen decides in one
 * place. A request that got no answer is `unanswered`, and so is every 5xx: money may have moved, so only the SAME key is
 * safe to send again (the contract's rule, `PinSheet`'s `unanswered`).
 */
export async function sendToWawuUser(input: SendInput): Promise<SendOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/money/transfers/wawu', {
      params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: {
        amountKobo: input.amountKobo,
        expectedTotalKobo: input.quote.totalKobo,
        recipientWawuUserId: input.recipientWawuUserId,
        quoteToken: input.quote.quoteToken,
        ...(input.note.trim() ? { note: input.note.trim() } : {}),
      },
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  return outcomeOf(result);
}

/** What a send to a bank account carries (WALLET-03): the bank, the ten digits, what they get, the quote, and the name token of the name check. */
export type BankSendInput = {
  bankCode: string;
  accountNumber: string;
  /** What the account gets, kobo. */
  amountKobo: number;
  quote: FeeQuote;
  /** The name check's `nameToken`: required for an account that is not saved, and left out for a saved one. */
  nameToken: string | null;
  note: string;
  /** One per payment intent, kept across retries of the same intent. */
  key: string;
  pin: string;
};

/**
 * POST /money/transfers/bank (WALLET-09): the same send as to a WAWU user, to a bank account. The Hub asks the bank for the name again
 * before the PIN is looked at and sends to the name the bank gives; the app never sends a name. Never rejects: every answer is a
 * `SendOutcome`. The status is read from `GET /money/transfers/{id}` (`pending` until the bank answers).
 */
export async function sendToBankAccount(input: BankSendInput): Promise<SendOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/money/transfers/bank', {
      params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: {
        bankCode: input.bankCode,
        accountNumber: input.accountNumber,
        amountKobo: input.amountKobo,
        expectedTotalKobo: input.quote.totalKobo,
        quoteToken: input.quote.quoteToken,
        ...(input.nameToken ? { nameToken: input.nameToken } : {}),
        ...(input.note.trim() ? { note: input.note.trim() } : {}),
      },
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  return outcomeOf(result);
}

/** Reads the Hub's answer to either send into the one `SendOutcome` the screen branches on. */
function outcomeOf(result: { data?: unknown; error?: unknown; response: Response }): SendOutcome {
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', transfer: readTransfer((data as unknown as Envelope<Transfer> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the send may exist, so it is not a refusal.
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
      return { kind: 'no_wallet' };
    case 'idempotency_in_progress':
      return { kind: 'unanswered' };
    case 'insufficient_funds':
      if (isKobo(reason.balanceKobo) && isKobo(reason.totalKobo) && isKobo(reason.shortfallKobo)) {
        return { kind: 'insufficient_funds', balanceKobo: reason.balanceKobo, totalKobo: reason.totalKobo, shortfallKobo: reason.shortfallKobo };
      }
      return { kind: 'refused', code, message: message || 'There is not enough in your wallet for this send.' };
    case 'quote_changed':
      try {
        return { kind: 'quote_changed', quote: readQuote(reason.feeQuote) };
      } catch {
        return { kind: 'refused', code, message: message || 'The fees changed. Go back and try again.' };
      }
    default:
      return { kind: 'refused', code, message: message || 'This send was not taken. Nothing left your wallet.' };
  }
}

/** GET /money/beneficiaries. */
export async function fetchBeneficiaries(): Promise<Beneficiary[]> {
  const body = (await unwrap(api.GET('/api/hub/money/beneficiaries'))) as unknown as Envelope<Beneficiary[]>;
  if (!Array.isArray(body?.data)) throw unreadable('saved people');
  return body.data;
}

/**
 * POST /money/beneficiaries for a bank account (W12's "Save as beneficiary" after a bank send). The Hub asks the bank for the name and
 * keeps the bank's, never one typed here. Saving one already saved answers the one already there.
 */
export async function saveBankBeneficiary(bankCode: string, accountNumber: string): Promise<Beneficiary> {
  const body = (await unwrap(
    api.POST('/api/hub/money/beneficiaries', { body: { kind: 'bank_account', bankCode, accountNumber } }),
  )) as unknown as Envelope<Beneficiary>;
  if (!body?.data || !filled(body.data.id)) throw unreadable('saved account');
  return body.data;
}

/** POST /money/beneficiaries for a WAWU user. Saving one already saved answers the one already there. */
export async function saveWawuBeneficiary(wawuUserId: string): Promise<Beneficiary> {
  const body = (await unwrap(
    api.POST('/api/hub/money/beneficiaries', { body: { kind: 'wawu_user', wawuUserId } }),
  )) as unknown as Envelope<Beneficiary>;
  if (!body?.data || !filled(body.data.id)) throw unreadable('saved person');
  return body.data;
}

/** DELETE /money/beneficiaries/{id}. */
export async function removeBeneficiary(id: string): Promise<void> {
  await unwrap(api.DELETE('/api/hub/money/beneficiaries/{id}', { params: { path: { id } } }));
}

/** The saved row for this bank account, if there is one. */
export function savedBankRowFor(rows: readonly Beneficiary[], bankCode: string, accountNumber: string): Beneficiary | undefined {
  return rows.find((row) => row.kind === 'bank_account' && row.bankAccount?.bankCode === bankCode && row.bankAccount?.accountNumber === accountNumber);
}

/** The saved row for this person, if there is one. */
export function savedRowFor(rows: readonly Beneficiary[], wawuUserId: string): Beneficiary | undefined {
  return rows.find((row) => row.kind === 'wawu_user' && row.wawuUser?.wawuUserId === wawuUserId);
}

export { isApiError };
