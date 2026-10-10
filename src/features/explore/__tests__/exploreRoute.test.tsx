import * as rtl from '@testing-library/react-native';

// The route file is what the app mounts as the Explore tab: this proves where each built entry leads (the event
// entries are proved in src/features/events/__tests__/exploreRoute.test.tsx).
const mockPush = jest.fn();
let mockProps: { onOpenCategory: (c: string) => void; onListServices: () => void } | null = null;
let mockTarget: '/professional-apply' | '/professional-listings' = '/professional-apply';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/explore/ExploreScreen', () => ({
  ExploreScreen: (props: { onOpenCategory: (c: string) => void; onListServices: () => void }) => {
    mockProps = props;
    return null;
  },
}));
jest.mock('@/features/pro-listing/door', () => ({ listServicesTarget: async () => mockTarget }));

describe('the Explore tab route', () => {
  async function mount() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tab = (require('@/app/(tabs)/explore') as typeof import('@/app/(tabs)/explore')).default;
    await rtl.render(<Tab />);
    return mockProps!;
  }

  beforeEach(() => mockPush.mockClear());

  it('opens Categories on the tile’s category (X3), and on All for All and More (X2)', async () => {
    const props = await mount();
    props.onOpenCategory('photography');
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/categories', params: { category: 'photography' } });
    props.onOpenCategory('all');
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/categories', params: { category: 'all' } });
  });

  it('sends "List your services" to P5 for someone with no application and to P8 for someone with one', async () => {
    const props = await mount();
    props.onListServices();
    await rtl.waitFor(() => expect(mockPush).toHaveBeenLastCalledWith('/professional-apply'));
    mockTarget = '/professional-listings';
    props.onListServices();
    await rtl.waitFor(() => expect(mockPush).toHaveBeenLastCalledWith('/professional-listings'));
  });
});
