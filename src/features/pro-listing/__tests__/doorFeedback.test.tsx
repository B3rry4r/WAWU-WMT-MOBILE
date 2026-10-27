/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// SERVICES-FEEDBACK item 1: the two doors to "list your services" (Create's Service tile, Explore's "List your services" row) read
// the account and the person's listings one after the other. Both routes are rendered as the app mounts them.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => false }),
  useIsFocused: () => true,
  useFocusEffect: () => undefined,
  Redirect: () => null,
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn', signIn: jest.fn(), signOut: jest.fn() }),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('@/features/create/CreateEntry', () => ({
  ...jest.requireActual('@/features/create/CreateEntry'),
  useCreatorGate: () => 'creator',
}));

type Step = 'ok' | 'offline' | 'server' | 'hold';
let me: Step = 'ok';
let mine: Step = 'ok';
let heldMe: (() => void) | null = null;
let asked: string[] = [];

const json = (status: number, data: unknown) => new Response(JSON.stringify({ statusCode: status, message: status === 200 ? 'OK' : 'No', data }), { status, headers: { 'content-type': 'application/json' } });
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  asked.push(`${request.method} ${path}`);
  if (request.method === 'GET' && path === '/users/me') {
    if (me === 'offline') throw new TypeError('Network request failed');
    if (me === 'hold') await new Promise<void>((resolve) => (heldMe = resolve));
    return json(200, { wawuUserId: 'u1', accountType: 'creator' });
  }
  if (request.method === 'GET' && path === '/professionals/applications/mine') {
    if (mine === 'server') return json(500, null);
    return json(200, []);
  }
  return json(404, null);
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const CreateRoute = (require('@/app/create') as typeof import('@/app/create')).default;
const ExploreTab = (require('@/app/(tabs)/explore') as typeof import('@/app/(tabs)/explore')).default;

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const frame = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={metrics}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);
const count = (key: string) => asked.filter((a) => a === key).length;

const DOORS = [
  { name: 'Create, Service tile', tile: 'create-tile-service', ready: () => screen.findByTestId('create-tile-service'), mount: () => render(frame(<CreateRoute />)) },
  { name: 'Explore, List your services door', tile: 'explore-door-list-services', ready: () => screen.findByTestId('explore-door-list-services'), mount: () => render(frame(<ExploreTab />)) },
];

beforeEach(() => {
  me = 'ok';
  mine = 'ok';
  heldMe = null;
  asked = [];
  mockPush.mockClear();
  queryClient.clear();
});

describe.each(DOORS)('SERVICES-FEEDBACK 1 · $name', ({ tile, ready, mount }) => {
  it('a user who taps it sees it working at once, and a second tap while it runs does nothing', async () => {
    await mount();
    const door = await ready();
    expect(door.props.accessibilityState?.busy ?? false).toBe(false);
    // Explore reads the account for its own purposes while it opens: only what the tap asks is counted.
    me = 'hold';
    const before = count('GET /users/me');

    await fireEvent.press(door);
    await waitFor(() => expect(screen.getByTestId(tile).props.accessibilityState?.busy).toBe(true));
    expect(screen.getByTestId(`${tile}-busy`)).toBeTruthy();

    await fireEvent.press(screen.getByTestId(tile));
    await fireEvent.press(screen.getByTestId(tile));
    expect(count('GET /users/me') - before).toBe(1);
    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => heldMe?.());
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(mockPush).toHaveBeenCalledWith('/professional-apply');
    expect(count('GET /users/me') - before).toBe(1);
    await waitFor(() => expect(screen.getByTestId(tile).props.accessibilityState?.busy).toBeFalsy());
    expect(screen.queryByTestId(`${tile}-busy`)).toBeNull();
  });

  it('a user whose connection fails is told so, stays here, and can tap again', async () => {
    await mount();
    const door = await ready();
    me = 'offline';
    await fireEvent.press(door);
    expect(await screen.findByTestId('services-door-notice')).toHaveTextContent('No connection. Check your internet and try again.');
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByTestId(`${tile}-busy`)).toBeNull();

    me = 'ok';
    await fireEvent.press(screen.getByTestId(tile));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/professional-apply'));
    await waitFor(() => expect(screen.queryByTestId('services-door-notice')).toBeNull());
  });

  it('a failed second read (the listings) says so too, and opens nothing', async () => {
    await mount();
    const door = await ready();
    mine = 'server';
    await fireEvent.press(door);
    expect(await screen.findByTestId('services-door-notice')).toHaveTextContent('Something went wrong. Try again.');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
