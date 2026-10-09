import { unbuilt } from '@/lib/unbuilt';

describe('unbuilt', () => {
  it('returns the same function for the same task id, every call', () => {
    expect(unbuilt('ME-03')).toBe(unbuilt('ME-03'));
    expect(unbuilt('ME-03')).not.toBe(unbuilt('ME-04'));
  });

  it('does nothing when called, with or without a press event', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
    const press = unbuilt('ME-03') as (...args: unknown[]) => unknown;
    expect(press()).toBeUndefined();
    expect(press({ nativeEvent: {} })).toBeUndefined();
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });
});
