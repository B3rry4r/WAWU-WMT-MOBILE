import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The calls behind Your points (PT5, PT5a) and Convert to cash (PT6, PT6a, PT6b), as the backend contract types them.
 *
 * - `GET /me/points` (POINTS-01): the balance, the live lots with their end dates, the next end and the last 20 movements.
 *   Every figure is a count of points, never naira.
 * - `GET /points/convert/quote?points=` (POINTS-04, TIER-06 round 2): the rate (so many points for so many kobo), the
 *   fewest points one conversion takes, the cash for `points`, `canConvert` and `blockedBy`, and a signed `quoteToken`.
 * - `POST /points/convert` (POINTS-04): the conversion. The PIN is the `X-Transaction-Pin` header and nothing else keeps it;
 *   the `Idempotency-Key` is one per intent and travels again, unchanged, on every retry of that intent. The body carries the
 *   `quoteToken` of the quote the person was shown.
 * - `GET /points/convert/{id}` (POINTS-04): one conversion as it stands now, which the app reads after `pending`.
 *
 * The Hub's refusals carry more than a code (`reason.triesLeft`, `reason.pointsQuote`), and the shared `ApiError` keeps only
 * the code, so the conversion reads its own answer and hands the screen one of `ConvertOutcome` (as Send does).
 */
export type MyPoints = components['schemas']['MyPointsView'];
export type PointLot = components['schemas']['PointLotView'];
export type PointMovement = components['schemas']['PointMovementView'];
export type ConvertQuote = components['schemas']['PointsConvertQuoteView'];
export type Conversion = components['schemas']['PointsConversionView'];

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const count = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isTime = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

/** A points answer the screens can draw: whole lots and movements, or nothing (an answer that is not whole is refused, never drawn half empty). */
export function readMyPoints(value: unknown): MyPoints {
  const v = value as Partial<MyPoints> | null;
  if (!v || typeof v !== 'object' || !count(v.balance) || !Array.isArray(v.lots) || !Array.isArray(v.movements)) throw unreadable('points');
  const next = v.nextExpiry as Partial<NonNullable<MyPoints['nextExpiry']>> | null | undefined;
  if (next !== null && next !== undefined && (typeof next !== 'object' || !count(next.points) || !isTime(next.expiresAt))) throw unreadable('points');
  const lots = v.lots.map((lot): PointLot => {
    const l = lot as Partial<PointLot> | null;
    if (!l || typeof l !== 'object' || !filled(l.id) || !count(l.points) || !isTime(l.expiresAt)) throw unreadable('points');
    return { id: l.id, points: l.points, granted: count(l.granted) ? l.granted : l.points, source: l.source as PointLot['source'], label: typeof l.label === 'string' ? l.label : '', expiresAt: l.expiresAt };
  });
  const movements = v.movements.map((row): PointMovement => {
    const m = row as Partial<PointMovement> | null;
    if (!m || typeof m !== 'object' || !filled(m.id) || typeof m.points !== 'number' || !Number.isFinite(m.points) || !filled(m.label) || !isTime(m.createdAt)) throw unreadable('points');
    return { id: m.id, points: m.points, label: m.label, reason: m.reason as PointMovement['reason'], pending: m.pending === true, createdAt: m.createdAt };
  });
  return {
    balance: v.balance,
    nextExpiry: next ? { points: next.points as number, expiresAt: next.expiresAt as string } : null,
    lots,
    lotCount: count(v.lotCount) ? v.lotCount : lots.length,
    movements,
  };
}

/** GET /me/points. */
export async function fetchMyPoints(): Promise<MyPoints> {
  const body = (await unwrap(api.GET('/api/hub/me/points'))) as unknown as Envelope<MyPoints>;
  return readMyPoints(body?.data);
}

/** Keyed by the signed-in account and read again each time the screen is shown: points move while the app is open. */
export const myPointsQuery = (owner: string | null) =>
  ({ queryKey: ['points', 'me', owner ?? ''] as const, queryFn: fetchMyPoints, staleTime: 0, enabled: Boolean(owner) }) as const;

const BLOCKS = ['below_minimum', 'insufficient_points', 'above_maximum'] as const;

/** What a quote must hold for a conversion to carry it: whole-kobo money, a known block or none, and the token. */
export function readConvertQuote(value: unknown): ConvertQuote {
  const q = value as Partial<ConvertQuote> | null;
  const rate = q?.rate as Partial<ConvertQuote['rate']> | undefined;
  const ok =
    q &&
    typeof q === 'object' &&
    q.currency === 'NGN' &&
    count(q.balancePoints) &&
    count(q.minimumPoints) &&
    (q.maximumPoints === null || count(q.maximumPoints)) &&
    rate &&
    count(rate.points) &&
    rate.points > 0 &&
    count(rate.kobo) &&
    count(q.points) &&
    whole(q.cashKobo) &&
    whole(q.feeKobo) &&
    typeof q.canConvert === 'boolean' &&
    (q.blockedBy === null || BLOCKS.includes(q.blockedBy as (typeof BLOCKS)[number])) &&
    filled(q.quoteToken) &&
    filled(q.expiresAt);
  if (!ok) throw unreadable('conversion quote');
  return { ...(q as ConvertQuote), wawuPaysProviderCharge: q.wawuPaysProviderCharge === true };
}

/** GET /points/convert/quote for `points`; with none, the quote is for the whole balance. Digits only: the Hub reads nothing else. */
export async function fetchConvertQuote(points?: number): Promise<ConvertQuote> {
  const query = points === undefined ? {} : { points };
  const body = (await unwrap(api.GET('/api/hub/points/convert/quote', { params: { query } }))) as unknown as Envelope<ConvertQuote>;
  return readConvertQuote(body?.data);
}

const STATUSES = ['pending', 'completed', 'failed'] as const;

/** A conversion as the screens read it: a known status and whole money. Anything else is refused, never drawn. */
export function readConversion(value: unknown): Conversion {
  const c = value as Partial<Conversion> | null;
  const ok = c && typeof c === 'object' && filled(c.id) && STATUSES.includes(c.status as (typeof STATUSES)[number]) && count(c.points) && whole(c.cashKobo) && filled(c.createdAt);
  if (!ok) throw unreadable('conversion');
  return {
    id: c.id as string,
    status: c.status as Conversion['status'],
    currency: 'NGN',
    points: c.points as number,
    cashKobo: c.cashKobo as number,
    reference: typeof c.reference === 'string' ? c.reference : '',
    statusMessage: typeof c.statusMessage === 'string' ? c.statusMessage : null,
    failureReason: typeof c.failureReason === 'string' ? c.failureReason : null,
    createdAt: c.createdAt as string,
    completedAt: typeof c.completedAt === 'string' ? c.completedAt : null,
  };
}

/** GET /points/convert/{id}: our own record of one conversion, what the app reads after `pending`. */
export async function fetchConversion(id: string): Promise<Conversion> {
  const body = (await unwrap(api.GET('/api/hub/points/convert/{id}', { params: { path: { id } } }))) as unknown as Envelope<Conversion>;
  return readConversion(body?.data);
}

export const conversionQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['points', 'conversion', owner ?? '', id ?? ''] as const, queryFn: () => fetchConversion(id as string), staleTime: 0, enabled: Boolean(owner) && Boolean(id) }) as const;

/** Why the Hub did not take the conversion, in the shapes the screen branches on. */
export type ConvertOutcome =
  /** The Hub took the request and answered with the conversion. Its `status` says how it ended: completed, pending, failed. */
  | { kind: 'done'; conversion: Conversion }
  /** `403 pin_incorrect`: nothing moved and no key is spent. */
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  /** `409 pin_not_set` (or `403 pin_required` with none set): A9 sets one, then this screen asks again. */
  | { kind: 'pin_not_set' }
  /** `409 wallet_not_open`: Open your wallet. */
  | { kind: 'no_wallet' }
  /** `409 quote_changed`: what the person was shown is not what is true now. `quote` is the new one (null when it cannot be read). */
  | { kind: 'quote_changed'; quote: ConvertQuote | null; message: string }
  /** `422 below_minimum`, `402 insufficient_points`, `400 amount_out_of_range`, `409 currency_not_supported`: refused before the PIN, nothing held. */
  | { kind: 'blocked'; code: string; message: string }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME key again. */
  | { kind: 'unanswered' }
  /** Any other refusal, in the Hub's own sentence. Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

export type ConvertInput = {
  points: number;
  /** The `quoteToken` of the quote the person saw. */
  quoteToken: string;
  /** One per intent, kept across retries of the same intent. */
  key: string;
  pin: string;
};

const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;
const BLOCKED_CODES = ['below_minimum', 'insufficient_points', 'amount_out_of_range', 'currency_not_supported'];

type Reason = { code?: unknown; message?: unknown; triesLeft?: unknown; lockedUntil?: unknown; pointsQuote?: unknown };

/** The refusal's `reason`, read defensively: the Hub answers `{ statusCode, message, reason }`. */
function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { reason, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

/**
 * POST /points/convert. Never rejects: whatever came back (or did not) is a `ConvertOutcome`, so the screen decides in one place.
 * A request that got no answer is `unanswered`, and so is every 5xx: the points may have moved, so only the SAME key is safe to
 * send again (the contract's rule, `PinSheet`'s `unanswered`).
 */
export async function convertPoints(input: ConvertInput): Promise<ConvertOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/points/convert', {
      params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: { points: input.points, quoteToken: input.quoteToken },
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', conversion: readConversion((data as unknown as Envelope<Conversion> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the conversion may exist, so it is not a refusal.
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
    case 'quote_changed': {
      let quote: ConvertQuote | null = null;
      try {
        quote = readConvertQuote(reason.pointsQuote);
      } catch {
        quote = null;
      }
      return { kind: 'quote_changed', quote, message };
    }
    default:
      if (code !== null && BLOCKED_CODES.includes(code)) return { kind: 'blocked', code, message };
      return { kind: 'refused', code, message };
  }
}
