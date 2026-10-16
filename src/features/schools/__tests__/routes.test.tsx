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
const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn(), push: jest.fn(), setParams: jest.fn() };
let mockParams: Record<string, string> = {};
const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => undefined,
  useIsFocused: () => true,
}));

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const GREENFIELD = { id: 's1', name: 'Greenfield Tech Academy', category: 'tech', location: 'Yaba, Lagos', logo: null, foundedYear: 2016, expertise: [], courseCount: 1, fromPriceKobo: 4500000, matchedCourses: [] };
const answers: Record<string, { status: number; body: unknown }> = {
  'GET /api/hub/schools?limit=20': ok({ items: [GREENFIELD], nextCursor: null }),
  'GET /api/hub/schools/s1': ok({
    ...GREENFIELD,
    about: 'About the school.',
    applyUrl: null,
    courses: [{ id: 'c1', title: 'Product Design Bootcamp', weeks: 12, mode: 'online', priceKobo: 15000000, nextIntake: null }],
  }),
  'GET /api/hub/schools/courses/c1': ok({
    id: 'c1',
    title: 'Product Design Bootcamp',
    weeks: 12,
    mode: 'online',
    syllabus: ['One'],
    outcomes: ['Certificate'],
    priceKobo: 15000000,
    school: { id: 's1', name: 'Greenfield Tech Academy', category: 'tech', location: 'Yaba, Lagos', logo: null, applyUrl: null },
    intakes: [],
  }),
  'GET /api/hub/explore/categories': ok({ items: [] }),
  'GET /api/hub/explore/featured-creators': ok({ items: [] }),
  'GET /api/hub/users/me': ok({ wawuUserId: 'me', accountType: 'user' }),
};
let sent: string[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  sent.push(`${request.method} ${url.pathname}${url.search}`);
  const a = answers[`${request.method} ${url.pathname}${url.search}`] ?? answers[`${request.method} ${url.pathname}`];
  if (!a) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  return new Response(JSON.stringify(a.body), { status: a.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const SchoolsRoute = (require('@/app/schools/index') as typeof import('@/app/schools/index')).default;
const SchoolRoute = (require('@/app/schools/[id]') as typeof import('@/app/schools/[id]')).default;
const CourseRoute = (require('@/app/schools/courses/[id]') as typeof import('@/app/schools/courses/[id]')).default;
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
  mockRedirect.mockClear();
  mockParams = {};
  mockStatus = 'signedIn';
  sent = [];
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

describe('the schools routes', () => {
  it('SC1: a tap on a school opens its page, SC2, by id', async () => {
    await rtl.render(wrap(<SchoolsRoute />));
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('schools-row-s1')));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/schools/[id]', params: { id: 's1' } });
  });

  it('SC1: back goes back a step, or to Explore when it was opened on its own, and Android’s back does the same', async () => {
    await rtl.render(wrap(<SchoolsRoute />));
    await rtl.screen.findByTestId('schools-row-s1');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-back')));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(hardwareBack()()).toBe(true);
    expect(mockRouter.back).toHaveBeenCalledTimes(2);
    mockRouter.canGoBack.mockReturnValue(false);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-back')));
    hardwareBack()();
    expect(mockRouter.replace).toHaveBeenNthCalledWith(1, '/explore');
    expect(mockRouter.replace).toHaveBeenNthCalledWith(2, '/explore');
  });

  it('SC2: the route reads the school named in the link, and a tap on a course opens SC3 by id', async () => {
    mockParams = { id: 's1' };
    await rtl.render(wrap(<SchoolRoute />));
    expect(await rtl.screen.findByText('About the school.')).toBeTruthy();
    expect(sent).toContain('GET /api/hub/schools/s1');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('school-course-c1')));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/schools/courses/[id]', params: { id: 'c1' } });
  });

  it('SC2: back goes back a step, or to SC1 when it was opened on its own, and Android’s back does the same', async () => {
    mockParams = { id: 's1' };
    await rtl.render(wrap(<SchoolRoute />));
    await rtl.screen.findByText('About the school.');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('school-back')));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockRouter.canGoBack.mockReturnValue(false);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('school-back')));
    hardwareBack()();
    expect(mockRouter.replace).toHaveBeenNthCalledWith(1, '/schools');
    expect(mockRouter.replace).toHaveBeenNthCalledWith(2, '/schools');
  });

  it('SC3: the route reads the course named in the link, and back goes to SC1 when it was opened on its own', async () => {
    mockParams = { id: 'c1' };
    mockRouter.canGoBack.mockReturnValue(false);
    await rtl.render(wrap(<CourseRoute />));
    expect(await rtl.screen.findByText('Product Design Bootcamp')).toBeTruthy();
    expect(sent).toContain('GET /api/hub/schools/courses/c1');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('course-back')));
    hardwareBack()();
    expect(mockRouter.replace).toHaveBeenNthCalledWith(1, '/schools');
    expect(mockRouter.replace).toHaveBeenNthCalledWith(2, '/schools');
    mockRouter.canGoBack.mockReturnValue(true);
    hardwareBack()();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['SC2', () => SchoolRoute, { id: '' }],
    ['SC2 with no id at all', () => SchoolRoute, {}],
    ['SC3', () => CourseRoute, { id: '' }],
    ['SC3 with no id at all', () => CourseRoute, {}],
  ])('%s: a link with no id goes to the list, not to an empty page', async (_name, route, params) => {
    mockParams = params as Record<string, string>;
    const Route = route();
    await rtl.render(wrap(<Route />));
    expect(mockRedirect).toHaveBeenCalledWith('/schools');
    expect(sent).toEqual([]);
  });

  it.each([
    ['SC1', () => SchoolsRoute],
    ['SC2', () => SchoolRoute],
    ['SC3', () => CourseRoute],
  ])('%s signed out is not drawn: it sends the person to the welcome screen, and nothing is asked of the Hub', async (_name, route) => {
    mockStatus = 'signedOut';
    mockParams = { id: 's1' };
    const Route = route();
    await rtl.render(wrap(<Route />));
    expect(mockRedirect).toHaveBeenCalledWith('/welcome');
    expect(sent).toEqual([]);
  });

  it.each([
    ['SC1', () => SchoolsRoute],
    ['SC2', () => SchoolRoute],
    ['SC3', () => CourseRoute],
  ])('%s while the session is being read draws nothing and asks nothing', async (_name, route) => {
    mockStatus = 'restoring';
    mockParams = { id: 's1' };
    const Route = route();
    await rtl.render(wrap(<Route />));
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(rtl.screen.queryAllByRole('button')).toHaveLength(0);
    expect(rtl.screen.queryByTestId(/^(schools-directory|school-screen|school-frame|course-screen|course-frame)$/)).toBeNull();
    expect(sent).toEqual([]);
  });
});

describe('the entry to Schools', () => {
  it('Explore draws the Find a school door as X15 does, with its words, and it opens SC1', async () => {
    await rtl.render(wrap(<ExploreTab />));
    const door = await rtl.screen.findByTestId('explore-door-find-school');
    expect(door.props.accessibilityLabel).toBe('Find a school, Courses from schools and academies');
    const titles = rtl.within(rtl.screen.getByTestId('explore-doors')).getAllByRole('button').map((b) => b.props.accessibilityLabel);
    expect(titles[1]).toBe('Find a school, Courses from schools and academies');
    await rtl.act(async () => rtl.fireEvent.press(door));
    expect(mockRouter.push).toHaveBeenCalledWith('/schools');
  });
});
