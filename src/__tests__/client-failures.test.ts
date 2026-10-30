/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * WALK-FIX H4 (29 Oct 2026 walk, L11): "No connection" is for a request that could not reach the server. Any other throw on the phone
 * (a body that will not serialize, a request that will not build, an answer that will not read) is `kind` 'client' with its own line and a
 * console.error of its name and message, and never escapes as a raw TypeError.
 */
const CLIENT_LINE = 'Something went wrong on this phone. Try again, and if it keeps happening, tell us.';
const NO_CONNECTION = 'No connection. Check your internet and try again.';

function boot(fetchImpl: typeof fetch) {
  jest.resetModules();
  globalThis.fetch = jest.fn(fetchImpl) as typeof fetch;
  return require('@/api/client') as typeof import('@/api/client');
}

const read = (client: typeof import('@/api/client')) => client.unwrap(client.api.GET('/api/hub/users/me' as never) as never);

let logged: jest.SpyInstance;
beforeEach(() => {
  logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  logged.mockRestore();
});

describe('a real network failure is still "No connection"', () => {
  it.each([
    ['React Native', new TypeError('Network request failed')],
    ['React Native timeout', new TypeError('Network request timed out')],
    ['a browser', new TypeError('Failed to fetch')],
    ['Safari', new TypeError('Load failed')],
    ['Node', new TypeError('fetch failed')],
    ['an abort', Object.assign(new Error('Aborted'), { name: 'AbortError' })],
  ])('%s', async (_name, thrown) => {
    const client = boot(async () => {
      throw thrown;
    });
    await expect(read(client)).rejects.toMatchObject({ kind: 'network', status: 0, message: NO_CONNECTION });
    expect(logged).not.toHaveBeenCalled();
  });
});

describe('any other throw on the phone is the phone\'s own error', () => {
  it('a fetch that throws something that is not a network failure is kind client, with the line, and is logged by name and message', async () => {
    const client = boot(async () => {
      throw new TypeError("Cannot read property 'blob' of undefined");
    });
    await expect(read(client)).rejects.toMatchObject({ kind: 'client', status: 0, message: CLIENT_LINE });
    expect(logged).toHaveBeenCalledTimes(1);
    expect(logged.mock.calls[0].join(' ')).toContain("TypeError Cannot read property 'blob' of undefined");
  });

  it('a body serializer that throws does not escape as a raw TypeError (walk L11)', async () => {
    const client = boot(async () => new Response('{}', { status: 200 }));
    const send = client.unwrap(
      client.api.POST('/api/hub/uploads/presign' as never, {
        body: { n: 1 },
        bodySerializer: () => {
          throw new TypeError('serializer blew up');
        },
      } as never) as never,
    );
    await expect(send).rejects.toMatchObject({ name: 'ApiError', kind: 'client', message: CLIENT_LINE });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('a body that cannot be turned into JSON (a BigInt) is the phone\'s own error', async () => {
    const client = boot(async () => new Response('{}', { status: 200 }));
    const send = client.unwrap(client.api.POST('/api/hub/uploads/presign' as never, { body: { n: BigInt(1) } } as never) as never);
    await expect(send).rejects.toMatchObject({ kind: 'client', message: CLIENT_LINE });
  });

  it('an answer that cannot be read is the phone\'s own error', async () => {
    const client = boot(async () => new Response('<html>not json</html>', { status: 200, headers: { 'content-type': 'application/json' } }));
    await expect(read(client)).rejects.toMatchObject({ kind: 'client', message: CLIENT_LINE });
  });

  it('the log carries no long digit runs (a number from the message is masked)', async () => {
    const client = boot(async () => {
      throw new TypeError('bad value 08031234567 here');
    });
    await expect(read(client)).rejects.toMatchObject({ kind: 'client' });
    expect(logged.mock.calls[0].join(' ')).not.toContain('08031234567');
  });
});

describe('every existing ApiError path is unchanged', () => {
  it('a refusal from the Hub is still its own kind and sentence', async () => {
    const client = boot(async () => new Response(JSON.stringify({ statusCode: 409, message: 'That is taken', data: null }), { status: 409, headers: { 'content-type': 'application/json' } }));
    await expect(read(client)).rejects.toMatchObject({ kind: 'conflict', status: 409, message: 'That is taken' });
    expect(logged).not.toHaveBeenCalled();
  });
});

describe('failureOf, for the screens\' own wrappers', () => {
  it('an ApiError passes through, a network failure is the offline error, anything else is client', () => {
    const errors = require('@/api/errors') as typeof import('@/api/errors');
    const already = new errors.ApiError('conflict', 409, 'x');
    expect(errors.failureOf(already)).toBe(already);
    expect(errors.failureOf(new TypeError('Network request failed'))).toMatchObject({ kind: 'network', message: NO_CONNECTION });
    expect(errors.failureOf(new Error('boom'))).toMatchObject({ kind: 'client', message: CLIENT_LINE });
    expect(errors.failureOf('a string')).toMatchObject({ kind: 'client' });
    expect(errors.failureOf(undefined)).toMatchObject({ kind: 'client' });
  });
});
