/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline';
type Sent = { method: string; path: string; body: unknown };

let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    const text = request.method === 'GET' ? '' : await request.text();
    sent.push({ method: request.method, path, body: text ? JSON.parse(text) : undefined });
    const key = `${request.method} ${path}`;
    const queued = answers[key];
    const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (statusCode: number, code: string, message: string) => ({
  status: statusCode,
  body: { statusCode, message, data: null, reason: { code, message } },
});

const PAYOUT = '/api/hub/money/payout-account';
const BANKS = '/api/hub/money/banks';
const NAME = '/api/hub/money/banks/name-check';

const saved = {
  bankCode: '000013',
  bankName: 'GTBANK PLC',
  accountNumber: '0123456789',
  accountName: 'SIMI MICHELLE',
  matchesBvnName: true,
  updatedAt: '2026-10-03T11:35:39.000Z',
};
const bankList = [
  { code: '000013', name: 'GTBANK PLC' },
  { code: '000014', name: 'ACCESS BANK' },
];

// openapi-fetch keeps the fetch it was created with, so the stand-in is in place before the client loads.
installFetch();
const { PayoutAccountScreen } = require('../PayoutAccountScreen') as typeof import('../PayoutAccountScreen');
const api = require('../api/payoutAccount') as typeof import('../api/payoutAccount');
const { ApiError } = require('@/api/errors') as typeof import('@/api/errors');

async function boot(onSaved?: jest.Mock) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const onBack = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <PayoutAccountScreen onBack={onBack} onSaved={onSaved} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { onBack };
}

beforeEach(() => {
  answers = {};
  sent = [];
});

describe('A21 · Payout bank', () => {
  it('a user with nothing saved can choose a bank, enter the number, see the bank’s name, save, and see it matches their BVN', async () => {
    const onSaved = jest.fn();
    answers = {
      [`GET ${PAYOUT}`]: ok(null),
      [`GET ${BANKS}`]: ok(bankList),
      [`POST ${NAME}`]: ok({ bankCode: '000014', bankName: 'ACCESS BANK', accountNumber: '0987654321', accountName: 'LENNOX EMMANUEL' }),
      [`PUT ${PAYOUT}`]: ok({ ...saved, bankCode: '000014', bankName: 'ACCESS BANK', accountNumber: '0987654321', accountName: 'LENNOX EMMANUEL', matchesBvnName: true }),
    };
    await boot(onSaved);
    await screen.findByText('Choose your bank');
    expect(screen.getByTestId('payout-save')).toBeDisabled();

    await fireEvent.press(screen.getByTestId('payout-bank'));
    await fireEvent.press(await screen.findByTestId('bank-000014'));
    await fireEvent.changeText(screen.getByTestId('payout-number'), '0987 654 321');
    expect(await screen.findByText('LENNOX EMMANUEL')).toBeTruthy();
    expect(screen.queryByText(/matches your BVN/)).toBeNull();
    expect(sent.find((s) => s.method === 'POST')?.body).toEqual({ bankCode: '000014', accountNumber: '0987654321' });

    await fireEvent.press(screen.getByTestId('payout-save'));
    expect(await screen.findByText('LENNOX EMMANUEL · matches your BVN')).toBeTruthy();
    const put = sent.find((s) => s.method === 'PUT');
    // Only the bank code and number go up: the name is always the bank's.
    expect(put?.body).toEqual({ bankCode: '000014', accountNumber: '0987654321' });
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ accountName: 'LENNOX EMMANUEL', matchesBvnName: true }));
    expect(screen.getByTestId('payout-save')).toBeDisabled();
  });

  it('a user with a saved account sees it as the server keeps it, and is not asked to check it again', async () => {
    answers = { [`GET ${PAYOUT}`]: ok(saved) };
    await boot();
    expect(await screen.findByText('SIMI MICHELLE · matches your BVN')).toBeTruthy();
    expect(screen.getByText('GTBANK PLC')).toBeTruthy();
    expect(screen.getByTestId('payout-number').props.value).toBe('0123456789');
    expect(screen.getByTestId('payout-save')).toBeDisabled();
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual([`GET ${PAYOUT}`]);
  });

  it('a user whose account is not in their BVN name sees it flagged, never "matches"', async () => {
    answers = { [`GET ${PAYOUT}`]: ok({ ...saved, matchesBvnName: false }) };
    await boot();
    expect(await screen.findByText('SIMI MICHELLE · not the name on your BVN')).toBeTruthy();
    expect(screen.queryByText(/matches your BVN/)).toBeNull();
  });

  it('with nothing to compare (null), the name shows with no BVN claim either way', async () => {
    answers = { [`GET ${PAYOUT}`]: ok({ ...saved, matchesBvnName: null }) };
    await boot();
    expect(await screen.findByText('SIMI MICHELLE')).toBeTruthy();
    expect(screen.queryByText(/BVN/)).toBeNull();
  });

  it('a user with no wallet is told to open one first; one still opening can check again', async () => {
    answers = { [`GET ${PAYOUT}`]: refusal(409, 'wallet_not_open', 'Open your wallet first.') };
    await boot();
    expect(await screen.findByTestId('payout-no-wallet')).toBeTruthy();
    expect(screen.queryByTestId('payout-save')).toBeNull();

    answers = { [`GET ${PAYOUT}`]: [refusal(409, 'wallet_opening', 'Opening.'), ok(null)] };
    sent = [];
    await boot();
    expect(await screen.findByTestId('payout-opening')).toBeTruthy();
    await fireEvent.press(screen.getByText('Check again'));
    expect(await screen.findByTestId('payout-form')).toBeTruthy();
  });

  it('a load that fails shows the error with Try again, which reads the account again', async () => {
    answers = { [`GET ${PAYOUT}`]: ['offline', ok(saved)] };
    await boot();
    expect(await screen.findByTestId('payout-error')).toBeTruthy();
    expect(screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('SIMI MICHELLE · matches your BVN')).toBeTruthy();
  });

  it('an account the bank does not confirm is refused on the field, and Save stays shut', async () => {
    answers = {
      [`GET ${PAYOUT}`]: ok(saved),
      [`POST ${NAME}`]: refusal(422, 'name_check_failed', 'We could not confirm that account. Check the bank and the account number.'),
    };
    await boot();
    await screen.findByText('SIMI MICHELLE · matches your BVN');
    await fireEvent.changeText(screen.getByTestId('payout-number'), '0123456788');
    expect(await screen.findByText('We could not confirm that account. Check the bank and the account number.')).toBeTruthy();
    expect(screen.getByTestId('payout-save')).toBeDisabled();
    // Changing back to the saved number needs no check and shows the saved answer again.
    await fireEvent.changeText(screen.getByTestId('payout-number'), '0123456789');
    expect(await screen.findByText('SIMI MICHELLE · matches your BVN')).toBeTruthy();
  });

  it('when the bank cannot be asked before saving, Save stays open and the server checks it then', async () => {
    answers = {
      [`GET ${PAYOUT}`]: ok(saved),
      [`POST ${NAME}`]: { status: 404, body: { statusCode: 404, message: 'Cannot POST', data: null } },
      [`PUT ${PAYOUT}`]: ok({ ...saved, accountNumber: '0123456788', accountName: 'ADA OKORO', matchesBvnName: false }),
    };
    await boot();
    await screen.findByText('SIMI MICHELLE · matches your BVN');
    await fireEvent.changeText(screen.getByTestId('payout-number'), '0123456788');
    expect(await screen.findByText('We could not check the name now. Saving checks it with the bank.')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('payout-save')).not.toBeDisabled());
    await fireEvent.press(screen.getByTestId('payout-save'));
    expect(await screen.findByText('ADA OKORO · not the name on your BVN')).toBeTruthy();
  });

  it('a save the bank refuses says so on the field; a save the bank cannot answer says so above the button', async () => {
    answers = {
      [`GET ${PAYOUT}`]: ok(saved),
      [`POST ${NAME}`]: ok({ bankCode: '000013', bankName: 'GTBANK PLC', accountNumber: '0123456788', accountName: 'ADA OKORO' }),
      [`PUT ${PAYOUT}`]: [
        refusal(503, 'provider_unreachable', 'We could not reach the bank right now. Try again in a moment.'),
        refusal(422, 'name_check_failed', 'We could not confirm that account. Check the bank and the account number.'),
      ],
    };
    await boot();
    await screen.findByText('SIMI MICHELLE · matches your BVN');
    await fireEvent.changeText(screen.getByTestId('payout-number'), '0123456788');
    await screen.findByText('ADA OKORO');
    await fireEvent.press(screen.getByTestId('payout-save'));
    expect(await screen.findByTestId('payout-save-error')).toBeTruthy();
    expect(screen.getByText('We could not reach the bank right now. Try again in a moment.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('payout-save'));
    expect(await screen.findByText('We could not confirm that account. Check the bank and the account number.')).toBeTruthy();
    expect(screen.queryByTestId('payout-save-error')).toBeNull();
    expect(screen.getByTestId('payout-save')).toBeDisabled();
  });

  it('a save answered "no wallet" reads the account again and shows why', async () => {
    answers = {
      [`GET ${PAYOUT}`]: [ok(saved), refusal(409, 'wallet_not_open', 'Open your wallet first.')],
      [`POST ${NAME}`]: ok({ bankCode: '000013', bankName: 'GTBANK PLC', accountNumber: '0123456788', accountName: 'ADA OKORO' }),
      [`PUT ${PAYOUT}`]: refusal(409, 'wallet_not_open', 'Open your wallet first.'),
    };
    await boot();
    await screen.findByText('SIMI MICHELLE · matches your BVN');
    await fireEvent.changeText(screen.getByTestId('payout-number'), '0123456788');
    await screen.findByText('ADA OKORO');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('payout-save'));
    });
    expect(await screen.findByTestId('payout-no-wallet')).toBeTruthy();
  });

  it('the bank list shows its loading, error with Try again, and no-match states', async () => {
    answers = { [`GET ${PAYOUT}`]: ok(null), [`GET ${BANKS}`]: [refusal(503, 'provider_unreachable', 'We could not reach the bank right now. Try again in a moment.'), ok(bankList)] };
    await boot();
    await screen.findByText('Choose your bank');
    await fireEvent.press(screen.getByTestId('payout-bank'));
    expect(await screen.findByTestId('bank-sheet-error')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('bank-000013')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('bank-sheet-search'), 'zenith');
    expect(await screen.findByTestId('bank-sheet-no-match')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('bank-sheet-search'), 'access');
    expect(await screen.findByTestId('bank-000014')).toBeTruthy();
    expect(screen.queryByTestId('bank-000013')).toBeNull();
  });
});

describe('A21 calls', () => {
  it('an answer that is not a payout account is refused, never shown', async () => {
    for (const data of [{}, { ...saved, accountName: '' }, { ...saved, matchesBvnName: 'yes' }]) {
      answers = { [`GET ${PAYOUT}`]: ok(data) };
      await expect(api.fetchPayoutAccount()).rejects.toMatchObject({ kind: 'unknown' });
    }
    answers = { [`GET ${PAYOUT}`]: ok(null) };
    await expect(api.fetchPayoutAccount()).resolves.toBeNull();
  });

  it('bank rows without a code or a name are dropped; a name check for another number is refused', async () => {
    answers = { [`GET ${BANKS}`]: ok([{ code: '000013', name: 'GTBANK PLC' }, { code: '', name: 'X' }, { name: 'Y' }, null]) };
    await expect(api.fetchBanks()).resolves.toEqual([{ code: '000013', name: 'GTBANK PLC' }]);
    answers = { [`POST ${NAME}`]: ok({ bankCode: '000013', bankName: 'GTBANK PLC', accountNumber: '9999999999', accountName: 'SOMEONE' }) };
    await expect(api.checkAccountName({ bankCode: '000013', accountNumber: '0123456789' })).rejects.toMatchObject({ kind: 'unknown' });
  });

  it('each refusal maps to the state the screen shows', () => {
    expect(api.payoutProblem(new ApiError('conflict', 409, 'x', 'wallet_not_open'))).toBe('no_wallet');
    expect(api.payoutProblem(new ApiError('conflict', 409, 'x', 'wallet_opening'))).toBe('opening');
    expect(api.payoutProblem(new ApiError('server', 503, 'x', 'provider_unreachable'))).toBe('other');
    expect(api.payoutProblem(new Error('x'))).toBe('other');
    expect(api.isUnconfirmedAccount(new ApiError('validation', 422, 'x', 'name_check_failed'))).toBe(true);
    expect(api.isUnconfirmedAccount(new ApiError('validation', 400, 'x'))).toBe(false);
    // A framework message (a route the Hub does not serve) is never shown; a money sentence and a lost connection are.
    expect(api.failureMessage(new ApiError('not_found', 404, 'Cannot GET /api/hub/money/banks'))).toBe('Something went wrong. Try again.');
    expect(api.failureMessage(new ApiError('server', 503, 'We could not reach the bank right now.', 'provider_unreachable'))).toBe('We could not reach the bank right now.');
    expect(api.failureMessage(new ApiError('network', 0, 'No connection. Check your internet and try again.'))).toBe('No connection. Check your internet and try again.');
  });
});
