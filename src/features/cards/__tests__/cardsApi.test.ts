/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * WALLET-22 / WALLET-31 (R-84): the card calls against a Hub stood in as `fetch`. What goes out (the header that approves, the
 * Idempotency-Key, the body), and what each answer comes to, so a screen branches in one place and a lost answer is never read as a refusal.
 */
type Seen = { method: string; path: string; headers: Record<string, string>; body: unknown };
let seen: Seen[] = [];
let answer: (request: Seen) => Response | Promise<Response>;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (status: number, data: unknown) => json(status, { statusCode: status, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) =>
  json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const CARD = {
  id: '11111111-1111-4111-8111-111111111111',
  kind: 'virtual',
  name: 'Virtual card',
  status: 'active',
  currency: 'USD',
  frozenBySupport: false,
  last4: null,
  statusMessage: null,
  createdAt: '2026-10-24T10:00:00.000Z',
};

function boot() {
  jest.resetModules();
  seen = [];
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new Request(String(input));
    const text = await request.clone().text();
    const headers: Record<string, string> = {};
    request.headers.forEach((v, k) => (headers[k] = v));
    const entry = { method: request.method, path: new URL(request.url).pathname, headers, body: text === '' ? null : (JSON.parse(text) as unknown) };
    seen.push(entry);
    return answer(entry);
  }) as typeof fetch;
  return require('../api') as typeof import('../api');
}

const pin = { pin: '4821' } as const;

describe('making a card', () => {
  it('sends the PIN as X-Transaction-Pin with the Idempotency-Key and only the kind (and a name when one was typed)', async () => {
    const cards = boot();
    answer = () => ok(201, CARD);
    const out = await cards.createCard({ kind: 'virtual', key: 'key-1', ...pin });
    expect(out).toEqual({ kind: 'done', value: expect.objectContaining({ id: CARD.id, status: 'active' }) });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ method: 'POST', path: '/api/hub/money/cards', body: { kind: 'virtual' } });
    expect(seen[0].headers['x-transaction-pin']).toBe('4821');
    expect(seen[0].headers['idempotency-key']).toBe('key-1');
    expect(seen[0].headers['x-device-approval']).toBeUndefined();
    await cards.createCard({ kind: 'single_use', name: '  Netflix  ', key: 'key-2', ...pin });
    expect(seen[1].body).toEqual({ kind: 'single_use', name: 'Netflix' });
  });

  it("approved by the phone: the approver is given exactly this request, its header goes in the PIN's place, and a stop sends nothing", async () => {
    const cards = boot();
    answer = () => ok(201, CARD);
    const approve = jest.fn(async () => ({ kind: 'ready' as const, header: 'signed-approval' }));
    await cards.createCard({ kind: 'virtual', key: 'key-3', approve });
    expect(approve).toHaveBeenCalledWith({ method: 'POST', path: '/api/hub/money/cards', body: { kind: 'virtual' } });
    expect(seen[0].headers['x-device-approval']).toBe('signed-approval');
    expect(seen[0].headers['x-transaction-pin']).toBeUndefined();
    seen = [];
    const cancelled = await cards.createCard({ kind: 'virtual', key: 'key-3', approve: async () => ({ kind: 'cancelled' as const }) });
    expect(cancelled).toEqual({ kind: 'approval_cancelled' });
    expect(seen).toEqual([]);
  });

  it("reads the Hub's refusals: a wrong PIN with its tries, a short wallet and a limit in the Hub's own words, a refused approval", async () => {
    const cards = boot();
    answer = () => refuse(403, { code: 'pin_incorrect', message: 'That PIN is not right.', triesLeft: 2 });
    expect(await cards.createCard({ kind: 'virtual', key: 'k', ...pin })).toEqual({ kind: 'pin_incorrect', triesLeft: 2 });
    answer = () => refuse(402, { code: 'insufficient_funds', message: 'Your wallet needs ₦657.72 for the card fee.' });
    expect(await cards.createCard({ kind: 'virtual', key: 'k', ...pin })).toEqual({
      kind: 'refused',
      code: 'insufficient_funds',
      message: 'Your wallet needs ₦657.72 for the card fee.',
    });
    answer = () => refuse(409, { code: 'card_limit_reached', message: 'You have the most cards one person can hold. Block one to get another.' });
    expect(await cards.createCard({ kind: 'virtual', key: 'k', ...pin })).toMatchObject({ kind: 'refused', code: 'card_limit_reached' });
    answer = () => refuse(403, { code: 'device_approval_refused', message: 'No.' });
    expect(await cards.createCard({ kind: 'virtual', key: 'k', approve: async () => ({ kind: 'ready' as const, header: 'x' }) })).toEqual({
      kind: 'approval_failed',
    });
    answer = () => refuse(409, { code: 'wallet_not_open', message: 'Open your wallet.' });
    expect(await cards.createCard({ kind: 'virtual', key: 'k', ...pin })).toEqual({ kind: 'no_wallet' });
  });

  it('an answer that never came, a 5xx, or a created card that cannot be read is unanswered, never a refusal: the same key goes again', async () => {
    const cards = boot();
    answer = () => {
      throw new TypeError('Network request failed');
    };
    expect(await cards.createCard({ kind: 'virtual', key: 'k', ...pin })).toEqual({ kind: 'unanswered' });
    answer = () => json(503, { statusCode: 503, message: 'down', data: null });
    expect(await cards.createCard({ kind: 'virtual', key: 'k', ...pin })).toEqual({ kind: 'unanswered' });
    answer = () => ok(201, { id: 'x' });
    expect(await cards.createCard({ kind: 'virtual', key: 'k', ...pin })).toEqual({ kind: 'unanswered' });
  });
});

describe('the card, its details and its controls', () => {
  it('shows the details only from an answer that holds a whole number, an expiry and a CVV, and sends the PIN with no body and no key', async () => {
    const cards = boot();
    answer = () => ok(200, { number: '4111111111119916', expiryMonth: '09', expiryYear: '28', cvv: '731', cardholderName: 'Ada Tester', billing: null });
    const out = await cards.revealCard(CARD.id, pin);
    expect(out).toMatchObject({ kind: 'done', value: { number: '4111111111119916', cvv: '731' } });
    expect(seen[0]).toMatchObject({ method: 'POST', path: `/api/hub/money/cards/${CARD.id}/reveal`, body: null });
    expect(seen[0].headers['x-transaction-pin']).toBe('4821');
    expect(seen[0].headers['idempotency-key']).toBeUndefined();
    answer = () => ok(200, { number: '12', expiryMonth: '09', expiryYear: '28', cvv: '7' });
    expect(await cards.revealCard(CARD.id, pin)).toEqual({ kind: 'unanswered' });
    answer = () => refuse(409, { code: 'card_blocked', message: 'This card is blocked and cannot be used again.' });
    expect(await cards.revealCard(CARD.id, pin)).toMatchObject({ kind: 'refused', code: 'card_blocked' });
  });

  it('unfreezes behind the PIN; freezes and blocks need none', async () => {
    const cards = boot();
    answer = (r) => ok(200, { ...CARD, status: r.path.endsWith('/freeze') ? 'frozen' : r.method === 'DELETE' ? 'blocked' : 'active' });
    expect(await cards.unfreezeCard(CARD.id, pin)).toMatchObject({ kind: 'done', value: { status: 'active' } });
    expect(seen[0].headers['x-transaction-pin']).toBe('4821');
    expect(await cards.freezeCard(CARD.id)).toMatchObject({ status: 'frozen' });
    expect(seen[1]).toMatchObject({ method: 'POST', path: `/api/hub/money/cards/${CARD.id}/freeze` });
    expect(seen[1].headers['x-transaction-pin']).toBeUndefined();
    expect(await cards.blockCard(CARD.id)).toMatchObject({ status: 'blocked' });
    expect(seen[2]).toMatchObject({ method: 'DELETE', path: `/api/hub/money/cards/${CARD.id}` });
  });

  it('refuses a list, a quote or a payment page it cannot read, and leaves out a payment with no whole-cent amount', async () => {
    const cards = boot();
    answer = () => ok(200, { enabled: true, cards: [{ id: 'x' }] });
    await expect(cards.fetchCards()).rejects.toMatchObject({ message: expect.stringContaining('could not be read') });
    answer = () =>
      ok(200, {
        enabled: true,
        currency: 'USD',
        kinds: ['virtual'],
        canCreate: true,
        fee: { providerFeeKobo: 65772, wawuFeeKobo: 0, totalFeeKobo: 1 },
        limits: {},
      });
    await expect(cards.fetchCardQuote()).rejects.toMatchObject({ message: expect.stringContaining('could not be read') });
    answer = () =>
      ok(200, {
        enabled: true,
        currency: 'USD',
        kinds: ['virtual'],
        canCreate: true,
        fee: { providerFeeKobo: 65772, wawuFeeKobo: 0, totalFeeKobo: 65772 },
        limits: {},
      });
    await expect(cards.fetchCardQuote()).resolves.toMatchObject({ fee: { totalFeeKobo: 65772 } });
    answer = () =>
      ok(200, {
        items: [
          {
            id: 'a',
            kind: 'purchase',
            amountCents: 728,
            currency: 'USD',
            merchant: 'Acme',
            place: null,
            narration: null,
            status: 'successful',
            occurredAt: null,
          },
          {
            id: 'b',
            kind: 'purchase',
            amountCents: 7.5,
            currency: 'USD',
            merchant: null,
            place: null,
            narration: null,
            status: 'successful',
            occurredAt: null,
          },
        ],
        nextCursor: null,
      });
    const page = await cards.fetchCardTransactions(CARD.id);
    expect(page.items.map((t) => t.id)).toEqual(['a']);
  });
});
