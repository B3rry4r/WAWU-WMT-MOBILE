import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor as waitForRaw } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import ClaimCodeRoute from '@/app/claim-code';
import ClaimOfferRoute from '@/app/claim-offer';
import WelcomeRoute from '@/app/welcome';
import { adoptSession, resetSessionForTests, signOut } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { resetSignupGate } from '@/features/auth/signupGate';
import { markOfferPending, resetOfferStep } from '../offerStep';
import { offerKey, STORE_WAIT_MS } from '../localStore';

/** The machine that runs these is often loaded: wait up to 15 s for a screen, never less than the default. */
const waitFor = (check: () => void) => waitForRaw(check, { timeout: 15_000 });

jest.setTimeout(60_000);

const mockVault = new Map<string, string>();
/** While true, every read or write of a claim key never answers: a keystore that hangs. */
let mockHangClaimKeys = false;
/** While true, every claim key fails: a keystore that is broken. */
let mockBreakClaimKeys = false;

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => {
    if (key.startsWith('wmt.claim.')) {
      if (mockHangClaimKeys) return new Promise<string | null>(() => undefined);
      if (mockBreakClaimKeys) throw new Error('keystore unavailable');
    }
    return mockVault.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    if (key.startsWith('wmt.claim.')) {
      if (mockHangClaimKeys) return new Promise<void>(() => undefined);
      if (mockBreakClaimKeys) throw new Error('keystore unavailable');
    }
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  'claim-offer': ClaimOfferRoute,
  'claim-code': ClaimCodeRoute,
};

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;
const ADA = 'account-ada';
const BOLA = 'account-bola';

const signedInAs = (sub: string) => {
  mockVault.set(ACCESS_KEY, tokenFor(sub));
  mockVault.set(REFRESH_KEY, 'stored-refresh');
};
const flag = (sub: string) => mockVault.get(offerKey(sub));

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  mockHangClaimKeys = false;
  mockBreakClaimKeys = false;
  resetSessionForTests();
  resetOfferStep();
  resetSignupGate();
  // The Hub and WAWU ID cannot be reached: every answer fails as if the phone were offline.
  globalThis.fetch = jest.fn(async () => {
    throw new TypeError('Network request failed');
  }) as typeof fetch;
});

const home = () => screen.getByRole('header', { name: 'Home' });

describe('right after sign-up a person is asked once whether they have an access code (JOIN-03 round 2)', () => {
  it('shows "Have an access code?" for an account marked at sign-up, and Skip opens the app and ends it for good', async () => {
    signedInAs(ADA);
    mockVault.set(offerKey(ADA), 'pending');
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    expect(screen.getByText('Have an access code?')).toBeTruthy();
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    // Showing it once is enough: it settled itself the moment it was drawn.
    await waitFor(() => expect(flag(ADA)).toBe('done'));

    await fireEvent.press(screen.getByTestId('claim-offer-skip'));
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('claim-offer')).toBeNull();
  });

  it('does not come back on the next start, even when the person closed the app without choosing', async () => {
    signedInAs(ADA);
    mockVault.set(offerKey(ADA), 'pending');
    const first = await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    await waitFor(() => expect(flag(ADA)).toBe('done'));
    await first.unmount();

    resetSessionForTests();
    resetOfferStep();
    resetSignupGate();
    await renderRouter(routes);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('claim-offer')).toBeNull();
  });

  it('Enter code opens the claim screen, and Back from it lands on Home (never on the step again)', async () => {
    signedInAs(ADA);
    mockVault.set(offerKey(ADA), 'pending');
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('claim-offer-enter'));
    await waitFor(() => expect(screen.getByTestId('claim-screen')).toBeTruthy());
    expect(screen.getByText('Your access code')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('auth-back'));
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('claim-offer')).toBeNull();
  });

  it('shows nothing to an account that signed in without being marked: the existing accounts, and every sign-in', async () => {
    signedInAs(ADA);
    await renderRouter(routes);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('claim-offer')).toBeNull();
    expect(flag(ADA)).toBeUndefined();
  });

  it('shows nothing to an account whose step is already done', async () => {
    signedInAs(ADA);
    mockVault.set(offerKey(ADA), 'done');
    await renderRouter(routes);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('claim-offer')).toBeNull();
  });

  it("is the first thing a person sees when sign-up hands them their session: marked, then signed in, no flash of Home", async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
    const tokens = { accessToken: tokenFor(BOLA), refreshToken: 'r1' };
    await act(async () => {
      await markOfferPending(tokens.accessToken);
      await adoptSession(tokens);
    });
    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    expect(flag(BOLA)).toBe('done');
  });

  it("does not carry one account's step to the next account on the same phone", async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
    await act(async () => {
      await markOfferPending(tokenFor(ADA));
      await adoptSession({ accessToken: tokenFor(ADA), refreshToken: 'r1' });
    });
    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    await act(async () => {
      await signOut();
    });
    await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
    await act(async () => {
      await adoptSession({ accessToken: tokenFor(BOLA), refreshToken: 'r2' });
    });
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('claim-offer')).toBeNull();
  });

  it('never blocks the app: a keystore that hangs or fails for this flag means Home, with no step', async () => {
    for (const break_ of [false, true]) {
      mockVault.clear();
      signedInAs(ADA);
      mockHangClaimKeys = !break_;
      mockBreakClaimKeys = break_;
      resetSessionForTests();
      resetOfferStep();
      resetSignupGate();
      const view = await renderRouter(routes);
      await waitFor(() => expect(home()).toBeTruthy());
      expect(screen.queryByTestId('claim-offer')).toBeNull();
      await view.unmount();
    }
  });

  it('marking a sign-up never throws when the keystore fails or hangs, and gives up on a hanging one after the wait', async () => {
    mockBreakClaimKeys = true;
    await expect(markOfferPending(tokenFor(ADA))).resolves.toBeUndefined();
    resetOfferStep();
    mockBreakClaimKeys = false;
    mockHangClaimKeys = true;
    const marking = markOfferPending(tokenFor(ADA));
    let settled = false;
    void marking.then(() => {
      settled = true;
    });
    // A store that never answers holds the sign-up up for the wait and no longer (the phone's timers are advanced by hand).
    await jest.advanceTimersByTimeAsync(STORE_WAIT_MS - 100);
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(200);
    await expect(marking).resolves.toBeUndefined();
    expect(settled).toBe(true);
  });

  it('a token that cannot be read marks nobody', async () => {
    await markOfferPending('not-a-jwt');
    expect([...mockVault.keys()].filter((k) => k.startsWith('wmt.claim.'))).toEqual([]);
  });
});
