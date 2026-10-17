/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { hub, installFetch, ok, renderFrame } from '../../library/__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

installFetch();
const { MeMenuSheet } = require('../MeMenuSheet') as typeof import('../MeMenuSheet');

const COUNTS = 'GET /api/hub/me/counts';

const open = async (extra: Record<string, () => void> = {}) => {
  const handlers = { settings: jest.fn(), purchases: jest.fn(), saved: jest.fn(), notifications: jest.fn() };
  const view = await renderFrame(
    <MeMenuSheet
      visible
      onClose={jest.fn()}
      onOpenSettings={handlers.settings}
      onOpenPurchases={handlers.purchases}
      onOpenSaved={handlers.saved}
      onOpenNotifications={handlers.notifications}
      {...extra}
    />,
  );
  return { ...handlers, ...view };
};

beforeEach(() => {
  installFetch();
  hub.answers[COUNTS] = ok({ purchases: 12, saved: 31, unreadNotifications: 3 });
});

describe('M7 · the Me menu rows ME-14 adds', () => {
  it('a user sees My purchases, Saved and Notifications with the Hub\'s three figures, in the canvas\'s order', async () => {
    await open();
    expect(await screen.findByText('12')).toBeTruthy();
    expect(screen.getByText('31')).toBeTruthy();
    expect(screen.getByText('3 new')).toBeTruthy();
    const titles = ['My purchases', 'Saved', 'Notifications', 'Settings'];
    const drawn = titles.map((t) => screen.getByText(t));
    expect(drawn).toHaveLength(4);
    expect(screen.getByTestId('me-menu-purchases')).toBeTruthy();
  });

  it('opens each screen from its row', async () => {
    const { purchases, saved, notifications } = await open();
    await screen.findByText('12');
    await fireEvent.press(screen.getByTestId('me-menu-purchases'));
    await fireEvent.press(screen.getByTestId('me-menu-saved'));
    await fireEvent.press(screen.getByTestId('me-menu-notifications'));
    expect(purchases).toHaveBeenCalledTimes(1);
    expect(saved).toHaveBeenCalledTimes(1);
    expect(notifications).toHaveBeenCalledTimes(1);
  });

  it('draws a title alone when a count is nothing or cannot be read, never a made-up number', async () => {
    hub.answers[COUNTS] = ok({ purchases: 0, saved: 0, unreadNotifications: 0 });
    await open();
    await waitFor(() => expect(hub.sent.some((s) => s.path === '/api/hub/me/counts')).toBe(true));
    expect(screen.getByText('My purchases')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('0 new')).toBeNull();
  });

  it('draws no row for a screen it was not given (R-47)', async () => {
    await renderFrame(<MeMenuSheet visible onClose={jest.fn()} onOpenSettings={jest.fn()} />);
    expect(screen.queryByTestId('me-menu-purchases')).toBeNull();
    expect(screen.queryByTestId('me-menu-saved')).toBeNull();
    expect(screen.queryByTestId('me-menu-notifications')).toBeNull();
    expect(hub.sent.filter((s) => s.path === '/api/hub/me/counts')).toHaveLength(0);
  });
});
