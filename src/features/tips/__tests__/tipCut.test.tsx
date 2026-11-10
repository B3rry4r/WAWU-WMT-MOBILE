/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform, Pressable, Text } from 'react-native';

import { hub, installHub, type HubProduct } from '@/features/store/testing/fakeHub';
import { fakeStore } from '@/features/store/testing/fakeIap';
import { renderSignedIn, resetApp } from '@/features/store/testing/screen';

/*
 * TIP-CUT (R-120): a buyer never sees what the creator receives. The tip sheet of a phone with a store (Android and iOS), as a person uses it:
 * every tile is the STORE's own price text (the string the Tip button charges, never naira beside a dollar button), nothing under a tile or in
 * the sheet's head says what the creator gets, a tile that is not priced yet is a skeleton, a tile and the Tip button press, and the Android
 * back button (the Modal's onRequestClose) closes the sheet. The real `useTip` and `TipSheets`, the Hub as a stand-in `fetch`, `expo-iap` replaced
 * at its own boundary (as `store/__tests__/ladderScreens`). Each test runs on Android and on iOS.
 */
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }), usePathname: () => '/' }));

const CREATOR = '22222222-2222-4222-8222-222222222222';
const NOT_WIRED = { onOpenWallet: () => undefined, onSetPin: () => undefined, onForgotPin: () => undefined, onAddMoney: () => undefined };
const TIPS = [200, 500, 1000, 2000, 5000, 10000];
const SHELF: Record<number, string> = { 200: '$0.99', 500: '$1.49', 1000: '$2.99', 2000: '$5.99', 5000: '$12.99', 10000: '$24.99' };

const rung = (platform: 'android' | 'ios', naira: number): HubProduct => ({
  id: `buy-${platform}-${naira}`,
  platform,
  storeProductId: `wawu.buy.${naira}`,
  kind: 'buy',
  title: `Buy ${naira}`,
  subscription: false,
  grants: { points: null, credits: null, tierId: null, days: null },
  listPriceKobo: naira * 100,
  storePriceKobo: naira * 120,
});

function serve(os: 'android' | 'ios', rungs: number[] = TIPS) {
  hub.reset();
  fakeStore.reset();
  installHub();
  hub.products = rungs.map((n) => rung(os, n));
  fakeStore.products = rungs.map((n) => ({ id: `wawu.buy.${n}`, displayPrice: SHELF[n], type: 'in-app' as const }));
  hub.prices = {
    prices: TIPS.map((n) => ({ priceNaira: n, storePriceNaira: rungs.includes(n) ? Math.round(n * 1.2) : null })),
    tips: TIPS.map((n) => ({ priceNaira: n, storePriceNaira: rungs.includes(n) ? Math.round(n * 1.2) : null })),
  };
}

async function boot() {
  const { useTip } = require('@/features/tips/useTip') as typeof import('@/features/tips/useTip');
  const { TipSheets } = require('@/features/tips/TipSheets') as typeof import('@/features/tips/TipSheets');
  function Harness() {
    const tip = useTip(NOT_WIRED);
    return (
      <>
        <Pressable testID="open-tip" onPress={() => tip.begin({ wawuId: CREATOR, name: 'Excel Okafor', avatarUrl: null, hue: 'lilac' })}>
          <Text>open tip</Text>
        </Pressable>
        <TipSheets tip={tip} {...NOT_WIRED} />
      </>
    );
  }
  await renderSignedIn(<Harness />);
}

rtl.configure({ asyncUtilTimeout: 10_000 });
beforeAll(() => {
  installHub();
  require('@/features/tips/TipSheets');
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

const press = async (id: string) => rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId(id)));
/** The Android back button: React Native calls the sheet's Modal `onRequestClose`; the dialog's nearest ancestor that carries one is that Modal. */
type Ancestor = { props: { onRequestClose?: () => void }; parent: Ancestor | null };
const pressBack = async () =>
  rtl.act(async () => {
    let node: Ancestor | null = rtl.screen.getByTestId('tip-sheet') as unknown as Ancestor;
    while (node && !node.props.onRequestClose) node = node.parent;
    expect(node).not.toBeNull();
    node?.props.onRequestClose?.();
  });
const creatorsCut = /gets|They get|earn|keeps|85|₦425|₦850|₦170|₦8,500/i;

describe.each(['android', 'ios'] as const)('R-120 · the tip sheet on %s', (os) => {
  beforeEach(() => {
    mockVault.clear();
    (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
    jest.replaceProperty(Platform, 'OS', os);
    serve(os);
  });

  it('every tile is the store’s own price text and nothing anywhere on the sheet says what the creator gets', async () => {
    await boot();
    await press('open-tip');
    expect(await rtl.screen.findByTestId('tip-tiles')).toBeTruthy();
    for (const n of TIPS) {
      expect(rtl.screen.getByTestId(`tip-tile-${n}-price`).props.children).toBe(SHELF[n]);
      expect(rtl.screen.getByTestId(`tip-tile-${n}`).props.accessibilityLabel).toBe(SHELF[n]);
    }
    expect(rtl.screen.getByText('Tip Excel')).toBeTruthy();
    // One currency on the sheet: the tiles and the button are the store's; no naira anywhere (the list price is the website's).
    expect(rtl.screen.queryByText(/₦/)).toBeNull();
    expect(rtl.screen.queryByText(creatorsCut)).toBeNull();
    expect(rtl.screen.getByText(os === 'ios' ? 'App Store' : 'Google Play')).toBeTruthy();
    // The tile that is chosen and the Tip button say the same price.
    expect(rtl.screen.getByText(`Tip · ${SHELF[1000]}`)).toBeTruthy();
    expect(rtl.screen.getByTestId('tip-tile-1000').props.accessibilityState.selected).toBe(true);
  });

  it('pressing a tile chooses it and the Tip button charges that tile’s price; pressing Tip buys it', async () => {
    await boot();
    await press('open-tip');
    await press('tip-tile-5000');
    expect(rtl.screen.getByTestId('tip-tile-5000').props.accessibilityState.selected).toBe(true);
    expect(rtl.screen.getByTestId('tip-tile-1000').props.accessibilityState.selected).toBe(false);
    expect(await rtl.screen.findByText('Tip · $12.99')).toBeTruthy();
    await press('tip-sheet-buy');
    expect(await rtl.screen.findByTestId('tip-sent')).toBeTruthy();
    expect(hub.intents).toEqual([{ platform: os, kind: 'tip', creatorWawuId: CREATOR, listPriceNaira: 5000 }]);
    expect(rtl.screen.getByText('$12.99 sent to Excel')).toBeTruthy();
    expect(rtl.screen.queryByText(creatorsCut)).toBeNull();
  });

  it('the Android back button (the sheet’s onRequestClose) closes the sheet and buys nothing', async () => {
    await boot();
    await press('open-tip');
    expect(await rtl.screen.findByTestId('tip-sheet')).toBeTruthy();
    await pressBack();
    expect(rtl.screen.queryByTestId('tip-sheet')).toBeNull();
    expect(hub.intents).toEqual([]);
    expect(fakeStore.requests).toEqual([]);
  });

  it('while the store has not priced its tiers the tiles are the loading state, never naira and never the list price', async () => {
    let release: () => void = () => undefined;
    hub.hold = new Promise<void>((r) => (release = r));
    await boot();
    await press('open-tip');
    expect(await rtl.screen.findByTestId('tip-tiles-loading')).toBeTruthy();
    expect(rtl.screen.queryByText(/₦/)).toBeNull();
    expect(rtl.screen.queryByTestId('tip-tile-1000')).toBeNull();
    await rtl.act(async () => release());
    expect(await rtl.screen.findByTestId('tip-tiles')).toBeTruthy();
    expect(rtl.screen.getByTestId('tip-tile-1000-price').props.children).toBe('$2.99');
  });

  it('a tier the store sells no product for is not a tile, and the others keep the store’s text', async () => {
    serve(os, [500, 1000, 5000]);
    await boot();
    await press('open-tip');
    await rtl.screen.findByTestId('tip-tiles');
    expect(rtl.screen.queryByTestId('tip-tile-200')).toBeNull();
    expect(rtl.screen.queryByTestId('tip-tile-2000')).toBeNull();
    expect(rtl.screen.getByTestId('tip-tile-500-price').props.children).toBe('$1.49');
  });

  it('a store that cannot sell shows its own notice and no tiles at all', async () => {
    hub.open = false;
    hub.reason = 'store_not_configured';
    await boot();
    await press('open-tip');
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('tip-tiles')).toBeNull();
    expect(rtl.screen.queryByTestId('tip-tiles-loading')).toBeNull();
    expect(rtl.screen.queryByText(/₦/)).toBeNull();
  });
});
