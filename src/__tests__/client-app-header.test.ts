/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * PRICE-LIST (R-101, option A): the app sends `X-Wawu-Client: app` on every Hub request, reads and writes alike, so the Hub holds a
 * price to the price list on the routes the website also calls. The Hub's CORS reflects the header for the web build.
 */
let seen: Request[] = [];

function boot() {
  jest.resetModules();
  seen = [];
  globalThis.fetch = jest.fn((input: RequestInfo | URL) => {
    seen.push(input instanceof Request ? input : new Request(String(input)));
    return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200, headers: { 'content-type': 'application/json' } }));
  }) as typeof fetch;
  return require('@/api/client') as typeof import('@/api/client');
}

describe('the app header', () => {
  it('is X-Wawu-Client: app', () => {
    const client = boot();
    expect(client.APP_CLIENT_HEADER).toBe('x-wawu-client');
    expect(client.APP_CLIENT_VALUE).toBe('app');
  });

  it('is sent on a read, a write and a request with a body', async () => {
    const client = boot();
    await client.api.GET('/api/hub/prices');
    await client.api.GET('/api/hub/money/wallet');
    await client.api.PUT('/api/hub/paid-dm/settings', { body: { enabled: false } });
    await client.api.POST('/api/hub/content', { body: {} as never });
    expect(seen).toHaveLength(4);
    expect(seen.map((r) => r.headers.get('x-wawu-client'))).toEqual(['app', 'app', 'app', 'app']);
  });

  it('is on the copy kept for a repeat after a token refresh too (it is set before the auth middleware clones the request)', async () => {
    const client = boot();
    await client.api.GET('/api/hub/prices');
    const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../api/client.ts'), 'utf8') as string;
    expect(src.indexOf('api.use(appClient)')).toBeGreaterThan(-1);
    expect(src.indexOf('api.use(appClient)')).toBeLessThan(src.indexOf('api.use(auth)'));
    expect(seen[0].headers.get('x-wawu-client')).toBe('app');
  });
});
