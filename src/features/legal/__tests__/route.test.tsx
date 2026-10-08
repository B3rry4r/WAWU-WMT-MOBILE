/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({
  useIsFocused: () => true,
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('@/api/session', () => ({ ...jest.requireActual('@/api/session'), useSession: () => ({ status: 'signedIn' }) }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/features/inbox/live', () => ({ retainLive: () => () => undefined, onLiveEvent: () => () => undefined, onLiveSynced: () => () => undefined }));

const asked: string[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  asked.push(`${request.method} ${new URL(request.url).pathname.replace(/^\/api\/hub/, '')}`);
  return new Promise<Response>(() => undefined);
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');

describe('the /legal route (src/app/legal.tsx)', () => {
  afterEach(async () => {
    await queryClient.cancelQueries();
    rtl.cleanup();
    queryClient.clear();
  });

  it('a person who opens /legal is in the legal chat, and the app asks the Hub for their conversation', async () => {
    const Route = (require('@/app/legal') as typeof import('@/app/legal')).default;
    await rtl.render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <Route />
      </SafeAreaProvider>,
    );
    expect(rtl.screen.getByTestId('legal-chat')).toBeTruthy();
    expect(await rtl.screen.findByTestId('legal-loading')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(asked).toContain('GET /legal/intake/mine');
  });
});
