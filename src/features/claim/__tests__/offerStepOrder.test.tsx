import { act, renderHook } from '@testing-library/react-native';

import { adoptSession, resetSessionForTests } from '@/api/session';
import { offerKey } from '../localStore';
import { markOfferPending, resetOfferStep, useClaimOfferStep } from '../offerStep';

const mockVault = new Map<string, string>();
/** While true, every claim key never answers: a keystore that hangs. */
let mockHangClaimKeys = false;

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => {
    if (mockHangClaimKeys && key.startsWith('wmt.claim.')) return new Promise<string | null>(() => undefined);
    return mockVault.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    if (mockHangClaimKeys && key.startsWith('wmt.claim.')) return new Promise<void>(() => undefined);
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;

beforeEach(() => {
  mockVault.clear();
  mockHangClaimKeys = false;
  resetSessionForTests();
  resetOfferStep();
});

/**
 * JOIN-03 round 3, N13 (the round 2 survivors MV6 and MV9): two things the step does that no screen test sees, because the
 * root layout hides them (it draws the same screen either way, a moment later).
 */
describe('the "Have an access code?" step, below the layout', () => {
  it('writes the mark as well as showing the step', async () => {
    await act(async () => {
      await markOfferPending(tokenFor('account-ada'));
    });
    expect(mockVault.get(offerKey('account-ada'))).toBe('pending');
    const step = await renderHook(() => useClaimOfferStep(true));
    expect(step.result.current.visible).toBe(true);
  });

  it('is shown the moment the account is marked, even when the store does not answer (MV6)', async () => {
    // The sign-up with no email step (a mailed code) adopts its first session straight away: the first signed-in screen is
    // drawn before the store has answered, so the step cannot wait on it.
    mockHangClaimKeys = true;
    void markOfferPending(tokenFor('account-ada'));
    const step = await renderHook(() => useClaimOfferStep(true));
    expect(step.result.current.visible).toBe(true);
  });

  it('is gone the moment another account takes the session, with no layout to notice (MV9)', async () => {
    await adoptSession({ accessToken: tokenFor('account-ada'), refreshToken: 'refresh-ada' });
    await act(async () => {
      await markOfferPending(tokenFor('account-ada'));
    });
    const step = await renderHook(() => useClaimOfferStep(true));
    expect(step.result.current.visible).toBe(true);

    // Another account signs in over the first: the first one's step must not be drawn for the second.
    await act(async () => {
      await adoptSession({ accessToken: tokenFor('account-bola'), refreshToken: 'refresh-bola' });
    });
    expect(step.result.current.visible).toBe(false);
  });
});
