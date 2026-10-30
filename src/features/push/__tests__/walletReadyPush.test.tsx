import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OPEN_WALLET_KEY } from '@/features/open-wallet/api/account';
import { CheckingScreen } from '@/features/open-wallet/CheckingScreen';

import { PushBridge } from '../PushBridge';
import { staleKeysForPush, WALLET_READ_KEYS } from '../refresh';
import { routeForPush } from '../routes';

/*
 * WALLET-40 (owner answer 31): "Your account number is ready". The notice is in the Hub's list as `wallet_ready`; a tap on it
 * (the phone's push) opens the wallet home, and A28 refreshes the moment it lands instead of waiting for its next ask.
 */

let mockNavigate = jest.fn();
let mockReceived: ((n: unknown) => void) | null = null;
let mockTap: ((r: unknown) => void) | null = null;
let mockProgress: () => Promise<unknown> = async () => ({});

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }),
  useRootNavigationState: () => ({ key: 'root' }),
}));
jest.mock('@/api/session', () => ({ ...jest.requireActual('@/api/session'), useSession: () => ({ status: 'signedIn' }) }));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'u1' }));
jest.mock('@/features/open-wallet/api/review', () => {
  const actual = jest.requireActual('@/features/open-wallet/api/review');
  return {
    ...actual,
    // The key is the real one; only the read is the test's.
    openingProgressQuery: (owner: string | undefined, poll?: boolean) => ({ ...actual.openingProgressQuery(owner, poll), queryFn: () => mockProgress() }),
  };
});
jest.mock('../registration', () => ({ syncPush: jest.fn(async () => 'registered'), installPushHandler: jest.fn() }));
jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  getLastNotificationResponse: () => null,
  clearLastNotificationResponse: jest.fn(),
  addNotificationReceivedListener: (listener: (n: unknown) => void) => {
    mockReceived = listener;
    return { remove: () => (mockReceived = null) };
  },
  addNotificationResponseReceivedListener: (listener: (r: unknown) => void) => {
    mockTap = listener;
    return { remove: () => (mockTap = null) };
  },
}));

const DEFAULT = 'expo.modules.notifications.actions.DEFAULT';
const note = (data: unknown) => ({ date: 5000, request: { identifier: `n-${Math.random()}`, content: { data } } });
const ready = { notificationId: 'n1', kind: 'wallet_ready' };

beforeEach(() => {
  mockNavigate = jest.fn();
  mockReceived = null;
  mockTap = null;
});

describe('where the notice goes and what it refreshes', () => {
  it('a tap on "Your account number is ready" opens the wallet home, whatever else the push carries', () => {
    expect(routeForPush(ready)).toBe('/wallet');
    expect(routeForPush({ kind: 'wallet_ready', target: { kind: 'profile', id: 'x' }, actionHref: 'https://example.com' })).toBe('/wallet');
  });

  it('only that notice marks the wallet reads stale, and the keys are the ones those reads use', () => {
    expect(staleKeysForPush(ready)).toBe(WALLET_READ_KEYS);
    expect(WALLET_READ_KEYS[0]).toEqual([OPEN_WALLET_KEY]);
    expect(staleKeysForPush({ kind: 'tgif_daily' })).toEqual([]);
    expect(staleKeysForPush({ kind: 'sale' })).toEqual([]);
    expect(staleKeysForPush(null)).toEqual([]);
    expect(staleKeysForPush('wallet_ready')).toEqual([]);
  });
});

describe('the notice landing while the app is open', () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

  it('marks the wallet reads stale, and leaves other notices alone', async () => {
    const c = client();
    c.setQueryData([OPEN_WALLET_KEY, 'progress', 'u1'], { state: 'opening' });
    c.setQueryData(['money', 'wallet-home', 'u1'], { balance: 0 });
    c.setQueryData(['inbox', 'u1'], { rows: [] });
    await render(
      <QueryClientProvider client={c}>
        <PushBridge live />
      </QueryClientProvider>,
    );
    expect(mockReceived).not.toBeNull();
    mockReceived?.(note({ notificationId: 'n0', kind: 'sale' }));
    expect(c.getQueryState([OPEN_WALLET_KEY, 'progress', 'u1'])?.isInvalidated).toBe(false);
    mockReceived?.(note(ready));
    expect(c.getQueryState([OPEN_WALLET_KEY, 'progress', 'u1'])?.isInvalidated).toBe(true);
    expect(c.getQueryState(['money', 'wallet-home', 'u1'])?.isInvalidated).toBe(true);
    expect(c.getQueryState(['inbox', 'u1'])?.isInvalidated).toBe(false);
  });

  it('a tap on it opens the wallet home and refreshes the same reads', async () => {
    const c = client();
    c.setQueryData([OPEN_WALLET_KEY, 'progress', 'u1'], { state: 'opening' });
    await render(
      <QueryClientProvider client={c}>
        <PushBridge live />
      </QueryClientProvider>,
    );
    mockTap?.({ actionIdentifier: DEFAULT, notification: note(ready) });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/wallet'));
    expect(c.getQueryState([OPEN_WALLET_KEY, 'progress', 'u1'])?.isInvalidated).toBe(true);
  });

  it('drawn outside the cache provider it still opens the wallet on a tap and does not throw', async () => {
    await render(<PushBridge live />);
    expect(mockReceived).toBeNull();
    mockTap?.({ actionIdentifier: DEFAULT, notification: note(ready) });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/wallet'));
  });

  it('A28 moves on as the notice lands, long before its own next ask', async () => {
    let asks = 0;
    mockProgress = async () => {
      asks += 1;
      return { state: 'opening', flow: 'review', accountNumberStatus: 'on_its_way', review: { stage: 'approved', reasons: [], canResubmit: false, canResubmitAt: null, decidedAt: null } };
    };
    const props = { onOpened: jest.fn(), onRejected: jest.fn(), onNeedsDocuments: jest.fn(), onLeave: jest.fn() };
    const c = client();
    const view = await render(
      <QueryClientProvider client={c}>
        <SafeAreaProvider initialMetrics={frame}>
          <CheckingScreen {...props} />
          <PushBridge live />
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
    // A28 is up. Its title is "Checking your details" until the first ask answers and "Your account number is being made" once it has
    // (the number is on its way), and which one a slow runner sees first is a race (FIX-TESTCLOCK): either is the screen this test means.
    expect(await view.findByText(/^(Checking your details|Your account number is being made)$/)).toBeTruthy();
    await waitFor(() => expect(asks).toBe(1));
    expect(props.onOpened).not.toHaveBeenCalled();

    // The number becomes active at the Hub, and the notice reaches the phone.
    mockProgress = async () => {
      asks += 1;
      return { state: 'open', flow: 'review', accountNumberStatus: 'active', review: { stage: 'approved', reasons: [], canResubmit: false, canResubmitAt: null, decidedAt: null } };
    };
    const before = Date.now();
    mockReceived?.(note(ready));
    await waitFor(() => expect(props.onOpened).toHaveBeenCalledTimes(1));
    // The ask that moved it on was the notice's, not the three-second poll's.
    expect(Date.now() - before).toBeLessThan(2500);
    expect(asks).toBeGreaterThanOrEqual(2);
  });
});
