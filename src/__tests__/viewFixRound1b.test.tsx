/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Dimensions, Keyboard, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * VIEW-FIX round 1 (R-117 part B, owner hard rule 3), the three sheets found in the full TextInput inventory that held a field and sat under
 * the keyboard: the door's "Type the ticket code" sheet, the wallet's country sheet (search field) and the pro listing's "Add something you
 * take on" sheet. Each is a modal the keyboard covers (Android draws edge to edge), so each adds the keyboard's height under its last row,
 * on Android AND iPhone, told by the phone's own keyboard events.
 */
jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('expo-camera', () => {
  const { createElement } = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    CameraView: (props: Record<string, unknown>) => createElement(View, { testID: props.testID as string }),
    useCameraPermissions: () => [{ granted: true, status: 'granted', canAskAgain: true }, jest.fn(), jest.fn()],
  };
});
const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockStore.set(key, value)),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));

const field = (id: string, label: string, applyCategory: string, regulated: boolean) => ({ id, label, applyCategory, categories: [applyCategory], regulated });
const answers: Record<string, unknown> = {
  'GET /api/hub/users/me': { wawuUserId: 'u1', accountType: 'creator' },
  'GET /api/hub/professionals/fields': [field('design_creative', 'Design & Creative', 'entertainment_creative', false)],
  'GET /api/hub/professionals/applications/mine': [],
};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const data = answers[`${request.method} ${new URL(request.url).pathname}`];
  if (data === undefined) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const KEYBOARD = 336;
const SCREEN_H = 844;
const OSES = ['android', 'ios'] as const;
type Phone = (typeof OSES)[number];
const showEvent = (os: Phone) => (os === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow');
const hideEvent = (os: Phone) => (os === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide');
const keyboardEvent = { endCoordinates: { screenY: SCREEN_H - KEYBOARD, height: KEYBOARD, screenX: 0, width: 390 }, duration: 0, easing: 'keyboard' as const };

let os: jest.ReplaceProperty<typeof Platform.OS>;
let listeners: Map<string, ((e: unknown) => void)[]>;
const clients: QueryClient[] = [];
function phone(name: Phone) {
  os = jest.replaceProperty(Platform, 'OS', name);
  listeners = new Map();
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, fn: (e: unknown) => void) => {
    listeners.set(event, [...(listeners.get(event) ?? []), fn]);
    return { remove: () => listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn)) };
  }) as never);
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
}
afterEach(() => {
  os?.restore();
  jest.restoreAllMocks();
  rtl.cleanup();
  clients.splice(0).forEach((c) => c.clear());
});
const say = (event: string, payload?: unknown) => rtl.act(async () => (listeners.get(event) ?? []).forEach((l) => l(payload)));
const heightOf = (testID: string) => StyleSheet.flatten(rtl.screen.getByTestId(testID).props.style).height;

function area(node: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: SCREEN_H }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

describe.each(OSES)('R-117 B · the sheets found in the full inventory ride above the keyboard (%s)', (name) => {
  beforeEach(() => phone(name));

  it('the door: the "Type the ticket code" sheet adds the keyboard under the Check ticket button, and gives it back', async () => {
    const { DoorScreen } = require('@/features/events/door/DoorScreen') as typeof import('@/features/events/door/DoorScreen');
    await rtl.render(area(<DoorScreen eventId="e9000000-0000-4000-8000-000000000001" onClose={jest.fn()} />));
    await rtl.fireEvent.press(await rtl.screen.findByText('Type the code instead'));
    await rtl.screen.findByTestId('door-code-input');
    expect(rtl.screen.queryByTestId('door-keyboard-lift')).toBeNull();
    await say(showEvent(name), keyboardEvent);
    expect(heightOf('door-keyboard-lift')).toBe(KEYBOARD);
    await say(hideEvent(name));
    expect(rtl.screen.queryByTestId('door-keyboard-lift')).toBeNull();
  });

  it('the wallet country sheet (the search field): the room is added under the list and the list shortens to what is left', async () => {
    Dimensions.set({ window: { width: 390, height: SCREEN_H, scale: 3, fontScale: 1 }, screen: { width: 390, height: SCREEN_H, scale: 3, fontScale: 1 } });
    const { CountryStep } = require('@/features/open-wallet/CountryStep') as typeof import('@/features/open-wallet/CountryStep');
    const { queryClient } = require('@/api/query') as typeof import('@/api/query');
    queryClient.setQueryData(['world', 'countries'], [{ code: 'GH', name: 'Ghana' }, { code: 'KE', name: 'Kenya' }, { code: 'NG', name: 'Nigeria' }]);
    await rtl.render(
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: SCREEN_H }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
          <CountryStep onClose={jest.fn()} onNigeria={jest.fn()} onAbroad={jest.fn()} />
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
    await rtl.fireEvent.press(await rtl.screen.findByTestId('open-wallet-country-field'));
    const list = await rtl.screen.findByTestId('country-sheet-list');
    const resting = StyleSheet.flatten(list.props.style).maxHeight as number;
    expect(rtl.screen.queryByTestId('country-sheet-keyboard-lift')).toBeNull();
    await say(showEvent(name), keyboardEvent);
    expect(heightOf('country-sheet-keyboard-lift')).toBe(KEYBOARD);
    expect(StyleSheet.flatten(rtl.screen.getByTestId('country-sheet-list').props.style).maxHeight).toBeLessThan(resting);
    await say(hideEvent(name));
    expect(rtl.screen.queryByTestId('country-sheet-keyboard-lift')).toBeNull();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('country-sheet-list').props.style).maxHeight).toBe(resting);
    queryClient.clear();
  });

  it('the pro listing: the "Add something you take on" sheet adds the keyboard under the Add button, and gives it back', async () => {
    const { ApplyScreen } = require('@/features/pro-listing/ApplyScreen') as typeof import('@/features/pro-listing/ApplyScreen');
    await rtl.render(area(<ApplyScreen onBack={jest.fn()} onDone={jest.fn()} onMyListings={jest.fn()} />));
    await rtl.screen.findByTestId('pro-continue');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pro-add-service')));
    await rtl.screen.findByTestId('pro-service-input');
    expect(rtl.screen.queryByTestId('pro-service-keyboard-lift')).toBeNull();
    await say(showEvent(name), keyboardEvent);
    expect(heightOf('pro-service-keyboard-lift')).toBe(KEYBOARD);
    await say(hideEvent(name));
    expect(rtl.screen.queryByTestId('pro-service-keyboard-lift')).toBeNull();
  });
});
