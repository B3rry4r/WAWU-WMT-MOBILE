/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, Text as NativeText, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));

jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));

/** The signed-in account the wallet reads are keyed by (a token with no readable `sub` has none, and no query would run). */
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'u1' }));

const mockSignOut = jest.fn<Promise<{ serverEnded: boolean; storeCleared: boolean }>, []>();
jest.mock('@/features/settings/signOutFlow', () => ({ signOutOfThisPhone: () => mockSignOut() }));

type Plain = { status: number; body: unknown };
type Answer = Plain | 'offline' | 'hang' | (() => Promise<Plain>);
type Sent = { method: string; path: string; body: unknown };

let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hang') return new Promise<Response>(() => undefined);
  const plain = typeof answer === 'function' ? await answer() : answer;
  return new Response(JSON.stringify(plain.body), { status: plain.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const WALLET = 'GET /api/hub/money/wallet';
const BALANCE = 'GET /api/hub/money/wallet/balance';
const DELETE = 'DELETE /api/hub/account';
const OPEN_WALLET = { state: 'open', account: { accountNumber: '8012345678', accountName: 'Ada Okafor', bankName: 'Nuvion' } };
const balance = (kobo: number): Answer => ok({ availableKobo: kobo, asOf: '2026-10-17T10:00:00.000Z' });
const DATE = '2026-11-16T10:00:00.000Z';

/** What the Hub answers when it refuses: the one error shape, with `reason.code` `account_deletion_blocked` (Z6's 409). */
const blocked = (message: string, blockers: string[], extra: Record<string, unknown> = {}): Answer => ({
  status: 409,
  body: { statusCode: 409, message, data: null, reason: { code: 'account_deletion_blocked', message, blockers, openHolds: 0, waitingEarnings: 0, ...extra } },
});
const unreachable: Answer = {
  status: 503,
  body: {
    statusCode: 503,
    message: 'We could not reach your account. Your money is safe. Try again in a moment.',
    data: null,
    reason: { code: 'provider_unreachable', message: 'We could not reach your account. Your money is safe. Try again in a moment.' },
  },
};

const clients: QueryClient[] = [];
function frame(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity, retry: false } } });
  clients.push(client);
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{child}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

const mod = <T,>(path: string) => require(path) as T;
void [mod('../DeleteAccountScreen'), mod('../ConfirmDeletionScreen'), mod('../ScheduledScreen'), mod('../../settings/SettingsScreen')];
void [ActivityIndicator, Animated, Image, Pressable, ScrollView, NativeText, TextInput, View];

beforeAll(async () => {
  const warm = await render(<View />);
  warm.unmount();
});

beforeEach(() => {
  answers = {};
  sent = [];
  mockSignOut.mockReset().mockResolvedValue({ serverEnded: true, storeCleared: true });
});

afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

const tap = (testID: string) => act(async () => fireEvent.press(screen.getByTestId(testID)));
const disabled = (testID: string) => Boolean(screen.getByTestId(testID).props.accessibilityState?.disabled);
const deletes = () => sent.filter((s) => s.method === 'DELETE' && s.path === '/api/hub/account');

describe('Z6 · Delete account', () => {
  const boot = async () => {
    const { DeleteAccountScreen } = mod<typeof import('../DeleteAccountScreen')>('../DeleteAccountScreen');
    const handlers = { onBack: jest.fn(), onWithdraw: jest.fn(), onContinue: jest.fn() };
    await render(frame(<DeleteAccountScreen {...handlers} />));
    return handlers;
  };

  it('a person with money in the wallet sees the bank\'s figure and Withdraw, Continue waits, and Withdraw opens the withdrawal', async () => {
    answers[WALLET] = ok(OPEN_WALLET);
    answers[BALANCE] = balance(48_525_075);
    const handlers = await boot();
    await screen.findByTestId('delete-wallet-warning');
    expect(screen.getByText('Empty your wallet first')).toBeTruthy();
    expect(screen.getByText('You have ₦485,250.75. Withdraw it to your bank before deleting.')).toBeTruthy();
    expect(disabled('delete-continue')).toBe(true);
    await tap('delete-continue');
    expect(handlers.onContinue).not.toHaveBeenCalled();
    await tap('delete-withdraw');
    expect(handlers.onWithdraw).toHaveBeenCalledTimes(1);
  });

  it('draws what goes, with the wallet and cards (R-84 settled the cards R-16 left out), and no figure for the waiting period', async () => {
    answers[WALLET] = ok(OPEN_WALLET);
    answers[BALANCE] = balance(48_525_075);
    await boot();
    await screen.findByTestId('delete-wallet-warning');
    for (const row of ['Your profile, content and communities', 'Your purchases and tickets', 'Your wallet and cards']) expect(screen.getByText(row)).toBeTruthy();
    expect(screen.getByText('Delete your account?')).toBeTruthy();
    expect(screen.queryByText(/30/)).toBeNull();
  });

  it('a person with an empty wallet has no warning, and Continue opens the confirmation', async () => {
    answers[WALLET] = ok(OPEN_WALLET);
    answers[BALANCE] = balance(0);
    const handlers = await boot();
    await waitFor(() => expect(disabled('delete-continue')).toBe(false));
    expect(screen.queryByTestId('delete-wallet-warning')).toBeNull();
    expect(screen.getByText('Your wallet and cards')).toBeTruthy();
    await tap('delete-continue');
    expect(handlers.onContinue).toHaveBeenCalledTimes(1);
  });

  it('a person with no wallet (R-6) sees no wallet warning and no wallet row, and can continue', async () => {
    answers[WALLET] = ok({ state: 'not_open', account: null });
    const handlers = await boot();
    await waitFor(() => expect(disabled('delete-continue')).toBe(false));
    expect(screen.queryByTestId('delete-wallet-warning')).toBeNull();
    expect(screen.queryByTestId('delete-wallet-notice')).toBeNull();
    expect(screen.queryByText('Your wallet and cards')).toBeNull();
    expect(sent.some((s) => s.path === '/api/hub/money/wallet/balance')).toBe(false);
    await tap('delete-continue');
    expect(handlers.onContinue).toHaveBeenCalledTimes(1);
  });

  it('while the wallet is being read nothing is claimed: no warning, Continue waits', async () => {
    answers[WALLET] = 'hang';
    await boot();
    await screen.findByTestId('delete-wallet-loading');
    expect(screen.queryByTestId('delete-wallet-warning')).toBeNull();
    expect(disabled('delete-continue')).toBe(true);
  });

  it('when the bank does not answer the balance, the screen says so in the Hub\'s words and never takes it for empty; Try again reads it again', async () => {
    answers[WALLET] = ok(OPEN_WALLET);
    answers[BALANCE] = [unreachable, balance(0)];
    await boot();
    await screen.findByTestId('delete-wallet-notice');
    expect(screen.getByText("We couldn't reach your account")).toBeTruthy();
    expect(screen.getByText('We could not reach your account. Your money is safe. Try again in a moment.')).toBeTruthy();
    expect(disabled('delete-continue')).toBe(true);
    await tap('delete-wallet-retry');
    await waitFor(() => expect(disabled('delete-continue')).toBe(false));
    expect(screen.queryByTestId('delete-wallet-notice')).toBeNull();
  });

  it('a wallet that is still opening says so and keeps Continue closed', async () => {
    answers[WALLET] = ok({ state: 'opening', account: null });
    await boot();
    await screen.findByTestId('delete-wallet-notice');
    expect(screen.getByText('Your account is opening')).toBeTruthy();
    expect(screen.getByText('Check again')).toBeTruthy();
    expect(disabled('delete-continue')).toBe(true);
  });
});

describe('Z7 · Confirm', () => {
  const boot = async () => {
    const { ConfirmDeletionScreen } = mod<typeof import('../ConfirmDeletionScreen')>('../ConfirmDeletionScreen');
    const handlers = { onBack: jest.fn(), onScheduled: jest.fn(), onWithdraw: jest.fn() };
    await render(frame(<ConfirmDeletionScreen {...handlers} />));
    return handlers;
  };
  const type = (text: string) => act(async () => fireEvent.changeText(screen.getByTestId('confirm-typed'), text));
  const pick = async (code: string) => {
    await tap('confirm-reason');
    await tap(`reason-${code}`);
  };

  it('Delete my account stays closed until DELETE is typed, and sends nothing before then', async () => {
    await boot();
    expect(disabled('confirm-delete')).toBe(true);
    await tap('confirm-delete');
    expect(deletes()).toHaveLength(0);
    await type('delet');
    expect(disabled('confirm-delete')).toBe(true);
    await type('DELETE');
    expect(disabled('confirm-delete')).toBe(false);
  });

  it('a user can leave without a reason: the request carries none and Z8 gets the Hub\'s date', async () => {
    answers[DELETE] = ok({ deletionScheduledAt: DATE });
    const handlers = await boot();
    await type('DELETE');
    await tap('confirm-delete');
    await waitFor(() => expect(handlers.onScheduled).toHaveBeenCalledWith(DATE));
    expect(deletes().map((d) => d.body)).toEqual([{}]);
  });

  it('a user can pick a reason: its code goes with the request, and the field shows its words', async () => {
    answers[DELETE] = ok({ deletionScheduledAt: DATE });
    const handlers = await boot();
    expect(screen.getByText('Choose a reason')).toBeTruthy();
    await pick('privacy');
    expect(screen.getByText("I'm worried about my privacy")).toBeTruthy();
    await type('DELETE');
    await tap('confirm-delete');
    await waitFor(() => expect(handlers.onScheduled).toHaveBeenCalled());
    expect(deletes().map((d) => d.body)).toEqual([{ reason: 'privacy' }]);
  });

  it('every choice the Hub knows is offered, and tapping the chosen one again clears it', async () => {
    answers[DELETE] = ok({ deletionScheduledAt: DATE });
    const handlers = await boot();
    await tap('confirm-reason');
    for (const code of ['not_using_enough', 'another_account', 'privacy', 'too_many_notifications', 'something_else']) {
      expect(screen.getByTestId(`reason-${code}`)).toBeTruthy();
    }
    await tap('reason-not_using_enough');
    expect(screen.getByText("I don't use it enough")).toBeTruthy();
    await tap('confirm-reason');
    await tap('reason-not_using_enough');
    expect(screen.getByText('Choose a reason')).toBeTruthy();
    await type('DELETE');
    await tap('confirm-delete');
    await waitFor(() => expect(handlers.onScheduled).toHaveBeenCalled());
    expect(deletes().map((d) => d.body)).toEqual([{}]);
  });

  it('a double tap on Delete my account sends one request and schedules once', async () => {
    let release: (value: Plain) => void = () => undefined;
    answers[DELETE] = () =>
      new Promise<Plain>((resolve) => {
        release = resolve;
      });
    const handlers = await boot();
    await type('DELETE');
    const button = screen.getByTestId('confirm-delete');
    await act(async () => {
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
    });
    expect(deletes()).toHaveLength(1);
    expect(handlers.onScheduled).not.toHaveBeenCalled();
    await act(async () => release({ status: 200, body: { statusCode: 200, message: 'OK', data: { deletionScheduledAt: DATE } } }));
    await waitFor(() => expect(handlers.onScheduled).toHaveBeenCalledTimes(1));
    expect(deletes()).toHaveLength(1);
  });

  it('money in the wallet: the Hub\'s refusal is shown in its words with Withdraw, and nothing is scheduled', async () => {
    const words = 'Empty your wallet first. Withdraw what is in it to your bank, then delete your account.';
    answers[DELETE] = blocked(words, ['wallet_balance'], { balanceKobo: 48_525_075 });
    const handlers = await boot();
    await type('DELETE');
    await tap('confirm-delete');
    await screen.findByTestId('confirm-refused');
    expect(screen.getByText(words)).toBeTruthy();
    expect(handlers.onScheduled).not.toHaveBeenCalled();
    await tap('confirm-withdraw');
    expect(handlers.onWithdraw).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('confirm-typed').props.value).toBe('DELETE');
  });

  it('an owed earning: the Hub\'s refusal is shown in its words, with no Withdraw (there is nothing to withdraw yet)', async () => {
    const words = 'Some of your money is still on its way. Delete your account once it has reached your wallet and you have withdrawn it.';
    answers[DELETE] = blocked(words, ['waiting_earnings'], { waitingEarnings: 2 });
    const handlers = await boot();
    await type('DELETE');
    await tap('confirm-delete');
    await screen.findByTestId('confirm-refused');
    expect(screen.getByText(words)).toBeTruthy();
    expect(screen.queryByTestId('confirm-withdraw')).toBeNull();
    expect(handlers.onScheduled).not.toHaveBeenCalled();
  });

  it('a bank that does not answer: the Hub\'s sentence, what was typed kept, and the same button tries again', async () => {
    answers[DELETE] = [unreachable, ok({ deletionScheduledAt: DATE })];
    const handlers = await boot();
    await pick('another_account');
    await type('DELETE');
    await tap('confirm-delete');
    await screen.findByTestId('confirm-problem');
    expect(screen.getByText('We could not reach your account. Your money is safe. Try again in a moment.')).toBeTruthy();
    expect(handlers.onScheduled).not.toHaveBeenCalled();
    expect(screen.getByTestId('confirm-typed').props.value).toBe('DELETE');
    await tap('confirm-delete');
    await waitFor(() => expect(handlers.onScheduled).toHaveBeenCalledWith(DATE));
    expect(deletes().map((d) => d.body)).toEqual([{ reason: 'another_account' }, { reason: 'another_account' }]);
    expect(screen.queryByTestId('confirm-problem')).toBeNull();
  });

  it('no connection: says so, and a retry sends it again', async () => {
    answers[DELETE] = ['offline', ok({ deletionScheduledAt: DATE })];
    const handlers = await boot();
    await type('DELETE');
    await tap('confirm-delete');
    await screen.findByText('No connection. Check your internet and try again.');
    await tap('confirm-delete');
    await waitFor(() => expect(handlers.onScheduled).toHaveBeenCalledTimes(1));
  });

  it('a server fault is the app\'s own sentence, never the server\'s raw words', async () => {
    answers[DELETE] = { status: 500, body: { statusCode: 500, message: 'Internal server error', data: null } };
    await boot();
    await type('DELETE');
    await tap('confirm-delete');
    await screen.findByText('Your account could not be scheduled for deletion. Try again.');
    expect(screen.queryByText('Internal server error')).toBeNull();
  });

  it('an answer with no readable date is not taken as scheduled', async () => {
    answers[DELETE] = ok({});
    const handlers = await boot();
    await type('DELETE');
    await tap('confirm-delete');
    await screen.findByText('We could not read the answer. Try again.');
    expect(handlers.onScheduled).not.toHaveBeenCalled();
  });
});

describe('Z8 · Scheduled', () => {
  const NOW = new Date('2026-10-17T10:00:00.000Z');
  const boot = async (at = DATE) => {
    const { ScheduledScreen } = mod<typeof import('../ScheduledScreen')>('../ScheduledScreen');
    const onSignedOut = jest.fn();
    await render(frame(<ScheduledScreen at={at} now={NOW} onSignedOut={onSignedOut} />));
    return onSignedOut;
  };

  it('says it is scheduled, with the Hub\'s date and how to cancel', async () => {
    await boot();
    expect(screen.getByText('Scheduled for deletion')).toBeTruthy();
    expect(screen.getByText('On 16 November. Sign in before then to cancel.')).toBeTruthy();
  });

  it('a user can tap Done: the phone signs out once, even on a double tap, and leaves', async () => {
    let finish: (value: { serverEnded: boolean; storeCleared: boolean }) => void = () => undefined;
    mockSignOut.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const onSignedOut = await boot();
    const done = screen.getByTestId('scheduled-done');
    await act(async () => {
      fireEvent.press(done);
      fireEvent.press(done);
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(onSignedOut).not.toHaveBeenCalled();
    await act(async () => finish({ serverEnded: true, storeCleared: true }));
    await waitFor(() => expect(onSignedOut).toHaveBeenCalledTimes(1));
  });

  it('when the phone cannot clear its saved sign-in, it says so, stays, and Done tries again', async () => {
    mockSignOut.mockResolvedValueOnce({ serverEnded: true, storeCleared: false });
    const onSignedOut = await boot();
    await tap('scheduled-done');
    await screen.findByTestId('scheduled-problem');
    expect(onSignedOut).not.toHaveBeenCalled();
    await tap('scheduled-done');
    await waitFor(() => expect(onSignedOut).toHaveBeenCalledTimes(1));
    expect(mockSignOut).toHaveBeenCalledTimes(2);
  });

  it('a date that cannot be read says nothing about a day', async () => {
    await boot('not a date');
    expect(screen.getByText('Sign in before the deletion date to cancel.')).toBeTruthy();
  });
});

describe('Z2 · the Delete account line', () => {
  const props = () => ({
    onBack: jest.fn(),
    onOpenProfile: jest.fn(),
    onOpenNotifications: jest.fn(),
    onOpenPrivacy: jest.fn(),
    onOpenPassword: jest.fn(),
    onOpenAbout: jest.fn(),
    onOpenTerms: jest.fn(),
    onOpenPolicy: jest.fn(),
    onSignedOut: jest.fn(),
  });

  it('a user can tap Delete account under Sign out and reach Z6', async () => {
    const { SettingsScreen } = mod<typeof import('../../settings/SettingsScreen')>('../../settings/SettingsScreen');
    const onOpenDeleteAccount = jest.fn();
    await render(frame(<SettingsScreen {...props()} onOpenDeleteAccount={onOpenDeleteAccount} />));
    await screen.findByTestId('settings-delete-account');
    await tap('settings-delete-account');
    expect(onOpenDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it('the line is not drawn where the route gives it no place to go (R-47)', async () => {
    const { SettingsScreen } = mod<typeof import('../../settings/SettingsScreen')>('../../settings/SettingsScreen');
    await render(frame(<SettingsScreen {...props()} />));
    await screen.findByTestId('settings-sign-out');
    expect(screen.queryByTestId('settings-delete-account')).toBeNull();
  });
});
