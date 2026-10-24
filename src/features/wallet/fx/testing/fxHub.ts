/**
 * A stand-in for the Hub's foreign-currency routes (`/money/fx/...`), in the shapes the contract gives (WALLET-21), for the tests of the
 * Wallet tabs, Swap, Receive and Send. It answers the way the Hub does on dev: a quote held for the seconds the test sets, a swap or send
 * answered again for a key it knows (never done twice), a wrong PIN, an expired quote, a provider that declines. Made-up numbers and
 * addresses only; never a real account.
 */
export const USD_ID = 'a0000000-0000-4000-8000-0000000000a1';
export const USDT_ID = 'a0000000-0000-4000-8000-0000000000b1';
export const USDC_ID = 'a0000000-0000-4000-8000-0000000000c1';
export const ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
export const OUTSIDE = '0x52908400098527886E0F7030069857D2E4169EE7';
export const SWAP_ID = 'f0000000-0000-4000-8000-0000000000e1';
export const SEND_ID = 'f0000000-0000-4000-8000-0000000000e2';

const FIAT = [
  ['USD', 'US dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British pound'],
  ['CAD', 'Canadian dollar'],
  ['AED', 'UAE dirham'],
  ['GHS', 'Ghana cedi'],
] as const;

export const currenciesBody = (opts: { openAccount?: boolean; off?: string[] } = {}) => ({
  currencies: [
    ...FIAT.map(([code, name]) => ({ code, name, kind: 'fiat', decimals: 2, chains: [], enabled: !opts.off?.includes(code) })),
    { code: 'USDT', name: 'Tether', kind: 'stablecoin', decimals: 2, chains: ['eth', 'base', 'matic', 'sol'], enabled: true },
    { code: 'USDC', name: 'USD Coin', kind: 'stablecoin', decimals: 2, chains: ['eth', 'base', 'matic', 'sol'], enabled: true },
    { code: 'RLUSD', name: 'Ripple USD', kind: 'stablecoin', decimals: 2, chains: ['eth'], enabled: false },
  ],
  products: { openAccount: opts.openAccount ?? true, swap: true, cryptoSend: true },
  naira: { code: 'NGN', decimals: 2 },
});

const fiatDetails = { status: 'active', beneficiaryName: 'Ada Eze', accountNumber: '9900004410', routingNumber: '026000999', swiftCode: 'TESTUS33', iban: null, sortCode: null, bankName: 'Lead Test Bank', bankAddress: '1 Test Street, Kansas City', chain: null, address: null };
const coinDetails = (chain: string, address: string | null) => ({ status: address ? 'active' : 'pending', beneficiaryName: null, accountNumber: null, routingNumber: null, swiftCode: null, iban: null, sortCode: null, bankName: null, bankAddress: null, chain, address });

export const usdAccount = { id: USD_ID, currency: 'USD', kind: 'fiat', decimals: 2, chain: null, status: 'open', balance: { currency: 'USD', availableMinor: 124_050, bookedMinor: 124_050 }, details: fiatDetails, openedAt: '2026-10-20T09:00:00.000Z' };
export const usdtAccount = { id: USDT_ID, currency: 'USDT', kind: 'stablecoin', decimals: 2, chain: 'eth', status: 'open', balance: { currency: 'USDT', availableMinor: 32_000, bookedMinor: 32_000 }, details: coinDetails('eth', ADDRESS), openedAt: '2026-10-20T09:05:00.000Z' };
export const usdcAccount = { id: USDC_ID, currency: 'USDC', kind: 'stablecoin', decimals: 2, chain: 'base', status: 'opening', balance: null, details: coinDetails('base', null), openedAt: '2026-10-21T09:05:00.000Z' };

export type SwapMode = 'ok' | 'pending' | 'expired' | 'no_answer_first' | 'declined';
export type SendMode = 'ok' | 'declined' | 'pending';

export const hub = {
  accounts: [] as Record<string, unknown>[],
  currencies: currenciesBody() as ReturnType<typeof currenciesBody>,
  accountsFault: null as null | { status: number; code: string; message: string },
  quoteSeconds: 90,
  quotes: [] as Record<string, unknown>[],
  swapMode: 'ok' as SwapMode,
  sendMode: 'ok' as SendMode,
  wrongPinFirst: false,
  swaps: [] as { key: string | null; pin: string | null; body: Record<string, unknown> }[],
  sends: [] as { key: string | null; pin: string | null; body: Record<string, unknown> }[],
  opened: [] as Record<string, unknown>[],
  sendQuotes: [] as string[],
  transactions: [] as Record<string, unknown>[],
  /** Operations by Idempotency-Key: a key the Hub knows is answered with the first one. */
  done: {} as Record<string, unknown>,
  pins: 0,
};

export function resetFxHub() {
  hub.accounts = [usdAccount, usdtAccount, usdcAccount];
  hub.currencies = currenciesBody();
  hub.accountsFault = null;
  hub.quoteSeconds = 90;
  hub.quotes = [];
  hub.swapMode = 'ok';
  hub.sendMode = 'ok';
  hub.wrongPinFirst = false;
  hub.swaps = [];
  hub.sends = [];
  hub.opened = [];
  hub.sendQuotes = [];
  hub.transactions = [];
  hub.done = {};
  hub.pins = 0;
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown, status = 200) => json(status, { statusCode: status, message: status === 201 ? 'Created' : 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const swapView = (q: Record<string, unknown>, status: string) => ({
  id: SWAP_ID,
  status,
  fromCurrency: q.fromCurrency,
  toCurrency: q.toCurrency,
  fromAccountId: q.fromAccountId,
  toAccountId: q.toAccountId,
  amountFromMinor: q.amountFromMinor,
  amountToMinor: q.amountToMinor,
  fromDecimals: q.fromDecimals,
  toDecimals: q.toDecimals,
  rate: q.rate,
  providerFeeMinor: 0,
  wawuFeeMinor: q.wawuFeeMinor,
  failureReason: null,
  createdAt: '2026-10-24T09:00:00.000Z',
  completedAt: status === 'completed' ? '2026-10-24T09:00:02.000Z' : null,
});

/** Answers a request under `/api/hub/money/fx`, or null when the path is not one of them. `path` has no `/api/hub` prefix. */
export async function fxFetch(request: Request, path: string): Promise<Response | null> {
  if (!path.startsWith('/money/fx/')) return null;
  const method = request.method;
  const url = new URL(request.url);
  const body = method === 'POST' ? ((await request.clone().json().catch(() => ({}))) as Record<string, unknown>) : {};
  if (path === '/money/fx/currencies') return ok(hub.currencies);
  if (path === '/money/fx/accounts' && method === 'GET') {
    if (hub.accountsFault) return refuse(hub.accountsFault.status, { code: hub.accountsFault.code, message: hub.accountsFault.message });
    return ok({ accounts: hub.accounts });
  }
  if (path === '/money/fx/accounts' && method === 'POST') {
    hub.opened.push(body);
    const made = { id: `a0000000-0000-4000-8000-00000000${String(100 + hub.opened.length)}`, currency: body.currency, kind: body.chain ? 'stablecoin' : 'fiat', decimals: 2, chain: body.chain ?? null, status: 'opening', balance: null, details: null, openedAt: '2026-10-24T09:00:00.000Z' };
    hub.accounts = [...hub.accounts, made];
    return ok(made, 201);
  }
  const txMatch = /^\/money\/fx\/accounts\/([^/]+)\/transactions$/.exec(path);
  if (txMatch) return ok({ items: hub.transactions.filter((t) => t.accountId === txMatch[1]), nextCursor: null });
  if (path === '/money/fx/quotes' && method === 'POST') {
    if (hub.swapMode === 'declined') return refuse(409, { code: 'provider_declined', message: 'Nuvion cannot swap this pair on dev.' });
    const from = String(body.fromCurrency);
    const to = String(body.toCurrency);
    const amountFromMinor = Number(body.amountFromMinor);
    // One dollar is 1,580 naira here: kobo to cents is 100 / 158,000.
    const rate = from === 'NGN' ? 100 / 158_000 : 158_000 / 100;
    const amountToMinor = Math.floor(amountFromMinor * rate);
    const quote = {
      id: `c0000000-0000-4000-8000-00000000${String(100 + hub.quotes.length)}`,
      fromCurrency: from,
      toCurrency: to,
      fromAccountId: body.fromAccountId ?? null,
      toAccountId: body.toAccountId ?? null,
      amountFromMinor,
      amountToMinor,
      fromDecimals: 2,
      toDecimals: 2,
      rate: String(rate),
      providerFeeMinor: 0,
      wawuFeeMinor: 0,
      totalFromMinor: amountFromMinor,
      expiresAt: new Date(Date.now() + hub.quoteSeconds * 1000).toISOString(),
      validForSeconds: hub.quoteSeconds,
    };
    hub.quotes.push(quote);
    return ok(quote, 201);
  }
  if (path === '/money/fx/swaps' && method === 'POST') {
    const key = request.headers.get('idempotency-key');
    const pin = request.headers.get('x-transaction-pin');
    hub.swaps.push({ key, pin, body });
    if (key && hub.done[key]) return ok(hub.done[key], 201);
    if (hub.swapMode === 'no_answer_first' && hub.swaps.length === 1) {
      const first = hub.quotes.find((q) => q.id === body.quoteId) ?? hub.quotes[0] ?? {};
      if (key) hub.done[key] = swapView(first as Record<string, unknown>, 'completed');
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    if (hub.wrongPinFirst && hub.pins++ === 0) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.swapMode === 'expired') return refuse(409, { code: 'quote_expired', message: 'This rate ran out.' });
    const quote = hub.quotes.find((q) => q.id === body.quoteId);
    if (!quote) return refuse(404, { code: 'not_found', message: 'No such quote.' });
    const view = swapView(quote, hub.swapMode === 'pending' ? 'pending' : 'completed');
    if (key) hub.done[key] = view;
    return ok(view, 201);
  }
  if (path === `/money/fx/swaps/${SWAP_ID}`) return ok(swapView(hub.quotes[0] ?? { fromCurrency: 'NGN', toCurrency: 'USD', amountFromMinor: 15_800_000, amountToMinor: 10_000, fromDecimals: 2, toDecimals: 2, rate: '0.000632911', wawuFeeMinor: 0 }, 'completed'));
  if (path === '/money/fx/sends/quote') {
    hub.sendQuotes.push(url.search);
    return ok({ accountId: url.searchParams.get('accountId'), currency: url.searchParams.get('currency'), chain: url.searchParams.get('chain'), decimals: 2, amountMinor: Number(url.searchParams.get('amountMinor')), providerFeeMinor: null, wawuFeeMinor: 0, availableMinor: 32_000 });
  }
  if (path === '/money/fx/sends' && method === 'POST') {
    const key = request.headers.get('idempotency-key');
    const pin = request.headers.get('x-transaction-pin');
    hub.sends.push({ key, pin, body });
    if (hub.wrongPinFirst && hub.pins++ === 0) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.sendMode === 'declined') return refuse(409, { code: 'provider_declined', message: 'Nuvion cannot send USDT on dev.' });
    const view = { id: SEND_ID, status: hub.sendMode === 'pending' ? 'pending' : 'completed', accountId: body.accountId, currency: body.currency, chain: body.chain, decimals: 2, address: body.address, amountMinor: body.amountMinor, providerFeeMinor: null, wawuFeeMinor: 0, failureReason: null, createdAt: '2026-10-24T09:00:00.000Z', completedAt: null };
    return ok(view, 201);
  }
  if (path === `/money/fx/sends/${SEND_ID}`) {
    return ok({ id: SEND_ID, status: 'completed', accountId: USDT_ID, currency: 'USDT', chain: 'eth', decimals: 2, address: OUTSIDE, amountMinor: 12_000, providerFeeMinor: null, wawuFeeMinor: 0, failureReason: null, createdAt: '2026-10-24T09:00:00.000Z', completedAt: '2026-10-24T09:01:00.000Z' });
  }
  return json(404, { statusCode: 404, message: `Not here: ${method} ${path}` });
}
