import { fireEvent, render, screen } from '@testing-library/react-native';

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
});
