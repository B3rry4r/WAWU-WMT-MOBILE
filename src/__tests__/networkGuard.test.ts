import { installNetworkGuard, isLocalHost, takeViolations } from '../../jest/network-guard';

/**
 * FIX-48: no test reaches a real server. The guard (jest/network-guard.js, installed by
 * jest.network-guard.js for every test file) refuses any host that is not localhost or 127.0.0.1.
 * These cases run the guard on stand-in globals, and on the real ones where that sends nothing.
 */
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Scratch = Record<string, unknown> & {
  fetch: typeof fetch;
  XMLHttpRequest: new () => { open: (method: string, url: string) => void };
  WebSocket: new (url: string) => { url: string };
};

/** What the stand-in pieces were asked to do, behind the guard. */
type Sent = { fetch: jest.Mock; opened: string[] };

/** A scratch "global" with stand-in network pieces, so a request that passes the guard sends nothing. */
function scratchGlobal(): { target: Scratch; sent: Sent } {
  const sent: Sent = { fetch: jest.fn(async () => ({ ok: true })), opened: [] };
  class FakeXhr {
    open(_method: string, url: string) {
      sent.opened.push(url);
    }
  }
  class FakeSocket {
    static readonly OPEN = 1;
    constructor(public url: string) {}
  }
  const target = { fetch: sent.fetch, XMLHttpRequest: FakeXhr, WebSocket: FakeSocket } as unknown as Scratch;
  installNetworkGuard(target);
  return { target, sent };
}

afterEach(() => {
  // Tests here refuse requests on purpose; each takes its own record, this is the safety net.
  takeViolations(globalThis);
});

describe('the host check', () => {
  it.each(['localhost', '127.0.0.1', '::1', '[::1]', 'LOCALHOST'])('%s is this machine', (host) => {
    expect(isLocalHost(host)).toBe(true);
  });

  it.each(['api.wawuafrica.com', 'id.wawuafrica.com', 'live.fintavapay.com', 'hub.test', '127.0.0.1.evil.example', 'localhost.evil.example', '10.0.0.5', '0.0.0.0'])(
    '%s is not',
    (host) => {
      expect(isLocalHost(host)).toBe(false);
    },
  );
});

describe('fetch', () => {
  it('rejects a request to a real host and names the host', async () => {
    const { target: scratch, sent } = scratchGlobal();
    await expect(scratch.fetch('https://api.wawuafrica.com/api/hub/users/me?token=secret')).rejects.toThrow(
      /Blocked a real network request from a test: fetch to host "api\.wawuafrica\.com"/,
    );
    expect(sent.fetch).not.toHaveBeenCalled();
    const [violation] = takeViolations(scratch);
    expect(violation).toMatchObject({ via: 'fetch', host: 'api.wawuafrica.com' });
    expect(violation.message).not.toContain('secret');
  });

  it('lets localhost and 127.0.0.1 through', async () => {
    const { target: scratch, sent } = scratchGlobal();
    await scratch.fetch('http://127.0.0.1:9/api/hub/ping');
    await scratch.fetch('http://localhost:3000/x');
    await scratch.fetch(new URL('http://[::1]:3000/x'));
    expect(takeViolations(scratch)).toEqual([]);
    expect(sent.fetch).toHaveBeenCalledTimes(3);
  });

  it('reads the host of a Request or URL object, and of a lookalike or credentials trick', async () => {
    const { target: scratch } = scratchGlobal();
    const guarded = scratch.fetch;
    await expect(guarded(new Request('https://id.wawuafrica.com/refresh'))).rejects.toThrow(/"id\.wawuafrica\.com"/);
    await expect(guarded(new URL('https://api.wawuafrica.com/x'))).rejects.toThrow(/"api\.wawuafrica\.com"/);
    await expect(guarded('http://127.0.0.1.evil.example/x')).rejects.toThrow(/"127\.0\.0\.1\.evil\.example"/);
    await expect(guarded('http://127.0.0.1@api.wawuafrica.com/x')).rejects.toThrow(/"api\.wawuafrica\.com"/);
    expect(takeViolations(scratch)).toHaveLength(4);
  });

  it('has no host to check for a relative, data: or file: address', async () => {
    const { target: scratch, sent } = scratchGlobal();
    await scratch.fetch('/api/hub/ping');
    await scratch.fetch('data:text/plain,hi');
    await scratch.fetch('file:///tmp/a.txt');
    expect(takeViolations(scratch)).toEqual([]);
    expect(sent.fetch).toHaveBeenCalledTimes(3);
  });

  it('guards the real global fetch of this test file', async () => {
    await expect(fetch('https://api.wawuafrica.com/api/hub/users/me')).rejects.toThrow(/api\.wawuafrica\.com/);
    expect(takeViolations(globalThis)).toHaveLength(1);
  });

  it('sits under a test mock: a mocked fetch is not stopped and nothing is recorded', async () => {
    const real = globalThis.fetch;
    const mock = jest.fn(async () => new Response('{}'));
    globalThis.fetch = mock as unknown as typeof fetch;
    try {
      await fetch('http://hub.test/api/hub/ping');
      expect(mock).toHaveBeenCalledTimes(1);
      expect(takeViolations(globalThis)).toEqual([]);
    } finally {
      globalThis.fetch = real;
    }
  });

  it('stops the API client when its address is a real host, even though the client turns the failure into an answer', async () => {
    jest.resetModules();
    jest.doMock('@/api/env', () => ({ apiBaseUrl: 'https://api.wawuafrica.com', identityBaseUrl: 'https://id.wawuafrica.com' }));
    try {
      // Built now, after the env above: the client keeps the fetch and the address it finds when it is created.
      const { api } = jest.requireActual<typeof import('@/api/client')>('@/api/client');
      // WALK-FIX H4, lead ruling (30 Oct 2026): the guard throws a plain Error, which is not a network failure, so the client now says 'client'.
      await expect(api.GET('/api/hub/users/me' as never)).rejects.toMatchObject({ kind: 'client' });
      const violations = takeViolations(globalThis);
      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({ via: 'fetch', host: 'api.wawuafrica.com' });
    } finally {
      // Back to the setup's address, for the cases after this one.
      jest.doMock('@/api/env', () => ({ apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://localhost:9' }));
      jest.resetModules();
    }
  });
});

describe('XMLHttpRequest', () => {
  it('refuses to open a request to a real host and allows a local one', () => {
    const { target: scratch, sent } = scratchGlobal();
    const request = new scratch.XMLHttpRequest();
    expect(() => request.open('PUT', 'https://uploads.example.com/bucket/key')).toThrow(/XMLHttpRequest to host "uploads\.example\.com"/);
    expect(() => request.open('PUT', 'http://127.0.0.1:9/bucket/key')).not.toThrow();
    expect(sent.opened).toEqual(['http://127.0.0.1:9/bucket/key']);
    expect(takeViolations(scratch)).toHaveLength(1);
  });
});

describe('WebSocket', () => {
  it('refuses to connect to a real host and allows a local one', () => {
    const { target: scratch } = scratchGlobal();
    expect(() => new scratch.WebSocket('wss://api.wawuafrica.com/api/hub/live')).toThrow(/WebSocket to host "api\.wawuafrica\.com"/);
    const local = new scratch.WebSocket('ws://127.0.0.1:9/api/hub/live');
    expect(local.url).toBe('ws://127.0.0.1:9/api/hub/live');
    expect(local instanceof scratch.WebSocket).toBe(true);
    expect((scratch.WebSocket as unknown as { OPEN: number }).OPEN).toBe(1);
    expect(takeViolations(scratch)).toHaveLength(1);
  });

  it('guards the real global WebSocket of this test file', () => {
    expect(() => new WebSocket('wss://api.wawuafrica.com/api/hub/live')).toThrow(/api\.wawuafrica\.com/);
    expect(takeViolations(globalThis)).toHaveLength(1);
  });
});

describe('@/api/env in tests', () => {
  it('is a closed local port for the Hub and for WAWU ID, whichever way it is imported', () => {
    const viaAlias = jest.requireMock<typeof import('@/api/env')>('@/api/env');
    const viaPath = jest.requireMock<typeof import('@/api/env')>('../api/env');
    expect(viaPath).toBe(viaAlias);
    for (const address of [viaAlias.apiBaseUrl, viaAlias.identityBaseUrl]) {
      const url = new URL(address);
      expect(isLocalHost(url.hostname)).toBe(true);
      expect(url.port).toBe('9');
    }
    // A test tells a call to the Hub from a call to WAWU ID by `startsWith`, so neither may start with the other.
    expect(viaAlias.identityBaseUrl.startsWith(viaAlias.apiBaseUrl)).toBe(false);
    expect(viaAlias.apiBaseUrl.startsWith(viaAlias.identityBaseUrl)).toBe(false);
  });
});
