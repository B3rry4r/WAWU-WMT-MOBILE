import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { darkColors, lightColors } from '@/theme/tokens.generated';

import { ExploreBar } from '../ExploreBar';

describe('X1 · the bell in the bar', () => {
  it('is not drawn unless Notifications can be opened (R-47)', async () => {
    await render(<ExploreBar unread={4} />);
    expect(screen.queryByTestId('explore-bell')).toBeNull();
    expect(screen.queryByTestId('explore-bell-dot')).toBeNull();
  });

  it('opens Notifications when pressed, and says so to a screen reader', async () => {
    const open = jest.fn();
    await render(<ExploreBar onOpenNotifications={open} unread={0} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Notifications' }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('draws the dot only while the Hub says something is unread', async () => {
    const { rerender } = await render(<ExploreBar onOpenNotifications={jest.fn()} unread={0} />);
    expect(screen.queryByTestId('explore-bell-dot')).toBeNull();
    await rerender(<ExploreBar onOpenNotifications={jest.fn()} unread={3} />);
    expect(screen.getByTestId('explore-bell-dot')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Notifications, new ones waiting' })).toBeTruthy();
  });

  // SWEEP-APP-5 (HOME-18 L1): Explore's bar draws the `explore` fit of the shared bell, not Today's. The mutant that gave Explore the
  // `today` variant (a 40 button, the dot 9 from the top and 10 from the right) passed every test; X1's canvas draws 44, 10 and 11.
  it('draws the bell as X1 does: a 44 round button, its dot 8 across, 10 from the top and 11 from the right, ringed 2 in the card colour', async () => {
    await render(<ExploreBar onOpenNotifications={jest.fn()} unread={2} />);
    const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style) as Record<string, unknown>;
    expect(flat('explore-bell')).toMatchObject({ width: 44, height: 44 });
    expect(flat('explore-bell-dot')).toMatchObject({ width: 8, height: 8, top: 10, right: 11 });
    const ring = (flat('explore-bell-dot').boxShadow as { color: string }[])[0];
    expect(ring).toMatchObject({ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 2 });
    expect([darkColors.surfaceCard, lightColors.surfaceCard]).toContain(ring.color);
  });
});
