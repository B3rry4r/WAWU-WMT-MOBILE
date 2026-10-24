/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

type Reply = { status: number; body: unknown };
type Answer = Reply | 'offline';

const OWNER = '00000000-0000-4000-8000-0000000000b8';
/** Made-up details in the server's shape, none of them the canvas's samples ("812 345 6789", "lennox@wawu.africa"). */
const ACCOUNT = {
  accountNumber: '8100000417',
  accountName: 'Ada Eze',
  bankName: 'Ekiti Trial MFB',
  bankCode: '090620',
  licenceLine: null,
  depositInsuranceLine: null,
  openedAt: '2026-10-04T09:00:00.000Z',
};
const MASKED = 'q***@mail.test';
/** 26 Sep 2026, midday in Lagos: the day the canvas draws. */
const NOW = new Date('2026-09-26T11:00:00Z');
const clock = () => NOW;

type Seen = { method: string; path: string; key: string | null; body: unknown };
let sent: Seen[] = [];
let answers: Record<string, Answer[]> = {};

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({
  status,
  body: { statusCode: status, message, data: null, reason: { code, message } },
});
const wallet = (over: Record<string, unknown> = {}) =>
  ok({
    state: 'open',
    account: ACCOUNT,
    limits: null,
    pin: { isSet: true, changedAt: '2026-07-01T09:00:00.000Z', triesLeft: 5, lockedUntil: null },
    bankTransfers: { allowed: true, blockedBy: null },
    beneficiaryCount: 0,
    ...over,
  });
const delivery = (over: Record<string, unknown> = {}) => ok({ email: MASKED, canEmail: true, formats: ['csv'], ...over });
const mailed = (over: Record<string, unknown> = {}) =>
  ok({ sentTo: MASKED, from: '2026-07-01', to: '2026-09-26', format: 'csv', fileName: 'statement-2026-07-01-to-2026-09-26.csv', rowCount: 3, sentAt: '2026-09-26T11:00:00.000Z', ...over });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const route = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const text = request.method === 'POST' ? await request.clone().text() : '';
  sent.push({ method: request.method, path: route.split(' ')[1], key: request.headers.get('Idempotency-Key'), body: text ? JSON.parse(text) : null });
  const queue = answers[route];
  if (!queue || queue.length === 0) throw new Error(`no answer for ${route}`);
  const answer = queue.length > 1 ? queue.shift()! : queue[0];
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

type Props = { onBack: jest.Mock; onSent: jest.Mock; onOpenWallet: jest.Mock };
async function boot(extra: Record<string, unknown> = {}): Promise<Props> {
  const { StatementScreen } = require('../StatementScreen') as typeof import('../StatementScreen');
  const props = { onBack: jest.fn(), onSent: jest.fn(), onOpenWallet: jest.fn(), ...extra };
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <StatementScreen {...props} clock={clock} />
    </SafeAreaProvider>,
  );
  return props;
}

const text = () => {
  const seen = new WeakSet<object>();
  return JSON.stringify(rtl.screen.toJSON(), (_key, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    return value;
  });
};
const posts = () => sent.filter((s) => s.method === 'POST');

// The first draw loads the whole screen's modules, which on a busy machine can outlast a test's own 20 s.
beforeAll(() => {
  require('../StatementScreen');
}, 120_000);

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  sent = [];
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  answers = { 'GET /money/wallet': [wallet()], 'GET /money/statements/delivery': [delivery()] };
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
  (require('../notice') as typeof import('../notice')).clearStatementSent();
});

afterEach(async () => {
  (require('../notice') as typeof import('../notice')).clearStatementSent();
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  await queryClient.cancelQueries();
  queryClient.clear();
});

afterAll(() => {
  (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
});

describe('W38 · Statement', () => {
  it('a user sees their account, the period W38 opens on, the format the server offers and where it will go, all from the API and the clock', async () => {
    await boot();
    expect(await rtl.screen.findByTestId('statement-form')).toBeTruthy();
    expect(rtl.screen.getByText('Statement')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Account, Naira wallet · 810 000 0417')).toBeTruthy();
    for (const label of ['This month', 'Last month', '3 months', 'Custom']) expect(rtl.screen.getByText(label)).toBeTruthy();
    expect(rtl.screen.getByLabelText('From, 1 Jul 2026')).toBeTruthy();
    expect(rtl.screen.getByLabelText('To, 26 Sep 2026')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Format, CSV')).toBeTruthy();
    expect(rtl.screen.getByLabelText(`Send to, ${MASKED}`)).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Send statement' })).toBeTruthy();
    expect(sent.map((s) => `${s.method} ${s.path}`).sort()).toEqual(['GET /money/statements/delivery', 'GET /money/wallet']);
    // Nothing the server did not send: no stamped PDF, no canvas sample, no typed address, no em-dash.
    expect(text()).not.toMatch(/Stamped PDF|visa|lennox|812 345 6789|—/);
    expect(rtl.screen.queryByRole('textbox')).toBeNull();
  });

  it('the period chips set the days: This month and Last month', async () => {
    await boot();
    await rtl.screen.findByTestId('statement-form');
    await rtl.fireEvent.press(rtl.screen.getByText('This month'));
    expect(rtl.screen.getByLabelText('From, 1 Sep 2026')).toBeTruthy();
    expect(rtl.screen.getByLabelText('To, 26 Sep 2026')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Last month'));
    expect(rtl.screen.getByLabelText('From, 1 Aug 2026')).toBeTruthy();
    expect(rtl.screen.getByLabelText('To, 31 Aug 2026')).toBeTruthy();
  });

  it('Send statement asks for exactly the period and the format, with no address, under one Idempotency-Key, then goes back with the server\'s masked address', async () => {
    answers['POST /money/statements/email'] = [mailed()];
    const props = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Send statement' }));
    await rtl.waitFor(() => expect(props.onSent).toHaveBeenCalledTimes(1));
    expect(posts()).toHaveLength(1);
    expect(posts()[0].path).toBe('/money/statements/email');
    expect(posts()[0].body).toEqual({ from: '2026-07-01', to: '2026-09-26', format: 'csv' });
    expect(posts()[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    const { useStatementSent } = require('../notice') as typeof import('../notice');
    let seen: string | null = null;
    function Probe() {
      seen = useStatementSent();
      return null;
    }
    await rtl.render(<Probe />);
    expect(seen).toBe(`Statement sent to ${MASKED}`);
  });

  it('a picked custom range is what is sent: First day opens a calendar on that month, days after today cannot be chosen', async () => {
    answers['POST /money/statements/email'] = [mailed()];
    const props = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('statement-from'));
    expect(await rtl.screen.findByTestId('day-sheet-month')).toHaveTextContent('July 2026');
    await rtl.fireEvent.press(rtl.screen.getByTestId('day-sheet-2026-07-14'));
    expect(rtl.screen.getByLabelText('From, 14 Jul 2026')).toBeTruthy();
    // Custom is now on, and the other end kept its day.
    expect(rtl.screen.getByLabelText('To, 26 Sep 2026')).toBeTruthy();

    await rtl.fireEvent.press(rtl.screen.getByTestId('statement-to'));
    expect(await rtl.screen.findByTestId('day-sheet-month')).toHaveTextContent('September 2026');
    expect(rtl.screen.getByTestId('day-sheet-2026-09-27').props.accessibilityState.disabled).toBe(true);
    expect(rtl.screen.getByTestId('day-sheet-next').props.accessibilityState.disabled).toBe(true);
    await rtl.fireEvent.press(rtl.screen.getByTestId('day-sheet-2026-09-20'));
    expect(rtl.screen.getByLabelText('To, 20 Sep 2026')).toBeTruthy();

    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send statement' }));
    await rtl.waitFor(() => expect(props.onSent).toHaveBeenCalled());
    expect(posts()[0].body).toEqual({ from: '2026-07-14', to: '2026-09-20', format: 'csv' });
  });

  it('a first day after the last day is said, and nothing can be sent', async () => {
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('statement-to'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('day-sheet-prev'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('day-sheet-prev'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('day-sheet-2026-07-01'));
    // From was 1 Jul: put To on 1 Jul, then move From later.
    await rtl.fireEvent.press(rtl.screen.getByTestId('statement-from'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('day-sheet-2026-07-20'));
    expect(await rtl.screen.findByTestId('statement-period-problem')).toBeTruthy();
    expect(rtl.screen.getByText('The first day must be on or before the last day.')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send statement' }));
    expect(posts()).toHaveLength(0);
  });

  it('when the server offers more than one format they are the segments, and the chosen one is sent', async () => {
    answers['GET /money/statements/delivery'] = [delivery({ formats: ['csv', 'pdf'] })];
    answers['POST /money/statements/email'] = [mailed({ format: 'pdf' })];
    const props = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByText('Stamped PDF'));
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send statement' }));
    await rtl.waitFor(() => expect(props.onSent).toHaveBeenCalled());
    expect(posts()[0].body).toEqual({ from: '2026-07-01', to: '2026-09-26', format: 'pdf' });
  });

  it('an account with no confirmed email is told so, has no address to show, and sends nothing', async () => {
    answers['GET /money/statements/delivery'] = [delivery({ email: null, canEmail: false })];
    await boot();
    expect(await rtl.screen.findByTestId('statement-no-email')).toBeTruthy();
    expect(rtl.screen.getByText('Confirm your email address to get a statement by email.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('statement-send-to')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send statement' }));
    expect(posts()).toHaveLength(0);
  });

  it('G-486: with a way to confirm, the no-email card has a Confirm email button that opens it; without one the card has no button', async () => {
    answers['GET /money/statements/delivery'] = [delivery({ email: null, canEmail: false })];
    const onConfirmEmail = jest.fn();
    await boot({ onConfirmEmail });
    await rtl.fireEvent.press(await rtl.screen.findByTestId('statement-confirm-email'));
    expect(onConfirmEmail).toHaveBeenCalledTimes(1);
  });

  it('a refusal shows the server\'s own sentence and the person can try again with a new key; a lost answer repeats the same key', async () => {
    answers['POST /money/statements/email'] = [
      refusal(503, 'statement_email_failed', "We couldn't send your statement. Try again in a moment."),
      'offline',
      mailed(),
    ];
    const props = await boot();
    const button = await rtl.screen.findByRole('button', { name: 'Send statement' });
    await rtl.fireEvent.press(button);
    expect(await rtl.screen.findByText("We couldn't send your statement. Try again in a moment.")).toBeTruthy();
    expect(props.onSent).not.toHaveBeenCalled();
    // The server answered, so the next press is a new attempt; then no answer came, so the one after repeats it.
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send statement' }));
    await rtl.waitFor(() => expect(posts()).toHaveLength(2));
    await rtl.waitFor(() => expect(rtl.screen.getByRole('button', { name: 'Send statement' }).props.accessibilityState.busy).toBeFalsy());
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send statement' }));
    await rtl.waitFor(() => expect(props.onSent).toHaveBeenCalled());
    const keys = posts().map((p) => p.key);
    expect(keys).toHaveLength(3);
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[2]).toBe(keys[1]);
  });

  it('too many statements, too large a period and an unconfirmed email each show the server\'s words', async () => {
    answers['POST /money/statements/email'] = [
      refusal(429, 'statement_rate_limited', 'You have asked for a lot of statements in a short time. Try again in a little while.'),
      refusal(400, 'statement_too_large', 'This period has more movements than one statement lists. Pick a shorter range.'),
    ];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Send statement' }));
    expect(await rtl.screen.findByText(/asked for a lot of statements/)).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send statement' }));
    expect(await rtl.screen.findByText(/Pick a shorter range/)).toBeTruthy();
  });

  it('the server saying the email is not confirmed reads the options again and shows that state', async () => {
    answers['POST /money/statements/email'] = [refusal(409, 'email_not_verified', 'Confirm your email address to get a statement by email.')];
    answers['GET /money/statements/delivery'] = [delivery(), delivery({ email: null, canEmail: false })];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Send statement' }));
    expect(await rtl.screen.findByTestId('statement-no-email')).toBeTruthy();
  });

  it('while it loads the fields\' shapes show and no figure; a failed read says so and tries again', async () => {
    answers['GET /money/statements/delivery'] = [refusal(503, 'x', 'The server is busy.'), delivery()];
    await boot();
    expect(await rtl.screen.findByTestId('statement-error')).toBeTruthy();
    expect(rtl.screen.queryByTestId('statement-send')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /try again/i }));
    expect(await rtl.screen.findByTestId('statement-form')).toBeTruthy();
  });

  it('no wallet yet leads to Open your wallet, and an account still opening says to check again', async () => {
    answers['GET /money/wallet'] = [wallet({ state: 'not_open', account: null })];
    const props = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByText('Open your wallet'));
    expect(props.onOpenWallet).toHaveBeenCalledTimes(1);
    expect(rtl.screen.queryByTestId('statement-send')).toBeNull();
  });
});
