/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform, Pressable, Text } from 'react-native';

import { hub, installHub, type HubCredit, type HubProduct } from '../testing/fakeHub';
import { fakeStore } from '../testing/fakeIap';
import { renderSignedIn, resetApp } from '../testing/screen';

/*
 * STORE-BUY-APP (R-101): the pay sheets of a phone with a store, as a person uses them. The real hooks (`useUnlock`, `useTip`, `useAsk`) and
 * the real sheets are drawn with the Hub as a stand-in `fetch` and `expo-iap` replaced at its own boundary. What a person sees: the STORE's
 * price (never the list price), "Paid with Google Play", a credit offered first, and every Hub refusal in the app's words; and what the Hub is
 * told: an intent first, then the store's receipt. On the web none of it is drawn and the wallet keeps its path.
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
const PIECE = '11111111-1111-4111-8111-111111111111';
const NOT_WIRED = { onOpenWallet: () => undefined, onSetPin: () => undefined, onForgotPin: () => undefined, onAddMoney: () => undefined };

const NAIRA = [100, 500, 1000, 2500, 5000];
const rung = (naira: number): HubProduct => ({
  id: `buy-android-${naira}`,
  platform: 'android',
  storeProductId: `wawu.buy.${naira}`,
  kind: 'buy',
  title: `Buy ${naira}`,
  subscription: false,
  grants: { points: null, credits: null, tierId: null, days: null },
  listPriceKobo: naira * 100,
  storePriceKobo: naira * 120,
});
/** The store's own text for each rung: not the list price, and in the person's own currency. */
const SHELF: Record<number, string> = { 100: '$0.99', 500: '$1.49', 1000: '$2.99', 2500: '$6.99', 5000: '$12.99' };
const credit = (id: string, naira: number, scope: HubCredit['scope'] = null): HubCredit => ({ id, amountKobo: naira * 100, scope, createdAt: '2026-10-27T00:00:00.000Z' });

const item = () => ({
  id: PIECE,
  status: 'live',
  createdAt: '2026-10-01T00:00:00Z',
  title: 'How I built a ₦2M a month agency',
  creatorWawuId: CREATOR,
  slug: PIECE,
  contentType: 'video',
  description: 'The full lesson.',
  category: 'Business',
  specializations: [],
  tags: [],
  accessType: 'paid',
  price: 2500,
  durationLabel: '18:04',
  pageCount: null,
  previewAssetUrl: 'https://cdn.test/preview.webm',
  creatorFirstUploadFree: false,
  views: 0,
  ratingPct: null,
  commentCount: 0,
  likes: 0,
  fullAssetUrl: null,
  fullAssetLocked: true,
  likedByMe: false,
  savedByMe: false,
  followsCreator: false,
  shares: 0,
  creator: { wawuId: CREATOR, displayName: 'Chidi Eze', handle: 'chidi', avatarUrl: null, verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } } },
  media: { contentId: PIECE, contentType: 'video', durationLabel: '18:04', pageCount: null, frameCount: 0, frames: [] },
});

function serve(over: { available?: boolean; rungs?: number[] } = {}) {
  hub.reset();
  fakeStore.reset();
  installHub();
  hub.open = over.available ?? true;
  hub.reason = over.available === false ? 'store_not_configured' : null;
  const rungs = over.rungs ?? NAIRA;
  hub.products = rungs.map(rung);
  fakeStore.products = rungs.map((n) => ({ id: `wawu.buy.${n}`, displayPrice: SHELF[n], type: 'in-app' as const }));
  hub.prices = {
    prices: NAIRA.map((n) => ({ priceNaira: n, storePriceNaira: rungs.includes(n) ? Math.round(n * 1.2) : null })),
    tips: [500, 1000, 5000].map((n) => ({ priceNaira: n, storePriceNaira: rungs.includes(n) ? Math.round(n * 1.2) : null })),
  };
}

let asked: [string, unknown][] = [];
async function boot() {
  const React = require('react') as typeof import('react');
  const { useUnlock } = require('@/features/unlock/useUnlock') as typeof import('@/features/unlock/useUnlock');
  const { UnlockSheets } = require('@/features/unlock/UnlockSheets') as typeof import('@/features/unlock/UnlockSheets');
  const { useTip } = require('@/features/tips/useTip') as typeof import('@/features/tips/useTip');
  const { TipSheets } = require('@/features/tips/TipSheets') as typeof import('@/features/tips/TipSheets');
  const { useAsk } = require('@/features/paid-ask/useAsk') as typeof import('@/features/paid-ask/useAsk');
  const { AskSheets } = require('@/features/paid-ask/AskSheets') as typeof import('@/features/paid-ask/AskSheets');
  function Harness() {
    const unlock = useUnlock(NOT_WIRED);
    const tip = useTip(NOT_WIRED);
    const ask = useAsk(NOT_WIRED, (who, q) => void asked.push([who, q]));
    return (
      <>
        <Text testID="native">{String(unlock.store !== null && tip.store !== null && ask.store !== null)}</Text>
        <Pressable testID="open-unlock" onPress={() => unlock.begin(item() as never)}>
          <Text>open unlock</Text>
        </Pressable>
        <Pressable testID="open-tip" onPress={() => tip.begin({ wawuId: CREATOR, name: 'Chidi Eze', avatarUrl: null, hue: 'lilac' })}>
          <Text>open tip</Text>
        </Pressable>
        <Pressable testID="open-ask" onPress={() => ask.begin({ wawuId: CREATOR, name: 'Chidi Eze', avatarUrl: null, hue: 'lilac', tick: 'creator', priceKobo: 100_000, windowHours: 48 })}>
          <Text>open ask</Text>
        </Pressable>
        <UnlockSheets unlock={unlock} {...NOT_WIRED} />
        <TipSheets tip={tip} {...NOT_WIRED} />
        <AskSheets ask={ask} {...NOT_WIRED} />
      </>
    );
  }
  void React;
  await renderSignedIn(<Harness />);
}

rtl.configure({ asyncUtilTimeout: 10_000 });
beforeAll(() => {
  installHub();
  for (const m of ['@/features/unlock/UnlockSheets', '@/features/tips/TipSheets', '@/features/paid-ask/AskSheets']) require(m);
});
beforeEach(() => {
  mockVault.clear();
  asked = [];
  (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

const press = async (id: string) => rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId(id)));
const noMoneyWords = () => expect(rtl.screen.queryByText(/wallet|PIN|Bank charge|Approve/)).toBeNull();

describe('H14 and H16 · unlocking a piece on a phone with a store', () => {
  it('shows the store’s price and where it is paid, and no wallet, PIN, bank charge or list price', async () => {
    serve();
    await boot();
    await press('open-unlock');
    expect(await rtl.screen.findByText('Unlock · $6.99')).toBeTruthy();
    expect(rtl.screen.getByText('Google Play')).toBeTruthy();
    expect(rtl.screen.getByText('Forever, in My purchases')).toBeTruthy();
    noMoneyWords();
    expect(rtl.screen.queryByText(/₦2,500|2,500/)).toBeNull();
    expect(rtl.screen.queryByText(/cheaper|elsewhere|website/i)).toBeNull();
  });

  it('a person unlocks it: the Hub is told what it is for, the store takes the payment, and H16 says what was paid and where', async () => {
    serve();
    await boot();
    await press('open-unlock');
    await press('unlock-store-sheet-buy');
    expect(await rtl.screen.findByTestId('unlock-done')).toBeTruthy();
    expect(hub.intents).toEqual([{ platform: 'android', kind: 'content', contentId: PIECE, listPriceNaira: 2500 }]);
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'wawu.buy.2500', purchaseToken: 'token-1', intentId: 'intent-1' }]);
    expect(fakeStore.finished).toEqual([{ productId: 'wawu.buy.2500', isConsumable: true }]);
    expect(rtl.screen.getByText('$6.99')).toBeTruthy();
    expect(rtl.screen.getByText('Google Play')).toBeTruthy();
  });

  it('a credit that covers the price is offered first; using it opens no store sheet', async () => {
    serve();
    hub.credits = [credit('c1', 5000)];
    await boot();
    await press('open-unlock');
    expect(await rtl.screen.findByTestId('unlock-store-sheet-use-credit')).toBeTruthy();
    expect(rtl.screen.getByText('A credit can only be used on Who Made This. It can not be turned into cash.')).toBeTruthy();
    await press('unlock-store-sheet-use-credit');
    expect(await rtl.screen.findByTestId('unlock-done')).toBeTruthy();
    expect(hub.intents).toEqual([{ platform: 'android', kind: 'content', contentId: PIECE, listPriceNaira: 2500, payWith: 'credit' }]);
    expect(fakeStore.requests).toEqual([]);
    expect(rtl.screen.getByText('Your credit')).toBeTruthy();
    expect(rtl.screen.queryByText(/cash out|withdraw/i)).toBeNull();
  });

  it('a question credit is not offered for a piece', async () => {
    serve();
    hub.credits = [credit('q1', 5000, 'question')];
    await boot();
    await press('open-unlock');
    await rtl.screen.findByText('Unlock · $6.99');
    expect(rtl.screen.queryByTestId('unlock-store-sheet-use-credit')).toBeNull();
  });

  it.each([
    ['store_intent_target_not_found', 'The piece is not available.', 'This is not available any more. You were not charged.'],
    ['store_intent_price_changed', '', 'The price changed. Check the new price, then try again. You were not charged.'],
    ['store_intent_not_payable', 'You already own this piece.', 'You already own this piece.'],
  ])('the Hub refusing (%s) is told in words, before any store sheet opens', async (code, hubSays, line) => {
    serve();
    hub.intent = code;
    hub.intentMessage = hubSays;
    await boot();
    await press('open-unlock');
    await press('unlock-store-sheet-buy');
    expect(await rtl.screen.findByText(line)).toBeTruthy();
    expect(fakeStore.requests).toEqual([]);
    expect(rtl.screen.queryByTestId('unlock-done')).toBeNull();
  });

  it('a late sale is told as a credit, never as an unlock', async () => {
    serve();
    hub.late = true;
    await boot();
    await press('open-unlock');
    await press('unlock-store-sheet-buy');
    expect(await rtl.screen.findByText(/You have a ₦2500 credit to use on Who Made This/)).toBeTruthy();
    expect(rtl.screen.queryByTestId('unlock-done')).toBeNull();
  });

  it('a price the store does not sell shows no price and no buy button, and the Hub not open says so plainly', async () => {
    serve({ rungs: [100, 500] });
    await boot();
    await press('open-unlock');
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('unlock-store-sheet-buy')).toBeNull();
  });
});

describe('H26 and H28 · tipping on a phone with a store', () => {
  it('draws the tip list at the store’s price with what the creator gets, and tips on the chosen one', async () => {
    serve();
    await boot();
    await press('open-tip');
    expect(await rtl.screen.findByTestId('tip-tiles')).toBeTruthy();
    // ₦500 is on the list; the creator gets 85% of the LIST tip.
    expect(rtl.screen.getAllByText(/₦425/).length).toBeGreaterThan(0);
    noMoneyWords();
    await press('tip-tile-500');
    expect(await rtl.screen.findByText('Tip · $1.49')).toBeTruthy();
    await press('tip-sheet-buy');
    expect(await rtl.screen.findByTestId('tip-sent')).toBeTruthy();
    expect(hub.intents).toEqual([{ platform: 'android', kind: 'tip', creatorWawuId: CREATOR, listPriceNaira: 500 }]);
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'wawu.buy.500', purchaseToken: 'token-1', intentId: 'intent-1' }]);
    expect(fakeStore.finished).toEqual([{ productId: 'wawu.buy.500', isConsumable: true }]);
    expect(rtl.screen.getByText('$1.49')).toBeTruthy();
  });

  it('a tip the store has no product for is not drawn', async () => {
    serve({ rungs: [100, 500, 2500] });
    await boot();
    await press('open-tip');
    await rtl.screen.findByTestId('tip-tiles');
    expect(rtl.screen.queryByTestId('tip-tile-1000')).toBeNull();
    expect(rtl.screen.queryByTestId('tip-tile-5000')).toBeNull();
    expect(rtl.screen.getByTestId('tip-tile-500')).toBeTruthy();
  });

  it('a credit that covers the tip is offered first and pays for it with no store sheet', async () => {
    serve();
    hub.credits = [credit('c1', 1000)];
    await boot();
    await press('open-tip');
    await press('tip-tile-500');
    await press('tip-sheet-use-credit');
    expect(await rtl.screen.findByTestId('tip-sent')).toBeTruthy();
    expect(hub.intents[0]).toMatchObject({ kind: 'tip', listPriceNaira: 500, payWith: 'credit' });
    expect(fakeStore.requests).toEqual([]);
  });

  it('the Hub refusing the tip says so and nothing is charged', async () => {
    serve();
    hub.intent = 'store_intent_target_not_found';
    await boot();
    await press('open-tip');
    await press('tip-sheet-buy');
    expect(await rtl.screen.findByText('This is not available any more. You were not charged.')).toBeTruthy();
    expect(fakeStore.requests).toEqual([]);
  });
});

describe('I3 · a paid question on a phone with a store', () => {
  const write = async (words: string) => rtl.act(async () => rtl.fireEvent.changeText(await rtl.screen.findByTestId('ask-text'), words));

  it('the button waits for words, says the price is the store’s and what happens with no reply (a question credit, never cash)', async () => {
    serve();
    await boot();
    await press('open-ask');
    expect(await rtl.screen.findByText('Send · $2.99')).toBeTruthy();
    expect(rtl.screen.getByTestId('ask-sheet-buy').props.accessibilityState?.disabled).toBe(true);
    expect(rtl.screen.getByText('No reply in time? You get a question credit, to ask anyone at this price or less.')).toBeTruthy();
    noMoneyWords();
    await write('How do I price my first course?');
    expect(rtl.screen.getByTestId('ask-sheet-buy').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('sending: the intent carries the words, the store takes the payment, the Hub sends the question and the screen opens the thread', async () => {
    serve();
    await boot();
    await press('open-ask');
    await write('How do I price my first course?');
    await press('ask-sheet-buy');
    await rtl.waitFor(() => expect(asked).toHaveLength(1));
    expect(hub.intents).toEqual([{ platform: 'android', kind: 'question', creatorWawuId: CREATOR, text: 'How do I price my first course?', listPriceNaira: 1000 }]);
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'wawu.buy.1000', purchaseToken: 'token-1', intentId: 'intent-1' }]);
    expect(fakeStore.finished).toEqual([{ productId: 'wawu.buy.1000', isConsumable: true }]);
    expect(asked[0][0]).toBe(CREATOR);
  });

  it('a credit that is not a question credit is not offered for a question', async () => {
    serve();
    hub.credits = [credit('c1', 5000)];
    await boot();
    await press('open-ask');
    await write('A question');
    await rtl.screen.findByText('Send · $2.99');
    expect(rtl.screen.queryByTestId('ask-sheet-use-credit')).toBeNull();
  });

  it('a question credit at this price or more is offered first and sends the question with no store sheet', async () => {
    serve();
    hub.credits = [credit('q1', 2500, 'question')];
    await boot();
    await press('open-ask');
    await write('A question');
    await press('ask-sheet-use-credit');
    await rtl.waitFor(() => expect(asked).toHaveLength(1));
    expect(hub.intents[0]).toMatchObject({ kind: 'question', listPriceNaira: 1000, payWith: 'credit' });
    expect(fakeStore.requests).toEqual([]);
  });

  it('a question credit worth less than the price is not offered', async () => {
    serve();
    hub.credits = [credit('q1', 500, 'question')];
    await boot();
    await press('open-ask');
    await write('A question');
    await rtl.screen.findByText('Send · $2.99');
    expect(rtl.screen.queryByTestId('ask-sheet-use-credit')).toBeNull();
  });

  it('the Hub refusing the question (the creator is not taking questions, or has one waiting) says so in the Hub’s words', async () => {
    serve();
    hub.intent = 'store_intent_not_payable';
    hub.intentMessage = 'Chidi is not taking questions right now.';
    await boot();
    await press('open-ask');
    await write('A question');
    await press('ask-sheet-buy');
    expect(await rtl.screen.findByText('Chidi is not taking questions right now.')).toBeTruthy();
    expect(fakeStore.requests).toEqual([]);
    expect(asked).toEqual([]);
  });
});

describe('the website and the web export keep the wallet', () => {
  it('on the web the store path is off: nothing on the ladder is asked and the three flows are the wallet’s', async () => {
    serve();
    jest.replaceProperty(Platform, 'OS', 'web');
    await boot();
    expect(rtl.screen.getByTestId('native').props.children).toBe('false');
    expect(hub.reads.filter((r) => /store|prices\?platform/.test(r))).toEqual([]);
    expect(hub.intents).toEqual([]);
  });
});
