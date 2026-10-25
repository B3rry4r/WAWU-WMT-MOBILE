import type { IconName } from '@/components/icon';
import { watOf } from '@/features/events/format';

import type { ConsultationOption, SlotMedium, SlotsView } from './api';

/** The icon each kind wears on S18's cards (`medium(...)`: Video, Phone, MapPin). */
const ICONS: Record<ConsultationOption['medium'], IconName> = { zoom: 'Video', phone: 'Phone', physical: 'MapPin' };

export type MediumRow = {
  medium: ConsultationOption['medium'];
  /** "Video call", "Phone call", "In person": the Hub's own label. */
  title: string;
  /** "30 minutes", or for an in-person consultation how it is arranged. */
  sub: string;
  /** What the Hub charges for it, or null when it is priced per matter ("On request"). */
  priceKobo: number | null;
  icon: IconName;
};

const minutesLine = (minutes: number | null) => (minutes === null ? '' : `${minutes} minutes`);

/** S18's cards from the Hub's options, in the order it gave them. */
export function mediumRows(options: readonly ConsultationOption[]): MediumRow[] {
  return options.map((o) => ({
    medium: o.medium,
    title: o.label,
    sub: o.onRequest ? (o.priceKobo === null ? 'Arranged by email, fee per matter' : 'Arranged by email') : minutesLine(o.minutes),
    priceKobo: o.priceKobo,
    icon: ICONS[o.medium],
  }));
}

export const isCall = (medium: MediumRow['medium']): medium is SlotMedium => medium === 'zoom' || medium === 'phone';

export type DayChip = {
  /** The Lagos date as the Hub gave it ("2026-10-02"). */
  date: string;
  /** "Thu" and 2. */
  weekday: string;
  day: number;
  slots: { startsAt: string; time: string; available: boolean; mine: boolean }[];
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** True when two ISO times are the same instant (the Hub and the matter may write the same hour with different suffixes). */
const sameInstant = (a: string, b: string): boolean => new Date(a).getTime() === new Date(b).getTime();

/**
 * The days the calendar offers: those with at least one hour still free, each with all its times (a taken hour stays on the grid,
 * greyed). The hour the person's own unpaid booking holds is served as taken (it is held for them); it is theirs to pick again, so it
 * is drawn free and marked `mine` (CHECK-3 S19: after backing out of the pay sheet it must read as their choice, not as taken).
 */
export function dayChips(view: SlotsView, ownHold: string | null = null): DayChip[] {
  const free = (startsAt: string, available: boolean): boolean => available || (ownHold !== null && sameInstant(startsAt, ownHold));
  return view.days
    .filter((d) => d.slots.some((s) => free(s.startsAt, s.available)))
    .map((d) => {
      const at = new Date(`${d.date}T00:00:00Z`);
      return {
        date: d.date,
        weekday: WEEKDAYS[at.getUTCDay()],
        day: at.getUTCDate(),
        slots: d.slots.map((s) => {
          const w = watOf(s.startsAt);
          return { startsAt: s.startsAt, time: `${w.hour}:${w.minute}`, available: free(s.startsAt, s.available), mine: ownHold !== null && sameInstant(s.startsAt, ownHold) };
        }),
      };
    });
}

/** "Thu 2 Oct, 12:00 (Lagos time)": the pick as the line under the times says it. */
export function pickedLine(startsAt: string, timeZone: string): string {
  const w = watOf(startsAt);
  const when = `${w.weekday} ${w.day} ${w.month}, ${w.hour}:${w.minute}`;
  return timeZone === 'Africa/Lagos' ? `${when} (Lagos time)` : when;
}

const NUMBER_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** How long the calendar looks ahead, as S25 says it: 21 days is "three weeks", anything that is not whole weeks is in days. */
export function horizonWords(days: number): string {
  if (days >= 7 && days % 7 === 0) {
    const weeks = days / 7;
    return `${NUMBER_WORDS[weeks] || weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `${days} days`;
}

/** "Video consultation", the pay sheet's title for what was booked. */
export function consultationTitle(medium: MediumRow['medium']): string {
  if (medium === 'zoom') return 'Video consultation';
  if (medium === 'phone') return 'Phone consultation';
  return 'In-person consultation';
}

/** "Thu 2 Oct, 12:00 · 30 min": the line under the title on the pay sheet. Left to the hour alone when the length is not known. */
export function sheetSubtitle(startsAt: string | null, minutes: number | null): string {
  const parts: string[] = [];
  if (startsAt) {
    const w = watOf(startsAt);
    parts.push(`${w.weekday} ${w.day} ${w.month}, ${w.hour}:${w.minute}`);
  }
  if (minutes !== null) parts.push(`${minutes} min`);
  return parts.join(' · ');
}
