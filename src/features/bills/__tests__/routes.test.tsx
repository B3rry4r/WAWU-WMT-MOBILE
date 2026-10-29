/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
let mockStatus = 'signedIn';
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: mockStatus }),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn(), push: jest.fn(), dismissTo: jest.fn() };
let mockParams: Record<string, string> = {};
const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
  useLocalSearchParams: () => mockParams,
}));

const ok = (data: unknown) => ({ statusCode: 200, message: 'OK', data });
const CATEGORIES = [
  { id: 1, name: 'Airtime', code: 'AIRTIME' },
  { id: 3, name: 'Utility Bills', code: 'UTILITYBILLS' },
];
const BILL = { id: 'bill-1', category: 'Utility Bills', billerName: 'Ikeja Electric', customerRef: '04123456789', amount: 10000, fee: 0, status: 'delivered', providerReference: 'REF1', failureReason: null, createdAt: '2026-10-29T10:42:00.000Z', deliveredAt: null, refundReference: null, refundedAt: null };
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const body = (data: unknown) => new Response(JSON.stringify(ok(data)), { status: 200, headers: { 'content-type': 'application/json' } });
  if (path === '/bills/categories') return body(CATEGORIES);
  if (path === '/bills/mine') return body({ items: [BILL], currentPage: 1, perPage: 50, total: 1 });
  if (path === '/bills/categories/UTILITYBILLS/billers') return body([{ id: 10, name: 'Ikeja Electric', biller_code: 'BIL_IKEJA' }]);
  return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { billDraft } = require('../draft') as typeof import('../draft');
const page = (path: string) => (require(path) as { default: () => ReactNode }).default;
const BillsRoute = page('@/app/bills/index');
const ElectricityRoute = page('@/app/bills/electricity/index');
const CableRoute = page('@/app/bills/cable/index');
const AirtimeRoute = page('@/app/bills/airtime');
const DataRoute = page('@/app/bills/data');
const ItemsRoute = page('@/app/bills/items');
const NumberRoute = page('@/app/bills/number');
const ReviewRoute = page('@/app/bills/review');
const ReceiptRoute = page('@/app/bills/receipt/[id]');

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  Object.values(mockRouter).forEach((f) => f.mockClear());
  mockRouter.canGoBack.mockReturnValue(true);
  mockRedirect.mockClear();
  mockParams = {};
  mockStatus = 'signedIn';
  billDraft.clear();
  queryClient.clear();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  rtl.cleanup();
  queryClient.clear();
});

const routes: [string, () => ReactNode][] = [
  ['S2', BillsRoute],
  ['S3 electricity', ElectricityRoute],
  ['S3 cable', CableRoute],
  ['S8 airtime', AirtimeRoute],
  ['S8 data', DataRoute],
  ['S9 items', ItemsRoute],
  ['S4 number', NumberRoute],
  ['S5 review', ReviewRoute],
  ['S7 receipt', ReceiptRoute],
];

describe('the bills routes', () => {
  it.each(routes)('%s: a person who is not signed in goes to the welcome screen and sees nothing of bills', async (_name, Route) => {
    mockStatus = 'signedOut';
    mockParams = { id: 'bill-1' };
    await rtl.render(wrap(<Route />));
    expect(mockRedirect).toHaveBeenCalledWith('/welcome');
  });

  it.each(routes)('%s: nothing is drawn while the session is being restored', async (_name, Route) => {
    mockStatus = 'restoring';
    mockParams = { id: 'bill-1' };
    await rtl.render(wrap(<Route />));
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(rtl.screen.queryByTestId('auth-back')).toBeNull();
  });

  it('S2: a kind opens its own address and a recent bill opens its receipt', async () => {
    await rtl.render(wrap(<BillsRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('bills-electricity')));
    expect(mockRouter.push).toHaveBeenCalledWith('/bills/electricity');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('bills-airtime')));
    expect(mockRouter.push).toHaveBeenCalledWith('/bills/airtime');
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('bills-recent-bill-1')));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/bills/receipt/[id]', params: { id: 'bill-1' } });
  });

  it('S2: back goes back, or Home when it was opened on its own', async () => {
    await rtl.render(wrap(<BillsRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('auth-back')));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockRouter.canGoBack.mockReturnValue(false);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('auth-back')));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('S3: a company opens the package step, which a link cannot reach on a company of its own choosing', async () => {
    await rtl.render(wrap(<ElectricityRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('biller-BIL_IKEJA')));
    expect(mockRouter.push).toHaveBeenCalledWith('/bills/items');
    expect(billDraft.get()?.biller?.code).toBe('BIL_IKEJA');
  });

  it.each([
    ['S9 items', ItemsRoute],
    ['S4 number', NumberRoute],
    ['S5 review', ReviewRoute],
  ] as [string, () => ReactNode][])('%s: opened with no bill started it goes back to the kinds of bill', async (_name, Route) => {
    await rtl.render(wrap(<Route />));
    await rtl.waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/bills'));
  });

  it('S7: with no id in the address it goes to S2', async () => {
    mockParams = {};
    await rtl.render(wrap(<ReceiptRoute />));
    expect(mockRedirect).toHaveBeenCalledWith('/bills');
  });

  it('S7: Done goes to S2, and Try again goes back to the review only while the bill is still being put together', async () => {
    mockParams = { id: 'bill-1' };
    await rtl.render(wrap(<ReceiptRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('receipt-done')));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/bills');
  });
});
