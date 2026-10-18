import * as rtl from '@testing-library/react-native';

// The route file is what the app mounts as the Home tab: this proves where Today's bell leads (HOME-18).
const mockPush = jest.fn();
let mockProps: { onOpenNotifications?: () => void } | null = null;
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/open-wallet/entry', () => ({ OPEN_WALLET_PIN_PATH: '/open-wallet-pin', useOpenWalletEntry: () => ({ open: jest.fn() }) }));
jest.mock('@/features/referral/pendingCode', () => ({ useClaimPendingReferral: () => undefined }));
jest.mock('@/features/home/HomeScreen', () => ({
  HomeScreen: (props: { onOpenNotifications?: () => void }) => {
    mockProps = props;
    return null;
  },
}));

describe('the Home tab route', () => {
  it('opens Notifications (M31) from the bell in Today\'s bar', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tab = (require('@/app/(tabs)/index') as typeof import('@/app/(tabs)/index')).default;
    await rtl.render(<Tab />);
    mockProps!.onOpenNotifications!();
    expect(mockPush).toHaveBeenLastCalledWith('/notifications');
  });
});
