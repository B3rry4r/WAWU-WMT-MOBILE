import { act, renderHook } from '@testing-library/react-native';

import { finishBonusStep, markBonusPending, resetBonusStep, useBonusStep } from '../bonusStep';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const tokenFor = (sub: string) => `${b64({ alg: 'none' })}.${b64({ sub })}.sig`;

afterEach(() => resetBonusStep());

describe('the VF1 step comes once, right after sign-up', () => {
  it('shows only for an account the sign-up marked, and "Build my shop" ends it', async () => {
    const { result } = await renderHook(() => useBonusStep(true));
    expect(result.current.visible).toBe(false);
    await act(async () => {
      await markBonusPending(tokenFor('11111111-1111-4111-8111-111111111111'));
    });
    expect(result.current.visible).toBe(true);
    await act(async () => finishBonusStep());
    expect(result.current.visible).toBe(false);
  });

  it('is never shown to a discoverer, and their mark is settled so it cannot come back', async () => {
    const sub = '22222222-2222-4222-8222-222222222222';
    const { result, rerender } = await renderHook(({ type }: { type: string | null }) => useBonusStep(true, type), { initialProps: { type: null } });
    await act(async () => {
      await markBonusPending(tokenFor(sub));
    });
    expect(result.current.visible).toBe(true);
    // WAWU ID's progress says user: VF1 is gone at once, and stays gone even if the type later reads as creator.
    await rerender({ type: 'user' });
    expect(result.current.visible).toBe(false);
    await rerender({ type: 'creator' });
    expect(result.current.visible).toBe(false);
  });

  it('is never shown signed out, and a token with no account marks nothing', async () => {
    await markBonusPending('not-a-token');
    const { result } = await renderHook(() => useBonusStep(false));
    expect(result.current.visible).toBe(false);
  });
});
