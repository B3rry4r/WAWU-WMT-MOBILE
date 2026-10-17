import { monthName } from '@/features/wallet/history/lagosTime';

import type { LibraryCounts } from '@/features/library/api';
import type { MyEarnings } from './api';

/** The shortest a bar is drawn, as a share of the tallest, so a month with nothing in it is still a mark (the board's shortest is 26%). */
export const MIN_BAR = 0.12;
const MINUS = '−';

/** "September": the name of the month the Hub names (`2026-09`). The 15th is used so the Lagos hour can never move it. */
export function monthWord(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return monthName(new Date(Date.UTC(y, m - 1, 15)));
}

/** "Earned in September". */
export const earnedTitle = (e: MyEarnings): string => `Earned in ${monthWord(e.month)}`;

/** One bar per month, a share of the tallest from 0 to 1, the least being `MIN_BAR`. The last is the month named, drawn in the accent. */
export function barsOf(e: MyEarnings): { month: string; share: number; last: boolean }[] {
  const tallest = Math.max(...e.months.map((m) => m.earnedKobo));
  return e.months.map((m, i) => ({
    month: m.month,
    share: tallest === 0 ? MIN_BAR : Math.max(MIN_BAR, m.earnedKobo / tallest),
    last: i === e.months.length - 1,
  }));
}

/** "+18%" in the positive tone, "−12%" in the danger tone, "0%" quiet; nothing when the Hub has no month to compare with (it sends null). */
export function changeOf(e: MyEarnings): { label: string; tone: 'positive' | 'danger' | 'neutral' } | null {
  if (e.changePct === null) return null;
  if (e.changePct > 0) return { label: `+${e.changePct}%`, tone: 'positive' };
  if (e.changePct < 0) return { label: `${MINUS}${Math.abs(e.changePct)}%`, tone: 'danger' };
  return { label: '0%', tone: 'neutral' };
}

/** "4 live · 1 in review · 1 rejected", the parts that have something in them; "Nothing yet" when none has. */
export function contentLine(c: LibraryCounts): string {
  const parts = [
    c.live > 0 ? `${c.live} live` : '',
    c.pending > 0 ? `${c.pending} in review` : '',
    c.rejected > 0 ? `${c.rejected} rejected` : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Nothing yet';
}
