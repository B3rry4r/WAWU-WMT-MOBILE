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

const EARNINGS = '/api/hub/me/earnings';
const PAID = '/api/hub/paid-dm/settings';
const COUNTS = '/api/hub/content/mine/library/counts';
const ALLOWANCE = '/api/hub/uploads/allowance';
const MONEY = '/api/hub/money/earnings';

const months = (kobo: number[]) => kobo.map((earnedKobo, i) => ({ month: `2025-${String(i + 10).padStart(2, '0')}`, earnedKobo }));
const earned = (over: Record<string, unknown> = {}) => ({
  month: '2026-09',
  earnedKobo: 12_840_000,
  salesCount: 31,
  previousMonth: '2026-08',
  previousEarnedKobo: 10_881_000,
  changePct: 18,
  months: [
    { month: '2025-10', earnedKobo: 3_000_000 },
    { month: '2025-11', earnedKobo: 4_400_000 },
    { month: '2025-12', earnedKobo: 2_600_000 },
    { month: '2026-01', earnedKobo: 5_200_000 },
    { month: '2026-02', earnedKobo: 3_800_000 },
    { month: '2026-03', earnedKobo: 6_000_000 },
    { month: '2026-04', earnedKobo: 4_800_000 },
    { month: '2026-05', earnedKobo: 7_000_000 },
    { month: '2026-06', earnedKobo: 5_600_000 },
    { month: '2026-07', earnedKobo: 8_200_000 },
    { month: '2026-08', earnedKobo: 10_881_000 },
    { month: '2026-09', earnedKobo: 12_840_000 },
  ],
  ...over,
});
const settings = (over: Record<string, unknown> = {}) => ({ enabled: true, priceKobo: 30_000, responseHours: 24, creatorSharePct: 85, earnPerMessageKobo: 25_500, raiseToKobo: null, options: {}, standing: { state: 'ok' }, ...over });
const wallet = (open: boolean) => ({
  month: '2026-09',
  walletOpen: open,
  allTime: { earnedKobo: 0, sales: 0, streams: [] },
  thisMonth: { earnedKobo: 0, sales: 0, streams: [] },
  waiting: { count: 0, amountKobo: 0 },
  held: { count: 0, amountKobo: 0 },
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
  hub.answers[`GET ${EARNINGS}`] = ok(earned());
  hub.answers[`GET ${PAID}`] = ok(settings());
  hub.answers[`GET ${COUNTS}`] = ok({ all: 6, live: 4, pending: 1, rejected: 1 });
  hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(4, 5));
  hub.answers[`GET ${MONEY}`] = ok(wallet(true));
});

describe('M18 · Creator dashboard', () => {
  it('shows the month, its figure with the change, the uploads used and every row of the list, from the Hub', async () => {
    await open();
    expect(await screen.findByText('Earned in September')).toBeTruthy();
    expect(screen.getByTestId('creator-earned-amount')).toHaveTextContent('₦128,400.00');
    expect(screen.getByText('+18%')).toBeTruthy();
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

  it('with a wallet open, the wallet row is done and there is nothing to open', async () => {
    const handlers = await open();
    expect(await screen.findByText('Your wallet')).toBeTruthy();
    expect(screen.getByText('Opened')).toBeTruthy();
    expect(screen.queryByText('Open')).toBeNull();
    expect(within(screen.getByTestId('creator-setup')).queryByTestId('creator-wallet')?.props.accessibilityRole).not.toBe('button');
    await fireEvent.press(screen.getByTestId('creator-wallet'));
    expect(handlers.wallet).not.toHaveBeenCalled();
  });

  it('without a wallet, the row reads "Open your wallet: Not opened" with Open, and opens Open your wallet', async () => {
    hub.answers[`GET ${MONEY}`] = ok(wallet(false));
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

  it('draws no change pill when the Hub has no earlier month to compare', async () => {
    hub.answers[`GET ${EARNINGS}`] = ok(earned({ changePct: null }));
    await open();
    await screen.findByText('Earned in September');
    expect(screen.queryByTestId('creator-earned-change')).toBeNull();
  });

  it('draws a minus for a fall in the danger tone', async () => {
    hub.answers[`GET ${EARNINGS}`] = ok(earned({ changePct: -12 }));
    await open();
    expect(await screen.findByText('\u221212%')).toBeTruthy();
  });

  it('draws a plain 0% when nothing changed', async () => {
    hub.answers[`GET ${EARNINGS}`] = ok(earned({ changePct: 0 }));
    await open();
    expect(await screen.findByText('0%')).toBeTruthy();
  });

  it('says Off for paid messages that are off, and never writes a price the Hub did not set', async () => {
    hub.answers[`GET ${PAID}`] = ok(settings({ enabled: false, priceKobo: null }));
    await open();
    expect(await screen.findByText('Off')).toBeTruthy();
    expect(paidLine({ enabled: true, priceKobo: null })).toBe('On');
    expect(paidLine({ enabled: true, priceKobo: 150_000 })).toBe('On · ₦1,500 a message');
  });

  it('a month with nothing earned is a zero figure with short bars, and a person with no content sees "Nothing yet"', async () => {
    hub.answers[`GET ${EARNINGS}`] = ok(earned({ earnedKobo: 0, salesCount: 0, previousEarnedKobo: 0, changePct: null, months: months(Array(12).fill(0)) }));
    hub.answers[`GET ${COUNTS}`] = ok({ all: 0, live: 0, pending: 0, rejected: 0 });
    await open();
    expect(await screen.findByTestId('creator-earned-amount')).toHaveTextContent('₦0.00');
    expect(await screen.findByText('Nothing yet')).toBeTruthy();
  });

  it('keeps every other row when the earnings cannot be read, says so, and asks again on Try again', async () => {
    hub.answers[`GET ${EARNINGS}`] = 'offline';
    await open();
    expect(await screen.findByTestId('creator-earnings-error')).toBeTruthy();
    expect(await screen.findByText('On · ₦300 a message')).toBeTruthy();
    hub.answers[`GET ${EARNINGS}`] = ok(earned());
    await fireEvent.press(screen.getByTestId('creator-earnings-retry'));
    expect(await screen.findByText('Earned in September')).toBeTruthy();
  });

  it('shows quiet blocks while the Hub has not answered, and asks the wallet again when the check failed', async () => {
    hub.answers[`GET ${EARNINGS}`] = 'hang';
    hub.answers[`GET ${MONEY}`] = 'offline';
    await open();
    expect(await screen.findByTestId('creator-earnings-loading')).toBeTruthy();
    const row = await screen.findByTestId('creator-wallet-error');
    hub.answers[`GET ${MONEY}`] = ok(wallet(false));
    await fireEvent.press(row);
    expect(await screen.findByText('Not opened')).toBeTruthy();
    expect(calls('GET', MONEY).length).toBeGreaterThan(1);
  });

  it('asks the Hub again when the person comes back to it', async () => {
    await open();
    await screen.findByText('Earned in September');
    await waitFor(() => expect(calls('GET', EARNINGS)).toHaveLength(1));
  });
});

describe('M18 · what the figures are made of', () => {
  const base = earned() as never;
  it('names the month the Hub names, in words', () => {
    expect(model.monthWord('2026-09')).toBe('September');
    expect(model.monthWord('2026-01')).toBe('January');
    expect(model.monthWord('2026-12')).toBe('December');
  });

  it('scales each bar to the tallest month, with the least as a short mark and the last in the accent', () => {
    const bars = model.barsOf(base);
    expect(bars).toHaveLength(12);
    expect(bars[11]).toMatchObject({ share: 1, last: true });
    expect(bars.filter((b) => b.last)).toHaveLength(1);
    expect(Math.min(...bars.map((b) => b.share))).toBeGreaterThanOrEqual(model.MIN_BAR);
    expect(model.barsOf(earned({ months: months(Array(12).fill(0)) }) as never).every((b) => b.share === model.MIN_BAR)).toBe(true);
  });
});
