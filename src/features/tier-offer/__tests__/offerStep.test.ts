/* eslint-disable @typescript-eslint/no-require-imports */
import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockFetchOffer = jest.fn();
const mockMarkSeen = jest.fn();
jest.mock('../api', () => ({
  fetchTierOffer: (...args: unknown[]) => mockFetchOffer(...args),
  markTierOfferSeen: (...args: unknown[]) => mockMarkSeen(...args),
}));

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const mockToken = `${b64({ alg: 'RS256' })}.${b64({ sub: 'account-ada', iat: 1000, exp: 4_000_000_000 })}.sig`;
jest.mock('@/api/session', () => ({
  getAccessToken: jest.fn(async () => mockToken),
  onSessionEnd: jest.fn(),
}));

const step = require('../offerStep') as typeof import('../offerStep');

beforeEach(() => {
  mockFetchOffer.mockReset();
  mockMarkSeen.mockReset().mockResolvedValue(undefined);
  step.resetTierOffer();
});

describe('the tier offer step (TIER-OFFER, R-94)', () => {
  it("asks the Hub once the gate is open, holds until it answers, then shows the offer with the Hub's close setting", async () => {
    let answer: (value: unknown) => void = () => undefined;
    mockFetchOffer.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { result } = await renderHook(() => step.useTierOfferStep(true, 'creator'));
    expect(result.current).toMatchObject({ holding: true, visible: false });
    await act(async () => {
      answer({ show: true, closeButton: false });
    });
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current).toMatchObject({
      holding: false,
      closeButton: false,
    });
    expect(mockFetchOffer).toHaveBeenCalledTimes(1);
  });

  it('asks nothing before the gate is open, and holds nothing', async () => {
    const { result } = await renderHook(() => step.useTierOfferStep(false, 'creator'));
    expect(result.current).toMatchObject({ visible: false, holding: false });
    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it('never asks about a discoverer account (a fan has no shop for a tier to unlock)', async () => {
    const { result } = await renderHook(() => step.useTierOfferStep(true, 'user'));
    await waitFor(() => expect(result.current.holding).toBe(false));
    expect(result.current.visible).toBe(false);
    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it('shows nothing when the Hub says no, and when it fails (the next start asks again, nothing was marked)', async () => {
    mockFetchOffer.mockResolvedValueOnce({ show: false, closeButton: true });
    const first = await renderHook(() => step.useTierOfferStep(true, 'creator'));
    await waitFor(() => expect(first.result.current.holding).toBe(false));
    expect(first.result.current.visible).toBe(false);
    await first.unmount();

    await act(async () => step.resetTierOffer());
    mockFetchOffer.mockRejectedValueOnce(new Error('offline'));
    const second = await renderHook(() => step.useTierOfferStep(true, 'creator'));
    await waitFor(() => expect(second.result.current.holding).toBe(false));
    expect(second.result.current.visible).toBe(false);
    expect(mockMarkSeen).not.toHaveBeenCalled();
  });

  it('gives up on a Hub that is too slow, and ignores the answer that comes late', async () => {
    jest.useFakeTimers();
    try {
      let answer: (value: unknown) => void = () => undefined;
      mockFetchOffer.mockReturnValue(new Promise((resolve) => (answer = resolve)));
      const { result } = await renderHook(() => step.useTierOfferStep(true, 'creator'));
      await act(async () => {
        await jest.advanceTimersByTimeAsync(step.TIER_OFFER_WAIT_MS + 10);
      });
      expect(result.current).toMatchObject({ holding: false, visible: false });
      await act(async () => {
        answer({ show: true, closeButton: true });
        await jest.advanceTimersByTimeAsync(10);
      });
      expect(result.current.visible).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('tells the Hub once that the offer was drawn, however many times it is told, and closing ends the step', async () => {
    mockFetchOffer.mockResolvedValue({ show: true, closeButton: true });
    const { result } = await renderHook(() => step.useTierOfferStep(true, 'creator'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    step.settleTierOffer();
    step.settleTierOffer();
    await act(async () => {
      step.finishTierOffer();
    });
    expect(mockMarkSeen).toHaveBeenCalledTimes(1);
    expect(result.current.visible).toBe(false);
  });

  it("hands Subscribe's tier to the bridge once, and a session that ends clears it", async () => {
    mockFetchOffer.mockResolvedValue({ show: true, closeButton: true });
    const { result } = await renderHook(() => step.useTierOfferStep(true, 'creator'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    await act(async () => {
      step.finishTierOffer({ tierId: 'plus', kind: 'tier' });
    });
    expect(result.current.checkout).toEqual({ tierId: 'plus', kind: 'tier' });
    expect(step.takeTierOfferCheckout()).toEqual({
      tierId: 'plus',
      kind: 'tier',
    });
    expect(step.takeTierOfferCheckout()).toBeNull();
    await act(async () => step.resetTierOffer());
  });
});
