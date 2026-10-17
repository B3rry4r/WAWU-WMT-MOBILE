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

  it('is never shown signed out, and a token with no account marks nothing', async () => {
    await markBonusPending('not-a-token');
    const { result } = await renderHook(() => useBonusStep(false));
    expect(result.current.visible).toBe(false);
  });
});
