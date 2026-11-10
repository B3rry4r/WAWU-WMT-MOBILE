import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { Platform } from 'react-native';

import { PICTURE_WORKER, registerPictureCache } from '@/lib/pictureCache';

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
    const cache = {
      match: async (key: string) => store.get(key),
      put: async (key: string, response: unknown) => void store.set(key, response),
      keys: async () => [...store.keys()],
      delete: async (key: string) => store.delete(key),
    };
    const picture = (url: string) => ({ status: 200, headers: { get: () => 'image/jpeg' }, url, clone() { return this; } });
    const sandbox = {
      self: { addEventListener: (name: string, fn: (event: unknown) => void) => void (listeners[name] = fn), location: { origin: 'https://usewmt.com' }, skipWaiting: () => undefined, clients: { claim: () => Promise.resolve() } },
      caches: { open: async () => cache },
      fetch: async (input: string | { url: string }) => {
        const url = typeof input === 'string' ? input : input.url;
        fetched.push(url);
        return picture(url);
      },
      URL,
    };
    vm.runInNewContext(source, sandbox);
    const ask = async (url: string, over: Record<string, unknown> = {}) => {
      let answer: Promise<unknown> | undefined;
      const waits: Promise<unknown>[] = [];
      listeners.fetch({ request: { method: 'GET', destination: 'image', url, ...over }, respondWith: (p: Promise<unknown>) => void (answer = p), waitUntil: (p: Promise<unknown>) => void waits.push(p) });
      const got = await answer;
      await Promise.all(waits);
      return { answered: answer !== undefined, got: got as { url: string } | undefined };
    };
    return { ask, fetched, store };
  }

  const signed = (at: string) => `https://bucket.nyc3.digitaloceanspaces.com/content/cover/u1/abc.jpg?X-Amz-Date=${at}&X-Amz-Signature=sig${at}&X-Amz-Expires=604800`;

  it('downloads a picture once and answers the same picture from its own address when the Hub signs it again', async () => {
    const w = boot();
    const first = await w.ask(signed('20261110T100000Z'));
    expect(first.answered).toBe(true);
    expect(w.fetched).toEqual([signed('20261110T100000Z')]);
    const second = await w.ask(signed('20261111T090000Z'));
    expect(w.fetched).toHaveLength(1);
    expect(second.got?.url).toBe(signed('20261110T100000Z'));
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
});
