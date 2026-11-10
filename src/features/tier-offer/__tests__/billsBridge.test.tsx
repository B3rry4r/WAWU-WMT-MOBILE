import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

/*
 * WEBAPP-06 fix 2 (F2): while the tier offer is up, a bills address on the web goes to the offer (where "/" goes), never a blank page.
 */
const mockReplace = jest.fn();
let mockPath = '/bills/airtime';
let mockOffer = true;
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: jest.fn() }), usePathname: () => mockPath, useRootNavigationState: () => ({ key: 'k' }) }));
jest.mock('../offerStep', () => ({ takeTierOfferCheckout: jest.fn(), useTierOfferShowing: () => mockOffer }));

const mount = async (os: 'web' | 'android', path: string, offer: boolean) => {
  jest.replaceProperty(Platform, 'OS', os);
  mockPath = path;
  mockOffer = offer;
  mockReplace.mockClear();
  const { TierOfferBridge } = require('../TierOfferBridge') as typeof import('../TierOfferBridge');
  await rtl.render(<TierOfferBridge checkout={null} />);
  await rtl.cleanup();
  jest.restoreAllMocks();
};

it('goes to the offer from any bills address on the web while the offer is up, and does nothing otherwise', async () => {
  for (const p of ['/bills', '/bills/airtime', '/bills/receipt/abc']) {
    await mount('web', p, true);
    expect(mockReplace).toHaveBeenCalledWith('/tier-offer');
  }
  await mount('web', '/bills', false);
  expect(mockReplace).not.toHaveBeenCalled();
  await mount('android', '/bills', true);
  expect(mockReplace).not.toHaveBeenCalled();
  await mount('web', '/wallet', true);
  expect(mockReplace).not.toHaveBeenCalled();
});
