/*
 * A stand-in for the Hub's two store routes, for tests only (IAP-02): `GET /store/products` and `POST /store/purchases`, answering in the
 * shapes of the contract (IAP-01). It records every purchase body and answers a store transaction it has seen with the first grant and
 * `alreadyGranted: true`, as the Hub does. Install it as `globalThis.fetch` with `installHub`.
 */
export type HubProduct = {
  id: string;
  platform: 'android' | 'ios';
  storeProductId: string;
  kind: 'points' | 'credits' | 'tier' | 'pass' | 'extra_products' | 'buy';
  title: string;
  subscription: boolean;
  grants: { points: number | null; credits: number | null; tierId: string | null; days: number | null; extraProducts?: number | null };
  /** A ladder product (`wawu.buy.<naira>`, R-101): the list price it sells and the store's price for it. */
  listPriceKobo?: number;
  storePriceKobo?: number;
};

/** A store credit the stand-in lists (`GET /store/credits`). */
export type HubCredit = { id: string; amountKobo: number; scope: 'question' | null; createdAt: string };

export const hub = {
  open: true,
  /** The person's account token the catalog hands the app (a stable UUID, never the user id). */
  accountToken: '7d9f0c1e-2b3a-4c5d-8e6f-a1b2c3d4e5f6',
  reason: null as 'store_not_configured' | 'store_disabled' | null,
  products: [] as HubProduct[],
  /** When set, `GET /store/products` waits for it (a store that is still loading). */
  hold: null as Promise<void> | null,
  /** What the next purchases answer: 'ok' grants; any other is a refusal code or 'network' / 'server'. */
  answer: 'ok' as string,
  message: 'The Hub said so.',
  bodies: [] as Record<string, unknown>[],
  seen: new Map<string, Record<string, unknown>>(),
  extra: {} as Record<string, unknown>,
  /** R-101: what `POST /store/intents` answers: 'ok' makes an intent; any other is a refusal code or 'network' / 'server'. */
  intent: 'ok' as string,
  intentMessage: 'The Hub said so.',
  /** Every intent body the stand-in saw. */
  intents: [] as Record<string, unknown>[],
  /** The intents it made (id to body), so a purchase can be checked against one. */
  made: new Map<string, Record<string, unknown>>(),
  credits: [] as HubCredit[],
  /** When true a purchase of a ladder product is answered as a late sale: kept as a store credit, nothing granted. */
  late: false,
  /** `GET /prices`: the list prices and the tips, with the store's price on each. */
  prices: { prices: [] as { priceNaira: number; storePriceNaira: number | null }[], tips: [] as { priceNaira: number; storePriceNaira: number | null }[] },
  /** Any other route a screen reads, by `METHOD /path`: the data it answers with (200). */
  routes: {} as Record<string, unknown>,
  /** A route answered with a refusal in the Hub's shape, by `METHOD /path`; `from` is the read it starts at (1 = every read, 2 = the second on). */
  errors: {} as Record<string, { status: number; code: string; message: string; from?: number }>,
  /** Every request the stand-in saw, as `METHOD /path`, in order (the API client keeps the first `fetch` it finds, so a call count lives here). */
  reads: [] as string[],
  reset() {
    this.open = true;
    this.reason = null;
    this.products = [];
    this.hold = null;
    this.answer = 'ok';
    this.message = 'The Hub said so.';
    this.bodies = [];
    this.seen = new Map();
    this.extra = {};
    this.intent = 'ok';
    this.intentMessage = 'The Hub said so.';
    this.intents = [];
    this.made = new Map();
    this.credits = [];
    this.late = false;
    this.prices = { prices: [], tips: [] };
    this.routes = {};
    this.errors = {};
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
  store_purchase_other_room: 409,
  store_pass_not_available: 409,
  store_unreachable: 503,
  store_account_token_missing: 422,
  store_grant_failed: 500,
  price_not_on_list: 400,
  store_intent_target_not_found: 404,
  store_intent_not_payable: 409,
  store_intent_price_changed: 409,
  store_credit_insufficient: 409,
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
    grant: { points: product.grants.points, credits: product.grants.credits, tierId: product.grants.tierId, extraProducts: product.grants.extraProducts ?? null, until: product.subscription || product.kind === 'pass' ? '2026-12-01T00:00:00.000Z' : null, communityId },
    purchasedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: product.subscription ? '2026-12-01T00:00:00.000Z' : null,
  };
}

/** What a purchase of a ladder product looks like: the goods the intent was for, or (a late sale) a store credit and nothing granted. */
function ladderView(product: HubProduct, again: boolean, intentId: string | null, intentBody: Record<string, unknown> | null, late: boolean) {
  const base = viewOf(product, again, null);
  if (late || !intentBody) {
    return { ...base, status: 'credited', grant: { points: null, credits: null, tierId: null, extraProducts: null, until: null, communityId: null }, credit: { amountKobo: product.listPriceKobo ?? 0, message: 'This purchase could not be finished in time. You have a ₦' + String((product.listPriceKobo ?? 0) / 100) + ' credit to use on Who Made This.' }, buyKind: null, intentId: null, targetId: null };
  }
  const kind = intentBody.kind as 'content' | 'tip' | 'pass' | 'question';
  const target = (intentBody.contentId ?? intentBody.creatorWawuId ?? intentBody.communityId ?? null) as string | null;
  return { ...base, grant: { ...base.grant, until: kind === 'pass' ? '2026-12-01T00:00:00.000Z' : null, communityId: kind === 'pass' ? target : null }, buyKind: kind, intentId, targetId: target };
}

export function installHub(): void {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/hub/, '');
    hub.reads.push(`${request.method} ${path}`);
    if (request.method === 'GET' && path === '/store/products') {
      if (hub.hold) await hub.hold;
      const platform = url.searchParams.get('platform');
      return json(200, {
        statusCode: 200,
        message: 'OK',
        data: { platform, available: hub.open, reason: hub.open ? null : hub.reason, accountToken: hub.accountToken, products: hub.open ? hub.products.filter((p) => p.platform === platform) : [] },
      });
    }
    if (request.method === 'GET' && path === '/prices') return json(200, { statusCode: 200, message: 'OK', data: hub.prices });
    if (request.method === 'GET' && path === '/store/credits') return json(200, { statusCode: 200, message: 'OK', data: { credits: hub.credits } });
    if (request.method === 'POST' && path === '/store/intents') {
      const body = (await request.json()) as Record<string, unknown>;
      hub.intents.push(body);
      if (hub.intent === 'network') throw new TypeError('Network request failed');
      if (hub.intent === 'server') return json(500, { statusCode: 500, message: 'The server is having trouble.', data: null });
      if (hub.intent !== 'ok') {
        const status = STATUS[hub.intent] ?? 400;
        return json(status, { statusCode: status, message: hub.intentMessage, data: null, reason: { code: hub.intent, message: hub.intentMessage } });
      }
      const product = hub.products.find((p) => p.kind === 'buy' && p.platform === body.platform && p.listPriceKobo === Number(body.listPriceNaira) * 100);
      if (!product) return json(400, { statusCode: 400, message: 'That price is not on the list.', data: null, reason: { code: 'price_not_on_list', message: 'That price is not on the list.' } });
      const intentId = `intent-${hub.made.size + 1}`;
      hub.made.set(intentId, body);
      const view: Record<string, unknown> = { intentId, productId: product.storeProductId, accountToken: hub.accountToken, expiresAt: '2026-11-01T01:00:00.000Z', purchase: null };
      if (body.payWith === 'credit') {
        const credit = hub.credits.filter((c) => (c.scope === 'question') === (body.kind === 'question') && c.amountKobo >= Number(body.listPriceNaira) * 100).sort((a, b) => a.amountKobo - b.amountKobo)[0];
        if (!credit) return json(409, { statusCode: 409, message: 'No credit covers this.', data: null, reason: { code: 'store_credit_insufficient', message: 'No credit covers this.' } });
        hub.credits = hub.credits.filter((c) => c !== credit);
        view.purchase = { ...ladderView(product, false, intentId, body, false), paidWithCredit: credit.id };
      }
      return json(201, { statusCode: 201, message: 'Created', data: view });
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
      if (product.kind === 'buy') {
        const intentId = typeof body.intentId === 'string' ? body.intentId : null;
        const intentBody = intentId ? (hub.made.get(intentId) ?? null) : null;
        return json(201, { statusCode: 201, message: 'Created', data: { ...ladderView(product, again, intentId, intentBody, hub.late), ...hub.extra } });
      }
      return json(201, { statusCode: 201, message: 'Created', data: { ...viewOf(product, again, (body.communityId as string | undefined) ?? null), ...hub.extra } });
    }
    const key = `${request.method} ${path}`;
    const refusal = hub.errors[key];
    if (refusal && hub.reads.filter((r) => r === key).length >= (refusal.from ?? 1)) {
      return json(refusal.status, { statusCode: refusal.status, message: refusal.message, data: null, reason: { code: refusal.code, message: refusal.message } });
    }
    const other = hub.routes[`${request.method} ${path}`];
    if (other !== undefined) return json(200, { statusCode: 200, message: 'OK', data: other });
    throw new Error(`no answer for ${request.method} ${path}`);
  }) as typeof fetch;
}
