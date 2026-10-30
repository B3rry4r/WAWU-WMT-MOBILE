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
const { noteAccountTypeWrite, resetAccountTypeWrite } = require('@/features/auth/accountTypeWrite') as typeof import('@/features/auth/accountTypeWrite');

beforeEach(() => {
  resetAccountTypeWrite();
  mockFetchOffer.mockReset();
  mockMarkSeen.mockReset().mockResolvedValue(undefined);
  step.resetTierOffer();
});

describe('the tier offer step (TIER-OFFER, R-94; the Hub decides who and how often, R-105)', () => {
  it("asks the Hub once the gate is open, holds until it answers, then shows the offer with the Hub's close setting", async () => {
    let answer: (value: unknown) => void = () => undefined;
    mockFetchOffer.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { result } = await renderHook(() => step.useTierOfferStep(true));
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
    const { result } = await renderHook(() => step.useTierOfferStep(false));
    expect(result.current).toMatchObject({ visible: false, holding: false });
    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it('decides nothing itself: it shows the offer for whoever the Hub says show to, and for nobody else, and asks again on every start (R-105)', async () => {
    mockFetchOffer.mockResolvedValue({ show: true, closeButton: true });
    const first = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(first.result.current.visible).toBe(true));
    await act(async () => {
      step.finishTierOffer();
    });
    expect(first.result.current.visible).toBe(false);
    await first.unmount();

    // The app is closed and opened again: the Hub is asked again and its yes shows the offer again; nothing here remembers it was shown.
    await act(async () => step.resetTierOffer());
    const second = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(second.result.current.visible).toBe(true));
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);
    await act(async () => {
      step.finishTierOffer();
    });
    expect(mockMarkSeen).toHaveBeenCalledTimes(2);
    await second.unmount();

    // And the Hub's no is the end of it, whoever the person is.
    await act(async () => step.resetTierOffer());
    mockFetchOffer.mockResolvedValue({ show: false, closeButton: true });
    const third = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(third.result.current.holding).toBe(false));
    expect(third.result.current.visible).toBe(false);
    expect(mockFetchOffer).toHaveBeenCalledTimes(3);
  });

  it('shows nothing when the Hub says no, and when it fails (the next start asks again, nothing was marked)', async () => {
    mockFetchOffer.mockResolvedValueOnce({ show: false, closeButton: true });
    const first = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(first.result.current.holding).toBe(false));
    expect(first.result.current.visible).toBe(false);
    await first.unmount();

    await act(async () => step.resetTierOffer());
    mockFetchOffer.mockRejectedValueOnce(new Error('offline'));
    const second = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(second.result.current.holding).toBe(false));
    expect(second.result.current.visible).toBe(false);
    expect(mockMarkSeen).not.toHaveBeenCalled();
  });

  it('gives up on a Hub that is too slow, and ignores the answer that comes late', async () => {
    jest.useFakeTimers();
    try {
      let answer: (value: unknown) => void = () => undefined;
      mockFetchOffer.mockReturnValue(new Promise((resolve) => (answer = resolve)));
      const { result } = await renderHook(() => step.useTierOfferStep(true));
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
    const { result } = await renderHook(() => step.useTierOfferStep(true));
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
    const { result } = await renderHook(() => step.useTierOfferStep(true));
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

describe('the tier offer step asks again after the account type was written (TIER-OFFER round 2, F1)', () => {
  const no = { show: false, closeButton: true };
  const yes = { show: true, closeButton: false };

  it('asks once more when the Hub said no while a creator type was just written, and shows the offer on the second answer', async () => {
    noteAccountTypeWrite(Promise.resolve('creator'));
    mockFetchOffer.mockResolvedValueOnce(no).mockResolvedValueOnce(yes);
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);
    expect(result.current.closeButton).toBe(false);
  });

  it('asks once more when the first ask failed, too', async () => {
    noteAccountTypeWrite(Promise.resolve('creator'));
    mockFetchOffer.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(yes);
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);
  });

  it('never asks twice when the Hub already said show (no extra wait)', async () => {
    noteAccountTypeWrite(Promise.resolve('creator'));
    mockFetchOffer.mockResolvedValue(yes);
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(mockFetchOffer).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an ordinary start that wrote nothing', () => Promise.resolve(null)],
    ['a write that failed', () => Promise.reject(new Error('refused'))],
  ])('asks once after %s', async (_name, write) => {
    noteAccountTypeWrite(write());
    mockFetchOffer.mockResolvedValue(no);
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(result.current.holding).toBe(false));
    expect(result.current.visible).toBe(false);
    expect(mockFetchOffer).toHaveBeenCalledTimes(1);
  });

  it("asks once more after a write that left the account a buyer's, too (R-105: the Hub offers the tiers to every account type)", async () => {
    noteAccountTypeWrite(Promise.resolve('user'));
    mockFetchOffer.mockResolvedValueOnce(no).mockResolvedValueOnce(yes);
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);
  });

  it("a Hub that has not been updated answers no to a buyer both times: nothing is shown, nothing is marked, the app goes on", async () => {
    noteAccountTypeWrite(Promise.resolve('user'));
    mockFetchOffer.mockResolvedValue(no);
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(result.current.holding).toBe(false));
    expect(result.current.visible).toBe(false);
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);
    expect(mockMarkSeen).not.toHaveBeenCalled();
  });

  it('asks once when no write was noted at all', async () => {
    mockFetchOffer.mockResolvedValue(no);
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(result.current.holding).toBe(false));
    expect(mockFetchOffer).toHaveBeenCalledTimes(1);
  });

  it('keeps holding for a write still on its way, then asks once more', async () => {
    let landed: (type: 'creator') => void = () => undefined;
    noteAccountTypeWrite(new Promise((resolve) => (landed = resolve)));
    mockFetchOffer.mockResolvedValueOnce(no).mockResolvedValueOnce(yes);
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(mockFetchOffer).toHaveBeenCalledTimes(1));
    expect(result.current).toMatchObject({ holding: true, visible: false });
    await act(async () => {
      landed('creator');
    });
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);
  });

  it('does not hold the splash for ever on a write that never finishes', async () => {
    jest.useFakeTimers();
    try {
      noteAccountTypeWrite(new Promise(() => undefined));
      mockFetchOffer.mockResolvedValue(no);
      const { result } = await renderHook(() => step.useTierOfferStep(true));
      await act(async () => {
        await jest.advanceTimersByTimeAsync(step.TIER_OFFER_WAIT_MS * 2 + 50);
      });
      expect(result.current).toMatchObject({ holding: false, visible: false });
      expect(mockFetchOffer).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps no offer when the second ask fails too, and marks nothing', async () => {
    noteAccountTypeWrite(Promise.resolve('creator'));
    mockFetchOffer.mockResolvedValueOnce(no).mockRejectedValueOnce(new Error('offline'));
    const { result } = await renderHook(() => step.useTierOfferStep(true));
    await waitFor(() => expect(result.current.holding).toBe(false));
    expect(result.current.visible).toBe(false);
    expect(mockFetchOffer).toHaveBeenCalledTimes(2);
    expect(mockMarkSeen).not.toHaveBeenCalled();
  });
});
