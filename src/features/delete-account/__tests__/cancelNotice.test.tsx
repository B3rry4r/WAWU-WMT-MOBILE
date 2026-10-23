/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

/**
 * SWEEP-FLOWS B14 (R-17): signing in during a scheduled deletion cancels it, and the person is told so, plainly, once. This phone holds
 * a mark for the account that scheduled the deletion here; only a sign-out from Z8 after it counts.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;
let mockToken: string | null = null;
let mockStatus: 'signedIn' | 'signedOut' = 'signedOut';
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => mockToken,
  useSession: () => ({ status: mockStatus }),
}));

const notice = require('../cancelNotice') as typeof import('../cancelNotice');

beforeEach(() => {
  mockVault.clear();
  mockToken = tokenFor('ada');
  mockStatus = 'signedOut';
});

function Probe() {
  const { message, clear } = notice.useDeletionCancelledNotice();
  return (
    <>
      <Text testID="message">{message ?? ''}</Text>
      <Text testID="clear" onPress={clear}>
        clear
      </Text>
    </>
  );
}
const said = () => screen.getByTestId('message').props.children as string;
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

describe('the deletion-cancelled notice', () => {
  it('shows once after the sign-in that follows Z7 and Z8 on this phone, in plain words, and not again', async () => {
    await notice.markDeletionScheduled();
    await notice.markLeavingForDeletion();
    mockStatus = 'signedIn';
    const first = await render(<Probe />);
    await waitFor(() => expect(said()).toBe('Your account deletion is cancelled. Welcome back.'));
    expect(notice.DELETION_CANCELLED_NOTICE).not.toMatch(/—/);
    await fireEvent.press(screen.getByTestId('clear'));
    expect(said()).toBe('');
    await first.unmount();
    // The next start of the same account: nothing is said.
    await render(<Probe />);
    await settle();
    expect(said()).toBe('');
  });

  it('is not said while the person is signed out, or for an account that never scheduled a deletion here', async () => {
    const out = await render(<Probe />);
    await settle();
    expect(said()).toBe('');
    await out.unmount();
    mockStatus = 'signedIn';
    await render(<Probe />);
    await settle();
    expect(said()).toBe('');
  });

  it('is never said when the app was closed on Z8 still signed in (the cancellation was not seen), or for another account', async () => {
    await notice.markDeletionScheduled();
    mockStatus = 'signedIn';
    const closed = await render(<Probe />);
    await settle();
    expect(said()).toBe('');
    await closed.unmount();
    await notice.markLeavingForDeletion();
    mockToken = tokenFor('grace');
    await render(<Probe />);
    await settle();
    expect(said()).toBe('');
  });
});
