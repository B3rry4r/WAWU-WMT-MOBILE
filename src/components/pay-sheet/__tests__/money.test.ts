import { feesTotalKobo, formatNaira, payTotalKobo, shortfallKobo } from '../money';

describe('pay sheet money', () => {
  it('adds the price and every fee line in kobo to make the total', () => {
    // ₦2,500 price + ₦23.25 Fintava charge (brief example values).
    expect(payTotalKobo(250000, [{ label: "Fintava's charge", amountKobo: 2325 }])).toBe(252325);
    // A bank send: ₦25,000 + ₦40 + ₦25.
    expect(
      payTotalKobo(2500000, [
        { label: "Fintava's charge", amountKobo: 4000 },
        { label: "WAWU's fee", amountKobo: 2500 },
      ]),
    ).toBe(2506500);
  });

  it('adds the fee parts into one fee total', () => {
    expect(feesTotalKobo([{ label: 'a', amountKobo: 4000 }, { label: 'b', amountKobo: 2500 }])).toBe(6500);
    expect(feesTotalKobo([{ label: 'a', amountKobo: 0 }, { label: 'b', amountKobo: 0 }])).toBe(0);
  });

  it('keeps the total equal to the price when a fee line is ₦0', () => {
    expect(payTotalKobo(150000, [{ label: "Fintava's charge", amountKobo: 0 }])).toBe(150000);
    expect(payTotalKobo(150000, [])).toBe(150000);
  });

  it('refuses amounts that are not whole kobo', () => {
    expect(() => payTotalKobo(2500.5, [])).toThrow(RangeError);
    expect(() => payTotalKobo(250000, [{ label: 'Fee', amountKobo: -1 }])).toThrow(RangeError);
    expect(() => payTotalKobo(Number.MAX_SAFE_INTEGER, [{ label: 'Fee', amountKobo: 1 }])).toThrow(RangeError);
  });

  it('works out the shortfall from the total, never the price alone', () => {
    expect(shortfallKobo(252325, 120000)).toBe(132325);
    expect(shortfallKobo(252325, 252325)).toBe(0);
    expect(shortfallKobo(252325, 48525075)).toBe(0);
  });

  it('formats kobo as naira without float rounding', () => {
    expect(formatNaira(252325)).toBe('₦2,523.25');
    expect(formatNaira(250000)).toBe('₦2,500');
    expect(formatNaira(250000, 'always')).toBe('₦2,500.00');
    expect(formatNaira(0)).toBe('₦0');
    expect(formatNaira(5)).toBe('₦0.05');
    expect(formatNaira(48525075, 'always')).toBe('₦485,250.75');
    // 0.1 + 0.2 style traps: 1,000,000,000.07 naira stays exact.
    expect(formatNaira(100000000007)).toBe('₦1,000,000,000.07');
    expect(() => formatNaira(23.25)).toThrow(RangeError);
  });
});
