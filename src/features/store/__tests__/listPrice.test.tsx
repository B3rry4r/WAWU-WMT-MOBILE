/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installHub } from '../testing/fakeHub';
import { renderSignedIn, resetApp } from '../testing/screen';

/*
 * STORE-BUY-APP patch round 1, F1 (R-101 point 10): on a phone with a store, a price that is drawn before a sheet opens is the STORE's price
 * (`GET /prices` `storePriceNaira`), never the list price, and where the store sells no rung there is no price at all. The website and the web
 * export keep the list price. One test for each place that drew the list price: a search result, the course row on a piece, the directory row,
 * a visitor's Services line, the message button on a professional's card, and the paid thread's composer and follow-up offer.
 */
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));

/** List ₦1,500 sells at ₦1,800 in the store; ₦5,000 at ₦6,000; ₦2,500 has no rung. */
function serve(): void {
  hub.reset();
  installHub();
  hub.prices = {
    prices: [
      { priceNaira: 1500, storePriceNaira: 1800 },
      { priceNaira: 5000, storePriceNaira: 6000 },
      { priceNaira: 2500, storePriceNaira: null },
    ],
    tips: [],
  };
}

rtl.configure({ asyncUtilTimeout: 10_000 });
beforeAll(() => installHub());
beforeEach(() => {
  mockVault.clear();
  (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
  jest.replaceProperty(Platform, 'OS', 'android');
  serve();
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

const web = () => jest.replaceProperty(Platform, 'OS', 'web');

describe('F1 · the list price is not drawn on a phone with a store', () => {
  it('a search result shows the store price, no price where the store has none, Free as Free, and the list price on the web', async () => {
    const { ContentRow } = require('@/features/search/parts') as typeof import('@/features/search/parts');
    const row = (id: string, priceKobo: number | null) => ({ id, title: `Piece ${id}`, byline: 'Kemi · PDF', thumb: null, locked: priceKobo !== null, priceKobo });
    await renderSignedIn(
      <>
        <ContentRow testID="r-paid" row={row('a', 150_000)} />
        <ContentRow testID="r-none" row={row('b', 250_000)} />
        <ContentRow testID="r-free" row={row('c', null)} />
      </>,
    );
    await rtl.waitFor(() => expect(rtl.within(rtl.screen.getByTestId('r-paid')).getByText('₦1,800')).toBeTruthy());
    expect(rtl.within(rtl.screen.getByTestId('r-paid')).queryByText('₦1,500')).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('r-none')).queryByText(/₦/)).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('r-none')).queryByText('Free')).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('r-free')).getByText('Free')).toBeTruthy();
    rtl.cleanup();
    web();
    await renderSignedIn(<ContentRow testID="r-web" row={row('a', 150_000)} />);
    expect(rtl.within(rtl.screen.getByTestId('r-web')).getByText('₦1,500')).toBeTruthy();
  });

  it('the course row on a piece shows the store price of the course, and nothing where the store has no rung', async () => {
    const { ParentCourseRow } = require('@/features/content-detail/Parts') as typeof import('@/features/content-detail/Parts');
    const course = (price: number) => ({ id: 'k1', title: 'VFX for Beginners', lessonCount: 12, price, previewAssetUrl: null }) as never;
    await renderSignedIn(
      <>
        <ParentCourseRow course={course(1500)} onPress={() => undefined} />
      </>,
    );
    await rtl.waitFor(() => expect(rtl.screen.getByText('₦1,800')).toBeTruthy());
    expect(rtl.screen.queryByText('₦1,500')).toBeNull();
    expect(rtl.screen.getByTestId('detail-parent-course').props.accessibilityLabel).not.toMatch(/1,500/);
    rtl.cleanup();
    await renderSignedIn(<ParentCourseRow course={course(2500)} onPress={() => undefined} />);
    await rtl.act(async () => new Promise((r) => setTimeout(r, 50)));
    expect(rtl.screen.queryByText(/₦/)).toBeNull();
    expect(rtl.screen.queryByText('Free')).toBeNull();
  });

  it('a professional in the directory shows the store price of a message, and none where the store has no rung', async () => {
    const { ProRow } = require('@/features/professionals/DirectoryScreen') as typeof import('@/features/professionals/DirectoryScreen');
    const entry = (id: string, messagePriceKobo: number) =>
      ({ id, wawuId: `w-${id}`, name: 'Funmi Adeyemi', handle: null, headline: 'Accountant', avatarUrl: null, dmEnabled: true, messagePriceKobo, field: { id: 'accounting_tax', label: 'Accounting & Tax' }, category: 'finance', verification: { creator: { verified: false, expiresAt: null }, professional: { verified: true, expiresAt: null } } }) as never;
    await renderSignedIn(
      <>
        <ProRow entry={entry('a', 150_000)} onPress={() => undefined} />
        <ProRow entry={entry('b', 250_000)} onPress={() => undefined} />
      </>,
    );
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('pros-row-a').props.accessibilityLabel).toMatch(/₦1,800 a message/));
    expect(rtl.screen.getByTestId('pros-row-a').props.accessibilityLabel).not.toMatch(/1,500/);
    expect(rtl.screen.queryByText('₦1,500')).toBeNull();
    expect(rtl.screen.getByTestId('pros-row-b').props.accessibilityLabel).not.toMatch(/₦|a message/);
    expect(rtl.screen.queryByTestId('pros-price-b')).toBeNull();
  });

  const view = (dmPrice: number) => ({ profile: { dmEnabled: true, dmPrice, dmResponseHours: 24 }, listings: [] }) as never;

  it('a visitor reads the creator\u2019s Services line at the store price', async () => {
    const { ServicesBody } = require('@/features/visitor/VisitorProfileScreen') as typeof import('@/features/visitor/VisitorProfileScreen');
    await renderSignedIn(<ServicesBody view={view(1500)} onOpenListing={() => undefined} />);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('me-service-paid-sub')).toHaveTextContent('₦1,800 a message · replies within 24 hours'));
  });

  it('a visitor reads only the reply time where the store has no rung for the price', async () => {
    const { ServicesBody } = require('@/features/visitor/VisitorProfileScreen') as typeof import('@/features/visitor/VisitorProfileScreen');
    await renderSignedIn(<ServicesBody view={view(2500)} onOpenListing={() => undefined} />);
    await rtl.act(async () => new Promise((r) => setTimeout(r, 100)));
    expect(rtl.screen.getByTestId('me-service-paid-sub')).toHaveTextContent(/^replies within 24 hours$/);
  });

  it('a visitor on the web reads the list price', async () => {
    web();
    const { ServicesBody } = require('@/features/visitor/VisitorProfileScreen') as typeof import('@/features/visitor/VisitorProfileScreen');
    await renderSignedIn(<ServicesBody view={view(1500)} onOpenListing={() => undefined} />);
    expect(rtl.screen.getByTestId('me-service-paid-sub')).toHaveTextContent('₦1,500 a message · replies within 24 hours');
  });

  it('the locked price in a creator card\u2019s strip is the store\u2019s, none where no rung sells it, and the list price on the web', () => {
    const { workTile } = require('@/features/feed/model') as typeof import('@/features/feed/model');
    const work = { title: 'Pitch deck', contentType: 'pdf', locked: true, accessType: 'paid', price: 1500, views: 3, frameCount: 0, durationLabel: null } as never;
    expect(workTile(work).left).toBe('₦1,500');
    const store = { forKobo: (k: number) => (k === 150_000 ? 180_000 : null) };
    expect(workTile(work, store).left).toBe('₦1,800');
    expect(workTile(work, store).label).toBe('Pitch deck, locked, ₦1,800');
    const none = { forKobo: () => null };
    expect(workTile(work, none).left).toBe('');
    expect(workTile(work, none).label).toBe('Pitch deck, locked');
  });

  it('the price under a Saved piece is the store\u2019s, none where no rung sells it, and the list price on the web', () => {
    const { metaOf } = require('@/features/saved/model') as typeof import('@/features/saved/model');
    const entry = { kind: 'content', content: { bought: false, accessType: 'paid', priceKobo: 150_000 } } as never;
    expect(metaOf(entry, new Date())).toBe('₦1,500');
    expect(metaOf(entry, new Date(), { forKobo: (k: number) => (k === 150_000 ? 180_000 : null) })).toBe('₦1,800');
    expect(metaOf(entry, new Date(), { forKobo: () => null })).toBe('');
  });

  it('the caption of a locked tile on a visitor\u2019s Content grid is the store\u2019s price, none where no rung sells it, and the list price on the web', () => {
    const { visitorTileOf } = require('@/features/me/model') as typeof import('@/features/me/model');
    const piece = { id: 'p1', title: 'Pitch deck', contentType: 'pdf', accessType: 'paid', price: 1500, views: 3, previewAssetUrl: null, fullAssetLocked: true } as never;
    expect(visitorTileOf(piece).caption).toBe('₦1,500');
    expect(visitorTileOf(piece, { forKobo: (k: number) => (k === 150_000 ? 180_000 : null) }).caption).toBe('₦1,800');
    const bare = visitorTileOf(piece, { forKobo: () => null });
    expect(bare.caption).toBe('');
    expect(bare.spoken).toBe('Pitch deck, paid');
  });

  it('F7: on a phone with a store a missed reply is a question credit, in the creator\u2019s own window; the web keeps its refund words', () => {
    const { replyPromise } = require('@/features/professionals/ProfileScreen') as typeof import('@/features/professionals/ProfileScreen');
    expect(replyPromise('Funmi Adeyemi', 24, true)).toBe('Funmi replies within 24 hours, or you get a question credit.');
    expect(replyPromise('Funmi Adeyemi', 72, true)).toBe('Funmi replies within 3 days, or you get a question credit.');
    expect(replyPromise('Funmi Adeyemi', null, true)).toBe('If Funmi does not reply in time, you get a question credit.');
    expect(replyPromise('Funmi Adeyemi', 24)).toBe("Funmi replies within 24 hours, or you're refunded automatically.");
    const { waitingCard, paidStamp } = require('@/features/paid-ask/model') as typeof import('@/features/paid-ask/model');
    const now = Date.parse('2026-10-28T12:00:00.000Z');
    const q = { deadlineAt: '2026-10-29T06:00:00.000Z' };
    expect(waitingCard(q, 'Funmi Adeyemi', now, null, true).body).toBe('If Funmi does not reply in time, you get a question credit.');
    expect(waitingCard(q, 'Funmi Adeyemi', now, null).body).toMatch(/comes back to your wallet/);
    expect(waitingCard({ deadlineAt: '2026-10-28T10:00:00.000Z' }, 'Funmi Adeyemi', now, null, true).body).toBe('You get a question credit.');
    expect(paidStamp('2026-10-28T09:51:00.000Z', 150_000, now, null, true)).toMatch(/ · Paid$/);
    expect(paidStamp('2026-10-28T09:51:00.000Z', 150_000, now, null)).toMatch(/ · ₦1,500 paid$/);
  });

  it('the labels that carry a price draw none when there is none, and the follow-up offer says so', () => {
    const model = require('@/features/paid-ask/model') as typeof import('@/features/paid-ask/model');
    expect(model.askButtonLabel(null)).toBe('Message');
    expect(model.askButtonLabel(null, 'Ask a question')).toBe('Ask a question');
    expect(model.askButtonLabel(180_000)).toBe('Message · ₦1,800');
    expect(model.composerLabel(null, null)).toBe('Ask a question');
    expect(model.composerLabel(null, 180_000)).toBe('Ask a question · ₦1,800');
    expect(model.answeredCard('Chidi', { priceKobo: null, windowHours: 24 }).body).toBe('Ask a follow-up. Each paid message gets its own 24-hour window.');
  });
});
