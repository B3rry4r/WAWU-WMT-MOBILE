/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fxFetch, hub, resetFxHub, SWAP_ID, USD_ID } from '../fx/testing/fxHub';

/*
 * WALLET-21: W20 (Swap), W21 (its review) and W11 (the PIN sheet) against the Hub's stand-in `fetch`. A quote is asked for once typing
 * stops, its hold counts down from the quote's own `expiresAt`, and one Idempotency-Key per swap travels again, unchanged, on a wrong
 * PIN and on a request that got no answer, so the swap happens once.
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
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }), useIsFocused: () => true }));

const OWNER = '00000000-0000-4000-8000-0000000000f1';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const fx = await fxFetch(request, path);
  if (fx) return fx;
  if (path === '/money/wallet/balance') return ok({ availableKobo: 48_525_075, asOf: '2026-10-07T09:00:00.000Z' });
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

const swapped = jest.fn();
async function boot(props: { from?: string; to?: string } = { from: 'NGN', to: 'USD' }) {
  const { SwapScreen } = require('../fx/swap/SwapScreen') as typeof import('../fx/swap/SwapScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <SwapScreen {...props} onBack={jest.fn()} onSwapped={swapped} onForgotPin={jest.fn()} onSetPin={jest.fn()} />
    </SafeAreaProvider>,
  );
}
const { fireEvent, waitFor } = rtl;
const key = async (digits: string) => {
  for (const d of digits) await fireEvent.press(await rtl.screen.findByTestId(`amount-key-${d === '.' ? 'point' : d}`));
};
/** The PIN sheet is the last modal on screen: its keys come after the amount keypad's. */
const pin = async (digits: string) => {
  for (const d of digits) await fireEvent.press(rtl.screen.getAllByRole('button', { name: d }).at(-1) as never);
};
const patient = { timeout: 4000 };
async function toReview(keys = '158000') {
  await boot();
  await rtl.screen.findByTestId('swap-from', {}, patient);
  await key(keys);
  await rtl.screen.findByText('$1 = ₦1,580.00', {}, patient);
  await fireEvent.press(rtl.screen.getByTestId('swap-review'));
  await rtl.screen.findByTestId('swap-review-sheet');
}

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  resetFxHub();
  swapped.mockReset();
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

describe('W20 · Swap', () => {
  it('starts on what the route names, shows both balances from the Hub, and asks for no rate until an amount is typed', async () => {
    await boot();
    expect(await rtl.screen.findByTestId('swap-from', {}, patient)).toBeTruthy();
    expect(rtl.screen.getByText('You swap')).toBeTruthy();
    expect(rtl.screen.getByText('You get')).toBeTruthy();
    expect(rtl.screen.getByTestId('swap-from-balance').props.children.join('')).toBe('Balance ₦485,250.75');
    expect(rtl.screen.getByTestId('swap-to-balance').props.children.join('')).toBe('Balance $1,240.50');
    expect(rtl.screen.getByTestId('swap-review').props.accessibilityState.disabled).toBe(true);
    expect(hub.quotes).toHaveLength(0);
  });

  it('asks the Hub for a rate once typing stops, for the account chosen, and shows the rate, the hold and the fee it names', async () => {
    await boot();
    await rtl.screen.findByTestId('swap-from', {}, patient);
    await key('158000');
    expect(await rtl.screen.findByText('$1 = ₦1,580.00', {}, patient)).toBeTruthy();
    expect(hub.quotes).toHaveLength(1);
    expect(hub.quotes[0]).toMatchObject({ fromCurrency: 'NGN', toCurrency: 'USD', toAccountId: USD_ID, amountFromMinor: 15_800_000, amountToMinor: 10_000 });
    expect(rtl.screen.getByLabelText('100 point 0 0 Dollar')).toBeTruthy();
    expect(rtl.screen.getByTestId('swap-hold').props.accessibilityLabel).toMatch(/^Rate held for 1:(29|30)$/);
    // BRIEF rules 3 and 4: the fee is its parts and a total, even at zero; "No fee" is never drawn.
    expect(rtl.screen.getByTestId('swap-fee').props.children).toBe('₦0.00');
    expect(rtl.screen.getByTestId('swap-fee-split').props.children).toBe('Bank charge ₦0.00 + WAWU fee ₦0.00');
    expect(rtl.screen.queryByText(/No fee/)).toBeNull();
    expect(rtl.screen.getByTestId('swap-review').props.accessibilityState.disabled).toBe(false);
  });

  it('counts the hold from the quote\'s own expiry and asks for a new rate when it runs out', async () => {
    hub.quoteSeconds = 1;
    await boot();
    await rtl.screen.findByTestId('swap-from', {}, patient);
    await key('1000');
    await rtl.screen.findByText('$1 = ₦1,580.00', {}, patient);
    await waitFor(() => expect(hub.quotes.length).toBeGreaterThanOrEqual(2), { timeout: 6000 });
  });

  it('says an amount over the balance is over it, and asks for no rate', async () => {
    await boot();
    await rtl.screen.findByTestId('swap-from', {}, patient);
    await key('999999999');
    expect(await rtl.screen.findByText(/Over your balance of ₦485,250.75/)).toBeTruthy();
    expect(rtl.screen.getByTestId('swap-review').props.accessibilityState.disabled).toBe(true);
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    });
    expect(hub.quotes).toHaveLength(0);
  });

  it('draws the provider\'s refusal as the plain refusal it is, never a rate', async () => {
    hub.swapMode = 'declined';
    await boot();
    await rtl.screen.findByTestId('swap-from', {}, patient);
    await key('1000');
    expect(await rtl.screen.findByText('This swap was not offered', {}, patient)).toBeTruthy();
    // M-02: one plain sentence, never the provider's words (the double's refusal names Nuvion).
    expect(rtl.screen.getByText("We can't offer this swap right now. Try another amount or pair, or try again later.")).toBeTruthy();
    expect(rtl.screen.queryByText(/Nuvion|cannot swap this pair|endpoint/)).toBeNull();
    expect(rtl.screen.getByTestId('swap-review').props.accessibilityState.disabled).toBe(true);
  });

  it('swaps the two sides and lets either be picked from the accounts the person holds', async () => {
    await boot();
    await rtl.screen.findByTestId('swap-from', {}, patient);
    await fireEvent.press(rtl.screen.getByTestId('swap-flip'));
    expect(rtl.screen.getByTestId('swap-from-side').props.accessibilityLabel).toBe('You swap: Dollar. Change');
    await fireEvent.press(rtl.screen.getByTestId('swap-to-side'));
    expect(await rtl.screen.findByTestId('swap-pick-NGN')).toBeTruthy();
    expect(rtl.screen.getByTestId(`swap-pick-a0000000-0000-4000-8000-0000000000b1`)).toBeTruthy();
    // An account that is still opening cannot be swapped to or from.
    expect(rtl.screen.queryByTestId('swap-pick-a0000000-0000-4000-8000-0000000000c1')).toBeNull();
  });
});

describe('W21 · review, with W11 the PIN sheet', () => {
  it('reviews the quote: From, To, the rate with its hold, the fee as the Hub\'s breakdown, and the total on the button', async () => {
    await toReview();
    expect(rtl.screen.getByTestId('swap-review-title').props.children.join('')).toBe('Swap ₦158,000 for $100.00');
    expect(rtl.screen.getByTestId('swap-review-from').props.children).toBe('Naira wallet');
    expect(rtl.screen.getByTestId('swap-review-to').props.children).toBe('Dollar account');
    expect(rtl.screen.getByTestId('swap-review-rate').props.children).toBe('$1 = ₦1,580.00');
    expect(rtl.screen.getByText('Bank charge')).toBeTruthy();
    expect(rtl.screen.getByText('WAWU fee')).toBeTruthy();
    expect(rtl.screen.getByText('Fees')).toBeTruthy();
    expect(rtl.screen.getByTestId('swap-review-total').props.children).toBe('₦158,000.00');
    expect(rtl.screen.queryByText(/No fee|Nuvion/)).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Swap ₦158,000' })).toBeTruthy();
    await fireEvent.press(rtl.screen.getByTestId('swap-cancel'));
    await waitFor(() => expect(rtl.screen.queryByTestId('swap-review-sheet')).toBeNull());
    expect(hub.swaps).toHaveLength(0);
  });

  it('a wrong PIN says so and uses no new key; the right PIN swaps with the SAME key, against the quote held, once', async () => {
    hub.wrongPinFirst = true;
    await toReview();
    await fireEvent.press(rtl.screen.getByTestId('swap-confirm'));
    expect(await rtl.screen.findByText('Approve swapping ₦158,000 for $100.00')).toBeTruthy();
    await pin('1111');
    expect(await rtl.screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    await pin('1234');
    await waitFor(() => expect(swapped).toHaveBeenCalledTimes(1));
    expect(hub.swaps).toHaveLength(2);
    expect(hub.swaps[0]?.key).toBeTruthy();
    expect(hub.swaps[1]?.key).toBe(hub.swaps[0]?.key);
    expect(hub.swaps.map((s) => s.pin)).toEqual(['1111', '1234']);
    expect(hub.swaps[0]?.body).toEqual({ quoteId: hub.quotes[0]?.id });
    expect(hub.quotes).toHaveLength(1);
    expect(swapped.mock.calls[0]?.[0]).toMatchObject({ id: SWAP_ID, status: 'completed' });
  });

  it('a request that gets no answer asks for the PIN again and sends the same key, so the swap happens once', async () => {
    hub.swapMode = 'no_answer_first';
    await toReview();
    await fireEvent.press(rtl.screen.getByTestId('swap-confirm'));
    await rtl.screen.findByText('Approve swapping ₦158,000 for $100.00');
    await pin('1234');
    expect(await rtl.screen.findByText(/We didn't get an answer/, {}, patient)).toBeTruthy();
    expect(swapped).not.toHaveBeenCalled();
    await pin('1234');
    await waitFor(() => expect(swapped).toHaveBeenCalledTimes(1));
    expect(hub.swaps).toHaveLength(2);
    expect(hub.swaps[1]?.key).toBe(hub.swaps[0]?.key);
  });

  it('a rate that ran out closes the review, asks for a new rate and says so; nothing moved', async () => {
    hub.swapMode = 'expired';
    await toReview();
    await fireEvent.press(rtl.screen.getByTestId('swap-confirm'));
    await rtl.screen.findByText('Approve swapping ₦158,000 for $100.00');
    await pin('1234');
    expect(await rtl.screen.findByText('The rate ran out. Check the new one before you swap.', {}, patient)).toBeTruthy();
    await waitFor(() => expect(hub.quotes.length).toBeGreaterThanOrEqual(2), patient);
    expect(swapped).not.toHaveBeenCalled();
  });

  it('a swap the provider has not finished is handed on as pending, to be read by its id', async () => {
    hub.swapMode = 'pending';
    await toReview();
    await fireEvent.press(rtl.screen.getByTestId('swap-confirm'));
    await rtl.screen.findByText('Approve swapping ₦158,000 for $100.00');
    await pin('1234');
    await waitFor(() => expect(swapped).toHaveBeenCalledTimes(1));
    expect(swapped.mock.calls[0]?.[0]).toMatchObject({ status: 'pending' });
  });
});
