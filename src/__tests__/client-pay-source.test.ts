/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * PAY-FX (R-91): the account that pays a wallet payment rides on one header, `X-Pay-Source-Currency`, on the paying requests while a
 * currency is chosen; with none chosen (the naira wallet) the request is exactly what it always was.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let seen: Request[] = [];

function boot() {
  jest.resetModules();
  seen = [];
  globalThis.fetch = jest.fn((input: RequestInfo | URL) => {
    seen.push(input instanceof Request ? input : new Request(String(input)));
    return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200, headers: { 'content-type': 'application/json' } }));
  }) as typeof fetch;
  return {
    client: require('@/api/client') as typeof import('@/api/client'),
    source: require('@/api/paySource') as typeof import('@/api/paySource'),
  };
}

describe('the paying account header', () => {
  it('is sent on the paying requests when a currency is chosen, and not when the naira wallet pays', async () => {
    const { client, source } = boot();
    await client.api.GET('/api/hub/money/payments/quote', { params: { query: { kind: 'tip', targetId: 'x' } } });
    expect(seen[0].headers.get('x-pay-source-currency')).toBeNull();
    source.choosePaySource('USD');
    await client.api.GET('/api/hub/money/payments/quote', { params: { query: { kind: 'tip', targetId: 'x' } } });
    expect(seen[1].headers.get('x-pay-source-currency')).toBe('USD');
    source.choosePaySource(null);
    await client.api.GET('/api/hub/money/payments/quote', { params: { query: { kind: 'tip', targetId: 'x' } } });
    expect(seen[2].headers.get('x-pay-source-currency')).toBeNull();
  });

  it('is not sent on any other Hub call while a currency is chosen (round 3, F5)', async () => {
    const { client, source } = boot();
    source.choosePaySource('USD');
    await client.api.GET('/api/hub/money/wallet');
    await client.api.GET('/api/hub/money/payments/{id}', { params: { path: { id: 'p1' } } });
    await client.api.GET('/api/hub/money/fx/accounts');
    expect(seen.map((r) => r.headers.get('x-pay-source-currency'))).toEqual([null, null, null]);
  });

  it('is sent on exactly the operations the contract declares it on', () => {
    const { source } = boot();
    const spec = JSON.parse(readFileSync(join(__dirname, '../../contract/openapi.json'), 'utf8')) as {
      paths: Record<string, Record<string, { parameters?: { in: string; name: string }[] }>>;
    };
    const declared: string[] = [];
    const wrong: string[] = [];
    for (const [path, ops] of Object.entries(spec.paths)) {
      for (const [verb, op] of Object.entries(ops)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(verb)) continue;
        const names = (op.parameters ?? []).filter((p) => p.in === 'header').map((p) => p.name);
        const reads = names.includes('X-Pay-Source-Currency');
        if (reads) declared.push(`${verb.toUpperCase()} ${path}`);
        const concrete = path.replace(/\{[^}]+\}/g, 'x1');
        if (source.carriesPaySource(verb, concrete) !== reads) wrong.push(`${verb.toUpperCase()} ${path}`);
      }
    }
    expect(declared.length).toBeGreaterThanOrEqual(16);
    expect(wrong).toEqual([]);
  });

  it('returns to the default when a sheet closes, and a session end forgets it', () => {
    const { source } = boot();
    source.setPaySourceDefaults({ fallback: 'GBP', hasNaira: false });
    expect(source.paySourceCode()).toBe('GBP');
    source.choosePaySource('USD');
    source.resetPaySource();
    expect(source.paySourceCode()).toBe('GBP');
    source.clearPaySource();
    expect(source.paySourceCode()).toBeNull();
    expect(source.paySourceHasNaira()).toBe(true);
  });
});
