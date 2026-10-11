import { act, renderHook } from '@testing-library/react-native';

import { useSettled } from '../useSettled';

/**
 * The wait before a meter is checked (D3): the value comes back only after it has stopped changing for the whole wait.
 * The times are literals so that a change to the wait is seen here too.
 */
describe('useSettled', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const advance = (ms: number) =>
    act(async () => {
      jest.advanceTimersByTime(ms);
    });
  const start = (value: string) => renderHook(({ value: v }: { value: string }) => useSettled(v, 600), { initialProps: { value } });

  it('opens on the value it is given', async () => {
    const { result } = await start('a');
    expect(result.current).toBe('a');
  });

  it('returns the new value only once 600 ms have passed without another change', async () => {
    const { result, rerender } = await start('');
    await rerender({ value: '1' });
    await advance(599);
    expect(result.current).toBe('');
    await advance(1);
    expect(result.current).toBe('1');
  });

  it('keys 100 ms apart never settle until the last one has had 600 ms to itself', async () => {
    const { result, rerender } = await start('');
    for (let i = 1; i <= 11; i += 1) {
      await rerender({ value: '0'.repeat(i) });
      await advance(100);
      expect(result.current).toBe('');
    }
    await advance(499);
    expect(result.current).toBe('');
    await advance(1);
    expect(result.current).toBe('0'.repeat(11));
  });

  it('a change at 599 ms of quiet starts the wait again', async () => {
    const { result, rerender } = await start('');
    await rerender({ value: 'a' });
    await advance(599);
    await rerender({ value: 'ab' });
    await advance(599);
    expect(result.current).toBe('');
    await advance(1);
    expect(result.current).toBe('ab');
  });

  it('a value put back to what was settled settles nothing and sets no late timer', async () => {
    const { result, rerender } = await start('a');
    await rerender({ value: 'b' });
    await advance(300);
    await rerender({ value: 'a' });
    await advance(5000);
    expect(result.current).toBe('a');
  });
});
