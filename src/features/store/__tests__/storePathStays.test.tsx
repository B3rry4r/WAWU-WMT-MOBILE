/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { renderSignedIn, resetApp } from '../testing/screen';

/*
 * R-86 (WEBAPP-06 fix 1): on Android and iOS a purchase of what the stores sell goes to the store sheet and never to the wallet path the web uses.
 * The web wallet's `begin` is never called, and no wallet quote is asked, on either phone platform.
 */
const mockBegin = jest.fn();
jest.mock('../webwallet/useWebBuy', () => ({
  useWebBuy: () => ({ busy: false, said: null, granted: null, begin: mockBegin, clear: jest.fn(), sheets: null }),
}));
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);
jest.mock('expo-secure-store', () => {
  const vault = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => vault.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void vault.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void vault.delete(k)),
  };
});
const seen: string[] = [];
beforeAll(() => {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    seen.push(url.pathname);
    return new Response(JSON.stringify({ statusCode: 500, message: 'no', data: null }), { status: 500, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
});
afterEach(() => {
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

describe.each(['android', 'ios'] as const)('%s', (os) => {
  it('buy() takes the store path: the wallet path is never begun and no wallet quote is asked', async () => {
    jest.replaceProperty(Platform, 'OS', os);
    seen.length = 0;
    mockBegin.mockClear();
    const { useStoreBuyer } = require('../useStore') as typeof import('../useStore');
    let buyer: ReturnType<typeof useStoreBuyer> | null = null;
    function Probe() {
      buyer = useStoreBuyer(null);
      return null;
    }
    await renderSignedIn(<Probe />);
    const item = { product: { id: 'p', platform: os, storeProductId: 'wawu.points.1000', kind: 'points', title: '1000 points', subscription: false, grants: { points: 1000 } }, price: '$1', offerToken: null };
    await rtl.act(async () => {
      await (buyer as unknown as ReturnType<typeof useStoreBuyer>).buy(item as never);
    });
    expect(mockBegin).not.toHaveBeenCalled();
    expect(seen.some((p) => p.includes('/plans/purchases') || p.includes('/credits/purchase/wallet'))).toBe(false);
  });
});
