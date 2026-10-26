import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { clearPaySource, paySourceCode, setPaySourceDefaults } from '@/api/paySource';
import type { PaymentQuote } from '@/features/events/buyApi';

import { usePaySource } from '../usePaySource';

/**
 * PAY-FX (R-91): the one hook every caller of the pay sheet uses. The naira wallet pays when it holds enough; when it does not, the
 * person's main currency pays and the others are offered; a person with only a naira wallet gets nothing here and today's sheet.
 */

const mockAccounts = jest.fn();
jest.mock('@/features/wallet/world/api', () => ({
  WORLD_ACCOUNTS_KEY: ['money', 'world-accounts'],
  fetchWorldAccounts: () => mockAccounts(),
}));
jest.mock('@/features/wallet/api/home', () => ({ fetchWalletHome: jest.fn() }));

const account = (currency: string) => ({ id: currency, currency, status: 'open', decimals: 2, availableMinor: 500, chain: null });

const naira = (shortfallKobo: number): PaymentQuote =>
  ({
    priceKobo: 30000,
    totalKobo: 30000,
    balanceKobo: 10000,
    shortfallKobo,
    fee: { providerFeeKobo: 0, wawuFeeKobo: 0, totalFeeKobo: 0 },
    quoteToken: 't',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  }) as PaymentQuote;

const dollars = (expiresInMs = 60000): PaymentQuote =>
  ({
    ...naira(0),
    balanceKobo: null,
    shortfallKobo: null,
    source: {
      currency: 'USD',
      decimals: 2,
      amountMinor: 23,
      providerFeeMinor: 0,
      wawuFeeMinor: 0,
      totalMinor: 23,
      rate: '1315.44',
      availableMinor: 500,
      shortfallMinor: 0,
      expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    },
  }) as PaymentQuote;

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrap({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  clearPaySource();
  mockAccounts.mockReset();
});

describe('usePaySource', () => {
  it('gives a person with only a naira wallet nothing: the sheet is the one they have always had', async () => {
    mockAccounts.mockResolvedValue([]);
    const requote = jest.fn();
    const { result } = await renderHook(() => usePaySource({ payment: naira(0), open: true, requote }), { wrapper: wrapper() });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    // Round 3 (F5): the other accounts are not even asked for when the naira wallet covers the payment.
    expect(mockAccounts).not.toHaveBeenCalled();
    expect(result.current).toBeUndefined();
    expect(requote).not.toHaveBeenCalled();
    expect(paySourceCode()).toBeNull();
  });

  it('naira that holds enough pays: nothing is switched', async () => {
    mockAccounts.mockResolvedValue([account('USD')]);
    const requote = jest.fn();
    await renderHook(() => usePaySource({ payment: naira(0), open: true, requote }), { wrapper: wrapper() });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(mockAccounts).not.toHaveBeenCalled();
    expect(paySourceCode()).toBeNull();
    expect(requote).not.toHaveBeenCalled();
  });

  it('asks for the other accounts only when another could matter: no naira wallet, or the naira wallet is short', async () => {
    mockAccounts.mockResolvedValue([account('USD')]);
    setPaySourceDefaults({ fallback: 'USD', hasNaira: false });
    await renderHook(() => usePaySource({ payment: dollars(), open: true, requote: jest.fn() }), { wrapper: wrapper() });
    await waitFor(() => expect(mockAccounts).toHaveBeenCalledTimes(1));
    clearPaySource();
    mockAccounts.mockClear();
    await renderHook(() => usePaySource({ payment: naira(20000), open: true, requote: jest.fn() }), { wrapper: wrapper() });
    await waitFor(() => expect(mockAccounts).toHaveBeenCalledTimes(1));
  });

  it('naira that does not hold enough: the main currency pays, and the quote is asked again against it', async () => {
    mockAccounts.mockResolvedValue([account('USD'), account('GBP')]);
    const requote = jest.fn();
    setPaySourceDefaults({ fallback: null, hasNaira: true });
    await renderHook(() => usePaySource({ payment: naira(20000), open: true, requote }), { wrapper: wrapper() });
    await waitFor(() => expect(paySourceCode()).toBe('USD'));
    await waitFor(() => expect(requote).toHaveBeenCalledTimes(1));
  });

  it('draws the firm amount from the quote, names the account, and offers the naira wallet and the other account', async () => {
    mockAccounts.mockResolvedValue([account('USD'), account('GBP')]);
    setPaySourceDefaults({ fallback: 'USD', hasNaira: true });
    const { result } = await renderHook(() => usePaySource({ payment: dollars(), open: true, requote: jest.fn() }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current?.choices?.length).toBe(3));
    expect(result.current).toMatchObject({ currency: 'USD', accountName: 'USD account', amountMinor: 23, decimals: 2, availableMinor: 500, expired: false });
    expect(result.current?.choices?.map((c) => `${c.id}:${c.selected}`)).toEqual(['NGN:false', 'USD:true', 'GBP:false']);
  });

  it('choosing another account names it to the Hub and asks the quote again', async () => {
    mockAccounts.mockResolvedValue([account('USD'), account('GBP')]);
    setPaySourceDefaults({ fallback: 'USD', hasNaira: true });
    const requote = jest.fn();
    const { result } = await renderHook(() => usePaySource({ payment: dollars(), open: true, requote }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current?.choices?.length).toBe(3));
    await act(async () => result.current?.onChoose?.('GBP'));
    expect(paySourceCode()).toBe('GBP');
    await waitFor(() => expect(requote).toHaveBeenCalled());
  });

  it('a firm quote past its expiry is expired, and the sheet asks for a new one', async () => {
    mockAccounts.mockResolvedValue([account('USD')]);
    setPaySourceDefaults({ fallback: 'USD', hasNaira: false });
    const requote = jest.fn();
    const payment = dollars(30);
    const { result } = await renderHook(() => usePaySource({ payment, open: true, requote }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current?.expired).toBe(true));
    await act(async () => result.current?.onRefresh());
    expect(requote).toHaveBeenCalled();
  });

  it('closing the sheet returns to the default, and a session end forgets everything', async () => {
    mockAccounts.mockResolvedValue([account('USD')]);
    setPaySourceDefaults({ fallback: null, hasNaira: true });
    const { rerender } = await renderHook((p: { open: boolean }) => usePaySource({ payment: dollars(), open: p.open, requote: jest.fn() }), {
      wrapper: wrapper(),
      initialProps: { open: true },
    });
    await act(async () => {
      const { choosePaySource } = jest.requireActual('@/api/paySource');
      choosePaySource('USD');
    });
    expect(paySourceCode()).toBe('USD');
    await rerender({ open: false });
    expect(paySourceCode()).toBeNull();
    clearPaySource();
    expect(paySourceCode()).toBeNull();
  });
});
