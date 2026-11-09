/* eslint-disable @typescript-eslint/no-require-imports */
import { act, renderHook } from '@testing-library/react-native';

/** WEBAPP-08 F4: "See the tiers" ends the offer and hands the tiers sheet to the bridge once, with no checkout. */
jest.mock('../api', () => ({ fetchTierOffer: jest.fn(async () => ({ show: true, closeButton: true })), markTierOfferSeen: jest.fn(async () => undefined) }));
jest.mock('@/api/session', () => ({ getAccessToken: jest.fn(async () => null), onSessionEnd: jest.fn() }));

const step = require('../offerStep') as typeof import('../offerStep');

it('finishTierOfferToTiers: the step is done, the tiers sheet is asked for once, no checkout', async () => {
  step.resetTierOffer();
  const { result } = await renderHook(() => step.useTierOfferStep(true));
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => step.finishTierOfferToTiers());
  expect(result.current.toTiers).toBe(true);
  expect(result.current.checkout).toBeNull();
  expect(result.current.visible).toBe(false);
  expect(step.takeTierOfferToTiers()).toBe(true);
  expect(step.takeTierOfferToTiers()).toBe(false);
});
