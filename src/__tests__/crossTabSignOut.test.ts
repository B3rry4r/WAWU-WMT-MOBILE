/* eslint-disable @typescript-eslint/no-require-imports */
/** The browser's localStorage, shared by every tab: the web build keeps the sign-in there. */
const store = new Map<string, string>();

const jwtFor = (sub: string, n: number) => `h.${btoa(JSON.stringify({ sub, n }))}.s`;

/** Two tabs are two module copies sharing one BroadcastChannel name; here a hub stands in for the browser. */
type Listener = (e: { data: unknown }) => void;
const tabs = new Set<Set<Listener>>();
class FakeChannel {
  private mine = new Set<Listener>();
  constructor() {
    tabs.add(this.mine);
  }
  postMessage(data: unknown) {
    tabs.forEach((l) => {
      if (l !== this.mine) l.forEach((fn) => fn({ data }));
    });
  }
  addEventListener(_: string, fn: Listener) {
    this.mine.add(fn);
  }
  removeEventListener(_: string, fn: Listener) {
    this.mine.delete(fn);
  }
}

/** WEBAPP-12 round 2: a session ending in one tab clears the picture cache in, and signs out, every other tab. */
describe('the session end across tabs', () => {
  const restores: { restore: () => void }[] = [];
  const deleted: string[] = [];

  function bootTab() {
    let out!: { session: typeof import('@/api/session'); store: typeof import('@/api/tokenStore') };
    jest.isolateModules(() => {
      const { Platform: P } = require('react-native');
      restores.push(jest.replaceProperty(P, 'OS', 'web'));
      out = { session: require('@/api/session'), store: require('@/api/tokenStore') };
      require('@/lib/pictureCache').registerPictureCache();
    });
    return out;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    tabs.clear();
    store.clear();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) } });
    deleted.length = 0;
    Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: FakeChannel });
    Object.defineProperty(globalThis, 'caches', { configurable: true, value: { delete: async (n: string) => (deleted.push(n), true) } });
  });
  afterEach(() => {
    jest.useRealTimers();
    restores.splice(0).forEach((r) => r.restore());
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
    delete (globalThis as { caches?: unknown }).caches;
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it('clears the cache and signs out the second tab when the first signs out', async () => {
    const one = bootTab();
    const two = bootTab();
    await one.session.adoptSession({ accessToken: jwtFor('a', 1), refreshToken: 'ra' });
    await two.session.adoptSession({ accessToken: jwtFor('a', 1), refreshToken: 'ra' });
    expect(await two.session.getAccessToken()).not.toBeNull();
    deleted.length = 0;
    await one.session.signOut();
    // One delete from tab 1 itself and one from tab 2, which heard the broadcast.
    expect(deleted).toEqual(['wmt-pictures-v1', 'wmt-pictures-v1']);
    await jest.advanceTimersByTimeAsync(400);
    // Tab 2 then dropped its session: nothing to send on a request any more.
    expect(await two.session.getAccessToken()).toBeNull();
  });

  it('leaves a tab alone when another account has signed in since', async () => {
    const one = bootTab();
    const two = bootTab();
    await one.session.adoptSession({ accessToken: jwtFor('a', 1), refreshToken: 'ra' });
    await two.session.adoptSession({ accessToken: jwtFor('a', 1), refreshToken: 'ra' });
    await one.session.signOut();
    // B signs in in the first tab before the second tab reads the saved sign-in.
    store.set('wawu.session.access', jwtFor('b', 3));
    store.set('wawu.session.refresh', 'rb');
    await jest.advanceTimersByTimeAsync(400);
    expect(store.get('wawu.session.refresh')).toBe('rb');
  });

  it('falls back to the storage event when the browser has no BroadcastChannel', async () => {
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
    const handlers: Record<string, (e: unknown) => void> = {};
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { addEventListener: (n: string, f: (e: unknown) => void) => void (handlers[n] = f) } });
    bootTab();
    deleted.length = 0;
    handlers.storage({ key: 'something.else', newValue: null });
    expect(deleted).toEqual([]);
    handlers.storage({ key: 'wawu.session.access', newValue: null });
    expect(deleted).toContain('wmt-pictures-v1');
    delete (globalThis as { window?: unknown }).window;
  });
});
