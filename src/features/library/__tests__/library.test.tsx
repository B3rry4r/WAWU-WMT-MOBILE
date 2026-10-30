/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { allowance, calls, hub, installFetch, ok, piece, renderFrame, runningTier, type Sent } from '../__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (run: () => void) => {
    require('react').useEffect(run, [run]);
  },
}));

installFetch();
const { LibraryScreen } = require('../LibraryScreen') as typeof import('../LibraryScreen');

const LIST = '/api/hub/content/mine/library';
const COUNTS = '/api/hub/content/mine/library/counts';
const ALLOWANCE = '/api/hub/uploads/allowance';
const TIER = '/api/hub/me/tier';

const page = (items: unknown[], nextPage: number | null = null, currentPage = 1) => ok(items, { currentPage, nextPage, perPage: 20, total: items.length });
const six = [
  piece({ id: 'w1', title: 'How I light a night shoot', contentType: 'video', price: 2500, salesCount: 18 }),
  piece({ id: 'c1', title: 'Brand deck template', contentType: 'template', price: 4500, salesCount: 9 }),
  piece({ id: 'w3', title: 'Afrobeats stems, vol. 1', contentType: 'audio', price: 1500, salesCount: 7 }),
  piece({ id: 'w5', title: 'Colour grading LUTs', contentType: 'template', price: 3500, salesCount: 0 }),
  piece({ id: 'e2', title: 'Pricing playbook v3', contentType: 'pdf', status: 'pending', price: 2000, salesCount: 0 }),
  piece({
    id: 'r1',
    title: 'Pricing playbook',
    contentType: 'pdf',
    status: 'rejected',
    price: 2000,
    salesCount: 0,
    rejectionReason: 'Charts on pages 22 to 24 were taken from another publisher.',
    rejectedAt: new Date().toISOString(),
  }),
];

/** The Hub's own filter: `status=` narrows the list to that state. */
const byStatus = (sent: Sent) => {
  const asked = /status=(\w+)/.exec(sent.search)?.[1];
  return page(asked ? six.filter((p) => p.status === asked) : six);
};

const open = async () => {
  const handlers = { back: jest.fn(), create: jest.fn(), seeWhy: jest.fn() };
  const view = await renderFrame(<LibraryScreen onBack={handlers.back} onCreate={handlers.create} onSeeWhy={handlers.seeWhy} />);
  return { ...handlers, ...view };
};

beforeEach(() => {
  installFetch();
  hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
  hub.answers[`GET ${COUNTS}`] = ok({ all: 6, live: 4, pending: 1, rejected: 1 });
  hub.answers[`GET ${LIST}`] = page(six);
});

describe('M28 · My content', () => {
  it('a user can see every piece with its kind, price and sales, its state, and the uploads used', async () => {
    await open();
    expect(await screen.findByText('How I light a night shoot')).toBeTruthy();
    expect(screen.getByText('Video · ₦2,500 · 18 sales')).toBeTruthy();
    expect(screen.getByText('Template · ₦4,500 · 9 sales')).toBeTruthy();
    expect(screen.getByText('Audio · ₦1,500 · 7 sales')).toBeTruthy();
    // A piece nobody has bought yet draws no count.
    expect(screen.getByText('Template · ₦3,500')).toBeTruthy();
    expect(screen.getByText('PDF · sent today')).toBeTruthy();
    expect(screen.getByText('PDF · see why')).toBeTruthy();
    expect(screen.getAllByText('Live')).toHaveLength(4 + 1); // four rows and the Live chip
    expect(screen.getAllByText('In review').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Rejected').length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByText('4 of 5 used')).toBeTruthy();
    expect(screen.getByText('All · 6')).toBeTruthy();
  });

  it('draws no Get verified link and no row it cannot open (R-47)', async () => {
    await open();
    await screen.findByText('How I light a night shoot');
    expect(screen.queryByText('Get verified')).toBeNull();
    // Only the turned-down piece opens anything.
    expect(within(screen.getByTestId('library-list')).getAllByRole('button').map((b) => b.props.testID)).toEqual(['library-row-r1']);
  });

  it('a person who holds a tier is shown the tier\u2019s own count and name, never "Get verified" (RELEASE-02 second pass, L-p2-12)', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(3, 3));
    hub.answers[`GET ${TIER}`] = ok(runningTier(3, 3));
    await open();
    expect(await screen.findByText('3 of 3')).toBeTruthy();
    expect(screen.getByText('Verify')).toBeTruthy();
    expect(screen.getByText(/^(Renews|Ends) /)).toBeTruthy();
    expect(screen.queryByText(/Get verified/)).toBeNull();
    expect(screen.queryByText(/more reach/)).toBeNull();
  });

  it('a person with no tier keeps the uploads meter and its way up', async () => {
    hub.answers[`GET ${TIER}`] = ok({ state: 'none', tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null });
    await open();
    expect(await screen.findByText('4 of 5 used')).toBeTruthy();
    expect(screen.getByText('Get verified for up to 25 uploads and more reach.')).toBeTruthy();
  });

  it('draws no "0 of 0" meter for an account the Hub allows nothing, and still lists its pieces', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(0, 0));
    await open();
    expect(await screen.findByText('How I light a night shoot')).toBeTruthy();
    await waitFor(() => expect(calls('GET', ALLOWANCE).length).toBeGreaterThan(0));
    expect(screen.queryByTestId('create-meter')).toBeNull();
    expect(screen.queryByText(/0 of 0/)).toBeNull();
  });

  it('a user can filter by Live, In review and Rejected, each asking the Hub for that state', async () => {
    await open();
    await screen.findByText('How I light a night shoot');
    hub.answers[`GET ${LIST}`] = byStatus;
    await fireEvent.press(screen.getByTestId('library-chip-live'));
    await waitFor(() => expect(hub.sent.some((s) => s.path === LIST && s.search.includes('status=live'))).toBe(true));
    await waitFor(() => expect(screen.queryByText('PDF · see why')).toBeNull());
    expect(await screen.findByText('Video · ₦2,500 · 18 sales')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('library-chip-pending'));
    await waitFor(() => expect(hub.sent.some((s) => s.path === LIST && s.search.includes('status=pending'))).toBe(true));
    await waitFor(() => expect(screen.getByText('Pricing playbook v3')).toBeTruthy());
    expect(screen.queryByText('How I light a night shoot')).toBeNull();

    hub.answers[`GET ${LIST}`] = page([six[5]]);
    await fireEvent.press(screen.getByTestId('library-chip-rejected'));
    await waitFor(() => expect(hub.sent.some((s) => s.path === LIST && s.search.includes('status=rejected'))).toBe(true));
    await waitFor(() => expect(screen.getByText('PDF · see why')).toBeTruthy());
  });

  it('a user can open a turned-down piece with "see why", and start a new piece with Plus', async () => {
    const handlers = await open();
    await fireEvent.press(await screen.findByTestId('library-row-r1'));
    expect(handlers.seeWhy).toHaveBeenCalledWith('r1');
    await fireEvent.press(screen.getByTestId('library-create'));
    expect(handlers.create).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('create-leave'));
    expect(handlers.back).toHaveBeenCalledTimes(1);
  });

  it('says what an empty filter means, and what a person who has made nothing sees', async () => {
    hub.answers[`GET ${LIST}`] = page([]);
    hub.answers[`GET ${COUNTS}`] = ok({ all: 0, live: 0, pending: 0, rejected: 0 });
    await open();
    expect(await screen.findByText('Nothing made yet')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('library-chip-rejected'));
    expect(await screen.findByText('Nothing was turned down')).toBeTruthy();
  });

  it('asks the next page when the end is near, and keeps what it has when that page fails', async () => {
    hub.answers[`GET ${LIST}`] = (sent) => (sent.search.includes('page=2') ? { status: 500, body: { statusCode: 500, message: 'Something went wrong on our side.', data: null } } : page(six, 2));
    await open();
    await screen.findByText('How I light a night shoot');
    await fireEvent.scroll(screen.getByTestId('library-screen-scroll'), {
      nativeEvent: { contentOffset: { y: 900 }, contentSize: { height: 1200 }, layoutMeasurement: { height: 800 } },
    });
    await waitFor(() => expect(hub.sent.some((s) => s.path === LIST && s.search.includes('page=2'))).toBe(true));
    expect(await screen.findByTestId('library-more-retry')).toBeTruthy();
    expect(screen.getByText('How I light a night shoot')).toBeTruthy();
    hub.answers[`GET ${LIST}`] = (sent) => page(sent.search.includes('page=2') ? [piece({ id: 'z9', title: 'The ninth piece', salesCount: 1 })] : six, null, sent.search.includes('page=2') ? 2 : 1);
    await fireEvent.press(screen.getByTestId('library-more-retry'));
    expect(await screen.findByText('The ninth piece')).toBeTruthy();
  });

  it('says why the list did not load, and asks again on Try again', async () => {
    hub.answers[`GET ${LIST}`] = 'offline';
    await open();
    expect(await screen.findByTestId('library-error')).toBeTruthy();
    hub.answers[`GET ${LIST}`] = page(six);
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('How I light a night shoot')).toBeTruthy();
  });

  it('shows a loading state while the Hub has not answered', async () => {
    hub.answers[`GET ${LIST}`] = 'hang';
    await open();
    expect(await screen.findByTestId('library-loading')).toBeTruthy();
  });

  it('keeps the list when the counts or the uploads cannot be read, with the chips unnumbered', async () => {
    hub.answers[`GET ${COUNTS}`] = 'offline';
    hub.answers[`GET ${ALLOWANCE}`] = 'offline';
    await open();
    expect(await screen.findByText('How I light a night shoot')).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
    expect(await screen.findByTestId('meter-error')).toBeTruthy();
    expect(calls('GET', LIST).length).toBeGreaterThan(0);
  });
});
