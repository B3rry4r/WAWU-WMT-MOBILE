import * as rtl from '@testing-library/react-native';

// The route file is what the app mounts at /events/<id>; this proves it is the one that asks for the tiers on focus (V10).
const mockRefetchOnFocus = jest.fn();
jest.mock('@/features/events/useRefetchTiersOnFocus', () => ({
  useRefetchTiersOnFocus: (id: string) => mockRefetchOnFocus(id),
}));
jest.mock('@/features/events/EventDetailScreen', () => ({ EventDetailScreen: () => null }));
jest.mock('@/api/session', () => ({ useSession: () => ({ status: 'signedIn' }) }));
jest.mock('expo-router', () => ({
  Redirect: () => null,
  useLocalSearchParams: () => ({ id: 'e-1' }),
  useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));

it('the event route asks for the tiers again whenever the screen comes back into focus (V10)', async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const EventRoute = (require('@/app/events/[id]') as typeof import('@/app/events/[id]')).default;
  await rtl.render(<EventRoute />);
  expect(mockRefetchOnFocus).toHaveBeenCalledWith('e-1');
});
