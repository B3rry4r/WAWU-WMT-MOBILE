/* eslint-disable @typescript-eslint/no-require-imports */
const mockVault = new Map<string, string>();

/** How long, in ms, a store write and a store delete take to land, like a slow phone. Zero is instant. */
let mockWriteDelay = 0;
let mockDeleteDelay = 0;
const mockSlow = (ms: number) => (ms ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    await mockSlow(mockWriteDelay);
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    await mockSlow(mockDeleteDelay);
    mockVault.delete(key);
  }),
}));

type Handler = (url: string, init: { headers: Headers; body?: string }) => { status: number; body: unknown };

let handler: Handler;
let offline: string[] = [];
const calls: { url: string; auth: string | null }[] = [];
/** When set, /auth/refresh waits for it, so a test can act while a refresh is in flight. */
let holdRefresh: Promise<void> | null = null;
let refreshReached: () => void = () => {};

const respond = ({ status, body }: { status: number; body: unknown }) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    if (request.url.endsWith('/auth/refresh') && holdRefresh) {
      refreshReached();
      await holdRefresh;
    }
    if (offline.some((suffix) => request.url.endsWith(suffix))) throw new TypeError('Network request failed');
    const body = init?.body ? String(init.body) : request.method === 'GET' ? undefined : await request.clone().text();
    calls.push({ url: request.url, auth: request.headers.get('authorization') });
    return respond(handler(request.url, { headers: request.headers, body }));
  }) as typeof fetch;
}

/** A fresh copy of the app's modules, as after the app process starts again. */
function boot() {
  jest.resetModules();
  installFetch();
  return {
    session: require('@/api/session') as typeof import('@/api/session'),
    client: require('@/api/client') as typeof import('@/api/client'),
    errors: require('@/api/errors') as typeof import('@/api/errors'),
    store: require('expo-secure-store') as typeof import('expo-secure-store'),
  };
}

const pair = (n: number) => ({ data: { accessToken: `access-${n}`, refreshToken: `refresh-${n}` } });

beforeEach(() => {
  mockVault.clear();
  calls.length = 0;
  offline = [];
  holdRefresh = null;
  refreshReached = () => {};
  mockWriteDelay = 0;
  mockDeleteDelay = 0;
  handler = (url, init) => {
    if (url.endsWith('/auth/login')) {
      const { password } = JSON.parse(init.body ?? '{}');
      return password === 'right'
        ? { status: 200, body: pair(1) }
        : password === 'other'
          ? { status: 200, body: pair(3) }
          : { status: 401, body: { statusCode: 401, message: 'Invalid credentials' } };
    }
    if (url.endsWith('/auth/refresh')) {
      const { refreshToken } = JSON.parse(init.body ?? '{}');
      return refreshToken === 'refresh-1'
        ? { status: 200, body: pair(2) }
        : { status: 401, body: { statusCode: 401, message: 'Invalid refresh token' } };
    }
    return init.headers.get('authorization') === 'Bearer access-2'
      ? { status: 200, body: { data: { ok: true } } }
      : { status: 401, body: { statusCode: 401, message: 'Unauthorized', data: null } };
  };
});

describe('signed-in session', () => {
  it('signs in with email and password, and is still signed in after the app restarts', async () => {
    const first = boot();
    await first.session.signIn('user@test.wawu.dev', 'right');
    expect(mockVault.get('wawu.session.access')).toBe('access-1');
    expect(mockVault.get('wawu.session.refresh')).toBe('refresh-1');

    const second = boot();
    await second.session.restoreSession();
    expect(await second.session.getAccessToken()).toBe('access-1');
  });

  it('refuses a wrong password with one error shape and stores nothing', async () => {
    const { session, errors } = boot();
    await expect(session.signIn('user@test.wawu.dev', 'wrong')).rejects.toMatchObject({
      kind: 'unauthorized',
      status: 401,
      message: 'Invalid credentials',
    });
    expect(mockVault.size).toBe(0);
    expect(errors.isApiError(await session.signIn('a', 'b').catch((e) => e))).toBe(true);
  });

  it('starts signed out when nothing is stored', async () => {
    const { session } = boot();
    await session.restoreSession();
    expect(await session.getAccessToken()).toBeNull();
  });

  it('refreshes an expired token once, silently, however many requests fail together', async () => {
    mockVault.set('wawu.session.access', 'access-1');
    mockVault.set('wawu.session.refresh', 'refresh-1');
    const { client } = boot();

    const [a, b] = await Promise.all([
      client.unwrap(client.api.GET('/api/hub/dm/inbox' as never)),
      client.unwrap(client.api.GET('/api/hub/notifications' as never)),
    ]);
    expect(a).toEqual({ data: { ok: true } });
    expect(b).toEqual({ data: { ok: true } });

    expect(calls.filter((c) => c.url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(calls.filter((c) => c.auth === 'Bearer access-2')).toHaveLength(2);
    expect(mockVault.get('wawu.session.access')).toBe('access-2');
    expect(mockVault.get('wawu.session.refresh')).toBe('refresh-2');
  });

  it('signs the user out when the refresh token is refused', async () => {
    mockVault.set('wawu.session.access', 'access-0');
    mockVault.set('wawu.session.refresh', 'refresh-0');
    const { client, session } = boot();
    await expect(client.unwrap(client.api.GET('/api/hub/notifications' as never))).rejects.toMatchObject({
      kind: 'unauthorized',
    });
    expect(mockVault.size).toBe(0);
    expect(await session.getAccessToken()).toBeNull();
  });

  it('keeps the tokens when the refresh cannot reach the server', async () => {
    mockVault.set('wawu.session.access', 'access-0');
    mockVault.set('wawu.session.refresh', 'refresh-1');
    const { client } = boot();
    offline = ['/auth/refresh'];
    await expect(client.unwrap(client.api.GET('/api/hub/notifications' as never))).rejects.toMatchObject({
      kind: 'network',
    });
    expect(mockVault.get('wawu.session.refresh')).toBe('refresh-1');
  });

  it('removes the tokens from secure storage on sign out, and later requests carry none', async () => {
    const { session, client, store } = boot();
    await session.signIn('user@test.wawu.dev', 'right');
    await session.signOut();
    expect(store.deleteItemAsync).toHaveBeenCalledWith('wawu.session.access');
    expect(store.deleteItemAsync).toHaveBeenCalledWith('wawu.session.refresh');
    expect(mockVault.size).toBe(0);

    calls.length = 0;
    await client.api.GET('/api/hub/notifications' as never);
    expect(calls[0].auth).toBeNull();

    const restarted = boot();
    await restarted.session.restoreSession();
    expect(await restarted.session.getAccessToken()).toBeNull();
  });

  it('reports a request that never reached the server as a network error', async () => {
    const { client } = boot();
    offline = ['/api/hub/notifications'];
    await expect(client.unwrap(client.api.GET('/api/hub/notifications' as never))).rejects.toMatchObject({
      kind: 'network',
      status: 0,
    });
  });
});

/** Holds the next refresh until `release()`; `reached` resolves once the refresh request is on the wire. */
function holdNextRefresh() {
  let release: () => void = () => {};
  holdRefresh = new Promise<void>((resolve) => {
    release = resolve;
  });
  const reached = new Promise<void>((resolve) => {
    refreshReached = resolve;
  });
  return { release, reached };
}

describe('refresh while the session changes', () => {
  beforeEach(() => {
    mockVault.set('wawu.session.access', 'access-1');
    mockVault.set('wawu.session.refresh', 'refresh-1');
  });

  it('stays signed out, with an empty store, when the user signs out during a refresh', async () => {
    const { session } = boot();
    await session.restoreSession();
    const hold = holdNextRefresh();
    const pending = session.refreshAccessToken('access-1');
    await hold.reached;

    await session.signOut();
    expect(mockVault.size).toBe(0);
    hold.release();

    await expect(pending).resolves.toBeNull();
    expect(mockVault.size).toBe(0);
    expect(await session.getAccessToken()).toBeNull();
    const restarted = boot();
    await restarted.session.restoreSession();
    expect(await restarted.session.getAccessToken()).toBeNull();
  });

  it('does not overwrite a different user who signed in during a refresh', async () => {
    const { session } = boot();
    await session.restoreSession();
    const hold = holdNextRefresh();
    const pending = session.refreshAccessToken('access-1');
    await hold.reached;

    await session.signIn('other@test.wawu.dev', 'other');
    hold.release();

    await expect(pending).resolves.toBeNull();
    expect(mockVault.get('wawu.session.access')).toBe('access-3');
    expect(mockVault.get('wawu.session.refresh')).toBe('refresh-3');
    expect(await session.getAccessToken()).toBe('access-3');
  });

  it('does not sign out a user who signed in again when the old refresh is refused', async () => {
    const { session } = boot();
    await session.restoreSession();
    const hold = holdNextRefresh();
    handler = (url) =>
      url.endsWith('/auth/login')
        ? { status: 200, body: pair(3) }
        : { status: 401, body: { statusCode: 401, message: 'Invalid refresh token' } };
    const pending = session.refreshAccessToken('access-1');
    await hold.reached;

    await session.signIn('other@test.wawu.dev', 'other');
    hold.release();

    await expect(pending).resolves.toBeNull();
    expect(mockVault.get('wawu.session.access')).toBe('access-3');
    expect(await session.getAccessToken()).toBe('access-3');
  });
});

const tick = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('sign out and sign in while the store is mockSlow', () => {
  it('ends signed out with an empty store when the user signs out during a token save', async () => {
    mockVault.set('wawu.session.access', 'access-1');
    mockVault.set('wawu.session.refresh', 'refresh-1');
    const { session } = boot();
    await session.restoreSession();
    mockWriteDelay = 80;
    mockDeleteDelay = 10;
    const pending = session.refreshAccessToken('access-1');
    await tick(30);

    await session.signOut();
    await pending.catch(() => null);
    await tick(200);

    expect(mockVault.size).toBe(0);
    expect(await session.getAccessToken()).toBeNull();
    const restarted = boot();
    await restarted.session.restoreSession();
    expect(await restarted.session.getAccessToken()).toBeNull();
  });

  it('keeps the newest sign in when a user signs in, out and in again with slow writes', async () => {
    mockWriteDelay = 10;
    mockDeleteDelay = 80;
    const { session } = boot();
    const first = session.signIn('a@test.wawu.dev', 'right');
    await tick(20);
    const out = session.signOut();
    await tick(10);
    const second = session.signIn('b@test.wawu.dev', 'other');
    await Promise.all([first, out, second]);
    await tick(200);

    expect(mockVault.get('wawu.session.access')).toBe('access-3');
    expect(mockVault.get('wawu.session.refresh')).toBe('refresh-3');
    expect(await session.getAccessToken()).toBe('access-3');
    const restarted = boot();
    await restarted.session.restoreSession();
    expect(await restarted.session.getAccessToken()).toBe('access-3');
  });

  it('ends signed out when the user signs out while a sign in is still being stored', async () => {
    mockWriteDelay = 80;
    mockDeleteDelay = 10;
    const { session } = boot();
    const signingIn = session.signIn('a@test.wawu.dev', 'right');
    await tick(30);
    await session.signOut();
    await signingIn;
    await tick(200);

    expect(mockVault.size).toBe(0);
    expect(await session.getAccessToken()).toBeNull();
    const restarted = boot();
    await restarted.session.restoreSession();
    expect(await restarted.session.getAccessToken()).toBeNull();
  });
});

describe('what a failed refresh does', () => {
  const refuse = (status: number) => {
    handler = () => ({ status, body: { statusCode: status, message: 'No.' } });
  };

  it.each([401, 403, 400, 422])('signs the user out when the server answers %i', async (status) => {
    mockVault.set('wawu.session.access', 'access-1');
    mockVault.set('wawu.session.refresh', 'refresh-1');
    const { session } = boot();
    await session.restoreSession();
    refuse(status);
    await expect(session.refreshAccessToken('access-1')).resolves.toBeNull();
    expect(mockVault.size).toBe(0);
    expect(await session.getAccessToken()).toBeNull();
  });

  it.each([
    [429, 'rate_limited'],
    [500, 'server'],
    [503, 'server'],
    [404, 'not_found'],
    [418, 'unknown'],
  ])('keeps the tokens and throws when the server answers %i', async (status, kind) => {
    mockVault.set('wawu.session.access', 'access-1');
    mockVault.set('wawu.session.refresh', 'refresh-1');
    const { session } = boot();
    await session.restoreSession();
    refuse(status);
    await expect(session.refreshAccessToken('access-1')).rejects.toMatchObject({ kind, status });
    expect(mockVault.get('wawu.session.access')).toBe('access-1');
    expect(mockVault.get('wawu.session.refresh')).toBe('refresh-1');
    expect(await session.getAccessToken()).toBe('access-1');
  });

  it('keeps the tokens and throws when the refresh cannot reach the server', async () => {
    mockVault.set('wawu.session.access', 'access-1');
    mockVault.set('wawu.session.refresh', 'refresh-1');
    const { session } = boot();
    await session.restoreSession();
    offline = ['/auth/refresh'];
    await expect(session.refreshAccessToken('access-1')).rejects.toMatchObject({ kind: 'network' });
    expect(mockVault.get('wawu.session.refresh')).toBe('refresh-1');
  });
});

describe('error shape', () => {
  it('reads the server code and joins validation sentences', () => {
    const { toApiError } = require('@/api/errors') as typeof import('@/api/errors');
    expect(toApiError(403, { statusCode: 403, code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email.' })).toMatchObject({
      kind: 'forbidden',
      code: 'EMAIL_NOT_VERIFIED',
    });
    expect(toApiError(400, { message: ['a is required', 'b is invalid'] }).message).toBe('a is required. b is invalid');
    expect(toApiError(503, null).kind).toBe('server');
  });
});

/** A token shaped like WAWU ID's: a JWT whose `sub` is the account. The signature is never read here. */
const jwtFor = (sub: string, n: number) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256', typ: 'JWT' })}.${part({ sub, n })}.signature`;
};

describe('the session tells its listeners when it ends (FIX-04)', () => {
  it('a sign-out, a refused refresh and a sign-in over a session each end it once; a first sign-in, a restore and a second sign-out do not', async () => {
    mockVault.set('wawu.session.access', 'access-0');
    mockVault.set('wawu.session.refresh', 'refresh-0');
    const { session, client } = boot();
    const ended = jest.fn();
    session.onSessionEnd(ended);

    await session.restoreSession();
    expect(ended).not.toHaveBeenCalled();
    await client.api.GET('/api/hub/notifications' as never);
    expect(await session.getAccessToken()).toBeNull();
    expect(ended).toHaveBeenCalledTimes(1);

    await session.signIn('a@test.wawu.dev', 'right');
    expect(ended).toHaveBeenCalledTimes(1);
    await session.signOut();
    expect(ended).toHaveBeenCalledTimes(2);
    await session.signOut();
    expect(ended).toHaveBeenCalledTimes(2);

    await session.signIn('a@test.wawu.dev', 'right');
    await session.signIn('b@test.wawu.dev', 'other');
    expect(ended).toHaveBeenCalledTimes(3);
    expect(await session.getAccessToken()).toBe('access-3');
  });

  it('a refresh for the same account does not end the session; one that answers for another account does', async () => {
    mockVault.set('wawu.session.access', jwtFor('account-a', 1));
    mockVault.set('wawu.session.refresh', 'refresh-a');
    const { session } = boot();
    const ended = jest.fn();
    session.onSessionEnd(ended);
    await session.restoreSession();

    let next = { accessToken: jwtFor('account-a', 2), refreshToken: 'refresh-a2' };
    handler = () => ({ status: 200, body: { data: next } });
    await expect(session.refreshAccessToken(jwtFor('account-a', 1))).resolves.toBe(next.accessToken);
    expect(ended).not.toHaveBeenCalled();

    const sameAccount = next.accessToken;
    next = { accessToken: jwtFor('account-b', 3), refreshToken: 'refresh-b' };
    await expect(session.refreshAccessToken(sameAccount)).resolves.toBe(next.accessToken);
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('a listener that throws stops neither the others nor the sign-out, which then reports it; an unsubscribed one is not called', async () => {
    const { session } = boot();
    const broken = jest.fn(() => {
      throw new Error('listener failed');
    });
    const after = jest.fn();
    const gone = jest.fn();
    session.onSessionEnd(broken);
    session.onSessionEnd(after);
    session.onSessionEnd(gone)();

    await session.signIn('a@test.wawu.dev', 'right');
    await expect(session.signOut()).rejects.toThrow('listener failed');

    expect(broken).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
    expect(gone).not.toHaveBeenCalled();
    expect(await session.getAccessToken()).toBeNull();
    expect(mockVault.size).toBe(0);
  });
});
