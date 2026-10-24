import { api, resendsUnderKey, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';
import { approvalRefused, credentialHeader, type ApprovalStopped, type Credential } from '@/features/device-approval/credential';

/**
 * The calls behind Buy points (PT4, PT4b, PT4c), as the backend contract types them (POINTS-02, TIER-05).
 *
 * - `GET /plans`: the packs (`packs`: id, points, price) and, for the Founding Maker's bonus, each tier's `packBonusPercent`.
 * - `GET /plans/purchases/quote?kind=points_pack&packId=`: the pack's price and points, the bonus points of a running tier, how long
 *   bought points last, and the wallet payment's own quote (the Bank charge, the total, the balance, the shortfall, the token).
 * - `POST /plans/purchases` with `kind: points_pack`: the purchase, by wallet or by bank transfer. The PIN is the `X-Transaction-Pin`
 *   header and nothing else keeps it; the `Idempotency-Key` is one per intent and travels again, unchanged, on every retry.
 * - `GET /plans/purchases/{id}`: one purchase as it stands now: what the app reads after `pending` and while a transfer is awaited.
 *
 * The Hub's refusals carry more than a code (`reason.triesLeft`, `reason.paymentQuote`, `balanceKobo`), and the shared `ApiError`
 * keeps only the code, so the purchase reads its own answer and hands the screen one of `BuyOutcome` (as Send and Convert do).
 */
export type PlansView = components['schemas']['PlansView'];
export type PackView = components['schemas']['PlanPackView'];
export type PackQuote = components['schemas']['PointsPackQuoteView'];
export type PackPurchase = components['schemas']['PointsPackPurchaseView'];
export type PaymentQuote = components['schemas']['PaymentQuoteView'];

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** GET /me/tier, as Buy points reads it: the tier the person holds now (its id and name), or null for a person with none or an ended one. */
export async function fetchRunningTier(): Promise<{ id: string; name: string | null } | null> {
  const body = (await unwrap(api.GET('/api/hub/me/tier'))) as unknown as Envelope<components['schemas']['MyTierView']>;
  const v = body?.data;
  if (!v || typeof v !== 'object' || !['none', 'active', 'ending', 'ended'].includes(v.state)) throw unreadable('tier');
  if ((v.state !== 'active' && v.state !== 'ending') || !v.tier || !filled(v.tier.id)) return null;
  return { id: v.tier.id, name: filled(v.tier.name) ? v.tier.name.trim() : null };
}

export const runningTierQuery = (owner: string | null) =>
  ({ queryKey: ['plans', 'running-tier', owner ?? ''] as const, queryFn: fetchRunningTier, staleTime: 0, enabled: Boolean(owner), retry: false }) as const;

/** The packs the Hub sells and the tiers' bonus percents, or nothing (an answer that is not whole is refused, never drawn half empty). */
export function readPlans(value: unknown): { currency: 'NGN' | 'USD'; packs: PackView[]; bonusByTier: Record<string, number> } {
  const v = value as Partial<PlansView> | null;
  if (!v || typeof v !== 'object' || (v.currency !== 'NGN' && v.currency !== 'USD') || !Array.isArray(v.packs)) throw unreadable('points packs');
  const packs = v.packs.map((p) => {
    const pack = p as Partial<PackView> | null;
    if (!pack || !filled(pack.id) || !whole(pack.points) || pack.points <= 0 || !whole(pack.priceMinor) || pack.priceMinor <= 0) throw unreadable('points packs');
    return { id: pack.id, points: pack.points, priceMinor: pack.priceMinor };
  });
  const bonusByTier: Record<string, number> = {};
  for (const t of Array.isArray(v.tiers) ? v.tiers : []) if (t && filled(t.id) && whole(t.packBonusPercent)) bonusByTier[t.id] = t.packBonusPercent;
  return { currency: v.currency, packs, bonusByTier };
}

export async function fetchPlans() {
  const body = (await unwrap(api.GET('/api/hub/plans'))) as unknown as Envelope<PlansView>;
  return readPlans(body?.data);
}

export const plansQuery = (owner: string | null) =>
  ({ queryKey: ['plans', owner ?? ''] as const, queryFn: fetchPlans, staleTime: 0, enabled: Boolean(owner) }) as const;

/** What a quote must hold for a purchase to carry it: whole-kobo money, whole points and the token. */
export function readPackQuote(value: unknown): PackQuote {
  const q = value as Partial<PackQuote> | null;
  const pay = q?.payment as Partial<PaymentQuote> | undefined;
  const ok =
    q &&
    typeof q === 'object' &&
    q.kind === 'points_pack' &&
    filled(q.packId) &&
    q.currency === 'NGN' &&
    whole(q.packMinor) &&
    whole(q.points) &&
    whole(q.bonusPercent) &&
    whole(q.bonusPoints) &&
    whole(q.totalPoints) &&
    whole(q.expiryDays) &&
    pay &&
    whole(pay.priceKobo) &&
    whole(pay.totalKobo) &&
    pay.fee &&
    whole(pay.fee.totalFeeKobo) &&
    filled(pay.quoteToken) &&
    filled(pay.expiresAt);
  if (!ok) throw unreadable('pack price');
  return q as PackQuote;
}

/** GET /plans/purchases/quote for one pack. */
export async function fetchPackQuote(packId: string): Promise<PackQuote> {
  const body = (await unwrap(api.GET('/api/hub/plans/purchases/quote', { params: { query: { kind: 'points_pack' as const, packId } } }))) as unknown as Envelope<PackQuote>;
  return readPackQuote(body?.data);
}

const STATUSES = ['pending', 'failed', 'reversed', 'expired', 'paid', 'awaiting_transfer'] as const;

/** A purchase as the screens read it: a known status and whole figures. Anything else is refused, never drawn. */
export function readPurchase(value: unknown): PackPurchase {
  const p = value as Partial<PackPurchase> | null;
  const ok =
    p &&
    typeof p === 'object' &&
    p.kind === 'points_pack' &&
    filled(p.id) &&
    filled(p.packId) &&
    (p.method === 'wallet' || p.method === 'transfer') &&
    STATUSES.includes(p.status as (typeof STATUSES)[number]) &&
    whole(p.amountMinor) &&
    whole(p.points) &&
    whole(p.bonusPoints) &&
    filled(p.createdAt);
  if (!ok) throw unreadable('purchase');
  return p as PackPurchase;
}

/** GET /plans/purchases/{id}. */
export async function fetchPurchase(id: string): Promise<PackPurchase> {
  const body = (await unwrap(api.GET('/api/hub/plans/purchases/{id}', { params: { path: { id } } }))) as unknown as Envelope<PackPurchase>;
  return readPurchase(body?.data);
}

export const purchaseQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['plans', 'purchase', owner ?? '', id ?? ''] as const, queryFn: () => fetchPurchase(id as string), staleTime: 0, enabled: Boolean(owner) && Boolean(id) }) as const;

/** Why the Hub did not take the purchase, in the shapes the screen branches on. */
export type BuyOutcome =
  /** The Hub took the request and answered with the purchase. Its `status` says how it stands: paid, pending, awaiting_transfer, failed. */
  | { kind: 'done'; purchase: PackPurchase }
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  | { kind: 'pin_not_set' }
  | { kind: 'no_wallet' }
  /** `402 insufficient_funds`: the bank's figures; nothing moved. */
  | { kind: 'insufficient_funds'; balanceKobo: number; totalKobo: number; shortfallKobo: number }
  /** `409 quote_changed`: what the person was shown is not what is true now. The screen asks for the quote again and shows it; nothing is sent until the person taps Pay again. */
  | { kind: 'quote_changed'; message: string }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME request again. */
  | { kind: 'unanswered' }
  /** The approval was closed, or this phone or the Hub refused it (FIX-112): no request was taken; the screen changes nothing it holds. */
  | ApprovalStopped
  /** Any other refusal, in the Hub's own sentence. Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

export type BuyInput = {
  packId: string;
  method: 'wallet' | 'transfer';
  /** `payment.totalKobo` and `payment.quoteToken` of the quote the person saw. */
  expectedTotalKobo: number;
  quoteToken: string;
  /** One per intent, kept across retries of the same intent. */
  key: string;
} & Credential;

const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;

type Reason = { code?: unknown; message?: unknown; triesLeft?: unknown; lockedUntil?: unknown; balanceKobo?: unknown; totalKobo?: unknown; shortfallKobo?: unknown };

function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { reason, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

/**
 * POST /plans/purchases for a points pack. Never rejects: whatever came back (or did not) is a `BuyOutcome`, so the screen decides in
 * one place. A request that got no answer is `unanswered`, and so is every 5xx: money may have moved, so only the SAME key is safe to
 * send again (the contract's rule, `PinSheet`'s `unanswered`).
 */
export async function buyPack(input: BuyInput): Promise<BuyOutcome> {
  const body = { kind: 'points_pack' as const, packId: input.packId, method: input.method, expectedTotalKobo: input.expectedTotalKobo, quoteToken: input.quoteToken };
  const headed = await credentialHeader(input, { method: 'POST', path: '/api/hub/plans/purchases', body });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/plans/purchases', {
      params: { header: { ...headed.header, 'Idempotency-Key': input.key } },
      body,
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', purchase: readPurchase((data as unknown as Envelope<PackPurchase> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the purchase may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  if (response.status >= HTTP_SERVER_MIN) return { kind: 'unanswered' };
  if (approvalRefused(error)) return { kind: 'approval_failed' };
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
    case 'payment_in_progress':
      return { kind: 'unanswered' };
    case 'insufficient_funds':
      if (whole(reason.balanceKobo) && whole(reason.totalKobo) && whole(reason.shortfallKobo)) {
        return { kind: 'insufficient_funds', balanceKobo: reason.balanceKobo, totalKobo: reason.totalKobo, shortfallKobo: reason.shortfallKobo };
      }
      return { kind: 'refused', code, message: message || 'There is not enough in your wallet for this.' };
    case 'quote_changed':
      return { kind: 'quote_changed', message };
    default:
      return { kind: 'refused', code, message: message || 'This purchase was not taken. Nothing left your wallet.' };
  }
}
