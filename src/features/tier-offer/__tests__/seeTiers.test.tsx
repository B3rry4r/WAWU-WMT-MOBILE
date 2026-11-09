/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

/**
 * WEBAPP-08 F4: on the web a person billed in dollars has no tier on sale in naira (R-16). The offer does not say "No tiers on sale ... Try again
 * later"; it says what the tiers sheet says and leads there ("See the tiers", R-94). A phone is unchanged.
 */
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'account-ada' }));
jest.mock('@/features/store/useStore', () => ({
  useStoreCatalog: () => ({ state: { kind: 'ready', items: [] }, catalog: null, refetch: jest.fn(), os: null }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { plansQuery } = require('@/features/verify/purchaseApi') as typeof import('@/features/verify/purchaseApi');
const { TierOfferScreen } = require('../TierOfferScreen') as typeof import('../TierOfferScreen');

const seed = (currency: 'NGN' | 'USD') => queryClient.setQueryData(plansQuery('account-ada').queryKey, { currency, tiers: [] });
let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
afterEach(() => {
  os?.restore();
  os = undefined;
  rtl.cleanup();
  queryClient.clear();
});

describe('WEBAPP-08 F4 · the tier offer for a person billed in dollars', () => {
  it('on the web: the tiers sheet words and a way to the sheet, never "Try again later"', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    seed('USD');
    const onSeeTiers = jest.fn();
    await rtl.render(<TierOfferScreen closeButton onClose={jest.fn()} onSubscribe={jest.fn()} onSeeTiers={onSeeTiers} />);
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByText(/Try again later/)).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByText('See the tiers'));
    expect(onSeeTiers).toHaveBeenCalledTimes(1);
    expect(rtl.screen.getByTestId('tier-offer-close')).toBeTruthy();
  });

  it('a phone keeps its own empty state', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'android');
    seed('USD');
    await rtl.render(<TierOfferScreen closeButton onClose={jest.fn()} onSubscribe={jest.fn()} onSeeTiers={jest.fn()} />);
    expect(await rtl.screen.findByText('No tiers on sale')).toBeTruthy();
    expect(rtl.screen.queryByText('See the tiers')).toBeNull();
  });
});
