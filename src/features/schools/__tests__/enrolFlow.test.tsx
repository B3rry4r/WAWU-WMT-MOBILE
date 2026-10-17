/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Linking, Share, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * Enrolling and paying (SCHOOLS-06: SC4, SC5, SC6, SC7, SC11) and My courses and the school's own site (SCHOOLS-08: SC8, SC9), on the
 * real screens with the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in answers in the Hub's shapes,
 * records every enrolment and payment (headers and body), and answers a key it knows with the first payment, as the Hub does.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'owner-1' }));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn' }),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const ENR = '66666666-6666-4666-8666-666666666666';
const NOV = { id: 'i-nov', startDate: '2099-11-03', schedule: 'Weekend class', location: 'Yaba', capacity: 20, seatsLeft: 8, full: false };
const JAN = { id: 'i-jan', startDate: '2100-01-12', schedule: 'Weekday evenings', location: null, capacity: 20, seatsLeft: 12, full: false };
const FULL_NOV = { ...NOV, seatsLeft: 0, full: true };
const COURSE = (intakes: unknown[], over: Record<string, unknown> = {}) => ({
  id: 'c-1',
  title: 'Product Design Bootcamp',
  weeks: 12,
  mode: 'online',
  syllabus: ['One'],
  outcomes: ['Certificate'],
  priceKobo: 15_000_000,
  school: { id: 's-1', name: 'Greenfield Tech Academy', category: 'tech', location: 'Yaba, Lagos', logo: null, applyUrl: 'https://greenfield.ng/apply' },
  intakes,
  ...over,
});

type Status = 'reserved' | 'enrolled' | 'released' | 'refunded';
const enrolmentView = (status: Status, over: Record<string, unknown> = {}) => ({
  id: ENR,
  status,
  reference: 'WAW-SC4K-81PQ',
  course: { id: 'c-1', title: 'Product Design Bootcamp' },
  school: { id: 's-1', name: 'Greenfield Tech Academy' },
  intake: { id: 'i-nov', startDate: '2099-11-03', schedule: 'Weekend', location: 'Yaba' },
  priceKobo: 15_000_000,
  paymentId: status === 'enrolled' ? 'pay-1' : null,
  providerFeeKobo: status === 'enrolled' ? 1575 : null,
  totalKobo: status === 'enrolled' ? 15_001_575 : null,
  reservedUntil: status === 'reserved' ? '2099-01-01T00:00:00.000Z' : null,
  createdAt: '2026-10-16T09:42:00.000Z',
  enrolledAt: status === 'enrolled' ? '2026-10-16T09:43:00.000Z' : null,
  returned: { holdStatus: 'held', returned: false, returnedKobo: null },
  ...over,
});

const quoteView = (over: Record<string, unknown> = {}) => ({
  kind: 'school_fee',
  targetId: ENR,
  title: 'Product Design Bootcamp',
  payee: null,
  priceKobo: 15_000_000,
  fee: { providerFeeKobo: 1575, wawuFeeKobo: 0, totalFeeKobo: 1575 },
  totalKobo: 15_001_575,
  balanceKobo: hub.balanceKobo,
  shortfallKobo: null,
  willBeHeld: true,
  withinDailyLimit: true,
  remainingTodayKobo: null,
  quoteToken: `tok-${hub.quotes}`,
  expiresAt: '2099-01-01T00:00:00.000Z',
  ...over,
});

type PayMode = 'paid' | 'pending' | 'failed' | 'lost_after' | 'short' | 'no_wallet';
const hub = {
  mode: 'paid' as PayMode,
  balanceKobo: 48_525_075,
  status: 'reserved' as Status,
  quotes: 0,
  enrols: [] as { intakeId: string }[],
  enrolAnswers: [] as Response[],
  pays: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  paidKeys: new Set<string>(),
  payments: 0,
  wrongFirst: false,
  list: { current: [] as unknown[], finished: [] as unknown[] },
  listFails: false,
  clicks: 0,
  course: COURSE([NOV, JAN]) as unknown,
};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/users/me') return ok({ wawuUserId: 'me', firstName: 'Lennox', lastName: 'Emmanuel', email: 'lennox@wawu.africa', phone: '+2348031234412', verification: { creator: { verified: false }, professional: { verified: false } } });
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-16T09:00:00.000Z' });
  if (path === '/schools/courses/c-1' && method === 'GET') return ok(hub.course);
  if (path === '/schools/enrolments' && method === 'POST') {
    const body = (await request.json()) as { intakeId: string };
    hub.enrols.push(body);
    const next = hub.enrolAnswers.shift();
    if (next) return next;
    return json(201, { statusCode: 201, message: 'Created', data: enrolmentView('reserved') });
  }
  if (path === '/schools/enrolments' && method === 'GET') {
    if (hub.listFails) return json(500, { statusCode: 500, message: 'Something went wrong' });
    const tab = (url.searchParams.get('tab') ?? 'current') as 'current' | 'finished';
    return ok({ items: hub.list[tab], nextCursor: null });
  }
  if (path === `/schools/enrolments/${ENR}` && method === 'GET') return ok(enrolmentView(hub.status));
  if (path === '/money/payments/quote') {
    hub.quotes += 1;
    return ok(quoteView());
  }
  if (path === '/money/payments' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key') ?? '';
    hub.pays.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    const paymentView = (status: string) => ({ id: 'pay-1', kind: 'school_fee', targetId: ENR, title: 'Product Design Bootcamp', status, priceKobo: 15_000_000, fee: { providerFeeKobo: 1575, wawuFeeKobo: 0, totalFeeKobo: 1575 }, totalKobo: 15_001_575, reference: 'WAW-PAY', hold: null, failureReason: status === 'failed' ? 'The bank did not take it.' : null, delivered: status === 'completed', statusMessage: null, createdAt: '2026-10-16T09:42:00.000Z', completedAt: null });
    // The Hub answers a key it knows with the first payment, before it looks at the PIN or the quote.
    if (hub.paidKeys.has(key)) return json(201, { statusCode: 201, message: 'Created', data: paymentView('completed') });
    if (hub.mode === 'no_wallet') return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    if (hub.wrongFirst && hub.pays.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'short') return refuse(402, { code: 'insufficient_funds', message: 'Not enough.', balanceKobo: 500_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 500_000 });
    if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
      // The Hub took the payment and its answer never arrives.
      hub.paidKeys.add(key);
      hub.payments += 1;
      hub.status = 'enrolled';
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    if (hub.mode !== 'failed') {
      hub.paidKeys.add(key);
      hub.payments += 1;
    }
    hub.status = hub.mode === 'pending' ? 'reserved' : hub.mode === 'failed' ? 'reserved' : 'enrolled';
    return json(201, { statusCode: 201, message: 'Created', data: paymentView(hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'completed') });
  }
  if (path === '/schools/courses/c-1/apply-link') return ok({ courseId: 'c-1', code: 'wawu-7KQ2', url: 'https://greenfield.ng/apply?ref=wawu-7KQ2' });
  if (path === '/schools/courses/c-1/apply-click' && method === 'POST') {
    hub.clicks += 1;
    return json(201, { statusCode: 201, message: 'Created', data: { courseId: 'c-1', code: 'wawu-7KQ2', url: 'https://greenfield.ng/apply?ref=wawu-7KQ2' } });
  }
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

const { EnrolScreen } = require('../EnrolScreen') as typeof import('../EnrolScreen');
const { EnrolmentScreen } = require('../EnrolmentScreen') as typeof import('../EnrolmentScreen');
const { MyCoursesScreen } = require('../MyCoursesScreen') as typeof import('../MyCoursesScreen');
const { CourseScreen } = require('../CourseScreen') as typeof import('../CourseScreen');
const { forgetEnrolIntentsInMemory } = require('../enrolIntent') as typeof import('../enrolIntent');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

beforeEach(() => {
  mockVault.clear();
  forgetEnrolIntentsInMemory();
  queryClient.clear();
  Object.assign(hub, {
    mode: 'paid',
    balanceKobo: 48_525_075,
    status: 'reserved',
    quotes: 0,
    enrols: [],
    enrolAnswers: [],
    pays: [],
    paidKeys: new Set<string>(),
    payments: 0,
    wrongFirst: false,
    list: { current: [], finished: [] },
    listFails: false,
    clicks: 0,
    course: COURSE([NOV, JAN]),
  });
});

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  return rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        {child}
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

async function enterPin(pin: string) {
  const user = userEvent.setup();
  for (const d of pin) await user.press(await rtl.screen.findByRole('button', { name: d }));
}

describe('SC4: Your details', () => {
  const props = () => ({ courseId: 'c-1', onBack: jest.fn(), onHeld: jest.fn(), onOpen: jest.fn() });

  it('a user sees the details from their account, picks a class and Continue holds a place', async () => {
    const p = props();
    await render(<EnrolScreen {...p} />);
    await rtl.screen.findByTestId('enrol-class-i-nov');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('enrol-name')).toBeTruthy());
    expect(rtl.within(rtl.screen.getByTestId('enrol-name')).getByText('Lennox Emmanuel')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('enrol-email')).getByText('lennox@wawu.africa')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('enrol-phone')).getByText('0803 ••• 4412')).toBeTruthy();
    expect(rtl.screen.getByText('From your Who Made This? account')).toBeTruthy();
    expect(rtl.screen.getByText('Starts 3 November')).toBeTruthy();
    expect(rtl.screen.getByText('Weekend class · Yaba · 8 seats left')).toBeTruthy();
    expect(rtl.screen.getByText('Starts 12 January')).toBeTruthy();
    expect(rtl.screen.getByTestId('enrol-disclosure').props.children).toEqual(['Greenfield Tech Academy', ' gets these details so they can follow up with you.']);
    // The soonest class with a seat is picked; the person picks the January one.
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrol-class-i-jan'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrol-continue'));
    await rtl.waitFor(() => expect(p.onHeld).toHaveBeenCalledWith(ENR));
    expect(hub.enrols).toEqual([{ intakeId: 'i-jan' }]);
  });

  it('opens with the class SC3 offered picked', async () => {
    const p = props();
    await render(<EnrolScreen {...p} intakeId="i-jan" />);
    await rtl.screen.findByTestId('enrol-class-i-jan');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('enrol-continue').props.accessibilityState?.disabled).not.toBe(true));
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrol-continue'));
    await rtl.waitFor(() => expect(hub.enrols).toEqual([{ intakeId: 'i-jan' }]));
  });

  it('a double tap on Continue holds one place', async () => {
    const p = props();
    await render(<EnrolScreen {...p} />);
    await rtl.screen.findByTestId('enrol-class-i-nov');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('enrol-name')).toBeTruthy());
    const button = rtl.screen.getByTestId('enrol-continue');
    await rtl.fireEvent.press(button);
    await rtl.fireEvent.press(button);
    await rtl.waitFor(() => expect(p.onHeld).toHaveBeenCalled());
    expect(hub.enrols).toHaveLength(1);
    expect(p.onHeld).toHaveBeenCalledTimes(1);
  });

  it('SC11: a class that fills before Continue says so, takes nothing, and offers the next one', async () => {
    const p = props();
    hub.enrolAnswers = [refuse(409, { code: 'class_full', message: 'This class is full.', nextIntake: JAN }), json(201, { statusCode: 201, message: 'Created', data: enrolmentView('reserved', { intake: { id: 'i-jan', startDate: '2100-01-12', schedule: 'Weekday evenings', location: null } }) })];
    await render(<EnrolScreen {...p} />);
    await rtl.screen.findByTestId('enrol-class-i-nov');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('enrol-name')).toBeTruthy());
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrol-continue'));
    await rtl.screen.findByText('The November class is full');
    expect(rtl.screen.getByText('The next one starts 12 January.')).toBeTruthy();
    expect(p.onHeld).not.toHaveBeenCalled();
    expect(hub.payments).toBe(0);
    await rtl.fireEvent.press(rtl.screen.getByText('Enroll for January'));
    await rtl.waitFor(() => expect(p.onHeld).toHaveBeenCalledWith(ENR));
    expect(hub.enrols).toEqual([{ intakeId: 'i-nov' }, { intakeId: 'i-jan' }]);
  });

  it('SC11: when no other class has a seat the note says so and draws no button', async () => {
    const p = props();
    hub.enrolAnswers = [refuse(409, { code: 'class_full', message: 'This class is full.', nextIntake: null })];
    await render(<EnrolScreen {...p} />);
    await rtl.screen.findByTestId('enrol-class-i-nov');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('enrol-name')).toBeTruthy());
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrol-continue'));
    await rtl.screen.findByText('The November class is full');
    expect(rtl.screen.getByText('No other class has a seat right now. Check back later.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('enrol-full-enroll')).toBeNull();
  });

  it('a student already in the course is taken to that enrolment', async () => {
    const p = props();
    hub.enrolAnswers = [refuse(409, { code: 'already_enrolled', message: 'You are already enrolled.', enrolmentId: ENR })];
    await render(<EnrolScreen {...p} />);
    await rtl.screen.findByTestId('enrol-class-i-nov');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('enrol-name')).toBeTruthy());
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrol-continue'));
    await rtl.waitFor(() => expect(p.onOpen).toHaveBeenCalledWith(ENR));
  });

  it('a refusal shows the Hub words and keeps Continue, and a lost answer asks to try again', async () => {
    const p = props();
    hub.enrolAnswers = [refuse(409, { code: 'intake_closed', message: 'This class has already started.' }), json(500, { statusCode: 500, message: 'x' })];
    await render(<EnrolScreen {...p} />);
    await rtl.screen.findByTestId('enrol-class-i-nov');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('enrol-name')).toBeTruthy());
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrol-continue'));
    expect((await rtl.screen.findByTestId('enrol-notice')).props.children).toBe('This class has already started.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrol-continue'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('enrol-notice').props.children).toBe('Check your connection and try again.'));
    expect(p.onHeld).not.toHaveBeenCalled();
  });

  it('a full class cannot be picked, and a course with no class to join has no Continue', async () => {
    hub.course = COURSE([FULL_NOV]);
    const p = props();
    await render(<EnrolScreen {...p} />);
    await rtl.screen.findByTestId('enrol-class-i-nov');
    expect(rtl.screen.getByTestId('enrol-class-i-nov').props.accessibilityState.disabled).toBe(true);
    expect(rtl.screen.getByTestId('enrol-continue').props.accessibilityState?.disabled).toBe(true);
    expect(rtl.screen.getByText('Weekend class · Yaba · Full')).toBeTruthy();
  });
});

describe('SC5, SC6, SC7: pay from the wallet', () => {
  const handlers = () => ({ onBack: jest.fn(), onMyCourses: jest.fn(), onCourse: jest.fn(), onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });
  const payButton = () => rtl.screen.findByRole('button', { name: /^Pay · / });

  async function reachPin(h = handlers()) {
    await render(<EnrolmentScreen id={ENR} {...h} />);
    await rtl.fireEvent.press(await payButton());
    await rtl.screen.findByText(/^Approve /);
    return h;
  }

  it('SC5: a user sees the course fee, the Bank charge and the total, and pays from the wallet', async () => {
    await render(<EnrolmentScreen id={ENR} {...handlers()} />);
    await payButton();
    expect(rtl.screen.getByText('Course fee')).toBeTruthy();
    expect(rtl.screen.getByText('Bank charge')).toBeTruthy();
    expect(rtl.screen.getByText('Total')).toBeTruthy();
    expect(rtl.screen.getAllByText('Product Design Bootcamp').length).toBeGreaterThan(0);
    expect(rtl.screen.getByText('Greenfield Tech Academy · starts 3 Nov')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Pay · ₦150,015.75' })).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('enrolment-name-card')).getByText('Lennox Emmanuel')).toBeTruthy();
  });

  it('SC6 and SC7: the PIN approves the total to the school, one payment is made with the PIN in its header, and the receipt follows', async () => {
    await reachPin();
    expect(rtl.screen.getByText('Approve ₦150,015.75 to Greenfield Tech Academy')).toBeTruthy();
    await enterPin('4829');
    await rtl.screen.findByTestId('enrolment-receipt');
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('4829');
    expect(hub.pays[0].body).toEqual({ kind: 'school_fee', targetId: ENR, expectedTotalKobo: 15_001_575, quoteToken: 'tok-2' });
    expect(hub.payments).toBe(1);
    expect(rtl.screen.getByText("You're enrolled")).toBeTruthy();
    expect(rtl.screen.getByText('Product Design Bootcamp · starts 3 Nov')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('enrolment-school')).getByText('Greenfield Tech Academy')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('enrolment-class')).getByText('Weekend · Yaba')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('enrolment-paid')).getByLabelText('150,015 naira 75 kobo')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('enrolment-reference')).getByText('WAW-SC4K-81PQ')).toBeTruthy();
    expect(rtl.screen.getByTestId('enrolment-note').props.children.join('')).toBe("Greenfield Tech Academy will contact you. We've sent them your details.");
  });

  it('asks for a fresh quote on every tap on Pay', async () => {
    await render(<EnrolmentScreen id={ENR} {...handlers()} />);
    await payButton();
    expect(hub.quotes).toBe(1);
    await rtl.fireEvent.press(await payButton());
    await rtl.screen.findByText(/^Approve /);
    expect(hub.quotes).toBe(2);
  });

  it('a double tap on Pay opens one PIN sheet and makes one payment', async () => {
    await render(<EnrolmentScreen id={ENR} {...handlers()} />);
    const button = await payButton();
    await rtl.fireEvent.press(button);
    await rtl.fireEvent.press(button);
    await rtl.screen.findByText(/^Approve /);
    expect(rtl.screen.getAllByText(/^Approve /)).toHaveLength(1);
    expect(hub.quotes).toBe(2);
    await enterPin('4829');
    await rtl.screen.findByTestId('enrolment-receipt');
    expect(hub.pays).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('a wrong PIN moves nothing and the next try carries the same key: one debit', async () => {
    hub.wrongFirst = true;
    await reachPin();
    await enterPin('1111');
    await rtl.screen.findByText(/4 tries left/);
    expect(hub.payments).toBe(0);
    await enterPin('4829');
    await rtl.screen.findByTestId('enrolment-receipt');
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.payments).toBe(1);
  });

  it('a balance that falls short is told with the bank figures, Add money leads on, and nothing is taken', async () => {
    hub.mode = 'short';
    const h = await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('Not enough in your Naira wallet');
    expect(hub.payments).toBe(0);
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /^Add / }));
    expect(h.onAddMoney).toHaveBeenCalledWith(15_001_575 - 500_000);
  });

  it('a lost answer then a retry sends the same key again: one debit, one enrolment', async () => {
    hub.mode = 'lost_after';
    await reachPin();
    await enterPin('4829');
    // The Hub took the money and its answer never came: the sheet asks for the PIN again and the same request goes out.
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    await enterPin('4829');
    await rtl.screen.findByTestId('enrolment-receipt');
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.pays[1].body).toEqual(hub.pays[0].body);
    expect(hub.payments).toBe(1);
  });

  it('a payment the Hub has not finished is waited for, never paid again', async () => {
    hub.mode = 'pending';
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('Paid, still confirming');
    expect(rtl.screen.queryByRole('button', { name: /^Pay · / })).toBeNull();
    expect(hub.pays).toHaveLength(1);
    // The Hub decides: Refresh reads the enrolment and the receipt shows.
    hub.status = 'enrolled';
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Refresh' }));
    await rtl.screen.findByTestId('enrolment-receipt');
    expect(hub.payments).toBe(1);
  });

  it('a payment the bank refused says why and can be tried again with a new key', async () => {
    hub.mode = 'failed';
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('The bank did not take it.');
    hub.mode = 'paid';
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /Try again/ }));
    await rtl.fireEvent.press(await payButton());
    await rtl.screen.findByText(/^Approve /);
    await enterPin('4829');
    await rtl.screen.findByTestId('enrolment-receipt');
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).not.toBe(hub.pays[0].key);
    expect(hub.payments).toBe(1);
  });

  it('no wallet yet leads to Open your wallet', async () => {
    hub.mode = 'no_wallet';
    const h = await reachPin();
    await enterPin('4829');
    await rtl.waitFor(() => expect(h.onOpenWallet).toHaveBeenCalled());
    expect(hub.payments).toBe(0);
  });

  it('SC7: Share receipt opens the share sheet with the text and the reference', async () => {
    hub.status = 'enrolled';
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const h = handlers();
    await render(<EnrolmentScreen id={ENR} {...h} />);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('enrolment-share'));
    expect(share).toHaveBeenCalledTimes(1);
    const message = (share.mock.calls[0][0] as { message: string }).message;
    expect(message).toContain('Product Design Bootcamp');
    expect(message).toContain('Greenfield Tech Academy');
    expect(message).toContain('WAW-SC4K-81PQ');
    await rtl.fireEvent.press(rtl.screen.getByTestId('enrolment-my-courses'));
    expect(h.onMyCourses).toHaveBeenCalled();
    share.mockRestore();
  });

  it('a place that went back is told plainly, and the course can be opened again', async () => {
    hub.status = 'released';
    const h = handlers();
    await render(<EnrolmentScreen id={ENR} {...h} />);
    await rtl.screen.findByText('This place was given back');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'See the course' }));
    expect(h.onCourse).toHaveBeenCalledWith('c-1');
  });

  it('a refunded enrolment says the class filled up and where the money is', async () => {
    hub.status = 'refunded';
    await render(<EnrolmentScreen id={ENR} {...handlers()} />);
    await rtl.screen.findByText('The class filled up');
    expect(rtl.screen.getByText(/Your money is on its way back to your wallet/)).toBeTruthy();
  });
});

describe('SC8: My courses', () => {
  const row = (id: string, over: Record<string, unknown> = {}) => ({ ...enrolmentView('enrolled'), id, weeks: 12, endDate: '2100-02-01', tab: 'current', ...over });
  const props = () => ({ onBack: jest.fn(), onOpen: jest.fn(), onFindSchools: jest.fn() });

  it('a user sees the current courses, switches to Finished and opens one', async () => {
    hub.list.current = [row('e-1'), row('e-2', { status: 'reserved', intake: { id: 'i', startDate: '2099-11-03', schedule: 'Weekend', location: null } }), row('e-3', { intake: { id: 'i', startDate: '2020-01-06', schedule: 'Weekend', location: null } })];
    hub.list.finished = [row('e-9', { tab: 'finished', intake: { id: 'i', startDate: '2019-01-07', schedule: 'Weekend', location: null } })];
    const p = props();
    await render(<MyCoursesScreen {...p} />);
    await rtl.screen.findByTestId('mine-row-e-1');
    expect(rtl.within(rtl.screen.getByTestId('mine-row-e-1')).getByText('Greenfield Tech Academy · starts 3 Nov')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('mine-pill-e-1')).getByText('School will contact you')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('mine-pill-e-2')).getByText('Not paid yet')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('mine-row-e-3')).getByText('Greenfield Tech Academy · started 6 Jan')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('mine-pill-e-3')).getByText('In progress')).toBeTruthy();
    expect(rtl.screen.queryByText(/week 3 of 6/)).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('mine-tabs-finished'));
    await rtl.screen.findByTestId('mine-row-e-9');
    expect(rtl.within(rtl.screen.getByTestId('mine-pill-e-9')).getByText('Finished')).toBeTruthy();
    expect(rtl.screen.queryByTestId('mine-row-e-1')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('mine-row-e-9'));
    expect(p.onOpen).toHaveBeenCalledWith('e-9');
  });

  it('draws its empty states by tab, and an error that can be retried', async () => {
    const p = props();
    await render(<MyCoursesScreen {...p} />);
    await rtl.screen.findByText('No courses yet');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Find a school' }));
    expect(p.onFindSchools).toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByTestId('mine-tabs-finished'));
    await rtl.screen.findByText('No finished courses');
    hub.listFails = true;
    queryClient.clear();
    await rtl.fireEvent.press(rtl.screen.getByTestId('mine-tabs-current'));
    await rtl.screen.findByTestId('mine-error');
  });
});

describe('SC3, SC9, SC11 on the course page', () => {
  it('Enroll opens SC4 with the class SC3 tells about, and "One payment" sits under the fee', async () => {
    const onEnroll = jest.fn();
    await render(<CourseScreen id="c-1" onBack={jest.fn()} onEnroll={onEnroll} />);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('course-enroll'));
    expect(onEnroll).toHaveBeenCalledWith('i-nov');
    expect(rtl.screen.getByText('One payment')).toBeTruthy();
  });

  it('SC11: when the class it tells about is full the bar says so and offers the next one that has a seat', async () => {
    hub.course = COURSE([FULL_NOV, JAN]);
    const onEnroll = jest.fn();
    await render(<CourseScreen id="c-1" onBack={jest.fn()} onEnroll={onEnroll} />);
    await rtl.screen.findByText('The November class is full');
    expect(rtl.screen.getByText('The next one starts 12 January.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('course-enroll')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByText('Enroll for January'));
    expect(onEnroll).toHaveBeenCalledWith('i-jan');
  });

  it('draws no Enroll without a route to lead to, and no apply link for a school with no site (R-47)', async () => {
    hub.course = COURSE([NOV], { school: { id: 's-1', name: 'Greenfield Tech Academy', category: 'tech', location: 'Yaba', logo: null, applyUrl: null } });
    await render(<CourseScreen id="c-1" onBack={jest.fn()} />);
    await rtl.screen.findByTestId('course-price');
    expect(rtl.screen.queryByTestId('course-enroll')).toBeNull();
    expect(rtl.screen.queryByTestId('course-apply')).toBeNull();
    // A school with no site of its own has no apply link even where Enroll is drawn.
    await render(<CourseScreen id="c-1" onBack={jest.fn()} onEnroll={jest.fn()} />);
    await rtl.screen.findAllByTestId('course-enroll');
    expect(rtl.screen.queryByTestId('course-apply')).toBeNull();
  });

  it('SC9: the sheet prints the tracked link, Continue records one click and opens it, and Enroll instead leads to SC4', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const onEnroll = jest.fn();
    await render(<CourseScreen id="c-1" onBack={jest.fn()} onEnroll={onEnroll} />);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('course-apply'));
    expect((await rtl.screen.findByTestId('apply-url')).props.children).toBe('greenfield.ng/apply?ref=wawu-7KQ2');
    expect(rtl.screen.getByText("Apply on Greenfield Tech Academy's site")).toBeTruthy();
    expect(hub.clicks).toBe(0);
    await rtl.fireEvent.press(rtl.screen.getByTestId('apply-continue'));
    await rtl.waitFor(() => expect(open).toHaveBeenCalledWith('https://greenfield.ng/apply?ref=wawu-7KQ2'));
    expect(hub.clicks).toBe(1);
    await rtl.fireEvent.press(rtl.screen.getByTestId('course-apply'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('apply-enroll'));
    expect(onEnroll).toHaveBeenCalledWith('i-nov');
    open.mockRestore();
  });
});
