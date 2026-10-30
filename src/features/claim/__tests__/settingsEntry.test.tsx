/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
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

globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 })) as typeof fetch;

const { SettingsScreen } = require('@/features/settings/SettingsScreen') as typeof import('@/features/settings/SettingsScreen');

const base = () => ({
  onBack: jest.fn(),
  onOpenProfile: jest.fn(),
  onOpenNotifications: jest.fn(),
  onOpenPrivacy: jest.fn(),
  onOpenPassword: jest.fn(),
  onOpenAbout: jest.fn(),
  onOpenLegal: jest.fn(),
  onSignedOut: jest.fn(),
});

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

async function boot(extra: Record<string, unknown>) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  clients.push(client);
  const props = { ...base(), ...extra };
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <SettingsScreen {...(props as ReturnType<typeof base>)} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return props;
}

describe('a user reaches the access code screen from Settings (JOIN-03)', () => {
  it('can open it from the Access code row, with the line that says what it is for', async () => {
    const onOpenClaimCode = jest.fn();
    await boot({ onOpenClaimCode });
    expect(screen.getByText('Access code')).toBeTruthy();
    expect(screen.getByText('Claim a plan you paid for at an event')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('settings-claim-code'));
    expect(onOpenClaimCode).toHaveBeenCalledTimes(1);
  });

  it('draws no row when the route gives it no place to go (R-47)', async () => {
    await boot({});
    expect(screen.queryByTestId('settings-claim-code')).toBeNull();
    expect(screen.queryByText('Access code')).toBeNull();
  });
});
