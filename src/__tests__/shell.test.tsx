import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { setInboxUnread } from '@/features/inbox/unread';

const routes = {
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
};

/** The tabs of the app's bottom bar. Home draws a tab row of its own (Today, Following, For you, HOME-01), whose tabs are `feed-tab-*`. */
const barTabs = () => screen.getAllByRole('tab').filter((t) => !String(t.props.testID ?? '').startsWith('feed-tab-'));

/*
 * Nothing here depends on how fast the machine is or how warm Jest's cache is.
 * The first router render loads and first-renders the tab navigator and its
 * screens (about 1 s with a cold cache, over 4 s on a loaded machine), all
 * inside one test's 5 s budget. Rendering the app once here pays that with a
 * 60 s budget of its own (the same fix as lists.test.tsx).
 */
beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

describe('tab shell', () => {
  beforeEach(async () => {
    await act(async () => setInboxUnread(0));
  });

  it('lands on Home from a cold start', async () => {
    await renderRouter(routes);
    expect(screen.getByRole('tab', { name: 'Home' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy();
  });

  it('moves between the five tabs, in order', async () => {
    await renderRouter(routes);
    const names = barTabs().map((t) => t.props.accessibilityLabel);
    expect(names).toEqual(['Home', 'Explore', 'Inbox', 'Wallet', 'Me']);

    for (const label of [
      'Explore',
      'Inbox',
      'Wallet',
      'Me',
      'Home',
    ]) {
      await fireEvent.press(screen.getByRole('tab', { name: label }));
      expect(screen.getByRole('header', { name: label })).toBeTruthy();
      expect(screen.getByRole('tab', { name: label }).props.accessibilityState.selected).toBe(true);
      expect(barTabs().filter((t) => t.props.accessibilityState.selected)).toHaveLength(1);
    }
  });

  it('shows no Inbox badge until the inbox reports unread messages', async () => {
    await renderRouter(routes);
    expect(screen.queryByTestId('tab-badge')).toBeNull();
    await act(async () => setInboxUnread(3));
    expect(screen.getByTestId('tab-badge')).toHaveTextContent('3');
    expect(screen.getByRole('tab', { name: 'Inbox, 3 unread' })).toBeTruthy();
    await act(async () => setInboxUnread(0));
    expect(screen.queryByTestId('tab-badge')).toBeNull();
  });
});
