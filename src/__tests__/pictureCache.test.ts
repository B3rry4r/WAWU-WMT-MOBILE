import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { Platform } from 'react-native';

import { OPEN_KEY, PICTURE_CACHE, PICTURE_WORKER, registerPictureCache } from '@/lib/pictureCache';

/** WEBAPP-12: the web build keeps pictures under their own address; a phone is untouched. */
let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
const register = jest.fn(() => Promise.resolve({} as ServiceWorkerRegistration));

afterEach(() => {
  os?.restore();
  os = undefined;
  register.mockClear();
  // @ts-expect-error the test installs and removes a stand-in for the browser's service worker container
  delete globalThis.navigator.serviceWorker;
});

const withWorkers = () => {
  Object.defineProperty(globalThis.navigator, 'serviceWorker', { value: { register }, configurable: true });
};

describe('registerPictureCache', () => {
  it('does nothing on a phone, even if the runtime has a service worker container', () => {
    os = jest.replaceProperty(Platform, 'OS', 'android');
    withWorkers();
    registerPictureCache();
    expect(register).not.toHaveBeenCalled();
  });

  it('does nothing on iOS', () => {
    os = jest.replaceProperty(Platform, 'OS', 'ios');
    withWorkers();
    registerPictureCache();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers the worker on the web', () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    withWorkers();
    Object.defineProperty(globalThis, 'document', { value: { readyState: 'complete' }, configurable: true });
    registerPictureCache();
    expect(register).toHaveBeenCalledWith(PICTURE_WORKER);
    // @ts-expect-error the test removes its stand-in
    delete globalThis.document;
  });

  it('leaves a browser with no service workers alone', () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    expect(() => registerPictureCache()).not.toThrow();
    expect(register).not.toHaveBeenCalled();
  });
});

describe('the worker (public/wmt-sw.js)', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../public/wmt-sw.js'), 'utf8');

  /** Runs the worker's own file against a small fake browser: a cache that is a Map and a network that counts. */
  function boot() {
    const listeners: Record<string, (event: unknown) => void> = {};
    const store = new Map<string, unknown>();
    const fetched: string[] = [];
    const marker = { on: true };
    const cache = {
      match: async (key: string) => (key === OPEN_KEY ? (marker.on ? {} : undefined) : store.get(key)),
      put: async (key: string, response: unknown) => void store.set(key, response),
      keys: async () => [...store.keys()],
      delete: async (key: string) => store.delete(key),
    };
    const sizes = new Map<string, number>();
    const network: { answer?: (url: string) => Response } = {};
    /** A real Response (the worker reads its body and rebuilds it), carrying the address it was fetched from in a header. */
    const picture = (url: string, bytes = 1000) => new Response(new Uint8Array(sizes.get(new URL(url).pathname) ?? bytes), { status: 200, headers: { 'content-type': 'image/jpeg', 'x-test-url': url } });
    const sandbox = {
      self: { addEventListener: (name: string, fn: (event: unknown) => void) => void (listeners[name] = fn), location: { origin: 'https://usewmt.com' }, skipWaiting: () => undefined, clients: { claim: () => Promise.resolve() } },
      caches: { open: async () => cache },
      fetch: async (input: string | { url: string }) => {
        const url = typeof input === 'string' ? input : input.url;
        fetched.push(url);
        return network.answer ? network.answer(url) : picture(url);
      },
      URL,
      Response,
      Headers,
    };
    vm.runInNewContext(source, sandbox);
    const ask = async (url: string, over: Record<string, unknown> = {}) => {
      let answer: Promise<unknown> | undefined;
      const waits: Promise<unknown>[] = [];
      listeners.fetch({ request: { method: 'GET', destination: 'image', url, ...over }, respondWith: (p: Promise<unknown>) => void (answer = p), waitUntil: (p: Promise<unknown>) => void waits.push(p) });
      const got = await answer;
      await Promise.all(waits);
      return { answered: answer !== undefined, got: got as Response | undefined };
    };
    return { ask, fetched, store, sizes, network, marker };
  }

  const signed = (at: string) => `https://bucket.nyc3.digitaloceanspaces.com/content/cover/u1/abc.jpg?X-Amz-Date=${at}&X-Amz-Signature=sig${at}&X-Amz-Expires=604800`;

  it('downloads a picture once and answers the same picture from its own address when the Hub signs it again', async () => {
    const w = boot();
    const first = await w.ask(signed('20261110T100000Z'));
    expect(first.answered).toBe(true);
    expect(w.fetched).toEqual([signed('20261110T100000Z')]);
    const second = await w.ask(signed('20261111T090000Z'));
    expect(w.fetched).toHaveLength(1);
    expect(second.got?.headers.get('x-test-url')).toBe(signed('20261110T100000Z'));
    expect([...w.store.keys()]).toEqual(['https://bucket.nyc3.digitaloceanspaces.com/content/cover/u1/abc.jpg']);
  });

  it('keeps different pictures apart', async () => {
    const w = boot();
    await w.ask(signed('1'));
    await w.ask(signed('1').replace('abc.jpg', 'def.jpg'));
    expect(w.fetched).toHaveLength(2);
  });

  it('leaves everything else alone: the app\'s own files, unsigned links, other methods, and video or fonts', async () => {
    const w = boot();
    expect((await w.ask('https://usewmt.com/assets/a.png?X-Amz-Signature=x')).answered).toBe(false);
    expect((await w.ask('https://bucket.nyc3.digitaloceanspaces.com/a.jpg')).answered).toBe(false);
    expect((await w.ask(signed('1'), { method: 'POST' })).answered).toBe(false);
    expect((await w.ask(signed('1'), { destination: 'video' })).answered).toBe(false);
    expect((await w.ask(signed('1'), { destination: 'script' })).answered).toBe(false);
    expect(w.fetched).toHaveLength(0);
  });

  it('names the same cache as the page code that clears it', () => {
    expect(source).toContain(`const CACHE = '${PICTURE_CACHE}';`);
  });

  it('does not keep a 403, nor a non-image behind a signed link, and still hands them to the page', async () => {
    const w = boot();
    w.network.answer = () => new Response('no', { status: 403, headers: { 'content-type': 'image/jpeg' } });
    expect((await w.ask(signed('1'))).got?.status).toBe(403);
    w.network.answer = () => new Response('<p>', { status: 200, headers: { 'content-type': 'text/html' } });
    expect((await w.ask(signed('2').replace('abc', 'def'))).answered).toBe(true);
    expect(w.store.size).toBe(0);
  });

  it('holds at most 60 MB, dropping the oldest first, and never keeps one picture over the budget', async () => {
    const w = boot();
    const MB = 1024 * 1024;
    const at = (n: number) => `https://bucket.nyc3.digitaloceanspaces.com/p/${n}.jpg?X-Amz-Signature=s`;
    for (let n = 0; n < 15; n += 1) w.sizes.set(`/p/${n}.jpg`, 5 * MB);
    for (let n = 0; n < 15; n += 1) await w.ask(at(n));
    const held = [...w.store.keys()];
    // 15 x 5 MB = 75 MB offered: 12 fit in 60 MB, and the 3 oldest are the ones gone.
    expect(held).toHaveLength(12);
    expect(held[0]).toBe('https://bucket.nyc3.digitaloceanspaces.com/p/3.jpg');
    expect(held[11]).toBe('https://bucket.nyc3.digitaloceanspaces.com/p/14.jpg');
    // A single picture over the budget is shown but not kept, and nothing held is thrown out for it.
    w.sizes.set('/p/huge.jpg', 61 * MB);
    const huge = await w.ask('https://bucket.nyc3.digitaloceanspaces.com/p/huge.jpg?X-Amz-Signature=s');
    expect(huge.answered).toBe(true);
    expect([...w.store.keys()]).toEqual(held);
  });

  it('keeps nothing between a session ending and the next sign-in (no marker), but still shows the picture', async () => {
    const w = boot();
    w.marker.on = false;
    const shown = await w.ask(signed('1'));
    expect(shown.got?.status).toBe(200);
    expect(w.store.size).toBe(0);
    w.marker.on = true;
    await w.ask(signed('1'));
    expect(w.store.size).toBe(1);
  });

  it('names the same marker as the page code', () => {
    expect(source).toContain(`const OPEN_KEY = '${OPEN_KEY}';`);
  });

  it('still holds at most 120 small pictures', async () => {
    const w = boot();
    for (let n = 0; n < 125; n += 1) await w.ask(`https://bucket.nyc3.digitaloceanspaces.com/s/${n}.jpg?X-Amz-Signature=s`);
    expect(w.store.size).toBe(120);
  });
});
