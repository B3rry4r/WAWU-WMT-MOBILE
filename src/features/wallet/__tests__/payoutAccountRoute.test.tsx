/* eslint-disable @typescript-eslint/no-require-imports */
import { render, screen } from '@testing-library/react-native';

import type { PayoutAccount } from '../api/payoutAccount';
import type { PayoutAccountScreenProps } from '../PayoutAccountScreen';

const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
let mockProps: PayoutAccountScreenProps | null = null;

jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../PayoutAccountScreen', () => ({
  PayoutAccountScreen: (props: PayoutAccountScreenProps) => {
    mockProps = props;
    const { Text: T } = require('react-native');
    return <T testID="payout-screen">A21</T>;
  },
}));

const PayoutAccountRoute = require('@/app/payout-account').default as typeof import('@/app/payout-account').default;

const account = (matchesBvnName: boolean | null): PayoutAccount => ({
  bankCode: '000014',
  bankName: 'ACCESS BANK',
  accountNumber: '0987654321',
  accountName: 'LENNOX EMMANUEL',
  matchesBvnName,
  updatedAt: '2026-10-03T15:00:00.000Z',
});

beforeEach(() => {
  mockRouter.back.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.canGoBack.mockImplementation(() => true);
  mockProps = null;
});

// A signed-out visit never reaches this route: the route graph guards it (src/__tests__/route-graph.test.tsx, SHARED-05).
describe('the A21 route', () => {
  it('after a save in the BVN name, or with nothing to compare, the user goes back where they came from', async () => {
    await render(<PayoutAccountRoute />);
    mockProps!.onSaved!(account(true));
    mockProps!.onSaved!(account(null));
    expect(mockRouter.back).toHaveBeenCalledTimes(2);
  });

  it('after a save in another name, the user stays on A21 so the flag is seen', async () => {
    await render(<PayoutAccountRoute />);
    mockProps!.onSaved!(account(false));
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('opened with nothing behind it, a save stays and Back goes Home', async () => {
    mockRouter.canGoBack.mockImplementation(() => false);
    await render(<PayoutAccountRoute />);
    mockProps!.onSaved!(account(true));
    expect(mockRouter.back).not.toHaveBeenCalled();
    mockProps!.onBack();
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    mockRouter.canGoBack.mockImplementation(() => true);
    mockProps!.onBack();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
