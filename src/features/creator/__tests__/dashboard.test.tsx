/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { allowance, calls, hub, installFetch, ok, renderFrame } from '@/features/library/__helpers__/hub';

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
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'u1' }));

installFetch();
const { DashboardScreen, paidLine } = require('../DashboardScreen') as typeof import('../DashboardScreen');
const model = require('../model') as typeof import('../model');

const PAID = '/api/hub/paid-dm/settings';
const COUNTS = '/api/hub/content/mine/library/counts';
const ALLOWANCE = '/api/hub/uploads/allowance';
// The one read behind the month's figure and the wallet row, the read W39 makes; `/me/earnings` is never asked.
const MONEY = '/api/hub/money/earnings';
const OLD_EARNINGS = '/api/hub/me/earnings';

const settings = (over: Record<string, unknown> = {}) => ({ enabled: true, priceKobo: 30_000, responseHours: 24, creatorSharePct: 85, earnPerMessageKobo: 25_500, raiseToKobo: null, options: {}, standing: { state: 'ok' }, ...over });
const money = (open: boolean, monthKobo = 12_840_000, over: Record<string, unknown> = {}) => ({
  month: '2026-09',
  walletOpen: open,
  allTime: { earnedKobo: monthKobo + 5_000_000, sales: 40, streams: [] },
  thisMonth: { earnedKobo: monthKobo, sales: 31, streams: [] },
  waiting: { count: 0, amountKobo: 0 },
  held: { count: 0, amountKobo: 0 },
  ...over,
});

const open = async () => {
  const handlers = { back: jest.fn(), paid: jest.fn(), wallet: jest.fn(), earnings: jest.fn(), library: jest.fn() };
  const view = await renderFrame(
    <DashboardScreen onBack={handlers.back} onOpenPaid={handlers.paid} onOpenWallet={handlers.wallet} onOpenEarnings={handlers.earnings} onOpenLibrary={handlers.library} />,
  );
  return { ...handlers, ...view };
};

beforeEach(() => {
  installFetch();
  hub.answers[`GET ${PAID}`] = ok(settings());
  hub.answers[`GET ${COUNTS}`] = ok({ all: 6, live: 4, pending: 1, rejected: 1 });
  hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
  hub.answers[`GET ${MONEY}`] = ok(money(true));
});

describe('M18 · Creator dashboard', () => {
  it('shows the month, its figure, the uploads used and every row of the list, from the Hub', async () => {
    await open();
    expect(await screen.findByText('Earned in September')).toBeTruthy();
    expect(screen.getByTestId('creator-earned-amount')).toHaveTextContent('₦128,400.00');
    expect(await screen.findByText('4 of 5 used')).toBeTruthy();
    expect(screen.getByText('Creator account')).toBeTruthy();
    expect(await screen.findByText('On · ₦300 a message')).toBeTruthy();
    expect(screen.getByText('Earnings')).toBeTruthy();
    expect(screen.getByText('Lands in your wallet automatically')).toBeTruthy();
    expect(await screen.findByText('4 live · 1 in review · 1 rejected')).toBeTruthy();
  });

  it('draws what is built and nothing else: no Get verified, no Host a community, no move-to-wallet words (R-47, R-11)', async () => {
    await open();
    await screen.findByText('Earned in September');
    expect(screen.queryByText('Get verified')).toBeNull();
    expect(screen.queryByText(/Host a community/)).toBeNull();
    expect(screen.queryByText(/Move to/)).toBeNull();
    expect(screen.queryByText(/Identity check/)).toBeNull();
    expect(screen.queryByText(/KYC/)).toBeNull();
  });

  it('Host a community is the last row of the set-up list and opens I32 (INBOX-14); without a way in it is not drawn', async () => {
    const onCommunity = jest.fn();
    await renderFrame(
      <DashboardScreen onBack={jest.fn()} onOpenPaid={jest.fn()} onOpenWallet={jest.fn()} onOpenEarnings={jest.fn()} onOpenLibrary={jest.fn()} onOpenCommunity={onCommunity} />,
    );
    // The set-up list settles once the Hub has answered (the wallet row comes and goes), so the row is taken after that.
    await screen.findByText('Earned in September');
    await screen.findByText('On · ₦300 a message');
    const row = screen.getByTestId('creator-community');
    expect(screen.getByText('Host a community')).toBeTruthy();
    // The board's "You keep 85% of credits" is not served (G-INBOX-14-1), so it is not written.
    expect(screen.queryByText(/85%/)).toBeNull();
    await fireEvent.press(row);
    expect(onCommunity).toHaveBeenCalledTimes(1);
  });

  it('with a wallet open there is no wallet row at all (the board draws only "Not opened / Open")', async () => {
    const handlers = await open();
    await screen.findByText('Earned in September');
    await screen.findByText('On · ₦300 a message');
    expect(screen.queryByTestId('creator-wallet')).toBeNull();
    expect(screen.queryByTestId('creator-wallet-loading')).toBeNull();
    expect(screen.queryByText('Your wallet')).toBeNull();
    expect(screen.queryByText('Opened')).toBeNull();
    expect(screen.queryByText('Open your wallet')).toBeNull();
    expect(screen.queryByText('Open')).toBeNull();
    expect(handlers.wallet).not.toHaveBeenCalled();
  });

  it('the month\u2019s figure is the one the Earnings screen reads (GET /money/earnings), whatever the older read says', async () => {
    // The older read would say 4,250 for the month; the Earnings screen says nothing earned. The card follows the Earnings screen.
    hub.answers[`GET ${OLD_EARNINGS}`] = ok({ month: '2026-09', earnedKobo: 425_000, salesCount: 2, previousMonth: '2026-08', previousEarnedKobo: 212_500, changePct: 100, months: [{ month: '2026-09', earnedKobo: 425_000 }] });
    hub.answers[`GET ${MONEY}`] = ok(money(false, 0, { allTime: { earnedKobo: 0, sales: 0, streams: [] } }));
    await open();
    expect(await screen.findByText('Earned in September')).toBeTruthy();
    expect(screen.getByTestId('creator-earned-amount')).toHaveTextContent('₦0.00');
    expect(calls('GET', OLD_EARNINGS)).toHaveLength(0);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('without a wallet, the row reads "Open your wallet: Not opened" with Open, and opens Open your wallet', async () => {
    hub.answers[`GET ${MONEY}`] = ok(money(false));
    const handlers = await open();
    expect(await screen.findByText('Open your wallet')).toBeTruthy();
    expect(screen.getByText('Not opened')).toBeTruthy();
    expect(screen.getByText('Open')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('creator-wallet'));
    expect(handlers.wallet).toHaveBeenCalledTimes(1);
  });

  it('a user can open Paid messages, Earnings and My content, and go back', async () => {
    const handlers = await open();
    await fireEvent.press(await screen.findByTestId('creator-paid'));
    await fireEvent.press(screen.getByTestId('creator-earnings'));
    await fireEvent.press(screen.getByTestId('creator-content'));
    await fireEvent.press(screen.getByTestId('create-leave'));
    expect(handlers.paid).toHaveBeenCalledTimes(1);
    expect(handlers.earnings).toHaveBeenCalledTimes(1);
    expect(handlers.library).toHaveBeenCalledTimes(1);
    expect(handlers.back).toHaveBeenCalledTimes(1);
  });

  it('the Creator account row is a status, not a button (nothing to open)', async () => {
    await open();
    await screen.findByText('Earned in September');
    expect(screen.getByTestId('creator-account').props.accessibilityRole).not.toBe('button');
    expect(within(screen.getByTestId('creator-account')).getByText('Done')).toBeTruthy();
  });

  it('says Off for paid messages that are off, and never writes a price the Hub did not set', async () => {
    hub.answers[`GET ${PAID}`] = ok(settings({ enabled: false, priceKobo: null }));
    await open();
    expect(await screen.findByText('Off')).toBeTruthy();
    expect(paidLine({ enabled: true, priceKobo: null })).toBe('On');
    expect(paidLine({ enabled: true, priceKobo: 150_000 })).toBe('On · ₦1,500 a message');
  });

  it('a month with nothing earned is a zero figure, and a person with no content sees "Nothing yet"', async () => {
    hub.answers[`GET ${MONEY}`] = ok(money(true, 0));
    hub.answers[`GET ${COUNTS}`] = ok({ all: 0, live: 0, pending: 0, rejected: 0 });
    await open();
    expect(await screen.findByTestId('creator-earned-amount')).toHaveTextContent('₦0.00');
    expect(await screen.findByText('Nothing yet')).toBeTruthy();
  });

  it('keeps every other row when the earnings cannot be read, says so, and asks again on Try again', async () => {
    hub.answers[`GET ${MONEY}`] = 'offline';
    await open();
    expect(await screen.findByTestId('creator-earnings-error')).toBeTruthy();
    expect(await screen.findByText('On · ₦300 a message')).toBeTruthy();
    hub.answers[`GET ${MONEY}`] = ok(money(true));
    await fireEvent.press(screen.getByTestId('creator-earnings-retry'));
    expect(await screen.findByText('Earned in September')).toBeTruthy();
  });

  it('shows quiet blocks while the Hub has not answered', async () => {
    hub.answers[`GET ${MONEY}`] = 'hang';
    await open();
    expect(await screen.findByTestId('creator-earnings-loading')).toBeTruthy();
    expect(await screen.findByTestId('creator-wallet-loading')).toBeTruthy();
  });

  it('asks the wallet again when the check failed, from the row', async () => {
    hub.answers[`GET ${MONEY}`] = 'offline';
    await open();
    const row = await screen.findByTestId('creator-wallet-error');
    hub.answers[`GET ${MONEY}`] = ok(money(false));
    await fireEvent.press(row);
    expect(await screen.findByText('Not opened')).toBeTruthy();
    expect(await screen.findByText('Earned in September')).toBeTruthy();
    expect(calls('GET', MONEY).length).toBeGreaterThan(1);
  });

  it('asks the Hub for the month once when it opens', async () => {
    await open();
    await screen.findByText('Earned in September');
    await waitFor(() => expect(calls('GET', MONEY)).toHaveLength(1));
  });

  it('draws no "0 of 0" meter for an account the Hub allows nothing (no tier, no tick)', async () => {
    hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(0, 0));
    await open();
    await screen.findByText('Earned in September');
    await waitFor(() => expect(calls('GET', ALLOWANCE).length).toBeGreaterThan(0));
    expect(await screen.findByText('On · ₦300 a message')).toBeTruthy();
    expect(screen.queryByTestId('create-meter')).toBeNull();
    expect(screen.queryByText(/0 of 0/)).toBeNull();
    expect(screen.queryByTestId('meter-loading')).toBeNull();
  });
});

describe('M18 · what the figures are made of', () => {
  it('names the month the Hub names, in words', () => {
    expect(model.earnedTitle('2026-09')).toBe('Earned in September');
    expect(model.earnedTitle('2026-01')).toBe('Earned in January');
    expect(model.earnedTitle('2026-12')).toBe('Earned in December');
    expect(model.earnedTitle('September')).toBe('Earned this month');
  });
});
