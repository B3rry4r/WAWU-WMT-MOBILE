/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { allowance, hub, installFetch, ok, renderFrame } from '../../library/__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'u1' }));

installFetch();
const { MeMenuSheet } = require('../MeMenuSheet') as typeof import('../MeMenuSheet');
const { tickLine } = require('../model') as typeof import('../model');

const COUNTS = 'GET /api/hub/me/counts';
const EARNINGS = 'GET /api/hub/money/earnings';
const ALLOWANCE = 'GET /api/hub/uploads/allowance';

const earned = (kobo: number) => ({
  month: '2026-10',
  walletOpen: true,
  allTime: { earnedKobo: kobo, sales: 31, streams: [] },
  thisMonth: { earnedKobo: kobo, sales: 31, streams: [] },
  waiting: { count: 0, amountKobo: 0 },
  held: { count: 0, amountKobo: 0 },
});

const ROWS = ['me-menu-dashboard', 'me-menu-content', 'me-menu-purchases', 'me-menu-courses', 'me-menu-saved', 'me-menu-notifications', 'me-menu-verification', 'me-menu-settings'];

type Given = { creator?: boolean; ticks?: ('creator' | 'pro')[]; verification?: boolean; courses?: boolean };

/** The menu as the Me tab raises it: every row's screen is built, a creator's two rows only for a creator. */
async function open({ creator = true, ticks = ['creator'], verification = true, courses = true }: Given = {}) {
  const go = {
    settings: jest.fn(),
    courses: jest.fn(),
    verification: jest.fn(),
    dashboard: jest.fn(),
    library: jest.fn(),
    purchases: jest.fn(),
    saved: jest.fn(),
    notifications: jest.fn(),
  };
  const view = await renderFrame(
    <MeMenuSheet
      visible
      onClose={jest.fn()}
      onOpenSettings={go.settings}
      onOpenCourses={courses ? go.courses : undefined}
      onOpenVerification={verification ? go.verification : undefined}
      onOpenDashboard={creator ? go.dashboard : undefined}
      onOpenLibrary={creator ? go.library : undefined}
      onOpenPurchases={go.purchases}
      onOpenSaved={go.saved}
      onOpenNotifications={go.notifications}
      ticks={ticks}
    />,
  );
  return { ...go, ...view };
}

const rowsDrawn = () => within(screen.getByTestId('me-menu-list')).getAllByRole('button').map((r) => r.props.testID);

beforeEach(() => {
  installFetch();
  hub.answers[COUNTS] = ok({ purchases: 12, saved: 31, unreadNotifications: 3, enrolledCourses: 1 });
  hub.answers[EARNINGS] = ok(earned(12_840_000));
  hub.answers[ALLOWANCE] = ok(allowance(4, 5));
});

describe('M7 and Z1 · the Me menu (ME-03)', () => {
  it('a creator sees the canvas’s eight rows in its order, each line the Hub’s figure', async () => {
    await open();
    expect(await screen.findByText('₦128,400 this month')).toBeTruthy();
    expect(await screen.findByText('4 of 5 uploads')).toBeTruthy();
    expect(await screen.findByText('12')).toBeTruthy();
    expect(await screen.findByText('1 enrolled')).toBeTruthy();
    expect(await screen.findByText('31')).toBeTruthy();
    expect(await screen.findByText('3 new')).toBeTruthy();
    expect(await screen.findByText('Creator tick')).toBeTruthy();
    expect(rowsDrawn()).toEqual(ROWS);
    const titles = ['Creator dashboard', 'My content', 'My purchases', 'My courses', 'Saved', 'Notifications', 'Verification', 'Settings'];
    for (const t of titles) expect(screen.getByText(t)).toBeTruthy();
  });

  it('each row opens its own screen', async () => {
    const go = await open();
    await screen.findByText('1 enrolled');
    const pairs: [string, keyof typeof go][] = [
      ['me-menu-dashboard', 'dashboard'],
      ['me-menu-content', 'library'],
      ['me-menu-purchases', 'purchases'],
      ['me-menu-courses', 'courses'],
      ['me-menu-saved', 'saved'],
      ['me-menu-notifications', 'notifications'],
      ['me-menu-verification', 'verification'],
      ['me-menu-settings', 'settings'],
    ];
    for (const [id, name] of pairs) {
      await fireEvent.press(screen.getByTestId(id));
      expect(go[name]).toHaveBeenCalledTimes(1);
    }
  });

  it('a fan is given no creator rows: the Hub is not asked for earnings or uploads, and six rows are drawn', async () => {
    await open({ creator: false, ticks: [] });
    expect(await screen.findByText('1 enrolled')).toBeTruthy();
    expect(rowsDrawn()).toEqual(['me-menu-purchases', 'me-menu-courses', 'me-menu-saved', 'me-menu-notifications', 'me-menu-verification', 'me-menu-settings']);
    expect(screen.queryByText('Creator dashboard')).toBeNull();
    expect(screen.queryByText('My content')).toBeNull();
    expect(hub.sent.some((s) => s.path === '/api/hub/money/earnings' || s.path === '/api/hub/uploads/allowance')).toBe(false);
  });

  it('says the tick state only under Verification: nothing for no tick, never "ID check in review"', async () => {
    await open({ creator: false, ticks: [] });
    await screen.findByText('1 enrolled');
    expect(screen.queryByText(/tick/i)).toBeNull();
    expect(screen.queryByText(/review/i)).toBeNull();
    expect(screen.queryByText(/ID check/i)).toBeNull();
  });

  it('names a professional tick and both ticks as the profile does', () => {
    expect(tickLine([])).toBeUndefined();
    expect(tickLine(['creator'])).toBe('Creator tick');
    expect(tickLine(['pro'])).toBe('Professional tick');
    expect(tickLine(['creator', 'pro'])).toBe('Creator tick · Professional tick');
  });

  it('draws a title alone for a count of nothing and for a creator with no uploads allowed, and the Hub\u2019s own \u20a60 for a month with no earnings (empty)', async () => {
    hub.answers[COUNTS] = ok({ purchases: 0, saved: 0, unreadNotifications: 0, enrolledCourses: 0 });
    hub.answers[EARNINGS] = ok(earned(0));
    hub.answers[ALLOWANCE] = ok(allowance(0, 0));
    await open({ ticks: [] });
    await waitFor(() => expect(hub.sent.some((s) => s.path === '/api/hub/me/counts')).toBe(true));
    await waitFor(() => expect(hub.sent.some((s) => s.path === '/api/hub/uploads/allowance')).toBe(true));
    expect(rowsDrawn()).toEqual(ROWS);
    expect(screen.queryByText(/enrolled/)).toBeNull();
    expect(screen.queryByText(/new$/)).toBeNull();
    expect(screen.queryByText(/uploads/)).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
    // Earnings are an amount, not a count: a month with none is the Hub's true figure, as M18 says it.
    expect(await screen.findByText('\u20a60 this month')).toBeTruthy();
    expect(screen.queryByTestId('me-menu-retry')).toBeNull();
  });

  it('draws the titles alone while the Hub has not answered, with no note and no made-up number', async () => {
    hub.answers[COUNTS] = 'hang';
    hub.answers[EARNINGS] = 'hang';
    hub.answers[ALLOWANCE] = 'hang';
    await open();
    await waitFor(() => expect(hub.sent.some((s) => s.path === '/api/hub/me/counts')).toBe(true));
    expect(rowsDrawn()).toEqual(ROWS);
    expect(screen.queryByText(/enrolled|this month|uploads|new$/)).toBeNull();
    expect(screen.queryByTestId('me-menu-retry')).toBeNull();
  });

  it('keeps every row working when the Hub cannot be reached, says so once, and Try again reads the figures back', async () => {
    hub.answers[COUNTS] = 'offline';
    hub.answers[EARNINGS] = 'offline';
    hub.answers[ALLOWANCE] = 'offline';
    const go = await open();
    expect(await screen.findByText('Some numbers did not load')).toBeTruthy();
    expect(screen.getAllByTestId('me-menu-retry')).toHaveLength(1);
    expect(rowsDrawn()).toEqual(ROWS);
    expect(screen.queryByText(/enrolled|this month|uploads/)).toBeNull();
    await fireEvent.press(screen.getByTestId('me-menu-courses'));
    expect(go.courses).toHaveBeenCalledTimes(1);

    hub.answers[COUNTS] = ok({ purchases: 12, saved: 31, unreadNotifications: 3, enrolledCourses: 1 });
    hub.answers[EARNINGS] = ok(earned(12_840_000));
    hub.answers[ALLOWANCE] = ok(allowance(4, 5));
    await fireEvent.press(screen.getByTestId('me-menu-retry-retry'));
    expect(await screen.findByText('1 enrolled')).toBeTruthy();
    expect(await screen.findByText('₦128,400 this month')).toBeTruthy();
    expect(await screen.findByText('4 of 5 uploads')).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId('me-menu-retry')).toBeNull());
  });

  it('an answer the app cannot read counts as a failed read, not as zeros', async () => {
    hub.answers[COUNTS] = ok({ purchases: 'twelve' });
    await open({ creator: false });
    expect(await screen.findByText('Some numbers did not load')).toBeTruthy();
    expect(screen.queryByText('12')).toBeNull();
  });

  it('a Hub that does not serve the course count yet leaves My courses with its title and the other lines intact', async () => {
    hub.answers[COUNTS] = ok({ purchases: 12, saved: 31, unreadNotifications: 3 });
    await open({ creator: false });
    expect(await screen.findByText('31')).toBeTruthy();
    expect(screen.getByText('3 new')).toBeTruthy();
    expect(screen.getByText('My courses')).toBeTruthy();
    expect(screen.queryByText(/enrolled/)).toBeNull();
    expect(screen.queryByTestId('me-menu-retry')).toBeNull();
  });

  it('draws no My courses and no Verification row for a screen it was not given (R-47)', async () => {
    await open({ creator: false, courses: false, verification: false });
    await screen.findByText('31');
    expect(rowsDrawn()).toEqual(['me-menu-purchases', 'me-menu-saved', 'me-menu-notifications', 'me-menu-settings']);
  });

  it('writes no em-dash anywhere on the menu', async () => {
    await open();
    await screen.findByText('1 enrolled');
    const text = JSON.stringify(screen.toJSON());
    expect(text.includes(String.fromCharCode(0x2014))).toBe(false);
  });
});
