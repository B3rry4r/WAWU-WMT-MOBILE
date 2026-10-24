/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * FIX-79 L3 (G-FIX-79-2): a read the Hub never answers must end, so the screen shows its own error and its Try again instead of
 * a loading bar for good. Only reads (GET) end; a write is never aborted, so a money POST under its Idempotency-Key is untouched.
 */
const GET_URL = '/api/hub/dm/inbox';
const POST_URL = '/api/hub/dm/send/wallet/pay';

type Held = { request: Request; answer: (status: number, body: unknown) => void };
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
      held.push({ request, answer: (status, body) => resolve(respond(status, body)) });
    });
  }) as typeof fetch;
}

function boot() {
  jest.resetModules();
  installHub();
  return require('@/api/client') as typeof import('@/api/client');
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('a read the Hub never answers', () => {
  it('ends as "No connection" after the read timeout, never before, and the screen can try again', async () => {
    const client = boot();
    const outcome = client.unwrap(client.api.GET(GET_URL as never)).then(
      () => 'answered',
      (error: unknown) => error,
    );
    let settled = false;
    void outcome.then(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(29_999);
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(2);
    const error = await outcome;
    expect(client.isApiError(error)).toBe(true);
    expect(error).toMatchObject({ kind: 'network', status: 0, message: 'No connection. Check your internet and try again.' });

    // Try again is a new read, with a new timer of its own: it answers when the Hub does.
    const again = client.unwrap(client.api.GET(GET_URL as never));
    await jest.advanceTimersByTimeAsync(5_000);
    held.at(-1)?.answer(200, { data: { ok: true } });
    await expect(again).resolves.toEqual({ data: { ok: true } });
    expect(client.READ_TIMEOUT_MS).toBe(30_000);
  });

  it('leaves no timer behind once a read has been answered', async () => {
    const client = boot();
    const read = client.unwrap(client.api.GET(GET_URL as never));
    await jest.advanceTimersByTimeAsync(100);
    held[0].answer(200, { data: { ok: true } });
    await expect(read).resolves.toEqual({ data: { ok: true } });
    expect(jest.getTimerCount()).toBe(0);
  });
});

/*
 * SWEEP-APP-7 V4 (c), closed by SWEEP-MONEY-5b: a caller's own abort of a read. A GET sent with the caller's `signal` ends at once when
 * the caller aborts it (it does not wait for the 30 s), the request the Hub sees is aborted too, and no timer or listener is left behind.
 * (The cap is per try and the body is not timed after the headers: ruled in the sweep row, not a defect.)
 */
describe('a read the caller aborts itself', () => {
  it('ends when the caller aborts, long before the read timeout, and cancels the request the Hub sees', async () => {
    const client = boot();
    const controller = new AbortController();
    const read = client
      .unwrap(client.api.GET(GET_URL as never, { signal: controller.signal } as never))
      .then(
        () => 'answered',
        (error: unknown) => error,
      );
    let settled = false;
    void read.then(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(1_000);
    expect(settled).toBe(false);
    expect(held[0].request.signal.aborted).toBe(false);
    controller.abort();
    await jest.advanceTimersByTimeAsync(5);
    expect(settled).toBe(true);
    expect(held[0].request.signal.aborted).toBe(true);
    // The caller's abort is not the read timeout: it ended at 1 s, and nothing is left to fire at 30 s.
    expect(jest.getTimerCount()).toBe(0);
    expect(client.isApiError(await read)).toBe(true);
  });

  it('a signal that is already aborted never waits: the read ends at once and the Hub sees an aborted request', async () => {
    jest.resetModules();
    globalThis.fetch = jest.fn((input: RequestInfo | URL) => {
      const request = input instanceof Request ? input : new Request(String(input));
      return request.signal.aborted
        ? Promise.reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
        : new Promise<Response>(() => undefined);
    }) as typeof fetch;
    const client = require('@/api/client') as typeof import('@/api/client');
    const controller = new AbortController();
    controller.abort();
    const read = client.unwrap(client.api.GET(GET_URL as never, { signal: controller.signal } as never)).then(
      () => 'answered',
      (error: unknown) => error,
    );
    await jest.advanceTimersByTimeAsync(5);
    expect(client.isApiError(await read)).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('an abort after the answer changes nothing: the answered read keeps its data and no timer is left', async () => {
    const client = boot();
    const controller = new AbortController();
    const read = client.unwrap(client.api.GET(GET_URL as never, { signal: controller.signal } as never));
    await jest.advanceTimersByTimeAsync(100);
    held[0].answer(200, { data: { ok: true } });
    await expect(read).resolves.toEqual({ data: { ok: true } });
    controller.abort();
    await jest.advanceTimersByTimeAsync(31_000);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('a write', () => {
  it('is never aborted by the read timeout: a slow money POST keeps its Idempotency-Key and gets the Hub\'s answer', async () => {
    const client = boot();
    const write = client.unwrap(
      client.api.POST(POST_URL as never, { body: { quoteToken: 'q' }, headers: { 'Idempotency-Key': 'key-1' } } as never),
    );
    await jest.advanceTimersByTimeAsync(120_000);
    expect(held).toHaveLength(1);
    expect(held[0].request.method).toBe('POST');
    expect(held[0].request.headers.get('idempotency-key')).toBe('key-1');
    expect(held[0].request.signal.aborted).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
    held[0].answer(201, { data: { paid: true } });
    await expect(write).resolves.toEqual({ data: { paid: true } });
  });
});
