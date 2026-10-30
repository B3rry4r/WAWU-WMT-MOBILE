/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// A provider list as it really is: A to Z, the commercial banks under the CBN's three digits and the others under the NIBSS six, with look-alike
// names that a match on the name would take (a second "Access" and "Kuda", "OPay" spelled out in another bank's name).
const BANKS = [
  { code: '090270', name: 'AB Microfinance Bank' },
  { code: '044', name: 'Access Bank' },
  { code: '999900', name: 'Access Loans Microfinance Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '090267', name: 'Kuda Microfinance Bank' },
  { code: '999901', name: 'Kuda Lookalike Bank' },
  { code: '090405', name: 'Moniepoint Microfinance Bank' },
  { code: '100004', name: 'OPay Digital Services Limited' },
  { code: '100033', name: 'PalmPay Limited' },
  { code: '999902', name: 'OPay Pretender Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '057', name: 'Zenith Bank' },
];

let served: unknown = BANKS;
globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
  const request = input instanceof Request ? input : new Request(String(input));
  const path = new URL(request.url).pathname;
  if (path === '/api/hub/money/banks') return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: served }), { status: 200, headers: { 'content-type': 'application/json' } });
  return new Response('{}', { status: 404 });
}) as typeof fetch;

const { BankSheet } = require('../BankSheet') as typeof import('../BankSheet');
const { popularBanks } = require('../popularBanks') as typeof import('../popularBanks');

const frame = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } })}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

beforeEach(() => {
  served = BANKS;
});

describe('WALK-FIX M6 · the bank list leads with the popular banks', () => {
  it('matches by the provider\'s bank code, in the lead\'s order, and not by the words in a name', () => {
    expect(popularBanks(BANKS).map((b) => b.code)).toEqual(['100004', '100033', '090405', '090267', '058', '044', '057', '011', '033']);
    expect(popularBanks(BANKS).map((b) => b.name)).not.toContain('OPay Pretender Bank');
  });

  it('skips a bank the provider\'s list does not hold, and takes the provider\'s own name for the row', () => {
    const some = [
      { code: '058', name: 'GTBank (provider\'s own words)' },
      { code: '090267', name: 'Kuda Microfinance Bank' },
      { code: '999902', name: 'OPay Pretender Bank' },
    ];
    expect(popularBanks(some)).toEqual([
      { code: '090267', name: 'Kuda Microfinance Bank' },
      { code: '058', name: 'GTBank (provider\'s own words)' },
    ]);
    expect(popularBanks([])).toEqual([]);
  });

  it('a code is shown once even when two banks could claim it, and the NIBSS six-digit forms are known too', () => {
    const nibss = [
      { code: '000013', name: 'GTBank PLC' },
      { code: '000014', name: 'Access Bank' },
      { code: '000015', name: 'Zenith Bank' },
    ];
    expect(popularBanks(nibss).map((b) => b.code)).toEqual(['000013', '000014', '000015']);
  });

  it('the sheet shows Popular first (nine rows), then All banks A to Z with every bank, and Search is unchanged', async () => {
    const onPick = jest.fn();
    await render(frame(<BankSheet visible onClose={jest.fn()} selectedCode={null} onPick={onPick} />));
    await screen.findByTestId('bank-sheet-popular-label');
    // The list's own rows, in order: the heading, the nine, the second heading, then every bank A to Z (the window draws the first ten).
    const rows = screen.getByTestId('bank-sheet-list').props.data as { testID: string }[];
    const ids = rows.map((row) => row.testID);
    expect(ids.slice(0, 11)).toEqual([
      'bank-sheet-popular-label',
      'bank-popular-100004',
      'bank-popular-100033',
      'bank-popular-090405',
      'bank-popular-090267',
      'bank-popular-058',
      'bank-popular-044',
      'bank-popular-057',
      'bank-popular-011',
      'bank-popular-033',
      'bank-sheet-all-label',
    ]);
    expect(ids.slice(11)).toEqual(BANKS.map((b) => `bank-${b.code}`));
    expect(screen.getByTestId('bank-sheet-popular-label')).toBeTruthy();
    expect(screen.getByTestId('bank-popular-033')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('bank-popular-100004'));
    expect(onPick).toHaveBeenCalledWith({ code: '100004', name: 'OPay Digital Services Limited' });
    await fireEvent.changeText(screen.getByTestId('bank-sheet-search'), 'opay');
    expect(screen.queryByTestId('bank-sheet-popular-label')).toBeNull();
    expect(screen.queryByTestId('bank-popular-100004')).toBeNull();
    expect(screen.getByTestId('bank-100004')).toBeTruthy();
    expect(screen.getByTestId('bank-999902')).toBeTruthy();
  });

  it('a list with none of the nine draws no Popular heading', async () => {
    served = [{ code: '090270', name: 'AB Microfinance Bank' }];
    await render(frame(<BankSheet visible onClose={jest.fn()} selectedCode={null} onPick={jest.fn()} />));
    await screen.findByTestId('bank-090270');
    expect(screen.queryByTestId('bank-sheet-popular-label')).toBeNull();
    expect(screen.queryByTestId('bank-sheet-all-label')).toBeNull();
  });
});
