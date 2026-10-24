/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useIsFocused: () => true, Redirect: () => null }));

const ok = (data: unknown, extra: Record<string, unknown> = {}) => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });
const profile = {
  wawuUserId: 'u1', sub: 'u1', firstName: 'Lennox', middleName: null, lastName: 'Emmanuel', accountType: 'creator', handle: 'lennox', bio: 'Filmmaker.',
  avatarUrl: null, coverUrl: null, instagramHandle: null, tiktokHandle: null, xHandle: null, youtubeUrl: null, facebookUrl: null, linkedinUrl: null, websiteUrl: null,
  createdAt: '2025-03-10T09:00:00.000Z', experience: [], verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } },
};
const answers: Record<string, { status: number; body: unknown }> = {
  'GET /api/hub/users/me': ok(profile),
  'GET /api/hub/users/me/profile-fields': ok({ wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: '2025-03-10T09:00:00.000Z' }),
  'GET /api/hub/users/me/profile-stats': ok({ wawuUserId: 'u1', followerCount: 1, followingCount: 1, postCount: 0 }),
  'GET /api/hub/users/u1/content': ok([], { pagination: { currentPage: 1, nextPage: null } }),
  'GET /api/hub/creator/state': ok({ wawuUserId: 'u1', kycStatus: 'approved', slotsUsed: 0, slotsTotal: 5, dmEnabled: true, dmPrice: 300, dmResponseHours: 24 }),
  'GET /api/hub/professionals/applications/mine': ok([{ id: 'l1', status: 'approved', listed: true, headline: 'Brand strategy sessions', category: 'marketing' }]),
};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const a = answers[`${request.method} ${new URL(request.url).pathname}`];
  if (!a) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  return new Response(JSON.stringify(a.body), { status: a.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// The real tab route and the real Me screen: nothing in between is replaced.
const MeTab = (require('@/app/(tabs)/me') as typeof import('@/app/(tabs)/me')).default;

const hiddenOk = { includeHiddenElements: true };

async function openServices() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <MeTab />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  await screen.findByTestId('me-name');
  await fireEvent.press(screen.getByTestId('me-tab-services'));
  return screen.findByTestId('me-service-listing-l1-open');
}

describe('M2 on the real Me screen · the listing row and the paid messages row (R-41, T1, T2, T3)', () => {
  beforeEach(() => mockRouter.push.mockClear());

  it('T1: a user can tap the listing row and Your listings opens', async () => {
    const row = await openServices();
    await act(async () => fireEvent.press(row));
    expect(mockRouter.push).toHaveBeenCalledWith('/professional-listings');
  });

  it('T2: the listing row and the paid messages row both draw their chevron (INBOX-12 added the paid messages one)', async () => {
    const row = await openServices();
    expect(within(row).getByTestId('icon-ChevronRight', hiddenOk)).toBeTruthy();
    expect(within(screen.getByTestId('me-service-paid')).getByTestId('icon-ChevronRight', hiddenOk)).toBeTruthy();
    expect(screen.getByTestId('me-service-paid-open').props.accessibilityRole).toBe('button');
  });

  it('T3: a user can tap the paid messages row and the paid message settings open (I21, INBOX-12)', async () => {
    await openServices();
    await act(async () => fireEvent.press(screen.getByTestId('me-service-paid-open')));
    expect(mockRouter.push).toHaveBeenCalledWith('/paid-message-settings');
  });
});
