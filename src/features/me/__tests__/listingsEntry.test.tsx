/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ServicesTab } from '../ServicesTab';

const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, Redirect: () => null }));

let mockProps: { onOpenListings?: () => void } | null = null;
jest.mock('@/features/me/MeScreen', () => ({
  MeScreen: (props: { onOpenListings?: () => void }) => {
    mockProps = props;
    return null;
  },
}));

const MeTab = (require('@/app/(tabs)/me') as typeof import('@/app/(tabs)/me')).default;

const frame = { metrics: { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } } };
const listing = { id: 'l1', status: 'approved', listed: true, headline: 'Brand strategy sessions', category: 'marketing' } as never;

describe('M2 listing row opens P8 (R-41)', () => {
  it('a user can tap a listing row on Services and land on Your listings', async () => {
    mockRouter.push.mockClear();
    await render(<MeTab />);
    expect(mockProps?.onOpenListings).toBeDefined();
    await act(async () => mockProps!.onOpenListings!());
    expect(mockRouter.push).toHaveBeenCalledWith('/professional-listings');
  });

  it('the row shows its chevron and presses; the paid messages row has none yet', async () => {
    const open = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={frame.metrics}>
        <ServicesTab paid={{ priceLine: '₦300 a message', replyLine: 'replies within 24 hours' } as never} listings={[listing]} onOpenListings={open} />
      </SafeAreaProvider>,
    );
    await fireEvent.press(screen.getByTestId('me-service-listing-l1-open'));
    expect(open).toHaveBeenCalledTimes(1);
    // The paid messages row is ME-01's plain group again: nothing to press (D9).
    expect(screen.queryByTestId('me-service-paid-open')).toBeNull();
    expect(screen.getByLabelText(/^Paid messages, /)).toBeTruthy();
  });
});
