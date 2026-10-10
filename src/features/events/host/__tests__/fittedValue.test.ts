import { fittedValueSize } from '../hostParts';

describe('fittedValueSize (E14 Starts in a half-width field)', () => {
  const width = 111;
  it('keeps the drawn size when the value fits', () => {
    expect(fittedValueSize('14:00', width)).toBe(15.5);
    expect(fittedValueSize(null, width)).toBe(15.5);
  });
  it('shrinks a long value instead of cutting the time off, never below 12', () => {
    const small = fittedValueSize('Sun 8 Nov, 14:00', width);
    expect(small).toBeLessThan(15.5);
    expect(small).toBeGreaterThanOrEqual(12);
    expect(fittedValueSize('Wed 28 Oct, 20:00', width)).toBeLessThanOrEqual(small);
    expect(fittedValueSize('Wed 28 Oct 2027, 20:00', width)).toBe(12);
  });
});
