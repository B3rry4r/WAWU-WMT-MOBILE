/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installHub, type HubProduct } from '@/features/store/testing/fakeHub';
import { fakeStore } from '@/features/store/testing/fakeIap';
import { renderSignedIn, resetApp } from '@/features/store/testing/screen';

/*
 * I30 and I31 · A private community's pass, bought in the store sheet (IAP-02, R-86, IAP-03 round 2). The Hub is a stand-in `fetch` (the
 * room, the pass and the two store routes); `expo-iap` is replaced at its own boundary. A pass is bought ONCE for this room: the person pays
 * the store at the store's price, the Hub checks it with the store and lets them in for the days it gives, and nothing renews it. Renew
 * buys it again. Restore purchases is on the screen.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }), usePathname: () => '/' }));

const ID = 'c0000000-0000-4000-8000-000000000001';
const PASS: HubProduct = {
  id: 'pass-month',
  platform: 'android',
  storeProductId: 'africa.wawu.pass.month',
  kind: 'pass',
  title: 'Monthly pass',
  subscription: false,
  grants: { points: null, credits: null, tierId: null, days: 30 },
};
const newMember = { communityId: ID, sellsPass: true, priceKobo: 200_000, periodDays: 30, passUntil: null, active: false, canRenew: false, canBuy: true, isHost: false };

function serve(pass: Record<string, unknown> = newMember, over: { available?: boolean; reason?: 'store_not_configured' | 'store_disabled' } = {}) {
  hub.reset();
  fakeStore.reset();
  installHub();
  hub.products = [PASS];
  hub.open = over.available ?? true;
  hub.reason = over.reason ?? null;
  fakeStore.products = [{ id: PASS.storeProductId, displayPrice: '$3.99', type: 'in-app' }];
  hub.routes[`GET /communities/${ID}/room`] = { id: ID, name: 'Founders under 30', kind: 'private', imageUrl: null, description: 'A room', hostWawuId: 'host1', memberCount: 640, messagesToday: 0, slug: 'founders', link: 'wawu/c/founders', role: 'none', messageCostInCredits: 1 };
  hub.routes['GET /users/host1/public-profile'] = { handle: 'adaeze' };
  hub.routes[`GET /communities/${ID}/pass`] = pass;
}

async function boot(pass?: Record<string, unknown>, over?: Parameters<typeof serve>[1]) {
  serve(pass, over);
  const { PassScreen } = require('../PassScreen') as typeof import('../PassScreen');
  await renderSignedIn(<PassScreen id={ID} onBack={jest.fn()} />);
}

/*
 * L-4 (v-IAP-03c): the first test failed once under load with no `pass-price`. The screen's answer lands only after a chain of hops (room and
 * pass, the host's handle, the Hub's catalog, the store's prices), and the first test paid for loading the code on the way: about 0.3 s when
 * the machine is quiet, over the 1 s that `findBy*` waits by default when it is not (a cold transform cache takes it past 9 s). The asserts
 * are unchanged; this file waits as long as the other store screens' tests do (they wait up to 10 s, and a `findBy*` returns the moment its
 * element is there), and loads the screen's code before the first test starts instead of inside it.
 */
rtl.configure({ asyncUtilTimeout: 10_000 });

beforeAll(() => {
  // The Hub client takes `fetch` when it is first loaded, so the stand-in Hub goes in before the screen's code does (as `boot` does).
  installHub();
  require('../PassScreen');
});

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

describe('I30 · Private, pay to join, in the store sheet', () => {
  it('a person sees the pass at the store’s own price, with Restore purchases, and no wallet, PIN, bank charge or naira', async () => {
    await boot();
    expect(await rtl.screen.findByTestId('pass-price')).toBeTruthy();
    expect(rtl.screen.getByText('$3.99 for 30 days')).toBeTruthy();
    expect(rtl.screen.getByText('Join · $3.99')).toBeTruthy();
    expect(rtl.screen.getByTestId('pass-restore')).toBeTruthy();
    for (const gone of ['pass-breakdown', 'pass-total', 'pass-short', 'pass-no-wallet', 'pass-add']) expect(rtl.screen.queryByTestId(gone)).toBeNull();
    expect(rtl.screen.queryByText(/wallet|PIN|Bank charge|₦/i)).toBeNull();
  });

  it('a person joins: the store sheet opens for the pass with the room, the Hub lets them in, and I31 says when it runs to', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByTestId('pass-joined-title')).toBeTruthy();
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'africa.wawu.pass.month', purchaseToken: 'token-1', communityId: ID }]);
    // A pass is bought once: it is consumed, so the same product can be bought again (for another room, or to renew).
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.pass.month', isConsumable: true }]);
    expect(JSON.stringify(fakeStore.requests[0])).toContain('"in-app"');
    expect(JSON.stringify(fakeStore.requests[0])).not.toContain('subs');
    expect((fakeStore.requests[0] as { request: { google: { obfuscatedAccountId?: string; obfuscatedProfileId?: string } } }).request.google).toMatchObject({ obfuscatedAccountId: hub.accountToken, obfuscatedProfileId: ID });
    expect(rtl.screen.getByTestId('pass-joined-line').props.children).toBe('Your pass runs to 1 December.');
    expect(rtl.screen.queryByText(/renews it|cancel/i)).toBeNull();
  });

  it('the Hub refusing the room (removed, or the host’s own) says why in the Hub’s words and the store transaction stays open', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    hub.answer = 'store_pass_not_available';
    hub.message = 'You host this room, so you do not need a pass.';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText('You host this room, so you do not need a pass.')).toBeTruthy();
    expect(fakeStore.finished).toEqual([]);
  });

  it('cancelling or a pending payment in the store sheet is said by its cause and joins nobody', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText('Cancelled. You were not charged.')).toBeTruthy();
    fakeStore.next = { kind: 'pending' };
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText(/waiting for the store to finish/)).toBeTruthy();
    expect(hub.bodies).toEqual([]);
    expect(rtl.screen.queryByTestId('pass-joined-title')).toBeNull();
  });

  it('a pass the store holds for this account is brought back by Restore purchases, and says how many', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    fakeStore.owned = [{ id: 'run', productId: PASS.storeProductId, purchaseState: 'purchased', purchaseToken: 'running', isAcknowledgedAndroid: true, obfuscatedProfileIdAndroid: ID }];
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-restore')));
    expect(await rtl.screen.findByText('Restored 1 purchase.')).toBeTruthy();
    expect(fakeStore.restores).toBe(1);
    expect(hub.bodies).toEqual([{ platform: 'android', productId: PASS.storeProductId, purchaseToken: 'running', communityId: ID }]);
  });

  it('a member sees "You’re in" with the end day, that it does not renew by itself, and Renew at the store’s price', async () => {
    await boot({ ...newMember, active: true, canRenew: true, passUntil: '2026-11-16T12:00:00.000Z' });
    expect(await rtl.screen.findByTestId('pass-joined-title')).toBeTruthy();
    expect(rtl.screen.getByTestId('pass-joined-line').props.children).toMatch(/runs to 16 November.*does not renew by itself/);
    expect(await rtl.screen.findByText('Renew · $3.99')).toBeTruthy();
    expect(rtl.screen.getByTestId('pass-open')).toBeTruthy();
    expect(rtl.screen.getByTestId('pass-restore')).toBeTruthy();
    expect(rtl.screen.queryByText(/store renews|cancel (it )?there/i)).toBeNull();
  });

  it('Renew buys the pass again for this room, and the new end day is shown (the days stack behind the days left)', async () => {
    await boot({ ...newMember, active: true, canRenew: true, passUntil: '2026-11-16T12:00:00.000Z' });
    await rtl.screen.findByText('Renew · $3.99');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText('Your pass runs to 1 December.')).toBeTruthy();
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'africa.wawu.pass.month', purchaseToken: 'token-1', communityId: ID }]);
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.pass.month', isConsumable: true }]);
  });

  it('a payment still held for ANOTHER room is given to that room, never to this one, and the person is told to buy again', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    const other = 'd0000000-0000-4000-8000-0000000000aa';
    // The store still holds an unconsumed pass bought for another room: it refuses a second purchase of the product.
    fakeStore.next = { kind: 'error', code: 'already-owned' };
    fakeStore.owned = [{ id: 'held', productId: PASS.storeProductId, purchaseState: 'purchased', purchaseToken: 'held-token', isAcknowledgedAndroid: false, obfuscatedProfileIdAndroid: other }];
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText(/payment you made earlier for another room/)).toBeTruthy();
    expect(hub.bodies).toEqual([{ platform: 'android', productId: PASS.storeProductId, purchaseToken: 'held-token', communityId: other }]);
    expect(fakeStore.finished).toEqual([{ productId: PASS.storeProductId, isConsumable: true }]);
    expect(rtl.screen.queryByTestId('pass-joined-title')).toBeNull();
  });

  it('a held pass with no room of its own is not handed over under this room', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    fakeStore.next = { kind: 'error', code: 'already-owned' };
    fakeStore.owned = [{ id: 'held', productId: PASS.storeProductId, purchaseState: 'purchased', purchaseToken: 'held-token', isAcknowledgedAndroid: false, obfuscatedProfileIdAndroid: null }];
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText(/still has an earlier purchase of this to finish/)).toBeTruthy();
    expect(hub.bodies).toEqual([]);
    expect(rtl.screen.queryByTestId('pass-joined-title')).toBeNull();
  });

  it('the Hub saying the payment belongs to another room says so and gives nothing to this one', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    hub.answer = 'store_purchase_other_room';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText(/already used for a different room/)).toBeTruthy();
    expect(fakeStore.finished).toEqual([]);
    expect(rtl.screen.queryByTestId('pass-joined-title')).toBeNull();
  });

  it('a member the host removed sees "Removed by the host" and no way to buy', async () => {
    await boot({ ...newMember, active: true, canBuy: false, canRenew: false, passUntil: '2026-11-16T12:00:00.000Z' });
    expect(await rtl.screen.findByTestId('pass-blocked')).toBeTruthy();
    expect(rtl.screen.getByText('The host has removed you from this room. Ask the host to let you back in.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
  });

  it('a removed member is told nothing about cancelling: nothing renews, so there is nothing to cancel', async () => {
    await boot({ ...newMember, active: true, canBuy: false, canRenew: false, passUntil: '2026-11-16T12:00:00.000Z' });
    expect(await rtl.screen.findByTestId('pass-blocked')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-cancel-in-store')).toBeNull();
    expect(rtl.screen.queryByText(/cancel/i)).toBeNull();
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
  });

  it('the Hub not open for Google Play yet says plainly that buying is not open yet', async () => {
    await boot(undefined, { available: false, reason: 'store_not_configured' });
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
  });
});

describe('F-1 · App Store · passes the store still lists after they were delivered (IAP-03 round 3)', () => {
  const held = (id: string) => ({ id: `tx-${id}`, productId: PASS.storeProductId, purchaseState: 'purchased' as const, purchaseToken: 'jws', transactionId: id });
  const roomIntent = () => require('@/features/store/roomIntent') as typeof import('@/features/store/roomIntent');

  async function bootIos(owned: ReturnType<typeof held>[], setUp: () => Promise<void> = async () => {}) {
    mockVault.clear();
    jest.replaceProperty(Platform, 'OS', 'ios');
    (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
    serve();
    hub.products = [{ ...PASS, platform: 'ios' }];
    fakeStore.owned = owned;
    await setUp();
    const { PassScreen } = require('../PassScreen') as typeof import('../PassScreen');
    await renderSignedIn(<PassScreen id={ID} onBack={jest.fn()} />);
    await rtl.screen.findByTestId('pass-pay');
    await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  }

  it('a pass the app delivered and the store still lists is not sent again when the screen opens, and nothing is said', async () => {
    await bootIos([held('1001')], async () => {
      await roomIntent().markDone(hub.accountToken, '1001');
      // An earlier buy that never completed left an entry for this room: it must not be given to the delivered pass.
      await roomIntent().rememberBuy(hub.accountToken, PASS.storeProductId, ID);
    });
    expect(hub.bodies).toEqual([]);
    expect(rtl.screen.queryByTestId('pass-said')).toBeNull();
    expect(rtl.screen.queryByTestId('pass-restore-line')).toBeNull();
    expect(rtl.screen.queryByTestId('pass-joined-title')).toBeNull();
  });

  it('a payment the app never saw complete is handed to the Hub with this room, though delivered passes are listed beside it', async () => {
    await bootIos([held('1001'), held('1002'), held('3001')], async () => {
      await roomIntent().markDone(hub.accountToken, '1001');
      await roomIntent().markDone(hub.accountToken, '1002');
      await roomIntent().rememberBuy(hub.accountToken, PASS.storeProductId, ID);
    });
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: PASS.storeProductId, transactionId: '3001', communityId: ID }]);
    expect(fakeStore.finished).toEqual([{ productId: PASS.storeProductId, isConsumable: true }]);
    expect(rtl.screen.queryByTestId('pass-restore-line')).toBeNull();
  });

  it('two payments nothing was kept for are not guessed: the screen says so plainly, and Restore purchases gives one to this room', async () => {
    await bootIos([held('3001'), held('3002')], async () => {
      await roomIntent().rememberBuy(hub.accountToken, PASS.storeProductId, ID);
    });
    expect(hub.bodies).toEqual([]);
    expect((await rtl.screen.findByTestId('pass-restore-line')).props.children).toBe('2 payments for a pass could not be matched to a room on this phone. If you paid and are not in the room, open that room and tap Restore purchases.');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-restore')));
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: PASS.storeProductId, transactionId: '3001', communityId: ID }]);
    expect(await rtl.screen.findByText(/^Restored 1 purchase\. A payment for a pass could not be matched/)).toBeTruthy();
  });

  it('L-3: Restore purchases in a room, with the Hub refusing the payment as another room’s, tells the person so and does not say there was nothing to restore', async () => {
    await bootIos([held('3001')]);
    expect(hub.bodies).toEqual([]);
    hub.answer = 'store_purchase_other_room';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-restore')));
    expect((await rtl.screen.findByTestId('pass-restore-line')).props.children).toBe('That payment was already used for a different room. To join this one, buy its pass again.');
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: PASS.storeProductId, transactionId: '3001', communityId: ID }]);
    expect(rtl.screen.queryByText('There was nothing to restore.')).toBeNull();
    expect(rtl.screen.queryByTestId('pass-joined-title')).toBeNull();
  });

  it('a person who owes no pass payment on this phone, with passes listed from another device, is told nothing', async () => {
    await bootIos([held('4001'), held('4002')]);
    expect(hub.bodies).toEqual([]);
    expect(rtl.screen.queryByTestId('pass-restore-line')).toBeNull();
    expect(rtl.screen.queryByTestId('pass-said')).toBeNull();
  });
});
