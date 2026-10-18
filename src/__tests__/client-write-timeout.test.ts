/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * FIX-87 (SHARED-CHANGES WALLET-06 #5): a write the Hub never answers must end too, but only where ending it is safe.
 * A write ends after WRITE_TIMEOUT_MS as the network failure ("no answer") when it carries an Idempotency-Key AND its caller
 * passed `fetch: resendsUnderKey` (the screen sends it again under that same key). Every other write is never aborted.
 * (FIX-79's client-timeout.test.ts keeps pinning the reads and the plain write.)
 */
const PUT_URL = '/api/hub/money/pin';
const POST_URL = '/api/hub/money/pin/reset/confirm';

type Held = { request: Request; body: string; answer: (status: number, body: unknown) => void };
let held: Held[] = [];

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** A Hub that holds every request until the test answers it, and honours the request's abort signal as a real network does. */
function installHub() {
  held = [];
  globalThis.fetch = jest.fn((input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new Request(String(input));
    return new Promise<Response>((resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
      void request
        .clone()
        .text()
        .then((body) => held.push({ request, body, answer: (status, payload) => resolve(respond(status, payload)) }));
    });
  }) as typeof fetch;
}

function boot() {
  jest.resetModules();
  installHub();
  return require('@/api/client') as typeof import('@/api/client');
}

const NO_ANSWER = { kind: 'network', status: 0, message: 'No connection. Check your internet and try again.' };

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('a keyed write its screen re-sends under the same key', () => {
  const change = (client: typeof import('@/api/client'), key: string) =>
    client.unwrap(
      client.api.PUT(PUT_URL as never, {
        params: { header: { 'X-Transaction-Pin': '4821', 'Idempotency-Key': key } },
        body: { newPin: '1357', newPinConfirmation: '1357' },
        fetch: client.resendsUnderKey,
      } as never),
    );

  it('ends as "no answer" (network, status 0) after 30 s, never before, and a second try under the SAME key gets the Hub\'s one answer', async () => {
    const client = boot();
    expect(client.WRITE_TIMEOUT_MS).toBe(30_000);
    const first = change(client, 'key-w36').then(
      () => 'answered',
      (error: unknown) => error,
    );
    let settled = false;
    void first.then(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(29_999);
    expect(settled).toBe(false);
    expect(held[0].request.signal.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(2);
    const error = await first;
    expect(client.isApiError(error)).toBe(true);
    expect(error).toMatchObject(NO_ANSWER);
    expect(held[0].request.signal.aborted).toBe(true);

    // The second try is a new request under the same key, with a timer of its own; the Hub answers it with its one answer.
    const second = change(client, 'key-w36');
    await jest.advanceTimersByTimeAsync(12_000);
    expect(held).toHaveLength(2);
    held[1].answer(200, { data: { isSet: true } });
    await expect(second).resolves.toEqual({ data: { isSet: true } });

    // Key, PIN header, body and method: byte for byte the same on both.
    for (const sent of held) {
      expect(sent.request.method).toBe('PUT');
      expect(sent.request.headers.get('idempotency-key')).toBe('key-w36');
      expect(sent.request.headers.get('x-transaction-pin')).toBe('4821');
      expect(sent.body).toBe('{"newPin":"1357","newPinConfirmation":"1357"}');
    }
    expect(jest.getTimerCount()).toBe(0);
  });

  it('leaves no timer behind once the Hub has answered', async () => {
    const client = boot();
    const write = change(client, 'key-1');
    await jest.advanceTimersByTimeAsync(100);
    held[0].answer(200, { data: { ok: true } });
    await expect(write).resolves.toEqual({ data: { ok: true } });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('keeps the caller\'s own abort: a signal the caller aborts ends it as it did before, not as "no answer" from the timer', async () => {
    const client = boot();
    const controller = new AbortController();
    const write = client
      .unwrap(
        client.api.POST(POST_URL as never, {
          params: { header: { 'Idempotency-Key': 'key-2' } },
          body: { code: '123456' },
          signal: controller.signal,
          fetch: client.resendsUnderKey,
        } as never),
      )
      .then(
        () => 'answered',
        (error: unknown) => error,
      );
    await jest.advanceTimersByTimeAsync(1_000);
    controller.abort();
    await jest.advanceTimersByTimeAsync(10);
    expect(await write).toBeDefined();
    expect(held[0].request.signal.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('a write that is not aborted', () => {
  it('without an Idempotency-Key is never aborted, even when the caller passed the opt-in (it could move money twice)', async () => {
    const client = boot();
    const write = client.unwrap(
      client.api.POST(POST_URL as never, { body: { code: '123456' }, fetch: client.resendsUnderKey } as never),
    );
    await jest.advanceTimersByTimeAsync(600_000);
    expect(held).toHaveLength(1);
    expect(held[0].request.headers.get('idempotency-key')).toBeNull();
    expect(held[0].request.signal.aborted).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
    held[0].answer(201, { data: { done: true } });
    await expect(write).resolves.toEqual({ data: { done: true } });
  });

  it('with an empty Idempotency-Key is never aborted either', async () => {
    const client = boot();
    const write = client.unwrap(
      client.api.POST(POST_URL as never, { params: { header: { 'Idempotency-Key': '' } }, body: {}, fetch: client.resendsUnderKey } as never),
    );
    await jest.advanceTimersByTimeAsync(600_000);
    expect(held[0].request.signal.aborted).toBe(false);
    held[0].answer(201, { data: {} });
    await expect(write).resolves.toEqual({ data: {} });
  });

  it('with a key but no opt-in (a screen that makes a new key for each try) is never aborted, and its key and PIN reach the Hub untouched', async () => {
    const client = boot();
    const write = client.unwrap(
      client.api.PUT(PUT_URL as never, {
        params: { header: { 'X-Transaction-Pin': '4821', 'Idempotency-Key': 'key-3' } },
        body: { newPin: '1357', newPinConfirmation: '1357' },
      } as never),
    );
    await jest.advanceTimersByTimeAsync(600_000);
    expect(held).toHaveLength(1);
    expect(held[0].request.headers.get('idempotency-key')).toBe('key-3');
    expect(held[0].request.headers.get('x-transaction-pin')).toBe('4821');
    expect(held[0].request.signal.aborted).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
    held[0].answer(200, { data: { isSet: true } });
    await expect(write).resolves.toEqual({ data: { isSet: true } });
  });
});

describe('a keyed write the Hub answers with 401', () => {
  it('is sent again after the refresh with the same timeout, and the same key and body', async () => {
    jest.resetModules();
    installHub();
    jest.doMock('../api/session', () => ({
      getAccessToken: jest.fn(async () => 'token-1'),
      refreshAccessToken: jest.fn(async () => 'token-2'),
      isCurrentSessionToken: jest.fn(() => true),
    }));
    const client = require('@/api/client') as typeof import('@/api/client');
    const write = client
      .unwrap(
        client.api.PUT(PUT_URL as never, {
          params: { header: { 'X-Transaction-Pin': '4821', 'Idempotency-Key': 'key-401' } },
          body: { newPin: '1357', newPinConfirmation: '1357' },
          fetch: client.resendsUnderKey,
        } as never),
      )
      .then(
        () => 'answered',
        (error: unknown) => error,
      );
    await jest.advanceTimersByTimeAsync(100);
    held[0].answer(401, { statusCode: 401, message: 'Unauthorized' });
    await jest.advanceTimersByTimeAsync(100);
    // The repeat reached the Hub with the new token, the same key, the PIN and the body.
    expect(held).toHaveLength(2);
    expect(held[1].request.headers.get('authorization')).toBe('Bearer token-2');
    expect(held[1].request.headers.get('idempotency-key')).toBe('key-401');
    expect(held[1].request.headers.get('x-transaction-pin')).toBe('4821');
    expect(held[1].body).toBe('{"newPin":"1357","newPinConfirmation":"1357"}');
    // And the Hub never answers it: it ends as "no answer" after 30 s.
    await jest.advanceTimersByTimeAsync(30_001);
    expect(await write).toMatchObject(NO_ANSWER);
    expect(held[1].request.signal.aborted).toBe(true);
    jest.dontMock('../api/session');
  });
});
