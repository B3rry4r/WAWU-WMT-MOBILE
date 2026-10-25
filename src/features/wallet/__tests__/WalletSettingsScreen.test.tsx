/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockVault = new Map<string, string>();
const mockCopied: string[] = [];
const mockPush = jest.fn();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('expo-router', () => ({
  ...jest.requireActual<typeof import('expo-router')>('expo-router'),
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock('@/features/open-wallet/copy', () => ({
  copyText: jest.fn(async (value: string) => {
    mockCopied.push(value);
    return true;
  }),
}));

type Reply = { status: number; body: unknown };
type Answer = Reply | 'offline' | 'hold';

const OWNER = '00000000-0000-4000-8000-0000000000a6';
/** Made-up details in the server's shape, none of them the canvas's samples ("Fintava MFB", "812 345 6789"), so a screen that drew the canvas's figures would fail. */
const ACCOUNT = {
  accountNumber: '8100000417',
  accountName: 'Ada Eze',
  bankName: 'Ekiti Trial MFB',
  bankCode: '090620',
  licenceLine: null,
  depositInsuranceLine: null,
  openedAt: '2026-10-04T09:00:00.000Z',
};
const DAY = 24 * 60 * 60 * 1000;
const pin = (over: Record<string, unknown> = {}) => ({ isSet: true, changedAt: new Date(Date.now() - 90 * DAY).toISOString(), triesLeft: 5, lockedUntil: null, ...over });

let sent: { method: string; path: string }[] = [];
/** The JSON body of each POST, in order. */
let posted: unknown[] = [];
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const view = (over: Record<string, unknown> = {}) =>
  ok({ state: 'open', account: ACCOUNT, limits: null, pin: pin(), bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 6, ...over });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  sent.push({ method: request.method, path: url.pathname });
  if (request.method === 'POST') posted.push(await request.clone().json().catch(() => undefined));
  const answer = fallback[`${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`];
  if (!answer) throw new Error(`no answer for ${request.method} ${url.pathname}`);
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hold')
    return new Promise<Response>((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

type Props = { onBack: jest.Mock; onOpenPin: jest.Mock; onCreatePin: jest.Mock; onOpenWallet: jest.Mock; onOpenBeneficiaries?: jest.Mock };

async function boot(extra: Partial<Props> = {}): Promise<Props> {
  const { WalletSettingsScreen } = require('../settings/WalletSettingsScreen') as typeof import('../settings/WalletSettingsScreen');
  const props = { onBack: jest.fn(), onOpenPin: jest.fn(), onCreatePin: jest.fn(), onOpenWallet: jest.fn(), ...extra };
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WalletSettingsScreen {...props} />
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

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  sent = [];
  posted = [];
  mockPush.mockClear();
  mockCopied.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = { 'GET /money/wallet': view() };
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
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

describe('W35 · Wallet settings', () => {
  it('a user sees Transaction PIN with its age and Account details with the bank and the number, all from the wallet read (no destination given, so no Beneficiaries row)', async () => {
    await boot();
    expect(await rtl.screen.findByTestId('wallet-settings-pin')).toBeTruthy();
    expect(rtl.screen.getByRole('header', { name: 'Wallet settings' })).toBeTruthy();
    expect(rtl.screen.getByText('Transaction PIN')).toBeTruthy();
    expect(rtl.screen.getByText('Changed 3 months ago')).toBeTruthy();
    expect(rtl.screen.queryByText('Beneficiaries')).toBeNull();
    expect(rtl.screen.queryByText('6 saved')).toBeNull();
    expect(rtl.screen.getByText('Account details')).toBeTruthy();
    expect(rtl.screen.getByText('Ekiti Trial MFB · 810 000 0417')).toBeTruthy();
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual(['GET /api/hub/money/wallet']);
    // No tier, no canvas sample, no em-dash.
    expect(text()).not.toMatch(/Tier|Fintava|Loma Bank|812 345 6789|—/);
  });

  it('draws only what has a screen behind it: no Cards, Statements, and no fingerprint or face switch (R-47)', async () => {
    await boot();
    await rtl.screen.findByTestId('wallet-settings-pin');
    for (const name of ['Cards', 'Statements', 'Fingerprint or face for payments', 'Face ID for payments']) {
      expect(rtl.screen.queryByText(name)).toBeNull();
    }
    expect(rtl.screen.queryByRole('switch')).toBeNull();
  });

  it('Help with a payment is the last row, and opens the support chat with nothing attached (SUPPORT-01)', async () => {
    fallback['POST /support/thread'] = ok({ chatId: '00000000-0000-4000-8000-0000000000c9', reference: null, messageId: null });
    await boot();
    const help = await rtl.screen.findByTestId('wallet-settings-help');
    expect(rtl.screen.getByText('Help with a payment')).toBeTruthy();
    await rtl.fireEvent.press(help);
    await rtl.waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(posted).toEqual([{}]);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: '00000000-0000-4000-8000-0000000000c9' } });
  });

  it('a support chat that cannot be opened says so and stays on the page (SUPPORT-01)', async () => {
    fallback['POST /support/thread'] = 'offline';
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-settings-help'));
    expect(await rtl.screen.findByText('We couldn’t open the support chat. Try again.')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    expect(rtl.screen.getByText('Transaction PIN')).toBeTruthy();
  });

  it('shows no limits row while the server sends no limit', async () => {
    await boot();
    await rtl.screen.findByTestId('wallet-settings-pin');
    expect(rtl.screen.queryByTestId('wallet-settings-limits')).toBeNull();
  });

  it('shows the limits row, as sent, when the server sends a limit (the tier only when it names one)', async () => {
    fallback['GET /money/wallet'] = view({ limits: { tier: null, dailyLimitKobo: 500_000_000, usedTodayKobo: 0, remainingTodayKobo: 300_000_000, resetsAt: '2026-10-11T23:00:00.000Z' } });
    await boot();
    expect(await rtl.screen.findByTestId('wallet-settings-limits')).toBeTruthy();
    expect(rtl.screen.getByText('Daily limit')).toBeTruthy();
    expect(rtl.screen.getByText('₦5,000,000 daily · ₦3,000,000 left today')).toBeTruthy();
  });

  it('a limit that is not whole kobo, or is not positive, is no limits row (never a 0 or a guess)', async () => {
    fallback['GET /money/wallet'] = view({ limits: { tier: 'X', dailyLimitKobo: 0, usedTodayKobo: 0, remainingTodayKobo: 0, resetsAt: 'x' } });
    await boot();
    await rtl.screen.findByTestId('wallet-settings-pin');
    expect(rtl.screen.queryByTestId('wallet-settings-limits')).toBeNull();
  });

  it('a user can open Transaction PIN (W36)', async () => {
    const props = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Transaction PIN, Changed 3 months ago' }));
    expect(props.onOpenPin).toHaveBeenCalledTimes(1);
    expect(props.onCreatePin).not.toHaveBeenCalled();
  });

  it('with no PIN set yet the row says so and leads to creating one (A9), not to changing it', async () => {
    fallback['GET /money/wallet'] = view({ pin: pin({ isSet: false, changedAt: null }) });
    const props = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Transaction PIN, Not set yet' }));
    expect(props.onCreatePin).toHaveBeenCalledTimes(1);
    expect(props.onOpenPin).not.toHaveBeenCalled();
  });

  it('a user sees Beneficiaries with the Hub\'s count and taps it to open the saved accounts (R2-MONEY D-05)', async () => {
    const props = await boot({ onOpenBeneficiaries: jest.fn() });
    await rtl.screen.findByTestId('wallet-settings-pin');
    expect(rtl.screen.getByText('Beneficiaries')).toBeTruthy();
    expect(rtl.screen.getByText('6 saved')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('wallet-settings-beneficiaries'));
    expect(props.onOpenBeneficiaries).toHaveBeenCalledTimes(1);
  });

  it('with none saved the Beneficiaries row says "None saved"', async () => {
    fallback['GET /money/wallet'] = view({ beneficiaryCount: 0 });
    await boot({ onOpenBeneficiaries: jest.fn() });
    await rtl.screen.findByTestId('wallet-settings-pin');
    expect(rtl.screen.getByText('None saved')).toBeTruthy();
  });

  it('where the route gives Beneficiaries nowhere to go, the row is not drawn (R-47)', async () => {
    await boot();
    await rtl.screen.findByTestId('wallet-settings-pin');
    expect(rtl.screen.queryByTestId('wallet-settings-beneficiaries')).toBeNull();
  });

  it('a user can open Account details and read the holder, the number and the bank, and copy the number as sent', async () => {
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Account details, Ekiti Trial MFB · 810 000 0417' }));
    expect(await rtl.screen.findByTestId('wallet-account-card')).toBeTruthy();
    expect(rtl.screen.getByText('Ada Eze')).toBeTruthy();
    expect(rtl.screen.getByTestId('wallet-account-number-value').props.children).toBe('810 000 0417');
    expect(rtl.screen.getAllByText('Ekiti Trial MFB').length).toBeGreaterThan(0);
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Copy account number' }));
    await rtl.waitFor(() => expect(mockCopied).toEqual(['8100000417']));
    expect(await rtl.screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
  });

  it('Account details shows the licence and deposit insurance wording only when the server sends it', async () => {
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: /^Account details/ }));
    await rtl.screen.findByTestId('wallet-account-card');
    expect(rtl.screen.queryByTestId('wallet-account-note')).toBeNull();
    await rtl.cleanup();

    fallback['GET /money/wallet'] = view({ account: { ...ACCOUNT, licenceLine: 'Licensed by the CBN.', depositInsuranceLine: 'Deposits are insured.' } });
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: /^Account details/ }));
    expect(await rtl.screen.findByText('Licensed by the CBN.')).toBeTruthy();
    expect(rtl.screen.getByText('Deposits are insured.')).toBeTruthy();
  });

  it('the back button leaves the screen', async () => {
    const props = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Back' }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('loading: a quiet page, and no row, name or figure, while the wallet has not answered', async () => {
    fallback['GET /money/wallet'] = 'hold';
    await boot();
    expect(await rtl.screen.findByTestId('wallet-settings-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('wallet-settings-pin')).toBeNull();
    expect(rtl.screen.getByLabelText('Loading your wallet settings')).toBeTruthy();
  });

  it('error: the read fails with the server sentence and Try again asks again and shows the rows', async () => {
    fallback['GET /money/wallet'] = 'offline';
    await boot();
    expect(await rtl.screen.findByTestId('wallet-settings-error')).toBeTruthy();
    expect(rtl.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    fallback['GET /money/wallet'] = view();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByTestId('wallet-settings-pin')).toBeTruthy();
    expect(sent.filter((s) => s.path.endsWith('/money/wallet')).length).toBe(2);
  });

  it('an open wallet that arrives without its account is an error, never half a page', async () => {
    fallback['GET /money/wallet'] = view({ account: null });
    await boot();
    expect(await rtl.screen.findByTestId('wallet-settings-error')).toBeTruthy();
    expect(rtl.screen.queryByTestId('wallet-settings-pin')).toBeNull();
  });

  it('no wallet: the page says so and Open your wallet leads to A26', async () => {
    fallback['GET /money/wallet'] = view({ state: 'not_open', account: null, pin: pin({ isSet: false, changedAt: null }) });
    const props = await boot();
    expect(await rtl.screen.findByText("You don't have a wallet yet")).toBeTruthy();
    expect(rtl.screen.queryByTestId('wallet-settings-pin')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Open your wallet' }));
    expect(props.onOpenWallet).toHaveBeenCalledTimes(1);
  });

  it('an account still opening says so and Check again asks again', async () => {
    fallback['GET /money/wallet'] = view({ state: 'opening', account: null });
    await boot();
    expect(await rtl.screen.findByText('Your account is opening')).toBeTruthy();
    fallback['GET /money/wallet'] = view();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Check again' }));
    expect(await rtl.screen.findByTestId('wallet-settings-pin')).toBeTruthy();
  });
});
