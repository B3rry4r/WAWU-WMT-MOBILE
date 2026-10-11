/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { BackHandler } from 'react-native';
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

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const IKEJA = { code: 'Ikeja_Electric_Bill_Payment', name: 'Ikeja Electric', plan: 'prepaid', minimumKobo: 50000, maximumKobo: 50000000, presets: [{ amountKobo: 200000 }] };
let billers = ok({ available: true, billers: [IKEJA] });
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/hub/bills/electricity/billers') {
    return new Response(JSON.stringify(billers.body), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const BillsRoute = (require('@/app/bills/index') as typeof import('@/app/bills/index')).default;
const ElectricityRoute = (require('@/app/bills/electricity/index') as typeof import('@/app/bills/electricity/index')).default;
const MeterRoute = (require('@/app/bills/electricity/[code]') as typeof import('@/app/bills/electricity/[code]')).default;

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

let backSpy: jest.SpyInstance;
/** The handler the screen gave Android's back button, so a test can press it. */
function hardwareBack(): () => boolean | null | undefined {
  const calls = backSpy.mock.calls.filter(([name]) => name === 'hardwareBackPress');
  return calls[calls.length - 1][1];
}

beforeEach(() => {
  backSpy = jest.spyOn(BackHandler, 'addEventListener');
  Object.values(mockRouter).forEach((f) => f.mockClear());
  mockRouter.canGoBack.mockReturnValue(true);
  mockRedirect.mockClear();
  (globalThis.fetch as jest.Mock).mockClear();
  mockParams = {};
  mockStatus = 'signedIn';
  billers = ok({ available: true, billers: [IKEJA] });
  queryClient.clear();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  rtl.cleanup();
  queryClient.clear();
  backSpy.mockRestore();
});

describe('the bills routes', () => {
  it('S2: Electricity opens the companies, S3 (/bills/electricity)', async () => {
    await rtl.render(wrap(<BillsRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Electricity' })));
    expect(mockRouter.push).toHaveBeenCalledWith('/bills/electricity');
  });

  it('S2: back goes back a step, or to Home when it was opened on its own, and Android’s back does the same', async () => {
    await rtl.render(wrap(<BillsRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Back' })));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockRouter.canGoBack.mockReturnValue(false);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' })));
    expect(mockRouter.replace).toHaveBeenLastCalledWith('/');
    mockRouter.canGoBack.mockReturnValue(true);
    mockRouter.back.mockClear();
    expect(hardwareBack()()).toBe(true);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('S3: a tap on a company opens S4 with its code', async () => {
    await rtl.render(wrap(<ElectricityRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Ikeja Electric, Prepaid' })));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/bills/electricity/[code]', params: { code: 'Ikeja_Electric_Bill_Payment' } });
  });

  it('S3: back, and the X on "Paying for", go back a step, or to S2 when it was opened on its own', async () => {
    await rtl.render(wrap(<ElectricityRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Change what you are paying for' })));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockRouter.canGoBack.mockReturnValue(false);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' })));
    expect(mockRouter.replace).toHaveBeenLastCalledWith('/bills');
  });

  it('S3: a list that says bills are not on replaces S3 with S2, which draws S13', async () => {
    billers = ok({ available: false, billers: [] });
    await rtl.render(wrap(<ElectricityRoute />));
    await rtl.waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/bills'));
  });

  it('S4: opens on the code in the address; the X on "Biller" goes to S3 and the X on "Paying for" to S2', async () => {
    mockParams = { code: 'Ikeja_Electric_Bill_Payment' };
    await rtl.render(wrap(<MeterRoute />));
    expect(await rtl.screen.findByText('Ikeja Electric · Prepaid')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Change the company' })));
    expect(mockRouter.dismissTo).toHaveBeenLastCalledWith('/bills/electricity');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Change what you are paying for' })));
    expect(mockRouter.dismissTo).toHaveBeenLastCalledWith('/bills');
  });

  it('S4: a code the list no longer has goes to S3', async () => {
    mockParams = { code: 'Gone_Disco' };
    await rtl.render(wrap(<MeterRoute />));
    await rtl.waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/bills/electricity'));
  });

  it('S4: an address with no code goes to S3', async () => {
    mockParams = {};
    await rtl.render(wrap(<MeterRoute />));
    expect(mockRedirect).toHaveBeenCalledWith('/bills/electricity');
  });

  it('S4: back goes back a step, or to S3 when it was opened on its own', async () => {
    mockParams = { code: 'Ikeja_Electric_Bill_Payment' };
    await rtl.render(wrap(<MeterRoute />));
    // The form replaces the loading frame once the list is in: press its Back, not the loading frame's.
    await rtl.screen.findByTestId('meter-amount');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' })));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockRouter.canGoBack.mockReturnValue(false);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' })));
    expect(mockRouter.replace).toHaveBeenLastCalledWith('/bills/electricity');
  });

  it.each([
    ['S2', () => <BillsRoute />],
    ['S3', () => <ElectricityRoute />],
    ['S4', () => <MeterRoute />],
  ])('%s: someone signed out is sent to the welcome screen and nothing is asked of the Hub', async (_name, route) => {
    mockStatus = 'signedOut';
    mockParams = { code: 'Ikeja_Electric_Bill_Payment' };
    await rtl.render(wrap(route()));
    expect(mockRedirect).toHaveBeenCalledWith('/welcome');
    expect((globalThis.fetch as jest.Mock).mock.calls.filter(([input]) => String(input instanceof Request ? input.url : input).includes('/bills/')).length).toBe(0);
  });
});
