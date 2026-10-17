import { unwrap } from '@/api/client';
import { ApiError, isApiError } from '@/api/errors';
import { readPaymentQuote, type PaymentQuote } from '@/features/events/buyApi';

/**
 * What the feed's two wallet payments (a tip, HOME-13, and an unlock, HOME-12) share: how the Hub's answer to the
 * PIN-approved payment is sorted into the few cases a screen branches on, and the small readers both use. The calls
 * themselves are each feature's own (`../tips/api`, `../unlock/api`).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11),
 * so each call reads the envelope itself. A refusal carries more than a code (`reason.triesLeft`, `balanceKobo`,
 * `paymentQuote`), and the shared `ApiError` keeps only the code, so the payment reads its own answer.
 */
export type { PaymentQuote };
export { readPaymentQuote };

export type Envelope<T> = { data?: T | null };

export const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
export const isKobo = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

/** The body's `data` of a call that must succeed, or a refusal naming what was being read. */
export async function readData<T>(call: Parameters<typeof unwrap>[0], what: string): Promise<T> {
  const body = (await unwrap(call)) as unknown as Envelope<T>;
  const data = body?.data;
  if (data === null || data === undefined || typeof data !== 'object') throw unreadable(what);
  return data;
}

/** Why the Hub did not take the payment, in the shapes the screens branch on. */
export type PayOutcome<T> =
  /** The Hub took the request and answered with the payment's own view. Its `status` says how it stands: paid, pending, failed. */
  | { kind: 'done'; view: T }
  /** `403 pin_incorrect`: nothing moved, and no key is spent. */
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  /** `409 pin_not_set` (or `403 pin_required` with none set): A9 sets one. */
  | { kind: 'pin_not_set' }
  /** `409 wallet_not_open` or `wallet_opening`: Open your wallet. */
  | { kind: 'no_wallet' }
  /** `402 insufficient_funds`: the bank's figures. */
  | { kind: 'insufficient_funds'; balanceKobo: number; totalKobo: number; shortfallKobo: number }
  /** `409 quote_changed`: the price moved; this is the quote as it stands now (null when the Hub sent none). */
  | { kind: 'quote_changed'; quote: PaymentQuote | null }
  /** `409 payment_in_progress`: a payment for this is already being confirmed. Never pay again. */
  | { kind: 'in_progress' }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME key again. */
  | { kind: 'unanswered' }
  /** Any other refusal, in the Hub's own sentence. Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;

type Reason = {
  code?: unknown;
  message?: unknown;
  triesLeft?: unknown;
  lockedUntil?: unknown;
  balanceKobo?: unknown;
  totalKobo?: unknown;
  shortfallKobo?: unknown;
  paymentQuote?: unknown;
};

/** The refusal's `reason`, read defensively: the Hub answers `{ statusCode, message, reason }`. */
function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { reason, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

type Sent = { data?: unknown; error?: unknown; response: { status: number } };

/**
 * Sends the PIN-approved payment and never rejects: whatever came back (or did not) is a `PayOutcome`, so the screen decides in
 * one place. A request that got no answer is `unanswered`, and so is every 5xx: money may have moved, so only the SAME key is
 * safe to send again. `read` turns the 201 body's `data` into the view, or throws when it cannot be read (then it is
 * `unanswered` too: the Hub said created, so the payment may exist).
 */
export async function sendPayment<T>(send: () => Promise<Sent>, read: (value: unknown) => T, shortLine: string): Promise<PayOutcome<T>> {
  let result: Sent;
  try {
    result = await send();
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', view: read((data as Envelope<unknown> | undefined)?.data) };
    } catch {
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
    case 'pin_required':
      return { kind: 'pin_not_set' };
    case 'wallet_not_open':
    case 'wallet_opening':
      return { kind: 'no_wallet' };
    case 'idempotency_in_progress':
      return { kind: 'unanswered' };
    case 'payment_in_progress':
      return { kind: 'in_progress' };
    case 'insufficient_funds':
      if (isKobo(reason.balanceKobo) && isKobo(reason.totalKobo) && isKobo(reason.shortfallKobo)) {
        return { kind: 'insufficient_funds', balanceKobo: reason.balanceKobo, totalKobo: reason.totalKobo, shortfallKobo: reason.shortfallKobo };
      }
      return { kind: 'refused', code, message: message || shortLine };
    case 'quote_changed':
      try {
        return { kind: 'quote_changed', quote: readPaymentQuote(reason.paymentQuote) };
      } catch {
        return { kind: 'quote_changed', quote: null };
      }
    default:
      return { kind: 'refused', code, message: message || 'This payment was not taken. Nothing left your wallet.' };
  }
}

/** True when a quote or payment answer is "no wallet yet" (R-6): lead to Open your wallet. */
export const isWalletNotReady = (error: unknown): boolean =>
  isApiError(error) && (error.code === 'wallet_not_open' || error.code === 'wallet_opening');

/** The Hub's own sentence for a refusal, or the line to show when it gave none. */
export const sentenceOf = (error: unknown, fallback: string): string => (isApiError(error) && error.message ? error.message : fallback);
