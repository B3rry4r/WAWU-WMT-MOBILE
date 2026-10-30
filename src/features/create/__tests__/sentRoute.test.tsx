/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, screen } from '@testing-library/react-native';

import { allowance, hub, installFetch, ok, renderFrame } from '../__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// M25's route as a creator who has just sent a piece reaches it, with a router that records where it is told to go.
const mockRouter = { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), dismissAll: jest.fn(), dismissTo: jest.fn(), canDismiss: jest.fn(() => true), back: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, Redirect: () => null }));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn', signIn: jest.fn(), signOut: jest.fn() }),
}));
jest.mock('@/features/create/CreateEntry', () => ({
  ...jest.requireActual('@/features/create/CreateEntry'),
  useCreatorGate: () => 'creator',
}));

installFetch();
const Route = (require('@/app/create-review') as typeof import('@/app/create-review')).default;
const details = require('../details') as typeof import('../details');
const { leaveToHome } = require('@/features/navigation/leaveToHome') as typeof import('@/features/navigation/leaveToHome');

beforeEach(() => {
  installFetch();
  hub.answers['GET /api/hub/uploads/allowance'] = ok(allowance(2, 5));
  details.setSent({ title: 'My piece' });
  Object.values(mockRouter).forEach((fn) => fn.mockClear());
  mockRouter.canDismiss.mockReturnValue(true);
});

describe('WALK-FIX M3 and B10 · Done on "Sent for review" always lands on Home', () => {
  it('with a stack behind it Done closes the flow and brings Home up (not dismissTo, which did nothing on the web export)', async () => {
    await renderFrame(<Route />);
    await fireEvent.press(await screen.findByTestId('review-done'));
    expect(mockRouter.dismissAll).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith('/');
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });

  it('with nothing behind it (a reload, a link) Done puts Home in its place', async () => {
    mockRouter.canDismiss.mockReturnValue(false);
    await renderFrame(<Route />);
    await fireEvent.press(await screen.findByTestId('review-done'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(mockRouter.dismissAll).not.toHaveBeenCalled();
  });

  it('View in library lands on Home and then opens My content', async () => {
    await renderFrame(<Route />);
    await fireEvent.press(await screen.findByTestId('review-library'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/');
    expect(mockRouter.push).toHaveBeenCalledWith('/library');
  });

  it('Android Back does exactly what Done does, with the real handler (Platform.OS android)', async () => {
    const { BackHandler, Platform } = require('react-native') as typeof import('react-native');
    const realOs = Platform.OS;
    Platform.OS = 'android';
    let back: (() => boolean) | undefined;
    const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_e, cb) => {
      back = cb as () => boolean;
      return { remove: jest.fn() };
    });
    try {
      await renderFrame(<Route />);
      await screen.findByTestId('review-done');
      await act(async () => {
        expect(back?.()).toBe(true);
      });
      expect(mockRouter.dismissAll).toHaveBeenCalledTimes(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith('/');
      mockRouter.canDismiss.mockReturnValue(false);
      await act(async () => {
        back?.();
      });
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    } finally {
      spy.mockRestore();
      Platform.OS = realOs;
    }
  });
});

describe('leaveToHome', () => {
  it('closes what is behind, then lands on Home; or replaces when nothing is behind', () => {
    const calls: string[] = [];
    const router = {
      canDismiss: () => true,
      dismissAll: () => calls.push('dismissAll'),
      navigate: (href: string) => calls.push(`navigate ${href}`),
      replace: (href: string) => calls.push(`replace ${href}`),
    };
    leaveToHome(router);
    expect(calls).toEqual(['dismissAll', 'navigate /']);
    calls.length = 0;
    leaveToHome({ ...router, canDismiss: () => false });
    expect(calls).toEqual(['replace /']);
  });
});
