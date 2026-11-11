import { Platform } from 'react-native';

import { isChunkLoadError, reloadForNewDeploy, RELOAD_STAMP_KEY, RELOAD_WINDOW_MS } from '@/lib/staleChunk';

/** WEBAPP-12 fix 1: a tab open across a deploy reloads once when a route file is gone, and never loops. */
describe('reloadForNewDeploy', () => {
  const reload = jest.fn();
  const store = new Map<string, string>();
  let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
  const chunk = Object.assign(new Error('Loading module /_expo/static/js/web/search-ab12.js failed.\n(error: x)'), { name: 'AsyncRequireError' });

  beforeEach(() => {
    store.clear();
    reload.mockClear();
    os = jest.replaceProperty(Platform, 'OS', 'web');
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: { reload },
        sessionStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
      },
    });
  });
  afterEach(() => {
    os?.restore();
    delete (globalThis as { window?: unknown }).window;
  });

  it('recognises a missing route file and nothing else', () => {
    expect(isChunkLoadError(chunk)).toBe(true);
    expect(isChunkLoadError(new Error('Loading module /x.js failed.'))).toBe(true);
    expect(isChunkLoadError(Object.assign(new Error('x'), { name: 'ChunkLoadError' }))).toBe(true);
    expect(isChunkLoadError(new TypeError("Cannot read properties of null (reading 'layout')"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });

  it('reloads the page once for a missing route file', () => {
    expect(reloadForNewDeploy(chunk, 1_000_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(store.get(RELOAD_STAMP_KEY)).toBe('1000000');
  });

  it('does not loop: a second failure soon after shows the error screen', () => {
    expect(reloadForNewDeploy(chunk, 1_000_000)).toBe(true);
    expect(reloadForNewDeploy(chunk, 1_000_000 + 5_000)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('may reload again for a later deploy, after the window', () => {
    reloadForNewDeploy(chunk, 1_000_000);
    expect(reloadForNewDeploy(chunk, 1_000_000 + RELOAD_WINDOW_MS + 1)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('does not reload for any other error, or when storage cannot hold the stamp', () => {
    expect(reloadForNewDeploy(new Error('boom'), 1)).toBe(false);
    Object.defineProperty(globalThis.window, 'sessionStorage', { value: { getItem: () => { throw new Error('blocked'); } }, configurable: true });
    expect(reloadForNewDeploy(chunk, 1)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does nothing on a phone', () => {
    os?.restore();
    os = jest.replaceProperty(Platform, 'OS', 'android');
    expect(reloadForNewDeploy(chunk, 1)).toBe(false);
  });
});
