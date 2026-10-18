import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The calls behind paying a legal fee from the wallet (LEGAL-04's S19, LEGAL-06's S22 and S26), as the Hub's contract types them
 * (LEGAL-05):
 * - `GET /legal/requests/{id}/pay/wallet/quote`: the fee that is due now (the consultation fee once an hour is booked, the quoted
 *   fee once the engagement letter is signed), the bank's charge on top, the total, and the signed quote the payment sends back;
 * - `POST /legal/requests/{id}/pay/wallet`: pays it once. The PIN is the `X-Transaction-Pin` header and nothing keeps it; the
 *   `Idempotency-Key` is one per payment intent and travels again, unchanged, on every retry;
 * - `GET /legal/requests/{id}/pay/wallet/{paymentId}`: the payment as it stands, read while it is pending.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11), so each
 * call reads the envelope itself. A refusal carries more than a code (`reason.triesLeft`, `balanceKobo`, `paymentQuote`), and the
 * shared `ApiError` keeps only the code, so the payment reads its own answer and hands the screen one of `PayOutcome`.
 */
export type FeeQuote = components['schemas']['LegalFeeWalletQuoteView'];
export type FeePayment = components['schemas']['LegalFeeWalletView'];
export type PaymentQuote = components['schemas']['PaymentQuoteView'];

type Envelope<T> = { data?: T | null };

export const feeQuoteKey = (requestId: string) => ['legal', 'fee-quote', requestId] as const;

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isKobo = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

/** A payment quote that can be approved: whole-kobo money and the token the payment must carry. */
export function readPaymentQuote(value: unknown): PaymentQuote {
  const q = value as Partial<PaymentQuote> | null;
  const ok =
    q &&
    typeof q === 'object' &&
    isKobo(q.priceKobo) &&
    isKobo(q.totalKobo) &&
    !!q.fee &&
    isKobo(q.fee.providerFeeKobo) &&
    isKobo(q.fee.wawuFeeKobo) &&
    (q.balanceKobo === null || q.balanceKobo === undefined || isKobo(q.balanceKobo)) &&
    filled(q.quoteToken) &&
    filled(q.expiresAt);
  if (!ok) throw unreadable('price');
  return q as PaymentQuote;
}

export function readFeeQuote(value: unknown): FeeQuote {
  const v = value as Partial<FeeQuote> | null;
  if (!v || typeof v !== 'object' || !filled(v.requestId) || !filled(v.title) || !isKobo(v.priceKobo)) throw unreadable('price');
  if (v.stage !== 'consultation' && v.stage !== 'service') throw unreadable('price');
  return { ...(v as FeeQuote), payment: readPaymentQuote(v.payment) };
}

const PAYMENT_STATUSES: readonly FeePayment['status'][] = ['pending', 'failed', 'reversed', 'refunded', 'paid'];

export function readFeePayment(value: unknown): FeePayment {
  const p = value as Partial<FeePayment> | null;
  const ok = p && typeof p === 'object' && filled(p.id) && filled(p.requestId) && PAYMENT_STATUSES.includes(p.status as FeePayment['status']);
  if (!ok) throw unreadable('payment');
  return p as FeePayment;
}

/** The fee that is due now, with the wallet payment's quote. Nothing is reserved. Rejects with the shared `ApiError` (`wallet_not_open`, `target_not_payable`). */
export async function fetchFeeQuote(requestId: string): Promise<FeeQuote> {
  const body = (await unwrap(
    api.GET('/api/hub/legal/requests/{id}/pay/wallet/quote', { params: { path: { id: requestId } } }),
  )) as unknown as Envelope<FeeQuote>;
  return readFeeQuote(body?.data);
}

/** One payment as it stands. Our own records only. */
export async function fetchFeePayment(requestId: string, paymentId: string): Promise<FeePayment> {
  const body = (await unwrap(
    api.GET('/api/hub/legal/requests/{id}/pay/wallet/{paymentId}', { params: { path: { id: requestId, paymentId } } }),
  )) as unknown as Envelope<FeePayment>;
  return readFeePayment(body?.data);
}

/** Why the Hub did not take the payment, in the shapes the screen branches on. */
export type PayOutcome =
  /** The Hub took the request and answered with the payment. Its `status` says how it stands: pending, paid, failed. */
  | { kind: 'done'; payment: FeePayment }
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  /** `409 pin_not_set` (or `403 pin_required` with none set): A9 sets one. */
  | { kind: 'pin_not_set' }
  /** `409 wallet_not_open` or `wallet_opening`: Open your wallet. */
  | { kind: 'no_wallet' }
  /** `402 insufficient_funds`: the bank's figures. */
  | { kind: 'insufficient_funds'; balanceKobo: number; totalKobo: number; shortfallKobo: number }
  /** `409 quote_changed`: the fee moved with the stage; this is the quote as it stands now (null when the Hub sent none). */
  | { kind: 'quote_changed'; quote: PaymentQuote | null }
  /** `409 payment_in_progress`: a payment for this request is already being confirmed. Read the request; never pay again. */
  | { kind: 'in_progress' }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME key again. */
  | { kind: 'unanswered' }
  /** Any other refusal, in the Hub's own sentence (`target_not_payable` among them). Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

export type PayInput = {
  requestId: string;
  /** The quote's `totalKobo` and `quoteToken`, as the person saw them. */
  expectedTotalKobo: number;
  quoteToken: string;
  /** One per payment intent, kept across retries of the same intent. */
  key: string;
  pin: string;
};

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

/**
 * POST /legal/requests/{id}/pay/wallet. Never rejects: whatever came back (or did not) is a `PayOutcome`, so the screen decides in
 * one place. A request that got no answer is `unanswered`, and so is every 5xx: money may have moved, so only the SAME key is safe
 * to send again.
 */
export async function payFee(input: PayInput): Promise<PayOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/legal/requests/{id}/pay/wallet', {
      params: { path: { id: input.requestId }, header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: { expectedTotalKobo: input.expectedTotalKobo, quoteToken: input.quoteToken },
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', payment: readFeePayment((data as unknown as Envelope<FeePayment> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the payment may exist, so it is not a refusal.
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
      return { kind: 'refused', code, message: message || 'There is not enough in your wallet for this.' };
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
