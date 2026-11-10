/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));

const jwtFor = (sub: string, n: number) => `h.${btoa(JSON.stringify({ sub, n }))}.s`;

/** WEBAPP-12 fix 2: a held picture never outlives the account that fetched it. */
describe('the picture cache and the session', () => {
  let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
  const held = new Set<string>(['wmt-pictures-v1']);
  const deleted: string[] = [];

  function boot(platform: 'web' | 'android') {
    jest.resetModules();
    mockVault.clear();
    held.clear();
    held.add('wmt-pictures-v1');
    deleted.length = 0;
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: { delete: async (name: string) => (deleted.push(name), held.delete(name)) },
    });
    const { Platform: P } = require('react-native');
    os = jest.replaceProperty(P, 'OS', platform);
    const session = require('@/api/session');
    require('@/lib/pictureCache').registerPictureCache();
    return session as typeof import('@/api/session');
  }

  afterEach(() => {
    os?.restore();
    delete (globalThis as { caches?: unknown }).caches;
  });

  it('deletes the held pictures at sign-out', async () => {
    const s = boot('web');
    await s.adoptSession({ accessToken: jwtFor('a', 1), refreshToken: 'ra' });
    expect(held.has('wmt-pictures-v1')).toBe(true);
    await s.signOut();
    expect(held.has('wmt-pictures-v1')).toBe(false);
  });

  it('deletes them when another account signs in over the first', async () => {
    const s = boot('web');
    await s.adoptSession({ accessToken: jwtFor('a', 1), refreshToken: 'ra' });
    await s.adoptSession({ accessToken: jwtFor('b', 2), refreshToken: 'rb' });
    expect(deleted).toEqual(['wmt-pictures-v1']);
  });

  it('keeps them while the same account renews its token', async () => {
    const s = boot('web');
    await s.adoptSession({ accessToken: jwtFor('a', 1), refreshToken: 'ra' });
    await s.replaceTokens({ accessToken: jwtFor('a', 2), refreshToken: 'ra2' });
    expect(deleted).toEqual([]);
  });

  it('does nothing on a phone', async () => {
    const s = boot('android');
    await s.adoptSession({ accessToken: jwtFor('a', 1), refreshToken: 'ra' });
    await s.signOut();
    expect(deleted).toEqual([]);
  });
});
