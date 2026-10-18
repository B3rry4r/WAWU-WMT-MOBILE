import { api, resendsUnderKey, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The calls behind choosing a tier and paying for it (ME-12: VF5 to VF7a) and adding five products (VERIFY-05: VF13), as the Hub's
 * contract types them (TIER-03, TIER-04, TIER-05):
 *
 * - `GET /plans`: the tiers (`id`, `name`, `priceMinor`, `days`, `products`, `bonusPoints`, `eventPass`, `preselected`), the checkout
 *   offer (`checkoutBump`) and the five-more offer (`extraProducts`). Every figure on screen is read from here, never typed.
 * - `GET /plans/purchases/quote`: what the purchase costs the person now (an upgrade is the difference), the Bank charge, the total,
 *   the wallet's balance and shortfall, and the token the purchase sends back.
 * - `POST /plans/purchases`: the purchase. The PIN is the `X-Transaction-Pin` header and nothing keeps it; the `Idempotency-Key` is one
 *   per attempt and travels again, unchanged, on every retry of that attempt.
 * - `GET /plans/purchases/{id}`: one purchase as it stands now (read after `pending`, and while a bank transfer is awaited).
 *
 * The Hub's refusals carry more than a code (`reason.triesLeft`, `balanceKobo`, `shortfallKobo`), and the shared `ApiError` keeps only
 * the code, so the purchase reads its own answer and hands the screen one `PurchaseOutcome` (as Buy points and Send do).
 */
export type PlansView = components['schemas']['PlansView'];
export type PlanTier = components['schemas']['PlanTierView'];
type TierQuoteBody = components['schemas']['PlanPurchaseQuoteView'];
type ExtraQuoteBody = components['schemas']['ExtraProductsQuoteView'];
type PlanGrant = components['schemas']['PlanPurchaseGrantView'];
type PlanTransfer = components['schemas']['PlanPurchaseTransferView'];
export type PlanEventPass = components['schemas']['PlanEventPassView'];

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** What is being bought: a tier (first time, again after it ended, or a step up) or five more products. */
export type PurchaseTarget = { kind: 'tier' | 'renew' | 'upgrade'; tierId: string; bump: boolean } | { kind: 'extra_products' };

export const isTierTarget = (target: PurchaseTarget): target is Extract<PurchaseTarget, { tierId: string }> => target.kind !== 'extra_products';

/** The key two attempts at the same thing share while it is the same thing: it names the target, not the attempt. */
export const targetId = (target: PurchaseTarget): string => (isTierTarget(target) ? `${target.kind}:${target.tierId}:${target.bump ? 'bump' : 'plain'}` : 'extra_products');

/** The plans, the checkout offer and the five-more offer. An answer that is not whole is refused, never drawn as "no tiers". */
export type Plans = {
  currency: 'NGN' | 'USD';
  tiers: PlanTier[];
  extraProducts: { count: number; priceMinor: number };
  checkoutBump: { points: number; priceMinor: number };
};

export function readPlans(value: unknown): Plans {
  const v = value as Partial<PlansView> | null;
  if (!v || typeof v !== 'object' || (v.currency !== 'NGN' && v.currency !== 'USD') || !Array.isArray(v.tiers)) throw unreadable('tiers');
  const tiers = v.tiers.map((t) => {
    const tier = t as Partial<PlanTier> | null;
    if (!tier || !filled(tier.id) || !filled(tier.name) || !whole(tier.priceMinor) || tier.priceMinor <= 0 || !whole(tier.days) || !whole(tier.products) || !whole(tier.bonusPoints)) throw unreadable('tiers');
    return tier as PlanTier;
  });
  const extra = v.extraProducts;
  const bump = v.checkoutBump;
  if (!extra || !whole(extra.count) || !whole(extra.priceMinor) || !bump || !whole(bump.points) || !whole(bump.priceMinor)) throw unreadable('tiers');
  return { currency: v.currency, tiers, extraProducts: { count: extra.count, priceMinor: extra.priceMinor }, checkoutBump: { points: bump.points, priceMinor: bump.priceMinor } };
}

export async function fetchPlans(): Promise<Plans> {
  const body = (await unwrap(api.GET('/api/hub/plans'))) as unknown as Envelope<PlansView>;
  return readPlans(body?.data);
}

export const plansQuery = (owner: string | null) => ({ queryKey: ['plans', 'tiers', owner ?? ''] as const, queryFn: fetchPlans, staleTime: 0, enabled: Boolean(owner) }) as const;

/** The quote, as the screens read it: whole kobo, the parts of the total and the token. Both kinds of quote come out in this one shape. */
export type PurchaseQuote = {
  target: PurchaseTarget;
  /** The tier's price (the difference, on an upgrade) or the five-more price. */
  planKobo: number;
  /** The checkout offer's price and points when it is in the quote, else 0. */
  bumpKobo: number;
  bumpPoints: number;
  /** Five-more only: the places added, and the places the person has now and would have. */
  products: number | null;
  productsAllowed: number | null;
  productsAllowedAfter: number | null;
  priceKobo: number;
  feeKobo: number;
  totalKobo: number;
  balanceKobo: number | null;
  shortfallKobo: number | null;
  quoteToken: string;
  expiresAt: string;
};

function readPayment(p: unknown): Pick<PurchaseQuote, 'priceKobo' | 'feeKobo' | 'totalKobo' | 'balanceKobo' | 'shortfallKobo' | 'quoteToken' | 'expiresAt'> {
  const pay = p as Partial<components['schemas']['PaymentQuoteView']> | undefined;
  if (!pay || !whole(pay.priceKobo) || !whole(pay.totalKobo) || !pay.fee || !whole(pay.fee.totalFeeKobo) || !filled(pay.quoteToken) || !filled(pay.expiresAt)) throw unreadable('price');
  const balanceKobo = whole(pay.balanceKobo) ? pay.balanceKobo : null;
  const shortfallKobo = whole(pay.shortfallKobo) ? pay.shortfallKobo : null;
  return { priceKobo: pay.priceKobo, feeKobo: pay.fee.totalFeeKobo, totalKobo: pay.totalKobo, balanceKobo, shortfallKobo, quoteToken: pay.quoteToken, expiresAt: pay.expiresAt };
}

export function readQuote(target: PurchaseTarget, value: unknown): PurchaseQuote {
  if (isTierTarget(target)) {
    const q = value as Partial<TierQuoteBody> | null;
    if (!q || typeof q !== 'object' || q.currency !== 'NGN' || q.kind !== target.kind || !whole(q.planMinor) || !whole(q.bumpMinor) || !whole(q.bumpPoints)) throw unreadable('price');
    return { target, planKobo: q.planMinor, bumpKobo: q.bumpMinor, bumpPoints: q.bumpPoints, products: null, productsAllowed: null, productsAllowedAfter: null, ...readPayment(q.payment) };
  }
  const q = value as Partial<ExtraQuoteBody> | null;
  if (!q || typeof q !== 'object' || q.currency !== 'NGN' || q.kind !== 'extra_products' || !whole(q.extraMinor) || !whole(q.products) || !whole(q.productsAllowed) || !whole(q.productsAllowedAfter)) throw unreadable('price');
  return { target, planKobo: q.extraMinor, bumpKobo: 0, bumpPoints: 0, products: q.products, productsAllowed: q.productsAllowed, productsAllowedAfter: q.productsAllowedAfter, ...readPayment(q.payment) };
}

/** GET /plans/purchases/quote for one target. */
export async function fetchQuote(target: PurchaseTarget): Promise<PurchaseQuote> {
  const query = isTierTarget(target) ? { kind: target.kind, tierId: target.tierId, bump: target.bump } : { kind: 'extra_products' as const };
  const body = (await unwrap(api.GET('/api/hub/plans/purchases/quote', { params: { query } }))) as unknown as Envelope<unknown>;
  return readQuote(target, body?.data);
}

export const PURCHASE_STATUSES = ['pending', 'failed', 'reversed', 'refunded', 'expired', 'paid', 'awaiting_transfer'] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export type PurchaseTransfer = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  totalKobo: number;
  /** What the wallet still lacks: the amount to send. Null when the bank was not asked; the total then stands. */
  amountNeededKobo: number | null;
};

export type PurchaseGrant = {
  tierName: string | null;
  /** The tier's badge: `numbered` is true for the Founding Maker (the number itself is not served, G-421). */
  numbered: boolean;
  activeUntil: string;
  productsAllowed: number;
  bonusPoints: number;
  bumpPoints: number;
  eventPass: PlanEventPass | null;
};

/** A purchase as the screens read it: a known status and whole figures. Anything else is refused, never drawn. */
export type Purchase = {
  id: string;
  kind: 'tier' | 'renew' | 'upgrade' | 'extra_products';
  method: 'wallet' | 'transfer';
  status: PurchaseStatus;
  statusMessage: string | null;
  amountKobo: number;
  transfer: PurchaseTransfer | null;
  grant: PurchaseGrant | null;
  /** Five-more only: the places added. */
  products: number | null;
  /** Five-more only: the places the person has after it is granted. */
  productsAllowed: number | null;
};

function readTransfer(value: PlanTransfer | null | undefined): PurchaseTransfer | null {
  if (!value) return null;
  if (!filled(value.accountNumber) || !filled(value.accountName) || !filled(value.bankName) || !whole(value.totalKobo)) throw unreadable('purchase');
  return { accountNumber: value.accountNumber, accountName: value.accountName, bankName: value.bankName, totalKobo: value.totalKobo, amountNeededKobo: whole(value.amountNeededKobo) ? value.amountNeededKobo : null };
}

function readGrant(value: PlanGrant | null | undefined): PurchaseGrant | null {
  if (!value) return null;
  if (!value.tier || !whole(value.productsAllowed) || !whole(value.bonusPoints) || !whole(value.bumpPoints) || !filled(value.activeUntil)) throw unreadable('purchase');
  return {
    tierName: filled(value.tier.name) ? value.tier.name.trim() : null,
    numbered: value.tier.badge?.numbered === true,
    activeUntil: value.activeUntil,
    productsAllowed: value.productsAllowed,
    bonusPoints: value.bonusPoints,
    bumpPoints: value.bumpPoints,
    eventPass: value.eventPass && filled(value.eventPass.name) ? value.eventPass : null,
  };
}

/** What the three purchase views (a tier, a transfer order, five more) share on the wire, read loosely and checked below. */
type PurchaseWire = {
  id?: unknown;
  kind?: unknown;
  method?: unknown;
  status?: unknown;
  statusMessage?: unknown;
  amountMinor?: unknown;
  transfer?: PlanTransfer | null;
  grant?: (PlanGrant & { productsAllowed?: unknown }) | null;
  products?: unknown;
};

export function readPurchase(value: unknown): Purchase {
  const p = value as PurchaseWire | null;
  if (
    !p ||
    typeof p !== 'object' ||
    !filled(p.id) ||
    !(p.kind === 'tier' || p.kind === 'renew' || p.kind === 'upgrade' || p.kind === 'extra_products') ||
    !(p.method === 'wallet' || p.method === 'transfer') ||
    !PURCHASE_STATUSES.includes(p.status as PurchaseStatus) ||
    !whole(p.amountMinor)
  ) {
    throw unreadable('purchase');
  }
  const extra = p.kind === 'extra_products';
  return {
    id: p.id,
    kind: p.kind,
    method: p.method,
    status: p.status as PurchaseStatus,
    statusMessage: filled(p.statusMessage) ? p.statusMessage.trim() : null,
    amountKobo: p.amountMinor,
    transfer: readTransfer(p.transfer),
    grant: extra ? null : readGrant(p.grant),
    products: extra && whole(p.products) ? p.products : null,
    productsAllowed: extra && p.grant && whole(p.grant.productsAllowed) ? p.grant.productsAllowed : null,
  };
}

/** GET /plans/purchases/{id}. */
export async function fetchPurchase(id: string): Promise<Purchase> {
  const body = (await unwrap(api.GET('/api/hub/plans/purchases/{id}', { params: { path: { id } } }))) as unknown as Envelope<unknown>;
  return readPurchase(body?.data);
}

export const purchaseQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['plans', 'purchase', owner ?? '', id ?? ''] as const, queryFn: () => fetchPurchase(id as string), staleTime: 0, enabled: Boolean(owner) && Boolean(id) }) as const;

/** Why the Hub did not take the purchase, in the shapes the screen branches on. */
export type PurchaseOutcome =
  /** The Hub took the request and answered with the purchase. Its `status` says how it stands: paid, pending, awaiting_transfer, failed. */
  | { kind: 'done'; purchase: Purchase }
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  | { kind: 'pin_not_set' }
  | { kind: 'no_wallet' }
  /** `402 insufficient_funds`: the bank's figures; nothing moved. */
  | { kind: 'insufficient_funds'; balanceKobo: number; totalKobo: number; shortfallKobo: number }
  /** `409 quote_changed`: what the person was shown is not what is true now. The screen asks again and shows it; nothing is sent until the next Pay. */
  | { kind: 'quote_changed'; message: string }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME request again. */
  | { kind: 'unanswered' }
  /** Any other refusal, in the Hub's own sentence (a payment still going through, a tier already running, a plan that changed, no tier for five more). Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

export type PurchaseInput = {
  target: PurchaseTarget;
  method: 'wallet' | 'transfer';
  /** `totalKobo` and `quoteToken` of the quote the person saw. */
  expectedTotalKobo: number;
  quoteToken: string;
  /** One per attempt, kept across retries of the same attempt. */
  key: string;
  pin: string;
};

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

/** The request body for a target: a tier names its tier and whether the offer is bought; five more names neither. */
export function purchaseBody(input: Pick<PurchaseInput, 'target' | 'method' | 'expectedTotalKobo' | 'quoteToken'>): components['schemas']['PlanPurchaseDto'] {
  const { target, method, expectedTotalKobo, quoteToken } = input;
  if (isTierTarget(target)) return { kind: target.kind, tierId: target.tierId, bump: target.bump, method, expectedTotalKobo, quoteToken };
  return { kind: 'extra_products', method, expectedTotalKobo, quoteToken };
}

/**
 * POST /plans/purchases. Never rejects: whatever came back (or did not) is a `PurchaseOutcome`, so the screen decides in one place. A
 * request that got no answer is `unanswered`, and so is every 5xx: money may have moved, so only the SAME key is safe to send again.
 */
export async function buy(input: PurchaseInput): Promise<PurchaseOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/plans/purchases', {
      params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: purchaseBody(input),
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', purchase: readPurchase((data as unknown as Envelope<unknown> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the purchase may exist, so it is not a refusal.
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
      // The same key is still being worked on: no answer that proves anything yet, so the same request goes again.
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
