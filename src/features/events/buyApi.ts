import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The calls behind buying tickets from the wallet (EVENTS-06: E2's Get tickets, E3, E4, E5, E10), as the Hub's contract
 * types them (EVENTS-07, EVENTS-13):
 * - `POST /events/{id}/orders/wallet`: makes the order from the tickets picked (one line per tier) and answers E3's quote.
 *   A basket that costs nothing is issued here (R-8): `paid`, with the tickets, and no payment to quote.
 * - `POST /events/orders/wallet/pay`: pays it with the PIN, once. The PIN is the `X-Transaction-Pin` header and nothing
 *   else keeps it; the `Idempotency-Key` is one per payment intent and travels again, unchanged, on every retry.
 * - `GET /events/orders/wallet/{orderId}` and `.../quote`: the order as it stands (E5's tickets, E10's Refresh), and the
 *   quote again when the one the person saw has run out.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11),
 * so each call reads the envelope itself. A refusal carries more than a code (`reason.triesLeft`, `balanceKobo`,
 * `paymentQuote`) and the shared `ApiError` keeps only the code, so the payment reads its own answer and hands the screen
 * one of `PayOutcome`.
 */
export type WalletOrder = components['schemas']['EventWalletOrderView'];
export type PaymentQuote = components['schemas']['PaymentQuoteView'];
/** The contract types `payment` as always present; the Hub sends null for a basket that costs nothing. */
export type OrderQuote = { order: WalletOrder; payment: PaymentQuote | null };
export type OrderLine = { ticketTypeId: string; quantity: number };

type Envelope<T> = { data?: T | null };

export const walletOrderKey = (orderId: string) => ['events', 'wallet-order', orderId] as const;

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isKobo = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

const ORDER_STATUSES: readonly WalletOrder['status'][] = ['awaiting_payment', 'processing', 'paid', 'failed'];

/** An order as the screens read it: a known status, whole-kobo money, the event and the tickets. Anything else is refused, never drawn half empty. */
export function readOrder(value: unknown): WalletOrder {
  const o = value as Partial<WalletOrder> | null;
  const ok =
    o &&
    typeof o === 'object' &&
    filled(o.id) &&
    filled(o.reference) &&
    ORDER_STATUSES.includes(o.status as WalletOrder['status']) &&
    isKobo(o.ticketsKobo) &&
    Array.isArray(o.lines) &&
    Array.isArray(o.tickets) &&
    !!o.event &&
    filled(o.event.id) &&
    filled(o.event.name) &&
    filled(o.event.startsAt) &&
    o.lines.every((l) => filled(l?.ticketTypeId) && filled(l?.tierName) && isKobo(l?.unitPriceKobo) && Number.isSafeInteger(l?.quantity));
  if (!ok) throw unreadable('order');
  return o as WalletOrder;
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
    (q.balanceKobo === null || isKobo(q.balanceKobo)) &&
    filled(q.quoteToken) &&
    filled(q.expiresAt);
  if (!ok) throw unreadable('price');
  return q as PaymentQuote;
}

export function readOrderQuote(value: unknown): OrderQuote {
  const v = value as { order?: unknown; payment?: unknown } | null;
  if (!v || typeof v !== 'object') throw unreadable('order');
  const order = readOrder(v.order);
  return { order, payment: v.payment === null || v.payment === undefined ? null : readPaymentQuote(v.payment) };
}

/**
 * Makes the order. One `key` per tap on Get tickets, sent again unchanged when the same tickets are asked for again, so a
 * repeated tap answers the same order. Rejects with the shared `ApiError`: `wallet_not_open` leads to Open your wallet,
 * `event_order_limit` and `target_not_payable` carry the Hub's own sentence.
 */
export async function createOrder(input: { eventId: string; lines: readonly OrderLine[]; key: string }): Promise<OrderQuote> {
  const body = (await unwrap(
    api.POST('/api/hub/events/{id}/orders/wallet', {
      params: { path: { id: input.eventId }, header: { 'Idempotency-Key': input.key } },
      body: { lines: input.lines.map((l) => ({ ticketTypeId: l.ticketTypeId, quantity: l.quantity })) },
    }),
  )) as unknown as Envelope<OrderQuote>;
  return readOrderQuote(body?.data);
}

/** GET /events/orders/wallet/{orderId}: the order as it stands. Our own records only; the Hub never asks the provider. */
export async function fetchOrder(orderId: string): Promise<WalletOrder> {
  const body = (await unwrap(
    api.GET('/api/hub/events/orders/wallet/{orderId}', { params: { path: { orderId } } }),
  )) as unknown as Envelope<WalletOrder>;
  return readOrder(body?.data);
}

/** GET /events/orders/wallet/{orderId}/quote: E3 again, or a quote that ran out. */
export async function fetchOrderQuote(orderId: string): Promise<OrderQuote> {
  const body = (await unwrap(
    api.GET('/api/hub/events/orders/wallet/{orderId}/quote', { params: { path: { orderId } } }),
  )) as unknown as Envelope<OrderQuote>;
  return readOrderQuote(body?.data);
}

/** Why the Hub did not take the payment, in the shapes the screen branches on. */
export type PayOutcome =
  /** The Hub took the request and answered with the order. Its `status` says how it stands: paid, processing, failed. */
  | { kind: 'done'; order: WalletOrder }
  /** `403 pin_incorrect`: nothing moved, and no key is spent. */
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  /** `409 pin_not_set` (or `403 pin_required` with none set): A9 sets one. */
  | { kind: 'pin_not_set' }
  /** `409 wallet_not_open`: Open your wallet. */
  | { kind: 'no_wallet' }
  /** `402 insufficient_funds`: the bank's figures. */
  | { kind: 'insufficient_funds'; balanceKobo: number; totalKobo: number; shortfallKobo: number }
  /** `409 quote_changed`: the price moved; this is the quote as it stands now (null when the Hub sent none). */
  | { kind: 'quote_changed'; quote: PaymentQuote | null }
  /** `409 payment_in_progress`: a payment for this order is already being confirmed. Read the order; never pay again. */
  | { kind: 'in_progress' }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME key again. */
  | { kind: 'unanswered' }
  /** Any other refusal, in the Hub's own sentence (`event_order_limit` and `target_not_payable` among them). Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

export type PayInput = {
  orderId: string;
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
 * POST /events/orders/wallet/pay. Never rejects: whatever came back (or did not) is a `PayOutcome`, so the screen decides in one
 * place. A request that got no answer is `unanswered`, and so is every 5xx: money may have moved, so only the SAME key is safe
 * to send again.
 */
export async function payOrder(input: PayInput): Promise<PayOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/events/orders/wallet/pay', {
      params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: { orderId: input.orderId, expectedTotalKobo: input.expectedTotalKobo, quoteToken: input.quoteToken },
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', order: readOrder((data as unknown as Envelope<WalletOrder> | undefined)?.data) };
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
      return { kind: 'no_wallet' };
    case 'idempotency_in_progress':
      return { kind: 'unanswered' };
    case 'payment_in_progress':
      return { kind: 'in_progress' };
    case 'insufficient_funds':
      if (isKobo(reason.balanceKobo) && isKobo(reason.totalKobo) && isKobo(reason.shortfallKobo)) {
        return { kind: 'insufficient_funds', balanceKobo: reason.balanceKobo, totalKobo: reason.totalKobo, shortfallKobo: reason.shortfallKobo };
      }
      return { kind: 'refused', code, message: message || 'There is not enough in your wallet for these tickets.' };
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
