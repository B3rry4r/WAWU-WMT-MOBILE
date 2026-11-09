import { api, resendsUnderKey } from '@/api/client';
import { part, type Credential } from '@/features/device-approval/credential';
import { filled, isKobo, readData, readPaymentQuote, sendPayment, unreadable, type PayOutcome, type PaymentQuote } from '@/features/feedpay/payCall';
import type { PaymentViewLike, ViewStatus } from '@/features/feedpay/usePaymentFlow';

import { fetchPass } from '@/features/community-pass/api';

/**
 * What the phone sells through the stores, paid from the wallet on the web build (WEBAPP-06, R-128): a tier, a points pack, the upload pack,
 * a WAWU Credits pack and a community pass. The Hub's existing wallet routes, the website's (R-44), at the list price with no store cut:
 * - `GET /plans/purchases/quote` and `POST /plans/purchases` (a tier, a renewal, an upgrade, a points pack, the upload pack);
 * - `GET /credits/purchase/wallet/quote`, `POST /credits/purchase/wallet`, `GET /credits/purchase/wallet/{id}`;
 * - `GET /communities/{id}/pass/quote` and `POST /communities/{id}/pass`.
 * Every payment carries the PIN as `X-Transaction-Pin`, one `Idempotency-Key` per attempt (kept by `usePaymentFlow`), and the signed quote
 * the person saw. Every figure on the sheet is the Hub's quote.
 */
export type CreditPack = 'starter' | 'popular' | 'pro';

export type WebBuySpec =
  | { kind: 'tier' | 'renew' | 'upgrade'; tierId: string }
  | { kind: 'points_pack'; packId: string }
  | { kind: 'extra_products' }
  | { kind: 'credits'; pack: CreditPack }
  | { kind: 'pass'; communityId: string };

export type WebQuote = { title: string; payment: PaymentQuote };
export type WebView = PaymentViewLike & { id: string };

/** A stable name for what is being paid, so a kept attempt is reused only for the same request. */
export const scopeOf = (spec: WebBuySpec | null): string => (spec ? `webbuy:${spec.kind}:${JSON.stringify(spec)}` : 'webbuy:');

const STATUSES: readonly ViewStatus[] = ['pending', 'failed', 'reversed', 'refunded', 'paid'];

/** A purchase as the flow reads it: a known status and the payment under it. */
export function readView(value: unknown): WebView {
  const v = value as { id?: unknown; status?: unknown; statusMessage?: unknown; payment?: { status?: unknown; delivered?: unknown; failureReason?: unknown } } | null;
  const ok = v && typeof v === 'object' && filled(v.id) && STATUSES.includes(v.status as ViewStatus) && !!v.payment && filled(v.payment.status) && typeof v.payment.delivered === 'boolean';
  if (!ok) throw unreadable('purchase');
  return {
    id: v.id as string,
    status: v.status as ViewStatus,
    statusMessage: typeof v.statusMessage === 'string' ? v.statusMessage : null,
    payment: { status: v.payment!.status as string, delivered: v.payment!.delivered as boolean, failureReason: typeof v.payment!.failureReason === 'string' ? v.payment!.failureReason : null },
  };
}

function readQuote(value: unknown, title: string): WebQuote {
  const v = value as { payment?: unknown } | null;
  if (!v || typeof v !== 'object') throw unreadable('price');
  return { title, payment: readPaymentQuote(v.payment) };
}

/** GET the quote for what is on screen. Rejects with the shared `ApiError`: `wallet_not_open` leads to Open your wallet. */
export async function askWebQuote(spec: WebBuySpec, title: string): Promise<WebQuote> {
  switch (spec.kind) {
    case 'tier':
    case 'renew':
    case 'upgrade':
      return readQuote(await readData(api.GET('/api/hub/plans/purchases/quote', { params: { query: { kind: spec.kind, tierId: spec.tierId } } }), 'price'), title);
    case 'points_pack':
      return readQuote(await readData(api.GET('/api/hub/plans/purchases/quote', { params: { query: { kind: 'points_pack', packId: spec.packId } } }), 'price'), title);
    case 'extra_products':
      return readQuote(await readData(api.GET('/api/hub/plans/purchases/quote', { params: { query: { kind: 'extra_products' } } }), 'price'), title);
    case 'credits':
      return readQuote(await readData(api.GET('/api/hub/credits/purchase/wallet/quote', { params: { query: { pack: spec.pack } } }), 'price'), title);
    case 'pass':
      return readQuote(await readData(api.GET('/api/hub/communities/{id}/pass/quote', { params: { path: { id: spec.communityId } } }), 'price'), title);
  }
}

const SHORT = 'There is not enough in your wallet for this.';

/** POST the payment. Never rejects: whatever came back (or did not) is a `PayOutcome`. */
export function sendWebPayment(spec: WebBuySpec, quote: WebQuote, key: string, credential: Credential): Promise<PayOutcome<WebView>> {
  const pay = { expectedTotalKobo: quote.payment.totalKobo, quoteToken: quote.payment.quoteToken };
  const header = (h: Record<string, string>) => ({ ...h, 'Idempotency-Key': key });
  switch (spec.kind) {
    case 'tier':
    case 'renew':
    case 'upgrade':
    case 'points_pack':
    case 'extra_products': {
      const body = {
        kind: spec.kind,
        method: 'wallet' as const,
        ...(spec.kind === 'points_pack' ? { packId: spec.packId } : spec.kind === 'extra_products' ? {} : { tierId: spec.tierId }),
        ...pay,
      };
      return sendPayment(credential, { method: 'POST', path: '/api/hub/plans/purchases', body }, (h) => api.POST('/api/hub/plans/purchases', { params: { header: header(h) }, body, fetch: resendsUnderKey }), readView, SHORT);
    }
    case 'credits': {
      const body = { pack: spec.pack, ...pay };
      return sendPayment(credential, { method: 'POST', path: '/api/hub/credits/purchase/wallet', body }, (h) => api.POST('/api/hub/credits/purchase/wallet', { params: { header: header(h) }, body, fetch: resendsUnderKey }), readView, SHORT);
    }
    case 'pass':
      return sendPayment(
        credential,
        { method: 'POST', path: `/api/hub/communities/${part(spec.communityId)}/pass`, body: pay },
        (h) => api.POST('/api/hub/communities/{id}/pass', { params: { path: { id: spec.communityId }, header: header(h) }, body: pay, fetch: resendsUnderKey }),
        readView,
        SHORT,
      );
  }
}

/** One purchase as it stands now: our own records only. A pass has no read of its own, so the room's pass says whether the person is in. */
export async function readWebPurchase(spec: WebBuySpec, id: string): Promise<WebView> {
  switch (spec.kind) {
    case 'credits':
      return readView(await readData(api.GET('/api/hub/credits/purchase/wallet/{id}', { params: { path: { id } } }), 'purchase'));
    case 'pass': {
      const pass = await fetchPass(spec.communityId);
      return { id, status: pass.active ? 'paid' : 'pending', statusMessage: null, payment: { status: pass.active ? 'completed' : 'pending', delivered: pass.active, failureReason: null } };
    }
    default:
      return readView(await readData(api.GET('/api/hub/plans/purchases/{id}', { params: { path: { id } } }), 'purchase'));
  }
}

export const webPurchaseKey = (spec: WebBuySpec | null, id: string) => ['money', 'webbuy', scopeOf(spec), id] as const;

export { isKobo };
