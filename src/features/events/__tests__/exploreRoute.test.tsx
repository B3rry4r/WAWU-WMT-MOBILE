import * as rtl from '@testing-library/react-native';

// The route file is what the app mounts as the Explore tab; this proves where the event entries lead (T4: N2, N3).
const mockPush = jest.fn();
let mockProps: { onOpenEvent: (id: string) => void; onSeeAllEvents: () => void } | null = null;
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/explore/ExploreScreen', () => ({
  ExploreScreen: (props: { onOpenEvent: (id: string) => void; onSeeAllEvents: () => void }) => {
    mockProps = props;
    return null;
  },
}));

describe('the Explore tab route', () => {
  async function mount() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tab = (require('@/app/(tabs)/explore') as typeof import('@/app/(tabs)/explore')).default;
    await rtl.render(<Tab />);
    return mockProps!;
  }

  it('opens the featured event and a rail card on that event (E2), not on the list', async () => {
    const props = await mount();
    props.onOpenEvent('ev-7');
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/events/[id]', params: { id: 'ev-7' } });
  });

  it('sends Upcoming events’ See all to the Events list (E1)', async () => {
    const props = await mount();
    props.onSeeAllEvents();
    expect(mockPush).toHaveBeenLastCalledWith('/events');
  });
});
