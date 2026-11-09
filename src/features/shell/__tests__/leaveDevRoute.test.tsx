import * as rtl from '@testing-library/react-native';

/*
 * WEBAPP-06 fix 2 (F2): a bills route on the web is outside the route graph for a person the tier offer holds, so it falls to the not-found
 * screen; that screen sends each person where "/" sends them: the tier offer, Home, or welcome. Never a redirect to "/" that cannot resolve.
 */
const mockRedirect = jest.fn();
let mockStatus = 'signedIn';
let mockOffer = false;
jest.mock('expo-router', () => ({ Redirect: (p: { href: string }) => (mockRedirect(p.href), null) }));
jest.mock('@/api/session', () => ({ useSession: () => ({ status: mockStatus }) }));
jest.mock('@/features/auth/signupGate', () => ({ useSignupGate: () => ({ phase: 'ready', needsEmail: false }) }));
jest.mock('@/features/tier-offer/offerStep', () => ({ useTierOfferShowing: () => mockOffer }));

const go = async (status: string, offer: boolean) => {
  mockStatus = status;
  mockOffer = offer;
  mockRedirect.mockClear();
  const { LeaveDevRoute } = require('../LeaveDevRoute') as typeof import('../LeaveDevRoute');
  await rtl.render(<LeaveDevRoute />);
  await rtl.cleanup();
  return mockRedirect.mock.calls.map((c) => c[0]);
};

it('a fresh account goes to the tier offer, a tier holder to Home, a signed-out visitor to welcome', async () => {
  expect(await go('signedIn', true)).toEqual(['/tier-offer']);
  expect(await go('signedIn', false)).toEqual(['/']);
  expect(await go('signedOut', false)).toEqual(['/welcome']);
});
