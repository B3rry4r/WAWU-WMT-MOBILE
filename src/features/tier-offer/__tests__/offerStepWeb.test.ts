/* eslint-disable @typescript-eslint/no-require-imports */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

/** WEBAPP-03: on the web a "start" is a browser session (the tab), not a page load. */
const mockFetchOffer = jest.fn();
const mockMarkSeen = jest.fn();
jest.mock('../api', () => ({
  fetchTierOffer: (...args: unknown[]) => mockFetchOffer(...args),
  markTierOfferSeen: (...args: unknown[]) => mockMarkSeen(...args),
}));
const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const mockToken = `${b64({ alg: 'RS256' })}.${b64({ sub: 'account-ada', iat: 1000, exp: 4_000_000_000 })}.sig`;
jest.mock('@/api/session', () => ({ getAccessToken: jest.fn(async () => mockToken), onSessionEnd: jest.fn() }));

const step = require('../offerStep') as typeof import('../offerStep');
const { resetAccountTypeWrite } = require('@/features/auth/accountTypeWrite') as typeof import('@/features/auth/accountTypeWrite');

const store = new Map<string, string>();
let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  } as Storage;
  resetAccountTypeWrite();
  mockFetchOffer.mockReset().mockResolvedValue({ show: true, closeButton: true });
  mockMarkSeen.mockReset().mockResolvedValue(undefined);
  step.resetTierOffer();
});
afterEach(() => {
  os?.restore();
  os = undefined;
  delete (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage;
});

/** One page load: the module state is what a reload empties, the tab's storage is what it keeps. */
async function pageLoad() {
  step.resetTierOffer();
  const hook = await renderHook(() => step.useTierOfferStep(true));
  await act(async () => undefined);
  return hook;
}

describe('the tier offer on the web', () => {
  it('is shown once per browser session: a refresh in the same tab does not bring it back', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    const first = await pageLoad();
    await waitFor(() => expect(first.result.current.visible).toBe(true));
    await act(async () => {
      step.settleTierOffer();
    });
    expect(store.get(step.TIER_OFFER_SEEN_KEY)).toBe('account-ada');
    await first.unmount();
    mockFetchOffer.mockClear();
    const refresh = await pageLoad();
    expect(refresh.result.current).toMatchObject({ visible: false, holding: false });
    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it('comes again in a new tab (a new browser session)', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    store.set(step.TIER_OFFER_SEEN_KEY, 'account-ada');
    store.clear();
    const fresh = await pageLoad();
    await waitFor(() => expect(fresh.result.current.visible).toBe(true));
  });

  it('on a phone every start asks, as before', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'android');
    store.set(step.TIER_OFFER_SEEN_KEY, 'account-ada');
    const phone = await pageLoad();
    await waitFor(() => expect(phone.result.current.visible).toBe(true));
    expect(mockFetchOffer).toHaveBeenCalledTimes(1);
  });
});
