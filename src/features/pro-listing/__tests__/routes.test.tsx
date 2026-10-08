/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
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
const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Redirect: () => null,
  useLocalSearchParams: () => ({}),
  useFocusEffect: () => undefined,
}));

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const field = (id: string, label: string, applyCategory: string) => ({ id, label, applyCategory, categories: [applyCategory], regulated: true });
const answers: Record<string, { status: number; body: unknown }> = {
  'GET /api/hub/users/me': ok({ wawuUserId: 'u1', accountType: 'creator' }),
  'GET /api/hub/professionals/fields': ok([field('legal_compliance', 'Legal & Compliance', 'legal_services')]),
  'GET /api/hub/professionals/applications/mine': ok([
    { id: 'r1', status: 'rejected', reviewedAt: null, category: 'legal_services', documents: [], wawuUserId: 'u1', headline: 'Contract reviews', about: 'x', submittedAt: '2026-10-05T00:00:00.000Z', rejectionReason: 'No licence.', services: [], credentialKind: 'licence', listed: false },
  ]),
};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const a = answers[`${request.method} ${new URL(request.url).pathname}`];
  if (!a) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  return new Response(JSON.stringify(a.body), { status: a.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const Route = (require('@/app/professional-listings') as typeof import('@/app/professional-listings')).default;

const cleanup: (() => void)[] = [];
afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  cleanup.splice(0).forEach((c) => c());
});

describe('the listings route (T3)', () => {
  it('Apply again on a turned-down field opens the application route with ?field= and the field id', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    cleanup.push(() => client.clear());
    await render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <QueryClientProvider client={client}>
          <Route />
        </QueryClientProvider>
      </SafeAreaProvider>,
    );
    await act(async () => fireEvent.press(await screen.findByTestId('pro-again-r1')));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/professional-apply', params: { field: 'legal_compliance' } });
    await act(async () => fireEvent.press(screen.getByTestId('pro-apply-another')));
    expect(mockRouter.push).toHaveBeenLastCalledWith('/professional-apply');
  });
});
