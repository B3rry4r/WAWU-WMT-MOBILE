import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { approvalRefused, credentialHeader, type ApprovalStopped, type Credential } from '@/features/device-approval/credential';

/**
 * The calls behind Capital (NUV-12, R-84), as the backend contract types them: the provider's fixed-return and share-offering
 * products, reserved for a few minutes, confirmed with the PIN, then the portfolio, the orders, each holding's movements and a
 * withdrawal. Every figure is the Hub's (the provider's own); the app computes no rate, no return and no payout.
 *
 * Two money calls, `confirm` and `withdraw`, take a `Credential` (the PIN or the phone's approval, FIX-112) and one
 * `Idempotency-Key` per intent that travels again, unchanged, on every retry. The reservation takes the key too, so a double tap
 * reserves once. Neither call ever rejects: whatever came back (or did not) is a `MoneyOutcome`.
 */
export type CapitalProduct = components['schemas']['CapitalProductView'];
export type CapitalProductDetail = components['schemas']['CapitalProductDetailView'];
export type CapitalOrder = components['schemas']['CapitalOrderView'];
export type CapitalQuote = components['schemas']['CapitalQuoteView'];
export type CapitalHolding = components['schemas']['CapitalHoldingView'];
export type CapitalPortfolio = components['schemas']['CapitalPortfolioView'];
export type CapitalTransaction = components['schemas']['CapitalTransactionView'];
export type WithdrawalPreview = components['schemas']['CapitalWithdrawalPreviewView'];
export type CapitalOrderStatus = CapitalOrder['status'];

type Envelope<T> = { statusCode: number; message: string; data: T | null };
type Page<T> = { items: T[]; nextCursor: string | null };

const unreadable = (what: string) => new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const whole = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

const STATUSES: readonly CapitalOrderStatus[] = ['reserved', 'confirming', 'invested', 'matured', 'paying_out', 'paid_out', 'expired', 'rejected', 'cancelled', 'failed', 'review'];

/** An order as the Hub sends it, or an `unreadable` error; the optional parts stay `null` when absent. */
export function readOrder(value: unknown): CapitalOrder {
  const o = value as Partial<CapitalOrder> | null;
  if (!o || typeof o !== 'object' || !filled(o.id) || !filled(o.productName) || !STATUSES.includes(o.status as CapitalOrderStatus) || !whole(o.amountKobo) || !whole(o.totalKobo)) {
    throw unreadable('investment');
  }
  return {
    ...(o as CapitalOrder),
    quote: (o.quote ?? null) as CapitalOrder['quote'],
    holding: (o.holding ?? null) as CapitalOrder['holding'],
    feeKobo: whole(o.feeKobo) ? o.feeKobo : 0,
    frozen: o.frozen === true,
    canWithdraw: o.canWithdraw === true,
    withdrawBlockedBy: (o.withdrawBlockedBy ?? null) as CapitalOrder['withdrawBlockedBy'],
    expiresAt: filled(o.expiresAt) ? o.expiresAt : null,
    confirmedAt: filled(o.confirmedAt) ? o.confirmedAt : null,
    note: filled(o.note) ? o.note : null,
  };
}

export function readProduct(value: unknown): CapitalProductDetail {
  const p = value as Partial<CapitalProductDetail> | null;
  if (!p || typeof p !== 'object' || !filled(p.id) || !filled(p.name) || (p.kind !== 'fixed_return' && p.kind !== 'share_offering')) throw unreadable('product');
  return {
    ...(p as CapitalProductDetail),
    rateBands: Array.isArray(p.rateBands) ? p.rateBands : [],
    deductibles: Array.isArray(p.deductibles) ? p.deductibles : [],
    documents: Array.isArray(p.documents) ? p.documents : [],
    orderable: p.orderable !== false,
    notOrderableReason: (p.notOrderableReason ?? null) as CapitalProduct['notOrderableReason'],
    terms: p.terms ?? { wawuMinKobo: null, wawuMaxKobo: null, wawuFeeFlatKobo: 0, wawuFeeBasisPoints: 0 },
  };
}

function readPage<T>(body: unknown, read: (row: unknown) => T, what: string): Page<T> {
  const data = (body as Envelope<Page<unknown>> | null)?.data;
  if (!data || !Array.isArray(data.items)) throw unreadable(what);
  return { items: data.items.map(read), nextCursor: filled(data.nextCursor) ? data.nextCursor : null };
}

/**
 * GET /capital/availability: `available` when new orders can be made (the admin's switch is on and the provider serves Capital);
 * `holding` when the person holds an order that is not over, so the way in stays open to read it and take it out.
 */
export type Availability = { available: boolean; holding: boolean };
export async function fetchAvailability(): Promise<Availability> {
  const body = (await unwrap(api.GET('/api/hub/capital/availability'))) as unknown as Envelope<Availability>;
  return { available: body?.data?.available === true, holding: body?.data?.holding === true };
}
export const availabilityQuery = (owner: string | null) =>
  ({ queryKey: ['capital', 'availability', owner ?? ''] as const, queryFn: fetchAvailability, staleTime: 60_000, enabled: Boolean(owner) }) as const;

export async function fetchProducts(kind?: 'fixed_return' | 'share_offering'): Promise<Page<CapitalProduct>> {
  const body = await unwrap(api.GET('/api/hub/capital/products', { params: { query: kind ? { kind } : {} } }));
  return readPage(body, (r) => readProduct(r), 'products');
}
export const productsQuery = (owner: string | null) =>
  ({ queryKey: ['capital', 'products', owner ?? ''] as const, queryFn: () => fetchProducts(), staleTime: 30_000, enabled: Boolean(owner) }) as const;

export async function fetchProduct(id: string): Promise<CapitalProductDetail> {
  const body = (await unwrap(api.GET('/api/hub/capital/products/{productId}', { params: { path: { productId: id } } }))) as unknown as Envelope<CapitalProductDetail>;
  return readProduct(body?.data);
}
export const productQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['capital', 'product', owner ?? '', id ?? ''] as const, queryFn: () => fetchProduct(id as string), staleTime: 30_000, enabled: Boolean(owner) && Boolean(id) }) as const;

export async function fetchPortfolio(): Promise<CapitalPortfolio> {
  const body = (await unwrap(api.GET('/api/hub/capital/portfolio'))) as unknown as Envelope<CapitalPortfolio>;
  const p = body?.data;
  if (!p || !whole(p.investedKobo)) throw unreadable('portfolio');
  return { ...p, returnKobo: typeof p.returnKobo === 'number' ? p.returnKobo : null, valueKobo: typeof p.valueKobo === 'number' ? p.valueKobo : null };
}
export const portfolioQuery = (owner: string | null) =>
  ({ queryKey: ['capital', 'portfolio', owner ?? ''] as const, queryFn: fetchPortfolio, staleTime: 0, enabled: Boolean(owner) }) as const;

export async function fetchOrders(show?: 'holding' | 'ended'): Promise<Page<CapitalOrder>> {
  const body = await unwrap(api.GET('/api/hub/capital/orders', { params: { query: show ? { show } : {} } }));
  return readPage(body, readOrder, 'investments');
}
export const ordersQuery = (owner: string | null, show: 'holding' | 'ended') =>
  ({ queryKey: ['capital', 'orders', owner ?? '', show] as const, queryFn: () => fetchOrders(show), staleTime: 0, enabled: Boolean(owner) }) as const;

export async function fetchOrder(id: string): Promise<CapitalOrder> {
  const body = (await unwrap(api.GET('/api/hub/capital/orders/{id}', { params: { path: { id } } }))) as unknown as Envelope<CapitalOrder>;
  return readOrder(body?.data);
}
export const orderQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['capital', 'order', owner ?? '', id ?? ''] as const, queryFn: () => fetchOrder(id as string), staleTime: 0, enabled: Boolean(owner) && Boolean(id) }) as const;

export async function fetchTransactions(id: string): Promise<Page<CapitalTransaction>> {
  const body = await unwrap(api.GET('/api/hub/capital/orders/{id}/transactions', { params: { path: { id } } }));
  return readPage(
    body,
    (r) => {
      const t = r as Partial<CapitalTransaction> | null;
      if (!t || !filled(t.id) || !filled(t.event) || typeof t.amountKobo !== 'number') throw unreadable('movements');
      return { id: t.id, event: t.event, amountKobo: t.amountKobo, accruedOn: filled(t.accruedOn) ? t.accruedOn : null, occurredAt: filled(t.occurredAt) ? t.occurredAt : null };
    },
    'movements',
  );
}
export const transactionsQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['capital', 'transactions', owner ?? '', id ?? ''] as const, queryFn: () => fetchTransactions(id as string), staleTime: 0, enabled: Boolean(owner) && Boolean(id) }) as const;

export async function fetchPreview(id: string): Promise<WithdrawalPreview> {
  const body = (await unwrap(api.GET('/api/hub/capital/orders/{id}/withdrawal', { params: { path: { id } } }))) as unknown as Envelope<WithdrawalPreview>;
  const p = body?.data;
  if (!p || !whole(p.netPayoutKobo) || !whole(p.grossInterestKobo) || typeof p.penaltyRate !== 'number') throw unreadable('payout');
  return p;
}
export const previewQuery = (owner: string | null, id: string | null) =>
  ({ queryKey: ['capital', 'preview', owner ?? '', id ?? ''] as const, queryFn: () => fetchPreview(id as string), staleTime: 0, gcTime: 0, enabled: Boolean(owner) && Boolean(id) }) as const;

// ---------------------------------------------------------------------------------------------------------------------------
// The calls that reserve and move money
// ---------------------------------------------------------------------------------------------------------------------------

type Reason = { code?: unknown; message?: unknown; triesLeft?: unknown; lockedUntil?: unknown; balanceKobo?: unknown; shortfallKobo?: unknown; minimumKobo?: unknown; maximumKobo?: unknown };

function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { reason, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

/** What a call that may move money came to. The screen decides in one place. */
export type MoneyOutcome =
  /** The Hub took it and answered with the order (its `status` says how far it got). */
  | { kind: 'done'; order: CapitalOrder }
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  | { kind: 'pin_not_set' }
  | { kind: 'no_wallet' }
  /** The reservation ran out: start again (nothing was taken). */
  | { kind: 'expired'; message: string }
  /** Short of money: the Hub's figures. */
  | { kind: 'short'; shortfallKobo: number | null; message: string }
  /** No answer that proves anything (no connection, a timeout, a server fault): send the SAME key again. */
  | { kind: 'unanswered' }
  | ApprovalStopped
  /** Any other refusal, in the Hub's own sentence, with its code. Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string; minimumKobo?: number; maximumKobo?: number };

const CREATED = 201;
const SERVER_MIN = 500;

function classify(response: Response, error: unknown, data: unknown): MoneyOutcome {
  if (response.status === CREATED) {
    try {
      return { kind: 'done', order: readOrder((data as Envelope<CapitalOrder> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: it may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  if (response.status >= SERVER_MIN) return { kind: 'unanswered' };
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
      return { kind: 'unanswered' };
    case 'reservation_expired':
      return { kind: 'expired', message };
    case 'insufficient_funds':
      return { kind: 'short', shortfallKobo: whole(reason.shortfallKobo) ? reason.shortfallKobo : null, message };
    default:
      return {
        kind: 'refused',
        code,
        message,
        ...(whole(reason.minimumKobo) ? { minimumKobo: reason.minimumKobo } : {}),
        ...(whole(reason.maximumKobo) ? { maximumKobo: reason.maximumKobo } : {}),
      };
  }
}

export type ReserveInput = { productId: string; amountKobo: number; lockInvestment: boolean; key: string };

/** POST /capital/orders: reserves for a few minutes. No money moves and no PIN is asked. */
export async function reserveOrder(input: ReserveInput): Promise<MoneyOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/capital/orders', {
      params: { header: { 'Idempotency-Key': input.key } },
      body: { productId: input.productId, amountKobo: input.amountKobo, lockInvestment: input.lockInvestment, agreedToDocuments: true },
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  return classify(result.response, result.error, result.data);
}

export type MoneyInput = { id: string; key: string } & Credential;

/** POST /capital/orders/{id}/confirm: the one step that takes the money. */
export async function confirmOrder(input: MoneyInput): Promise<MoneyOutcome> {
  const headed = await credentialHeader(input, { method: 'POST', path: `/api/hub/capital/orders/${encodeURIComponent(input.id)}/confirm` });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/capital/orders/{id}/confirm', {
      params: { path: { id: input.id }, header: { ...headed.header, 'Idempotency-Key': input.key } },
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  return classify(result.response, result.error, result.data);
}

/** POST /capital/orders/{id}/withdrawal: starts the payout. */
export async function withdrawOrder(input: MoneyInput): Promise<MoneyOutcome> {
  const headed = await credentialHeader(input, { method: 'POST', path: `/api/hub/capital/orders/${encodeURIComponent(input.id)}/withdrawal` });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/capital/orders/{id}/withdrawal', {
      params: { path: { id: input.id }, header: { ...headed.header, 'Idempotency-Key': input.key } },
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  return classify(result.response, result.error, result.data);
}
