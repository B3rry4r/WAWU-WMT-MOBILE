/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * PAY-FX (R-91): the account that pays a wallet payment rides on one header, `X-Pay-Source-Currency`, on every request while a
 * currency is chosen; with none chosen (the naira wallet) the request is exactly what it always was.
 */
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
  it('is sent when a currency is chosen, and not when the naira wallet pays', async () => {
    const { client, source } = boot();
    await client.api.GET('/api/hub/money/wallet');
    expect(seen[0].headers.get('x-pay-source-currency')).toBeNull();
    source.choosePaySource('USD');
    await client.api.GET('/api/hub/money/wallet');
    expect(seen[1].headers.get('x-pay-source-currency')).toBe('USD');
    source.choosePaySource(null);
    await client.api.GET('/api/hub/money/wallet');
    expect(seen[2].headers.get('x-pay-source-currency')).toBeNull();
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
