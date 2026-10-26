/* eslint-disable @typescript-eslint/no-require-imports */
import { act, renderHook, waitFor } from '@testing-library/react-native';

/**
 * The tier offer never holds a sign-in, an account switch or a token refresh (TIER-OFFER, R-94; session-cache FIX-04). A session that
 * ends while the sign-up gate stays open (a sign-in over another account, or a refresh that brings one) resets the step, and the gate
 * does not reopen, so nothing used to ask the Hub again and the root layout held the app on its splash for good.
 */
const mockFetchOffer = jest.fn();
const mockMarkSeen = jest.fn();
jest.mock('../api', () => ({
  fetchTierOffer: (...args: unknown[]) => mockFetchOffer(...args),
  markTierOfferSeen: (...args: unknown[]) => mockMarkSeen(...args),
}));

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const mockToken = `${b64({ alg: 'RS256' })}.${b64({ sub: 'account-ada', iat: 1000, exp: 4_000_000_000 })}.sig`;
const mockEnders = new Set<() => void>();
jest.mock('@/api/session', () => ({
  getAccessToken: jest.fn(async () => mockToken),
  onSessionEnd: (listener: () => void) => {
    mockEnders.add(listener);
    return () => mockEnders.delete(listener);
  },
}));

const step = require('../offerStep') as typeof import('../offerStep');
const { resetAccountTypeWrite } = require('@/features/auth/accountTypeWrite') as typeof import('@/features/auth/accountTypeWrite');

/** What the real session does when the signed-in account's session ends: every listener runs, synchronously. */
const endSession = () => act(async () => mockEnders.forEach((listener) => listener()));

const no = { show: false, closeButton: true };
const yes = { show: true, closeButton: false };

beforeEach(() => {
  resetAccountTypeWrite();
  mockFetchOffer.mockReset();
  mockMarkSeen.mockReset().mockResolvedValue(undefined);
  step.resetTierOffer();
});

describe('a session that changes under an open app never holds it', () => {
  it('a sign-in over another account, or a refresh that brings one, leaves the app up: nothing held, nothing asked, no offer', async () => {
    mockFetchOffer.mockResolvedValue(no);
    const { result } = await renderHook(() => step.useTierOfferStep(true, 'creator'));
    await waitFor(() => expect(result.current.holding).toBe(false));
    expect(mockFetchOffer).toHaveBeenCalledTimes(1);

    await endSession();
    expect(result.current).toMatchObject({ holding: false, visible: false });
    await act(async () => undefined);
    expect(result.current).toMatchObject({ holding: false, visible: false });
    expect(mockFetchOffer).toHaveBeenCalledTimes(1);
  });

  it('an offer on screen when the account changes is dropped with the session, never shown to the next account', async () => {
    mockFetchOffer.mockResolvedValue(yes);
    const { result } = await renderHook(() => step.useTierOfferStep(true, 'creator'));
    await waitFor(() => expect(result.current.visible).toBe(true));

    await endSession();
    expect(result.current).toMatchObject({ holding: false, visible: false });
    expect(mockFetchOffer).toHaveBeenCalledTimes(1);
  });

  it("an ask still on its way when the account changes is asked again for the new account, and the first account's late answer is never shown", async () => {
    let first: (value: unknown) => void = () => undefined;
    mockFetchOffer.mockReturnValueOnce(new Promise((resolve) => (first = resolve))).mockResolvedValueOnce(no);
    const { result } = await renderHook(() => step.useTierOfferStep(true, 'creator'));
    await waitFor(() => expect(mockFetchOffer).toHaveBeenCalledTimes(1));
    expect(result.current.holding).toBe(true);

    await endSession();
    await waitFor(() => expect(result.current.holding).toBe(false));
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);

    await act(async () => first(yes));
    expect(result.current).toMatchObject({ holding: false, visible: false });
  });

  it('a sign-out and a sign-in still hold until the Hub answers for the new account, and show its offer', async () => {
    mockFetchOffer.mockResolvedValueOnce(no);
    const { result, rerender } = await renderHook(({ asked }: { asked: boolean }) => step.useTierOfferStep(asked, 'creator'), {
      initialProps: { asked: true },
    });
    await waitFor(() => expect(result.current.holding).toBe(false));

    await endSession();
    await rerender({ asked: false });
    expect(result.current.holding).toBe(false);

    let answer: (value: unknown) => void = () => undefined;
    mockFetchOffer.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    await rerender({ asked: true });
    expect(result.current).toMatchObject({ holding: true, visible: false });
    await act(async () => answer(yes));
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);
  });
});
