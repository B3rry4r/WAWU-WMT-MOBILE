/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ADDRESS, fxFetch, hub, OUTSIDE, resetFxHub, SEND_ID, SWAP_ID, usdcAccount, USDT_ID } from '../fx/testing/fxHub';

/*
 * WALLET-21: W22 (Receive), W23 (Send) and the receipt, against the Hub's stand-in `fetch`. The coins and networks are the Hub's, the
 * address is the Hub's, and the provider's refusals are drawn as the plain refusals they are.
 */
const mockVault = new Map<string, string>();
const mockCopied: string[] = [];
let mockPasted = '';
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }), useIsFocused: () => true }));
jest.mock('@/features/open-wallet/copy', () => ({
  copyText: jest.fn(async (value: string) => {
    mockCopied.push(value);
    return true;
  }),
}));
jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn(async () => mockPasted), setStringAsync: jest.fn(async () => true) }));

const OWNER = '00000000-0000-4000-8000-0000000000f1';
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const fx = await fxFetch(request, path);
  if (fx) return fx;
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const { fireEvent, waitFor } = rtl;
const frame = (node: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>
);
const patient = { timeout: 4000 };
const pin = async (digits: string) => {
  for (const d of digits) await fireEvent.press(rtl.screen.getAllByRole('button', { name: d }).at(-1) as never);
};

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  resetFxHub();
  mockCopied.length = 0;
  mockPasted = '';
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
  (require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts')).forgetAttempts();
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

async function receive(coin?: string) {
  const { ReceiveScreen } = require('../fx/ReceiveScreen') as typeof import('../fx/ReceiveScreen');
  await rtl.render(frame(<ReceiveScreen coin={coin} onBack={jest.fn()} />));
}

describe('W22 · Crypto · receive', () => {
  it('draws the coins and networks the Hub serves (no BTC, no sample network), the address with its QR and Copy, and the warning', async () => {
    await receive();
    expect(await rtl.screen.findByTestId('receive-address', {}, patient)).toBeTruthy();
    expect(rtl.screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual(['USDT', 'USDC']);
    expect(rtl.screen.getAllByRole('radio').map((t) => t.props.accessibilityLabel)).toEqual(['Ethereum', 'Base', 'Polygon', 'Solana']);
    expect(rtl.screen.getByTestId('receive-address').props.children).toBe(ADDRESS);
    expect(rtl.screen.getByTestId('receive-qr')).toBeTruthy();
    expect(rtl.screen.getByText('Send only USDT on Ethereum')).toBeTruthy();
    expect(rtl.screen.queryByText(/BTC|TRC-20|BEP-20|minimum/i)).toBeNull();
    await fireEvent.press(rtl.screen.getByTestId('receive-copy'));
    expect(mockCopied).toEqual([ADDRESS]);
  });

  it('opens an account on a network the person has none on, and says the address is on its way', async () => {
    await receive();
    await rtl.screen.findByTestId('receive-address', {}, patient);
    await fireEvent.press(rtl.screen.getByTestId('receive-chain-base'));
    await fireEvent.press(await rtl.screen.findByRole('button', { name: 'Get my address' }));
    await waitFor(() => expect(hub.opened).toEqual([{ currency: 'USDT', chain: 'base' }]));
    expect(await rtl.screen.findByTestId('receive-pending', {}, patient)).toBeTruthy();
  });

  it('shows an account that is still opening as on its way, never an address it does not have', async () => {
    await receive('USDC');
    await fireEvent.press(await rtl.screen.findByTestId('receive-chain-base', {}, patient));
    expect(await rtl.screen.findByTestId('receive-pending')).toBeTruthy();
    expect(rtl.screen.queryByTestId('receive-qr')).toBeNull();
  });

  it('L1: an address that is pending or not available says so with the Hub\u2019s words, and never promises one is coming', async () => {
    await receive('USDC');
    await fireEvent.press(await rtl.screen.findByTestId('receive-chain-base', {}, patient));
    expect(await rtl.screen.findByText('Your address is pending')).toBeTruthy();
    expect(rtl.screen.queryByText(/on its way|short while/i)).toBeNull();
    await rtl.cleanup();
    const note = 'One of our partner services is temporarily unavailable. Please try again in a few minutes.';
    hub.accounts = hub.accounts.map((a) => (a.id === usdcAccount.id ? { ...a, detailsStatus: 'unavailable', detailsNote: note } : a));
    const { queryClient } = require('@/api/query') as typeof import('@/api/query');
    queryClient.clear();
    await receive('USDC');
    await fireEvent.press(await rtl.screen.findByTestId('receive-chain-base', {}, patient));
    expect(await rtl.screen.findByText('Your address is not available right now')).toBeTruthy();
    expect(rtl.screen.getByText(note)).toBeTruthy();
    expect(rtl.screen.queryByText(/on its way|short while/i)).toBeNull();
    expect(rtl.screen.queryByTestId('receive-qr')).toBeNull();
  });

  it('says a network is not available, and offers nothing, when opening is switched off', async () => {
    hub.currencies = { ...hub.currencies, products: { ...hub.currencies.products, openAccount: false } };
    await receive();
    await fireEvent.press(await rtl.screen.findByTestId('receive-chain-sol', {}, patient));
    expect(await rtl.screen.findByTestId('receive-off')).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: 'Get my address' })).toBeNull();
  });

  it('says why when the accounts could not be read, and reads them again on request', async () => {
    hub.accountsFault = { status: 503, code: 'provider_unreachable', message: 'We could not reach your account.' };
    await receive();
    expect(await rtl.screen.findByText('We couldn’t reach your account', {}, patient)).toBeTruthy();
    hub.accountsFault = null;
    await fireEvent.press(rtl.screen.getByRole('button', { name: /Try again/ }));
    expect(await rtl.screen.findByTestId('receive-address', {}, patient)).toBeTruthy();
  });
});

const sent = jest.fn();
async function send() {
  const { CryptoSendScreen } = require('../fx/CryptoSendScreen') as typeof import('../fx/CryptoSendScreen');
  await rtl.render(frame(<CryptoSendScreen onBack={jest.fn()} onSent={sent} onForgotPin={jest.fn()} onSetPin={jest.fn()} />));
  await rtl.screen.findByTestId('crypto-send-address', {}, patient);
}
const fill = async (address = OUTSIDE, amount = '120') => {
  await fireEvent.changeText(rtl.screen.getByTestId('crypto-send-address'), address);
  await fireEvent.changeText(rtl.screen.getByTestId('crypto-send-amount'), amount);
  await rtl.screen.findByText('Shown on your receipt', {}, patient);
};

describe('W23 · Crypto · send', () => {
  beforeEach(() => sent.mockReset());

  it('asks for the fees of this amount on this network, adds them on top, and names the network fee only when the Hub can', async () => {
    await send();
    await fill();
    expect(hub.sendQuotes).toEqual([`?accountId=${USDT_ID}&currency=USDT&chain=eth&amountMinor=12000`]);
    expect(rtl.screen.getByText('No fee')).toBeTruthy();
    expect(rtl.screen.getByText('120.00 USDT + network fee')).toBeTruthy();
    expect([rtl.screen.getByTestId('crypto-send-balance').props.children].flat().join('')).toBe('Balance 320.00 USDT');
    expect(rtl.screen.queryByText(/Arrives|About 2 minutes|TRC-20/)).toBeNull();
    expect(rtl.screen.getByTestId('crypto-send-review').props.accessibilityState.disabled).toBe(false);
  });

  it('Max puts the whole balance in the amount; more than the balance is over it and cannot be reviewed', async () => {
    await send();
    await fireEvent.press(await rtl.screen.findByTestId('crypto-send-max'));
    expect(rtl.screen.getByTestId('crypto-send-amount').props.value).toBe('320');
    await fireEvent.changeText(rtl.screen.getByTestId('crypto-send-amount'), '321');
    expect(await rtl.screen.findByText(/Over your balance of 320.00 USDT/)).toBeTruthy();
    expect(rtl.screen.getByTestId('crypto-send-review').props.accessibilityState.disabled).toBe(true);
  });

  it('Paste takes the address from the clipboard; an address that cannot be one is said so and blocks Review', async () => {
    await send();
    mockPasted = OUTSIDE;
    await fireEvent.press(rtl.screen.getByTestId('crypto-send-paste'));
    await waitFor(() => expect(rtl.screen.getByTestId('crypto-send-address').props.value).toBe(OUTSIDE));
    await fireEvent.changeText(rtl.screen.getByTestId('crypto-send-address'), 'abc');
    expect(await rtl.screen.findByTestId('crypto-send-address-note')).toBeTruthy();
    await fireEvent.changeText(rtl.screen.getByTestId('crypto-send-amount'), '10');
    expect(rtl.screen.getByTestId('crypto-send-review').props.accessibilityState.disabled).toBe(true);
  });

  it('a wrong PIN uses no new key; the right PIN sends with the SAME key, the amount in the coin\'s own unit, and hands on the send', async () => {
    hub.wrongPinFirst = true;
    await send();
    await fill();
    await fireEvent.press(rtl.screen.getByTestId('crypto-send-review'));
    expect(rtl.screen.getByTestId('crypto-send-review-title').props.children.join('')).toBe('Send 120.00 USDT');
    await fireEvent.press(rtl.screen.getByTestId('crypto-send-confirm'));
    expect(await rtl.screen.findByText(/^Approve sending 120.00 USDT to 0x5290/)).toBeTruthy();
    await pin('1111');
    expect(await rtl.screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    await pin('1234');
    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[1]?.key).toBe(hub.sends[0]?.key);
    expect(hub.sends.map((s) => s.pin)).toEqual(['1111', '1234']);
    expect(hub.sends[0]?.body).toEqual({ accountId: USDT_ID, currency: 'USDT', chain: 'eth', address: OUTSIDE, amountMinor: 12_000 });
    expect(sent.mock.calls[0]?.[0]).toMatchObject({ id: SEND_ID, status: 'completed' });
  });

  it('draws the provider\'s refusal, in its own words, as the plain refusal it is: nothing hidden, nothing faked', async () => {
    hub.sendMode = 'declined';
    await send();
    await fill();
    await fireEvent.press(rtl.screen.getByTestId('crypto-send-review'));
    await fireEvent.press(rtl.screen.getByTestId('crypto-send-confirm'));
    await rtl.screen.findByText(/^Approve sending/);
    await pin('1234');
    expect(await rtl.screen.findByText('This send was not taken', {}, patient)).toBeTruthy();
    expect(rtl.screen.getByText('Nuvion cannot send USDT on dev.')).toBeTruthy();
    expect(sent).not.toHaveBeenCalled();
  });

  it('draws only the networks the person holds an open account on', async () => {
    await send();
    expect(rtl.screen.getAllByRole('radio').map((t) => t.props.accessibilityLabel)).toEqual(['Ethereum']);
  });
});

describe('W12 · the receipt of a swap and of a send', () => {
  const receipt = async (kind: 'swap' | 'send', id: string) => {
    const { FxReceiptScreen } = require('../fx/FxReceiptScreen') as typeof import('../fx/FxReceiptScreen');
    await rtl.render(frame(<FxReceiptScreen kind={kind} id={id} onDone={jest.fn()} />));
  };
  it('a send is read by its id: its status, its rows in the coin\'s places, and a Share', async () => {
    await receipt('send', SEND_ID);
    expect(await rtl.screen.findByTestId('fx-receipt-status', {}, patient)).toBeTruthy();
    expect(rtl.screen.getByText('Completed')).toBeTruthy();
    expect(rtl.screen.getByTestId('fx-receipt-network').props.children).toBeTruthy();
    expect(rtl.screen.getByText('Ethereum')).toBeTruthy();
    expect(rtl.screen.getByTestId('fx-receipt-amount')).toHaveTextContent(/120\.00 USDT$/);
    expect(rtl.screen.getByLabelText('120 point 0 0 Tether')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Share receipt' })).toBeTruthy();
  });

  it('a swap is read by its id with its rate and both amounts', async () => {
    hub.quotes = [{ fromCurrency: 'NGN', toCurrency: 'USD', amountFromMinor: 15_800_000, amountToMinor: 10_000, fromDecimals: 2, toDecimals: 2, rate: String(100 / 158_000), wawuFeeMinor: 0 }];
    await receipt('swap', SWAP_ID);
    expect(await rtl.screen.findByText('$1 = ₦1,580.00', {}, patient)).toBeTruthy();
    expect(rtl.screen.getByTestId('fx-receipt-got')).toHaveTextContent(/\$100\.00$/);
    expect(rtl.screen.getByTestId('fx-receipt-gave')).toHaveTextContent(/₦158,000\.00$/);
    expect(rtl.screen.getByLabelText('100 point 0 0 Dollar')).toBeTruthy();
  });

  it('says it could not find a receipt, by its cause', async () => {
    await receipt('send', 'nope');
    expect(await rtl.screen.findByTestId('fx-receipt-missing', {}, patient)).toBeTruthy();
  });
});
