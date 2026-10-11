import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SettingsRoute from '@/app/settings/index';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, canGoBack: () => true }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

globalThis.fetch = jest.fn(async () => {
  throw new TypeError('Network request failed');
}) as typeof fetch;

/**
 * The route file, not only the screen: Settings' Access code row has to open the claim screen at exactly
 * `/claim-code`, with nothing after it (round 2, V11). settingsEntry.test.tsx proves the row calls the handler it is
 * given; this proves the handler the route gives it.
 */
describe('Settings opens the access code screen (JOIN-03)', () => {
  it('the Access code row pushes /claim-code and nothing else', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    await render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <QueryClientProvider client={client}>
          <SettingsRoute />
        </QueryClientProvider>
      </SafeAreaProvider>,
    );
    await fireEvent.press(screen.getByTestId('settings-claim-code'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/claim-code');
    client.clear();
  });
});
