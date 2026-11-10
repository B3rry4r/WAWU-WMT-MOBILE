/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

// CREATOR-TAKEDOWN: where the owner's page lands after a take-down, from a direct link (no history) and from a screen before it.
const mockRouter = { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn(), push: jest.fn(), navigate: jest.fn() };
jest.mock('expo-router', () => ({
  Redirect: () => null,
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 'p1' }),
}));
jest.mock('@/api/session', () => ({ useSession: () => ({ status: 'signedIn' }) }));
jest.mock('@/features/open-wallet/entry', () => ({ OPEN_WALLET_PIN_PATH: '/x', useOpenWalletEntry: () => ({ open: jest.fn() }) }));
jest.mock('@/features/content-detail/ContentDetailScreen', () => ({
  ContentDetailScreen: ({ onTakenDown }: { onTakenDown: () => void }) => {
    const rn = require('react-native') as typeof import('react-native');
    return (
      <rn.Pressable testID="taken" onPress={onTakenDown}>
        <rn.Text>take down done</rn.Text>
      </rn.Pressable>
    );
  },
}));

const realOS = Platform.OS;
beforeAll(() => {
  Platform.OS = 'android';
});
afterAll(() => {
  Platform.OS = realOS;
});
beforeEach(() => jest.clearAllMocks());

const Route = () => {
  const Page = (require('@/app/content/[id]') as typeof import('@/app/content/[id]')).default;
  return <Page />;
};

describe('after the owner takes a piece down from its page', () => {
  it('a direct link (nothing to go back to) lands on My uploads', async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    await render(<Route />);
    await fireEvent.press(screen.getByTestId('taken'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/library');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('with history it goes back', async () => {
    mockRouter.canGoBack.mockReturnValue(true);
    await render(<Route />);
    await fireEvent.press(screen.getByTestId('taken'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
