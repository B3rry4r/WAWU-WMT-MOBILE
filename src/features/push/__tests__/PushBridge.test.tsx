import { act, render, waitFor } from '@testing-library/react-native';

import { PushBridge } from '../PushBridge';
import { installPushHandler, syncPush } from '../registration';

/**
 * INBOX-21: the bridge asks and registers once the tabs are reachable, and turns a tap into a screen.
 * expo-notifications, expo-router and the session are stood in for; the routes the tap goes to are
 * `routes.test.ts`, and the registration calls are `pushFlow.test.ts`.
 */

const mockNavigate = jest.fn();
let mockNavReady = true;
let mockStatus: 'signedIn' | 'signedOut' = 'signedIn';
let mockLast: unknown = null;
let mockListener: ((response: unknown) => void) | null = null;
const mockClear = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
  useRootNavigationState: () => (mockNavReady ? { key: 'root' } : undefined),
}));
jest.mock('@/api/session', () => ({ useSession: () => ({ status: mockStatus }) }));
jest.mock('../registration', () => ({ syncPush: jest.fn(async () => 'registered'), installPushHandler: jest.fn() }));
jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  getLastNotificationResponse: () => mockLast,
  clearLastNotificationResponse: () => mockClear(),
  addNotificationResponseReceivedListener: (listener: (response: unknown) => void) => {
    mockListener = listener;
    return {
      remove: () => {
        mockListener = null;
      },
    };
  },
}));

const DEFAULT = 'expo.modules.notifications.actions.DEFAULT';
let seq = 0;
const tap = (data: unknown, actionIdentifier = DEFAULT) => {
  seq += 1;
  return { actionIdentifier, notification: { date: 1000 + seq, request: { identifier: `note-${seq}`, content: { data } } } };
};
const room = { kind: 'community_join_approved', target: { kind: 'community', id: 'c0000000-0000-4000-8000-000000000001' } };

beforeEach(() => {
  jest.clearAllMocks();
  mockNavReady = true;
  mockStatus = 'signedIn';
  mockLast = null;
  mockListener = null;
});

describe('asking and registering', () => {
  it('asks and registers the phone once the tabs are reachable', async () => {
    await render(<PushBridge live />);
    expect(installPushHandler).toHaveBeenCalledTimes(1);
    expect(syncPush).toHaveBeenCalledWith({ ask: true });
  });

  it('does nothing while the sign-up steps still hold the person back', async () => {
    await render(<PushBridge live={false} />);
    expect(syncPush).not.toHaveBeenCalled();
  });

  it('asks again from the top only when the person becomes live again (another sign-in)', async () => {
    const view = await render(<PushBridge live />);
    await view.rerender(<PushBridge live={false} />);
    await view.rerender(<PushBridge live />);
    expect(syncPush).toHaveBeenCalledTimes(2);
  });
});

describe('a tap on a notification', () => {
  it('opens the room when the app was started by the tap', async () => {
    mockLast = tap(room);
    await render(<PushBridge live />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'c0000000-0000-4000-8000-000000000001' } }));
    expect(mockClear).toHaveBeenCalled();
  });

  it('opens the screen when the app is running and the tap arrives', async () => {
    await render(<PushBridge live />);
    await act(async () => mockListener?.(tap({ kind: 'sale' })));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/wallet'));
    await act(async () => mockListener?.(tap({ kind: 'dm_received' })));
    await waitFor(() => expect(mockNavigate).toHaveBeenLastCalledWith('/inbox'));
  });

  it('waits for the route graph and for the sign-up steps, then opens it once', async () => {
    mockNavReady = false;
    mockLast = tap(room);
    const view = await render(<PushBridge live={false} />);
    expect(mockNavigate).not.toHaveBeenCalled();
    await view.rerender(<PushBridge live />);
    expect(mockNavigate).not.toHaveBeenCalled();
    mockNavReady = true;
    await view.rerender(<PushBridge live />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
    await view.rerender(<PushBridge live />);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('drops a tap that arrives while nobody is signed in', async () => {
    mockStatus = 'signedOut';
    mockLast = tap(room);
    const view = await render(<PushBridge live={false} />);
    expect(mockClear).toHaveBeenCalled();
    mockStatus = 'signedIn';
    await view.rerender(<PushBridge live />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('leaves the app where it is for a kind with no screen, an action button, or a broken notification', async () => {
    mockLast = tap({ kind: 'new_follower', target: { kind: 'profile', id: 'p1' } });
    const view = await render(<PushBridge live />);
    await act(async () => mockListener?.(tap(room, 'some-action')));
    await act(async () => mockListener?.({ actionIdentifier: DEFAULT }));
    await act(async () => mockListener?.(null));
    await view.rerender(<PushBridge live />);
    await waitFor(() => expect(mockClear).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('stops listening when it goes away', async () => {
    const view = await render(<PushBridge live />);
    expect(mockListener).not.toBeNull();
    await view.unmount();
    expect(mockListener).toBeNull();
  });
});
