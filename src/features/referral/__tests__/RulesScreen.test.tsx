/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { referrals } from '../referralsForTests';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
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

let answer: { status: number; body: unknown } | 'offline' = 'offline';
globalThis.fetch = jest.fn(async () => {
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;
const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

const { RulesScreen } = require('../RulesScreen') as typeof import('../RulesScreen');

let client: QueryClient;
const onBack = jest.fn();
function open() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <RulesScreen onBack={onBack} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  cleanup();
  client?.clear();
  onBack.mockClear();
});

describe('How it works (RF4)', () => {
  it('numbers the rules and prints the Hub hold days, whatever they are', async () => {
    answer = ok(referrals({ holdDays: 10 }));
    await open();
    expect(await screen.findByText('Rewards are held for 10 days.')).toBeTruthy();
    expect(screen.getByTestId('invite-rule-4')).toHaveTextContent('4Rewards are held for 10 days.');
    expect(screen.getByText('Only verified people earn.')).toBeTruthy();
    expect(screen.getByText('Rewards are points, never cash.')).toBeTruthy();
    expect(screen.queryByText(/7 days/)).toBeNull();
    expect(screen.getAllByTestId(/^invite-rule-\d$/)).toHaveLength(6);
  });

  it('shows a loading state, and an error with Try again that recovers', async () => {
    answer = 'offline';
    await open();
    expect(screen.getByTestId('invite-rules-loading')).toBeTruthy();
    expect(await screen.findByTestId('invite-rules-error')).toBeTruthy();
    expect(screen.queryByTestId('invite-rule-1')).toBeNull();
    answer = ok(referrals({ holdDays: 7 }));
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('Rewards are held for 7 days.')).toBeTruthy();
  });

  it('Back goes back', async () => {
    answer = ok(referrals());
    await open();
    await fireEvent.press(await screen.findByTestId('invite-rules-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
