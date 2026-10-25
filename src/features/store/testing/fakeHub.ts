/*
 * A stand-in for the Hub's two store routes, for tests only (IAP-02): `GET /store/products` and `POST /store/purchases`, answering in the
 * shapes of the contract (IAP-01). It records every purchase body and answers a store transaction it has seen with the first grant and
 * `alreadyGranted: true`, as the Hub does. Install it as `globalThis.fetch` with `installHub`.
 */
export type HubProduct = {
  id: string;
  platform: 'android' | 'ios';
  storeProductId: string;
  kind: 'points' | 'credits' | 'tier' | 'pass';
  title: string;
  subscription: boolean;
  grants: { points: number | null; credits: number | null; tierId: string | null; days: number | null };
};

export const hub = {
  open: true,
  /** The person's account token the catalog hands the app (a stable UUID, never the user id). */
  accountToken: '7d9f0c1e-2b3a-4c5d-8e6f-a1b2c3d4e5f6',
  reason: null as 'store_not_configured' | 'store_disabled' | null,
  products: [] as HubProduct[],
  /** What the next purchases answer: 'ok' grants; any other is a refusal code or 'network' / 'server'. */
  answer: 'ok' as string,
  message: 'The Hub said so.',
  bodies: [] as Record<string, unknown>[],
  seen: new Map<string, Record<string, unknown>>(),
  extra: {} as Record<string, unknown>,
  /** Any other route a screen reads, by `METHOD /path`: the data it answers with (200). */
  routes: {} as Record<string, unknown>,
  /** Every request the stand-in saw, as `METHOD /path`, in order (the API client keeps the first `fetch` it finds, so a call count lives here). */
  reads: [] as string[],
  reset() {
    this.open = true;
    this.reason = null;
    this.products = [];
    this.answer = 'ok';
    this.message = 'The Hub said so.';
    this.bodies = [];
    this.seen = new Map();
    this.extra = {};
    this.routes = {};
    this.reads = [];
  },
};

const STATUS: Record<string, number> = {
  store_not_configured: 503,
  store_disabled: 409,
  store_product_unknown: 404,
  store_receipt_missing: 400,
  store_purchase_invalid: 422,
  store_purchase_pending: 409,
  store_purchase_taken: 409,
  store_pass_not_available: 409,
  store_unreachable: 503,
  store_account_token_missing: 422,
  store_grant_failed: 500,
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** What a granted purchase of this product looks like. */
export function viewOf(product: HubProduct, alreadyGranted: boolean, communityId: string | null) {
  return {
    id: `purchase-${product.storeProductId}`,
    platform: product.platform,
    storeProductId: product.storeProductId,
    kind: product.kind,
    status: 'granted',
    alreadyGranted,
    grant: { points: product.grants.points, credits: product.grants.credits, tierId: product.grants.tierId, until: product.subscription ? '2026-12-01T00:00:00.000Z' : null, communityId },
    purchasedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: product.subscription ? '2026-12-01T00:00:00.000Z' : null,
  };
}

export function installHub(): void {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/hub/, '');
    hub.reads.push(`${request.method} ${path}`);
    if (request.method === 'GET' && path === '/store/products') {
      const platform = url.searchParams.get('platform');
      return json(200, {
        statusCode: 200,
        message: 'OK',
        data: { platform, available: hub.open, reason: hub.open ? null : hub.reason, accountToken: hub.accountToken, products: hub.open ? hub.products.filter((p) => p.platform === platform) : [] },
      });
    }
    if (request.method === 'POST' && path === '/store/purchases') {
      const body = (await request.json()) as Record<string, unknown>;
      hub.bodies.push(body);
      if (hub.answer === 'network') throw new TypeError('Network request failed');
      if (hub.answer === 'server') return json(500, { statusCode: 500, message: 'The server is having trouble.', data: null });
      if (hub.answer !== 'ok') {
        const status = STATUS[hub.answer] ?? 400;
        return json(status, { statusCode: status, message: hub.message, data: null, reason: { code: hub.answer, message: hub.message } });
      }
      const product = hub.products.find((p) => p.storeProductId === body.productId);
      if (!product) return json(404, { statusCode: 404, message: 'That product is not for sale.', data: null, reason: { code: 'store_product_unknown', message: 'That product is not for sale.' } });
      const key = `${String(body.platform)}:${String(body.purchaseToken ?? body.transactionId)}`;
      const again = hub.seen.has(key);
      hub.seen.set(key, body);
      return json(201, { statusCode: 201, message: 'Created', data: { ...viewOf(product, again, (body.communityId as string | undefined) ?? null), ...hub.extra } });
    }
    const other = hub.routes[`${request.method} ${path}`];
    if (other !== undefined) return json(200, { statusCode: 200, message: 'OK', data: other });
    throw new Error(`no answer for ${request.method} ${path}`);
  }) as typeof fetch;
}
