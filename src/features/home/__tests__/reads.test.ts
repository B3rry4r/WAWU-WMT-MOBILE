import * as rtl from '@testing-library/react-native';

import { outcomeOf, useRead, type Outcome } from '../reads';

const read = async (first: Outcome) => rtl.renderHook(({ outcome }: { outcome: Outcome }) => useRead(outcome), { initialProps: { outcome: first } });

describe('a read as Today needs it, held steady across a retry', () => {
  it('is pending only before its first answer', async () => {
    const hook = await read('pending');
    expect(hook.result.current).toEqual({ pending: true, failed: false });
    await hook.rerender({ outcome: 'ok' });
    expect(hook.result.current).toEqual({ pending: false, failed: false });
  });

  it('keeps a failed read failed, not pending, while it is asked again', async () => {
    const hook = await read('pending');
    await hook.rerender({ outcome: 'failed' });
    expect(hook.result.current).toEqual({ pending: false, failed: true });
    await hook.rerender({ outcome: 'pending' });
    expect(hook.result.current).toEqual({ pending: false, failed: true });
    await hook.rerender({ outcome: 'ok' });
    expect(hook.result.current).toEqual({ pending: false, failed: false });
  });

  it('a read that was answered and is reset reads as pending again (a new account), not as failed', async () => {
    const hook = await read('ok');
    await hook.rerender({ outcome: 'pending' });
    expect(hook.result.current).toEqual({ pending: true, failed: false });
  });

  it('a failure after an answer is a failure', async () => {
    const hook = await read('ok');
    await hook.rerender({ outcome: 'failed' });
    expect(hook.result.current).toEqual({ pending: false, failed: true });
  });

  it('reads a query as answered, failed or on its way', () => {
    expect(outcomeOf({ isSuccess: true, isError: false })).toBe('ok');
    expect(outcomeOf({ isSuccess: false, isError: true })).toBe('failed');
    expect(outcomeOf({ isSuccess: false, isError: false })).toBe('pending');
  });
});
