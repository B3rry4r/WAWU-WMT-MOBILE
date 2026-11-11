/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

import { reloadForNewDeploy } from '@/lib/staleChunk';

/** WEBAPP-12 round 2: offline, a missing route file never reloads (the browser's own offline page would replace the app). */
describe('reloadForNewDeploy offline', () => {
  const reload = jest.fn();
  const chunk = Object.assign(new Error('Loading module /x.js failed.'), { name: 'AsyncRequireError' });
  let os: jest.ReplaceProperty<typeof Platform.OS>;
  beforeEach(() => {
    reload.mockClear();
    os = jest.replaceProperty(Platform, 'OS', 'web');
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { reload }, sessionStorage: { getItem: () => null, setItem: () => undefined } } });
  });
  afterEach(() => {
    os.restore();
    delete (globalThis as { window?: unknown }).window;
    Object.defineProperty(globalThis.navigator, 'onLine', { configurable: true, value: true });
  });

  it('does not reload while offline, and reloads once online again', () => {
    Object.defineProperty(globalThis.navigator, 'onLine', { configurable: true, value: false });
    expect(reloadForNewDeploy(chunk, 1)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    Object.defineProperty(globalThis.navigator, 'onLine', { configurable: true, value: true });
    expect(reloadForNewDeploy(chunk, 2)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('the address kept across the reload', () => {
  it('puts the route the person was going to back before reloading, once the error screen has set the address to the root', () => {
    jest.isolateModules(() => {
      const { Platform: P } = require('react-native');
      const restore = jest.replaceProperty(P, 'OS', 'web');
      let href = 'http://localhost/';
      const proto = {
        pushState: (_s: unknown, _t: string, url: string) => void (href = new URL(url, href).href),
        replaceState: (_s: unknown, _t: string, url: string) => void (href = new URL(url, href).href),
      };
      const history = Object.create(proto) as History;
      const reload = jest.fn();
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { history, get location() { return { href, reload }; }, sessionStorage: { getItem: () => null, setItem: () => undefined } },
      });
      const mod = require('@/lib/staleChunk');
      history.pushState(null, '', '/about');
      history.replaceState(null, '', '/');
      expect(href).toBe('http://localhost/');
      const chunk = Object.assign(new Error('Loading module /x.js failed.'), { name: 'AsyncRequireError' });
      expect(mod.reloadForNewDeploy(chunk, Date.now())).toBe(true);
      expect(href).toBe('http://localhost/about');
      expect(reload).toHaveBeenCalledTimes(1);
      restore.restore();
      delete (globalThis as { window?: unknown }).window;
    });
  });
});
