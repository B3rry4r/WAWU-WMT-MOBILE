import * as rtl from '@testing-library/react-native';

// The route file is what the app mounts at /events/dashboard/<id>: a host can open Edit event and Ticket types from E18 (EVENTS-14).
const mockPush = jest.fn();
let mockProps: Record<string, unknown> = {};
jest.mock('@/features/events/organiser/DashboardScreen', () => ({
  DashboardScreen: (props: Record<string, unknown>) => {
    mockProps = props;
    return null;
  },
}));
jest.mock('@/api/session', () => ({ useSession: () => ({ status: 'signedIn' }) }));
jest.mock('expo-router', () => ({
  Redirect: () => null,
  useLocalSearchParams: () => ({ id: '3f2b6c1e-0000-4000-8000-000000000001' }),
  useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn(), push: mockPush }),
}));

const ID = '3f2b6c1e-0000-4000-8000-000000000001';

it('a host can open Edit event and Ticket types from the dashboard: both rows are given their screens', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Route = (require('@/app/events/dashboard/[id]') as typeof import('@/app/events/dashboard/[id]')).default;
  await rtl.render(<Route />);
  expect(typeof mockProps.onEdit).toBe('function');
  expect(typeof mockProps.onTickets).toBe('function');
  (mockProps.onEdit as () => void)();
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/events/edit/[id]', params: { id: ID } });
  (mockProps.onTickets as () => void)();
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/events/ticket-types/[id]', params: { id: ID } });
});
