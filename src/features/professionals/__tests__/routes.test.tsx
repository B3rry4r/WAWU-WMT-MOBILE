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
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn' }),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn(), push: jest.fn(), setParams: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Redirect: () => null,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => undefined,
  useIsFocused: () => true,
}));

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const field = (id: string, label: string) => ({ id, label, categories: [id], applyCategory: id, regulated: false });
const ticks = { creator: { verified: false, expiresAt: null }, professional: { verified: true, expiresAt: null } };
const FUNMI = {
  id: 'p1', wawuId: 'w1', name: 'Funmi Adeyemi', handle: null, category: 'finance', headline: 'Chartered accountant, 9 years', services: [], verification: ticks,
  avatarUrl: null, pieceCount: 0, dmEnabled: true, dmResponseHours: 24, ratingAvg: null, reviewCount: 0, field: { id: 'accounting_tax', label: 'Accounting & Tax' },
  city: null, usualReplyMinutes: null, answeredMessageCount: 0, messagePriceKobo: 500000,
};
const answers: Record<string, { status: number; body: unknown }> = {
  'GET /api/hub/professionals/fields': ok([field('accounting_tax', 'Accounting & Tax'), field('engineering', 'Engineering')]),
  'GET /api/hub/professionals/directory?page=1&perPage=20': { status: 200, body: { statusCode: 200, message: 'OK', data: [FUNMI], pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 1 } } },
  'GET /api/hub/professionals/directory?page=1&perPage=20&field=engineering': { status: 200, body: { statusCode: 200, message: 'OK', data: [], pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 0 } } },
  'GET /api/hub/professionals/directory/p1': ok({ ...FUNMI, about: 'I help creators file taxes.', issuingBody: 'ICAN', credentialKind: 'licence' }),
  'GET /api/hub/explore/categories': ok({ items: [] }),
  'GET /api/hub/explore/featured-creators': ok({ items: [] }),
  'GET /api/hub/users/me': ok({ wawuUserId: 'me', accountType: 'user' }),
  'GET /api/hub/paid-dm/creators/w1/availability': ok({ paused: false, pausedUntil: null }),
};
const original = { ...answers };
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const a = answers[`${request.method} ${url.pathname}${url.search}`] ?? answers[`${request.method} ${url.pathname}`];
  if (!a) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  return new Response(JSON.stringify(a.body), { status: a.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const DirectoryRoute = (require('@/app/professionals/index') as typeof import('@/app/professionals/index')).default;
const ProfileRoute = (require('@/app/professionals/[id]') as typeof import('@/app/professionals/[id]')).default;
const ExploreTab = (require('@/app/(tabs)/explore') as typeof import('@/app/(tabs)/explore')).default;

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

/** The handler the screen gave Android's back button, so a test can press it. */
function hardwareBack(): () => boolean | null | undefined {
  const calls = backSpy.mock.calls.filter(([name]) => name === 'hardwareBackPress');
  return calls[calls.length - 1][1];
}

let backSpy: jest.SpyInstance;
beforeEach(() => {
  backSpy = jest.spyOn(BackHandler, 'addEventListener');
  Object.values(mockRouter).forEach((f) => f.mockClear());
  mockRouter.canGoBack.mockReturnValue(true);
  mockParams = {};
  queryClient.clear();
  Object.assign(answers, original);
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

describe('the professionals routes', () => {
  it('Explore draws Find a professional first in its doors card, as X15 does, and it opens P1', async () => {
    await rtl.render(wrap(<ExploreTab />));
    const doors = await rtl.screen.findByTestId('explore-doors');
    const titles = rtl.within(doors).getAllByRole('button').map((b) => b.props.accessibilityLabel);
    expect(titles).toEqual([
      'Find a professional, Accountants, lawyers, designers',
      'Find a school, Courses from schools and academies',
      'List your services, Get paid to answer questions',
    ]);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('explore-door-find-professional')));
    expect(mockRouter.push).toHaveBeenCalledWith('/professionals');
  });

  it('P1: a tap on a professional opens their profile route', async () => {
    await rtl.render(wrap(<DirectoryRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('pros-row-p1')));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/professionals/[id]', params: { id: 'p1' } });
  });

  it('P4: Offer your services opens P5 on the empty field, and the chip is kept in the route', async () => {
    await rtl.render(wrap(<DirectoryRoute />));
    await rtl.screen.findByTestId('pros-row-p1');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-chips-engineering')));
    expect(mockRouter.setParams).toHaveBeenCalledWith({ field: 'engineering' });
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Offer your services' })));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/professional-apply', params: { field: 'engineering' } });
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-chips-all')));
    expect(mockRouter.setParams).toHaveBeenLastCalledWith({ field: undefined });
  });

  it('system Back on P1 does what its on-screen back does', async () => {
    await rtl.render(wrap(<DirectoryRoute />));
    await rtl.screen.findByTestId('pros-row-p1');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-back')));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(hardwareBack()()).toBe(true);
    expect(mockRouter.back).toHaveBeenCalledTimes(2);
    // Opened on its own (a link): both backs go to Explore.
    mockRouter.canGoBack.mockReturnValue(false);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-back')));
    hardwareBack()();
    expect(mockRouter.replace).toHaveBeenNthCalledWith(1, '/explore');
    expect(mockRouter.replace).toHaveBeenNthCalledWith(2, '/explore');
  });

  it('system Back on P2 does what its on-screen back does', async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    mockParams = { id: 'p1' };
    await rtl.render(wrap(<ProfileRoute />));
    await rtl.screen.findByText('Funmi Adeyemi');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-back')));
    hardwareBack()();
    expect(mockRouter.replace).toHaveBeenNthCalledWith(1, '/professionals');
    expect(mockRouter.replace).toHaveBeenNthCalledWith(2, '/professionals');
    mockRouter.canGoBack.mockReturnValue(true);
    hardwareBack()();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('P2 route: the profile route reads the listing named in the link', async () => {
    mockParams = { id: 'p1' };
    await rtl.render(wrap(<ProfileRoute />));
    expect(await rtl.screen.findByText('Issued by ICAN · checked by Who Made This?')).toBeTruthy();
    expect(rtl.screen.getByText('I help creators file taxes.')).toBeTruthy();
  });

  // FIX-100 #1 (H2): P2 had no "Ask a question" button, so nobody could pay a professional from their profile.
  it('P2: a user can tap Ask a question with the price the Hub gave and the paid question (I3) opens', async () => {
    mockParams = { id: 'p1' };
    await rtl.render(wrap(<ProfileRoute />));
    const button = await rtl.screen.findByTestId('pro-ask');
    expect(rtl.within(button).getByText('Ask a question · ₦5,000')).toBeTruthy();
    expect(rtl.screen.getByText("Funmi replies within 24 hours, or you're refunded automatically.")).toBeTruthy();
    expect(rtl.screen.queryByTestId('pro-closed')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(button));
    expect(await rtl.screen.findByTestId('ask-sheet')).toBeTruthy();
    expect(rtl.screen.getByTestId('ask-title')).toHaveTextContent('Ask Funmi');
  });

  // FIX-101 (FIX-100 L-3): a listing whose category is outside the taxonomy comes with no field, and the page crashed reading its label.
  it('P2: a listing whose category is outside the taxonomy opens, with the category as the Hub gives it', async () => {
    const outside = { ...FUNMI, category: 'accounting', field: null };
    answers['GET /api/hub/professionals/directory/p1'] = ok({ ...outside, about: 'I help creators file taxes.', issuingBody: 'ICAN', credentialKind: 'licence' });
    mockParams = { id: 'p1' };
    await rtl.render(wrap(<ProfileRoute />));
    expect(await rtl.screen.findByTestId('pro-field')).toHaveTextContent('accounting');
    expect(rtl.screen.getByTestId('pro-name')).toHaveTextContent('Funmi Adeyemi');
  });

  it('P1: a row whose category is outside the taxonomy is drawn with the category as the Hub gives it', async () => {
    const outside = { ...FUNMI, category: 'accounting', field: null };
    answers['GET /api/hub/professionals/directory?page=1&perPage=20'] = { status: 200, body: { statusCode: 200, message: 'OK', data: [outside], pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 1 } } };
    await rtl.render(wrap(<DirectoryRoute />));
    expect(await rtl.screen.findByText('Funmi Adeyemi')).toBeTruthy();
    expect(rtl.screen.getByText('accounting')).toBeTruthy();
  });

  it('P3: a professional the Hub has paused shows Not taking messages, with no Ask a question', async () => {
    mockParams = { id: 'p1' };
    answers['GET /api/hub/paid-dm/creators/w1/availability'] = ok({ paused: true, pausedUntil: null });
    try {
      await rtl.render(wrap(<ProfileRoute />));
      expect(await rtl.screen.findByTestId('pro-closed')).toBeTruthy();
      expect(rtl.screen.queryByTestId('pro-ask')).toBeNull();
    } finally {
      answers['GET /api/hub/paid-dm/creators/w1/availability'] = ok({ paused: false, pausedUntil: null });
    }
  });

  it('P2: a professional looking at their own listing is not offered Ask a question', async () => {
    mockParams = { id: 'p1' };
    answers['GET /api/hub/users/me'] = ok({ wawuUserId: 'w1', accountType: 'creator' });
    try {
      await rtl.render(wrap(<ProfileRoute />));
      await rtl.screen.findByText('Issued by ICAN · checked by Who Made This?');
      await rtl.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      });
      expect(rtl.screen.queryByTestId('pro-ask')).toBeNull();
      expect(rtl.screen.queryByTestId('pro-closed')).toBeNull();
    } finally {
      answers['GET /api/hub/users/me'] = ok({ wawuUserId: 'me', accountType: 'user' });
    }
  });
});
