import { readerDay } from '../model';

/** 26 September 2025, mid-morning on the phone. */
const now = new Date(2025, 8, 26, 9, 41);

describe('the day the reader opens on (HOME-16)', () => {
  it('is today when nothing is asked for', () => {
    expect(readerDay(undefined, now)).toBe('2025-09-26');
    expect(readerDay('', now)).toBe('2025-09-26');
    expect(readerDay(null, now)).toBe('2025-09-26');
  });

  it('is the day a morning notice names, when it is yesterday, today or tomorrow on the phone', () => {
    expect(readerDay('2025-09-25', now)).toBe('2025-09-25');
    expect(readerDay('2025-09-26', now)).toBe('2025-09-26');
    expect(readerDay('2025-09-27', now)).toBe('2025-09-27');
  });

  it('is today when the notice is older or further on than the Hub takes a read for', () => {
    expect(readerDay('2025-09-24', now)).toBe('2025-09-26');
    expect(readerDay('2025-09-28', now)).toBe('2025-09-26');
    expect(readerDay('2024-09-26', now)).toBe('2025-09-26');
  });

  it('is today when what was asked for is not a real day', () => {
    for (const bad of ['2025-02-30', '2025-13-01', 'today', '26-09-2025', '2025-09-26T07:00:00Z', '2025-9-26', 20250926, {}, []]) {
      expect(readerDay(bad, now)).toBe('2025-09-26');
    }
  });

  it('counts days across a month and a year end', () => {
    const newYear = new Date(2026, 0, 1, 7, 0);
    expect(readerDay('2025-12-31', newYear)).toBe('2025-12-31');
    expect(readerDay('2026-01-02', newYear)).toBe('2026-01-02');
    expect(readerDay('2025-12-30', newYear)).toBe('2026-01-01');
    const leap = new Date(2028, 1, 29, 7, 0);
    expect(readerDay('2028-02-28', leap)).toBe('2028-02-28');
    expect(readerDay('2028-03-01', leap)).toBe('2028-03-01');
  });
});
