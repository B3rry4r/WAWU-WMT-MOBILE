import {
  dayLabel,
  daysBetween,
  lagosToday,
  monthTitle,
  monthWeeks,
  partsOf,
  periodProblem,
  presetRange,
  shiftMonth,
} from '../period';

describe('Lagos days', () => {
  it('today in Lagos is the phone clock plus an hour, read as UTC, whatever the phone zone', () => {
    expect(lagosToday(new Date('2026-09-26T10:00:00Z'))).toBe('2026-09-26');
    expect(lagosToday(new Date('2026-09-25T23:30:00Z'))).toBe('2026-09-26');
    expect(lagosToday(new Date('2026-09-25T22:59:59.999Z'))).toBe('2026-09-25');
    expect(lagosToday(new Date('2026-12-31T23:00:00Z'))).toBe('2027-01-01');
  });

  it('the presets are the days W38 draws: 3 months on 26 Sep is 1 Jul to 26 Sep', () => {
    expect(presetRange('three_months', '2026-09-26')).toEqual({ from: '2026-07-01', to: '2026-09-26' });
    expect(presetRange('this_month', '2026-09-26')).toEqual({ from: '2026-09-01', to: '2026-09-26' });
    expect(presetRange('last_month', '2026-09-26')).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  it('the presets cross a year and handle February', () => {
    expect(presetRange('last_month', '2027-01-05')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(presetRange('three_months', '2027-02-10')).toEqual({ from: '2026-12-01', to: '2027-02-10' });
    expect(presetRange('last_month', '2027-03-01')).toEqual({ from: '2027-02-01', to: '2027-02-28' });
    expect(presetRange('last_month', '2028-03-01')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(presetRange('this_month', '2026-09-01')).toEqual({ from: '2026-09-01', to: '2026-09-01' });
  });

  it('writes a day as W38 does, and a month as the calendar does', () => {
    expect(dayLabel('2026-07-01')).toBe('1 Jul 2026');
    expect(dayLabel('2026-09-26')).toBe('26 Sep 2026');
    expect(monthTitle(2026, 9)).toBe('September 2026');
  });

  it('refuses what is not a day', () => {
    for (const bad of ['2026-02-30x', '2026-13-01', '26-09-2026', '', '2026-9-1']) expect(() => partsOf(bad)).toThrow();
  });

  it('counts days between, and moves a month', () => {
    expect(daysBetween('2026-09-01', '2026-09-26')).toBe(25);
    expect(daysBetween('2026-09-26', '2026-09-01')).toBe(-25);
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('a month is whole weeks, Monday first, with every day once', () => {
    const weeks = monthWeeks(2026, 9); // 1 Sep 2026 is a Tuesday
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0].slice(0, 2)).toEqual([null, '2026-09-01']);
    const days = weeks.flat().filter((d): d is string => d !== null);
    expect(days).toHaveLength(30);
    expect(days[0]).toBe('2026-09-01');
    expect(days[29]).toBe('2026-09-30');
    expect(monthWeeks(2026, 2).flat().filter(Boolean)).toHaveLength(28);
    expect(monthWeeks(2028, 2).flat().filter(Boolean)).toHaveLength(29);
    // A month that starts on a Monday has no leading blanks.
    expect(monthWeeks(2026, 6)[0][0]).toBe('2026-06-01');
  });

  it('the only problems the phone judges: the order, and a last day after today', () => {
    expect(periodProblem('2026-09-01', '2026-09-26', '2026-09-26')).toBeNull();
    expect(periodProblem('2026-09-26', '2026-09-26', '2026-09-26')).toBeNull();
    expect(periodProblem('2026-09-27', '2026-09-26', '2026-09-26')).toMatch(/on or before/);
    expect(periodProblem('2026-09-01', '2026-09-27', '2026-09-26')).toMatch(/after today/);
    // Its length is the server's to judge: a year and more is not refused here.
    expect(periodProblem('2024-01-01', '2026-09-26', '2026-09-26')).toBeNull();
  });
});
