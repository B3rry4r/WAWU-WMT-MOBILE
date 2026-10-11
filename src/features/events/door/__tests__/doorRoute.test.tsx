/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';

// The route file is what the app mounts at /events/door/<event id>: a signed-in person gets the door for that event,
// a signed-out person is sent to the welcome screen, and the X goes back where the person came from.
const mockDoor = jest.fn();
const mockSession = { status: 'signedIn' as 'signedIn' | 'signedOut' | 'restoring' };
const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn() };
const mockRedirect = jest.fn();
jest.mock('@/features/events/door/DoorScreen', () => ({
  DoorScreen: (props: { eventId: string; onClose: () => void }) => {
    mockDoor(props);
    return null;
  },
}));
jest.mock('@/api/session', () => ({ useSession: () => mockSession }));
jest.mock('expo-router', () => ({
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
  useLocalSearchParams: () => ({ id: 'e9000000-0000-4000-8000-000000000001' }),
  useRouter: () => mockRouter,
}));

const route = () => (require('@/app/events/door/[id]') as typeof import('@/app/events/door/[id]')).default;

beforeEach(() => {
  mockDoor.mockClear();
  mockRedirect.mockClear();
  mockRouter.back.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.canGoBack.mockReturnValue(true);
  mockSession.status = 'signedIn';
});

describe('/events/door/<event id>', () => {
  it('a signed-in person gets the door for that event', async () => {
    const Door = route();
    await rtl.render(<Door />);
    expect(mockDoor).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'e9000000-0000-4000-8000-000000000001' }));
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('a signed-out person is sent to the welcome screen and never sees the door', async () => {
    mockSession.status = 'signedOut';
    const Door = route();
    await rtl.render(<Door />);
    expect(mockRedirect).toHaveBeenCalledWith('/welcome');
    expect(mockDoor).not.toHaveBeenCalled();
  });

  it('draws nothing while the session is still being read', async () => {
    mockSession.status = 'restoring';
    const Door = route();
    await rtl.render(<Door />);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockDoor).not.toHaveBeenCalled();
  });

  it('the X goes back, or to Events when there is nowhere to go back to', async () => {
    const Door = route();
    await rtl.render(<Door />);
    const onClose = mockDoor.mock.calls[0][0].onClose as () => void;
    onClose();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockRouter.canGoBack.mockReturnValue(false);
    onClose();
    expect(mockRouter.replace).toHaveBeenCalledWith('/events');
  });
});
