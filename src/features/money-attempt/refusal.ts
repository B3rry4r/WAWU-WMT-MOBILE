/**
 * How a money route's refusal is read, in one place, for the chat's sends and requests (INBOX-19, INBOX-20) and the credit
 * purchase (INBOX-13). The Hub answers `{ statusCode, message, reason }` and the shared `ApiError` keeps only the code
 * (SHARED-CHANGES WALLET-06 #2), so each money call reads its own answer and hands the screen one of these.
 *
 * What each one proves about the money, which decides what the caller does with its Idempotency-Key:
 * - `pin_incorrect`, `pin_locked`, `pin_not_set`, `no_wallet`, `insufficient_funds`, `quote_changed`, `refused`: the Hub said no before
 *   anything moved. The key is free again.
 * - `in_progress`: a payment for this target is already on its way. Read it; never pay again.
 * - `unanswered`: nothing proves anything (no connection, a timeout, a server fault, the same key still running). Money may have moved,
 *   so only the SAME key and the SAME body are safe to send again.
 */
export type Refusal =
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  | { kind: 'pin_not_set' }
  | { kind: 'no_wallet' }
  | { kind: 'insufficient_funds'; balanceKobo: number; totalKobo: number; shortfallKobo: number }
  /** The price moved. `quote` is what the Hub sent as it stands now (not read here: the caller knows which shape it expects). */
  | { kind: 'quote_changed'; quote: unknown }
  | { kind: 'in_progress' }
  | { kind: 'unanswered' }
  | { kind: 'refused'; code: string | null; message: string };

export const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
export const isKobo = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

type Reason = {
  code?: unknown;
  message?: unknown;
  triesLeft?: unknown;
  lockedUntil?: unknown;
  balanceKobo?: unknown;
  totalKobo?: unknown;
  shortfallKobo?: unknown;
  feeQuote?: unknown;
  paymentQuote?: unknown;
};

/** The refusal's `reason`, read defensively, and the sentence the Hub gave. */
export function reasonOf(error: unknown): { reason: Reason; message: string; code: string | null } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return {
    reason,
    message: typeof reason.message === 'string' && reason.message ? reason.message : message,
    code: typeof reason.code === 'string' ? reason.code : null,
  };
}

export const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;

/**
 * What a non-201 answer means. `fallback` is the sentence for a refusal the Hub gave no words for, and `fundsFallback` for a short
 * wallet with no figures. Never throws.
 */
export function readRefusal(status: number, error: unknown, fallback: string, fundsFallback: string): Refusal {
  if (status >= HTTP_SERVER_MIN) return { kind: 'unanswered' };
  const { reason, message, code } = reasonOf(error);
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
    case 'money_request_being_paid':
      return { kind: 'in_progress' };
    case 'insufficient_funds':
      if (isKobo(reason.balanceKobo) && isKobo(reason.totalKobo) && isKobo(reason.shortfallKobo)) {
        return { kind: 'insufficient_funds', balanceKobo: reason.balanceKobo, totalKobo: reason.totalKobo, shortfallKobo: reason.shortfallKobo };
      }
      return { kind: 'refused', code, message: message || fundsFallback };
    case 'quote_changed':
      return { kind: 'quote_changed', quote: reason.paymentQuote ?? reason.feeQuote ?? null };
    default:
      return { kind: 'refused', code, message: message || fallback };
  }
}

/** The labels a fee breakdown uses (R-10, R-53): the provider's part is "Bank charge", WAWU's keeps its own name. */
export const BANK_CHARGE = 'Bank charge';
export const WAWU_FEE = 'WAWU’s fee';
export const TOTAL_LABEL = 'Total';
export const WALLET_LABEL = 'Naira wallet';
