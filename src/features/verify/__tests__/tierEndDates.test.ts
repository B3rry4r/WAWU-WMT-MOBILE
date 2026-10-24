import { endsOn } from '@/features/points/model';
import { dateWords } from '@/features/wallet/history/lagosTime';

import { dayOf } from '../purchaseModel';
import { endingLine, stateLine } from '../YourTierScreen';

/*
 * FIX-78 F-3: every end date of a tier, a pass or a lot of points is written by one rule, in Lagos time: the day and the board's
 * three-letter month, with the year added when the date is not in the current year. A 12-month tier bought today ends on this day
 * next year, and must never read as ending today. Every case is written against a fixed day, so none changes with the calendar.
 */
const NOW = new Date('2026-10-18T09:00:00Z');
const NOW_MS = NOW.getTime();

describe('dayOf (the tier screens)', () => {
  it('leaves the year off for a date in this year', () => {
    expect(dayOf('2026-11-26T00:00:00.000Z', NOW)).toBe('26 Nov');
    expect(dayOf('2026-10-18T09:00:00.000Z', NOW)).toBe('18 Oct');
  });

  it('adds the year to a date in another year: a 12-month tier bought today ends 18 Oct 2027, not "18 Oct"', () => {
    expect(dayOf('2027-10-18T09:00:00.000Z', NOW)).toBe('18 Oct 2027');
    expect(dayOf('2025-10-18T09:00:00.000Z', NOW)).toBe('18 Oct 2025');
  });

  it('turns the year at midnight in Lagos, for the date and for today', () => {
    expect(dayOf('2026-12-31T22:59:00Z', NOW)).toBe('31 Dec');
    expect(dayOf('2026-12-31T23:00:00Z', NOW)).toBe('1 Jan 2027');
    expect(dayOf('2027-01-01T12:00:00Z', new Date('2026-12-31T23:30:00Z'))).toBe('1 Jan');
  });

  it('is null with no date or one that is not a date', () => {
    expect(dayOf(null, NOW)).toBeNull();
    expect(dayOf(undefined, NOW)).toBeNull();
    expect(dayOf('', NOW)).toBeNull();
    expect(dayOf('not a date', NOW)).toBeNull();
  });
});

describe('the Your tier card line', () => {
  it('says "Active until" with the year when the tier ends in another year, and without it this year', () => {
    expect(stateLine({ state: 'active', activeUntil: '2027-10-18T09:00:00.000Z' }, NOW_MS)).toBe('Active until 18 Oct 2027');
    expect(stateLine({ state: 'active', activeUntil: '2026-11-26T00:00:00.000Z' }, NOW_MS)).toBe('Active until 26 Nov');
  });

  it('says "Ended" with the year when the tier ended in another year', () => {
    expect(stateLine({ state: 'ended', activeUntil: '2025-10-18T09:00:00.000Z' }, NOW_MS)).toBe('Ended 18 Oct 2025');
    expect(stateLine({ state: 'ended', activeUntil: '2026-09-01T10:00:00.000Z' }, NOW_MS)).toBe('Ended 1 Sep');
  });

  it('says "Ends in 3 days" with the year when those days reach into the next one', () => {
    const now = new Date('2026-12-30T09:00:00Z').getTime();
    expect(endingLine('2027-01-02T09:00:00.000Z', now)).toBe('Ends in 3 days · 2 Jan 2027');
    expect(endingLine('2026-11-02T09:00:00.000Z', new Date('2026-10-30T09:00:00Z').getTime())).toBe('Ends in 3 days · 2 Nov');
    expect(stateLine({ state: 'ending', activeUntil: '2027-01-02T09:00:00.000Z' }, now)).toBe('Ends in 3 days · 2 Jan 2027');
  });

  it('writes no date when the Hub sent none (never one worked out from a price or a length)', () => {
    expect(stateLine({ state: 'active', activeUntil: null }, NOW_MS)).toBe('Active');
    expect(stateLine({ state: 'ended', activeUntil: null }, NOW_MS)).toBe('Ended');
    expect(endingLine(null, NOW_MS)).toBe('Ending soon');
    expect(stateLine({ state: 'none', activeUntil: null }, NOW_MS)).toBeNull();
  });
});

describe('one rule for every end date', () => {
  it('writes the tier screens, the meter and the points lots the same way', () => {
    for (const iso of ['2026-11-26T00:00:00.000Z', '2027-10-18T09:00:00.000Z', '2025-03-01T09:00:00.000Z', '2026-12-31T23:30:00.000Z']) {
      expect(dayOf(iso, NOW)).toBe(dateWords(new Date(iso), NOW));
      expect(endsOn(iso, NOW)).toBe(dateWords(new Date(iso), NOW));
    }
  });
});
