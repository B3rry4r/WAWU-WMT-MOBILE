import { whenLine } from '../format';
import { addDays, daysBetween, endOf, endShown, emptyDraft } from '../host/hostForm';

/** FIX-110 (G-443): a multi-day event names both days; the host picks the end's day. */
const NOW = Date.parse('2026-10-01T00:00:00Z');

describe('a multi-day event', () => {
  it('names both days, in the event\'s own zone, and keeps the start time', () => {
    const zone = { endsAt: '2026-11-10T16:00:00.000Z' };
    expect(whenLine('2026-11-08T13:00:00.000Z', zone, NOW)).toBe('Sun 8 Nov to Tue 10 Nov · 14:00 WAT');
  });

  it('reads as before when it ends on its start day, has no end, or the end is not a date', () => {
    expect(whenLine('2026-11-08T13:00:00.000Z', { endsAt: '2026-11-08T20:00:00.000Z' }, NOW)).toBe('Sun 8 Nov · 14:00 WAT');
    expect(whenLine('2026-11-08T13:00:00.000Z', { endsAt: null }, NOW)).toBe('Sun 8 Nov · 14:00 WAT');
    expect(whenLine('2026-11-08T13:00:00.000Z', { endsAt: 'soon' }, NOW)).toBe('Sun 8 Nov · 14:00 WAT');
    expect(whenLine('2026-11-08T13:00:00.000Z', undefined, NOW)).toBe('Sun 8 Nov · 14:00 WAT');
  });

  it('goes by the Lagos day: an end just after midnight in Lagos is the next day', () => {
    // 23:30 UTC on the 8th is 00:30 WAT on the 9th.
    expect(whenLine('2026-11-08T13:00:00.000Z', { endsAt: '2026-11-08T23:30:00.000Z' }, NOW)).toBe('Sun 8 Nov to Mon 9 Nov · 14:00 WAT');
  });

  it('adds the year to each day that is not in this year', () => {
    expect(whenLine('2027-01-02T09:00:00.000Z', { endsAt: '2027-01-04T09:00:00.000Z' }, NOW)).toBe('Sat 2 Jan 2027 to Mon 4 Jan 2027 · 10:00 WAT');
  });

  it('is what the host picks: the end day is a number of days after the start, and the Ends field says both days', () => {
    expect(daysBetween('2026-11-08', '2026-11-10')).toBe(2);
    expect(addDays('2026-11-30', 2)).toBe('2026-12-02');
    const draft = { ...emptyDraft(), day: '2026-11-08', startTime: '14:00', endTime: '18:00', endDaysAfter: 2 };
    expect(endOf(draft)).toEqual({ day: '2026-11-10', time: '18:00' });
    expect(endShown(draft, NOW)).toBe('Tue 10 Nov, 18:00');
    expect(endShown({ ...draft, endDaysAfter: 0 }, NOW)).toBe('18:00');
  });
});
