import type { LibraryCounts } from '@/features/library/api';
import { monthWords } from '@/features/wallet/earnings/model';

/** "Earned in October": the month the Hub names (`2026-10`) in words, as W39 says it; "Earned this month" if the Hub's month is not one. */
export function earnedTitle(month: string): string {
  const label = monthWords(month);
  return label ? `Earned in ${label}` : 'Earned this month';
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
