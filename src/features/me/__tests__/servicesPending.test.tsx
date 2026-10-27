/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// SERVICES-FEEDBACK item 2: after "Send for review" the person's own Services tab on Me shows the pending listing with an
// "Under review" chip. The real tab route and the real Me screen run; only the Hub's answers are made up.
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
const row = (id: string, status: 'approved' | 'pending' | 'rejected', listed: boolean, headline: string, category = 'marketing') => ({ id, status, listed, headline, category });

let listings: unknown[] = [];
let paid = true;
const answers = (): Record<string, { status: number; body: unknown }> => ({
  'GET /api/hub/users/me': ok(profile),
  'GET /api/hub/users/me/profile-fields': ok({ wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: '2025-03-10T09:00:00.000Z' }),
  'GET /api/hub/users/me/profile-stats': ok({ wawuUserId: 'u1', followerCount: 1, followingCount: 1, postCount: 0 }),
  'GET /api/hub/users/u1/content': ok([], { pagination: { currentPage: 1, nextPage: null } }),
  'GET /api/hub/creator/state': ok({ wawuUserId: 'u1', kycStatus: 'approved', slotsUsed: 0, slotsTotal: 5, dmEnabled: paid, dmPrice: paid ? 300 : null, dmResponseHours: 24 }),
  'GET /api/hub/professionals/applications/mine': ok(listings),
});
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const a = answers()[`${request.method} ${new URL(request.url).pathname}`];
  if (!a) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  return new Response(JSON.stringify(a.body), { status: a.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const MeTab = (require('@/app/(tabs)/me') as typeof import('@/app/(tabs)/me')).default;
const { ServicesTab } = require('../ServicesTab') as typeof import('../ServicesTab');

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
  await fireEvent.press(await screen.findByTestId('me-tab-services', hiddenOk));
  await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
}

beforeEach(() => {
  mockRouter.push.mockClear();
  paid = true;
});

describe('SERVICES-FEEDBACK 2 · Me, Services: a listing under review', () => {
  it('a person who just sent a listing for review sees it with "Under review", not "No services yet"', async () => {
    paid = false;
    listings = [row('a1', 'pending', false, 'Chartered accountant, 9 years', 'finance')];
    await openServices();
    expect(screen.queryByTestId('me-services-empty', hiddenOk)).toBeNull();
    expect(screen.getByText('Chartered accountant, 9 years', hiddenOk)).toBeTruthy();
    expect(screen.getByTestId('me-service-listing-a1-status', hiddenOk)).toHaveTextContent('Under review');
    expect(screen.getByLabelText(/Chartered accountant, 9 years, .*under review/i, hiddenOk)).toBeTruthy();
  });

  it('live listings keep their words, a pending one is marked beside them, and turned-down and hidden ones are not drawn', async () => {
    listings = [
      row('l1', 'approved', true, 'Brand strategy sessions'),
      row('l2', 'pending', false, 'Business advisor', 'professional_services'),
      row('l3', 'rejected', false, 'Contract reviews', 'legal_services'),
      row('l4', 'approved', false, 'Hidden by me', 'finance'),
    ];
    await openServices();
    expect(screen.getByTestId('me-service-listing-l1-sub', hiddenOk)).toHaveTextContent('Listed as a professional · via paid messages');
    expect(screen.queryByTestId('me-service-listing-l1-status', hiddenOk)).toBeNull();
    expect(screen.getByTestId('me-service-listing-l2-status', hiddenOk)).toHaveTextContent('Under review');
    expect(screen.queryByTestId('me-service-listing-l3', hiddenOk)).toBeNull();
    expect(screen.queryByTestId('me-service-listing-l4', hiddenOk)).toBeNull();
  });

  it('the pending row opens Your listings, where its status card is', async () => {
    listings = [row('l2', 'pending', false, 'Business advisor', 'professional_services')];
    await openServices();
    await fireEvent.press(screen.getByTestId('me-service-listing-l2-open', hiddenOk));
    expect(mockRouter.push).toHaveBeenCalledWith('/professional-listings');
  });

  it('a person with nothing pending and nothing live still sees the empty state', async () => {
    paid = false;
    listings = [row('l3', 'rejected', false, 'Contract reviews', 'legal_services')];
    await openServices();
    expect(screen.getByTestId('me-services-empty', hiddenOk)).toBeTruthy();
  });
});

describe('SERVICES-FEEDBACK 2 · only the owner sees it', () => {
  it('the tab on somebody else\'s profile draws no pending row: it is given live listings only', async () => {
    await render(<ServicesTab paid={null} listings={[{ id: 'l1', headline: 'Brand strategy sessions', category: 'marketing' }]} onOpenListing={jest.fn()} />);
    expect(within(screen.getByTestId('me-services')).queryByText('Under review')).toBeNull();
    expect(screen.getByTestId('me-service-listing-l1')).toBeTruthy();
  });
});

describe('SERVICES-FEEDBACK 2 · which listings are "under review"', () => {
  it('only the ones a reviewer has not decided, whatever their listed flag says', () => {
    const { pendingListings } = require('../model') as typeof import('../model');
    const all = [row('a', 'approved', true, 'A'), row('b', 'pending', false, 'B'), row('c', 'pending', true, 'C'), row('d', 'rejected', false, 'D'), row('e', 'approved', false, 'E')];
    expect(pendingListings(all as never).map((l) => l.id)).toEqual(['b', 'c']);
  });
});
