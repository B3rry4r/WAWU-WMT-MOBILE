import { formatMoney } from '@/components/Money';
import { nairaToKobo } from '@/api/kobo';
import { memberSinceLine, ticksOf, yearsOf, type HeaderBadge } from '@/features/me/model';
import { compactCount } from '@/features/feed/model';
import { whereLine, type PlaceParts } from '@/features/geo/place';

import type { Education, VisitorProfile } from './api';

/**
 * What M5, M6 and M33 decide from the Hub's visitor answer, kept apart from the drawing so each rule is tested on its own.
 * Every figure, tick, headline and price is the Hub's; a field it does not send leaves its element out.
 */

/** The person's name as one line: WAWU ID's name, else the handle (the Hub sends no name for a person who has none). */
export function visitorName(view: Pick<VisitorProfile, 'name' | 'profile'>): string {
  return (view.name ?? '').trim() || (view.profile.handle ?? '');
}

export const visitorTicks = (view: Pick<VisitorProfile, 'profile'>) => ticksOf(view.profile);

/** The tier pill beside the name (M5 draws it): the badge the Hub serves with the details, with its number when it is numbered. */
export function visitorBadge(fields: VisitorProfile['fields']): HeaderBadge | null {
  const badge = fields.badge;
  if (!badge || !badge.name?.trim()) return null;
  return { name: badge.name.trim(), number: badge.numbered && typeof badge.number === 'number' ? badge.number : null };
}

/** The Content tab's count: live pieces, as the Hub counted them. */
export const piecesOf = (view: Pick<VisitorProfile, 'profile'>) => view.profile.contentCount;

/** "Filmmaker and brand strategist · Founder, Lennox Films": the headline and the company, whichever the person has. */
export function headlineLine(profile: Pick<VisitorProfile['profile'], 'headline' | 'company'>): string | null {
  const parts = [profile.headline, profile.company].map((part) => (part ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/** M33's line under the title: what the person does, then where ("Filmmaker and brand strategist · Lagos, Nigeria"). */
export function subtitleLine(view: Pick<VisitorProfile, 'profile' | 'fields'>): string | null {
  const parts = [view.profile.headline, whereLine(view.fields)].map((part) => (part ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/** "Lagos, Nigeria · On Who Made This? since 2025": where, then how long they have been here. */
export function placeLine(fields: Pick<VisitorProfile['fields'], 'location' | 'memberSince'> & PlaceParts): string | null {
  const since = memberSinceLine(fields.memberSince)?.replace(/ since [A-Za-z]+ (\d{4})$/, ' since $1') ?? null;
  const parts = [whereLine(fields) ?? '', since].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(' · ') : null;
}

/** The "open to" chips: the first reads "Open to brand films" and stands out, the rest are the plain words (M33). */
export function openToChips(openTo: readonly string[]): { label: string; lead: boolean }[] {
  return openTo
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, i) => ({ label: i === 0 ? `Open to ${item.charAt(0).toLowerCase()}${item.slice(1)}` : item, lead: i === 0 }));
}

/** "Mass Communication · 2014 to 2018": the field, then the years. */
export function educationLine(row: Pick<Education, 'field' | 'startYear' | 'endYear' | 'current'>): string | null {
  const years = yearsOf({ startedOn: String(row.startYear), endedOn: row.endYear === null ? null : String(row.endYear), current: row.current });
  const parts = [(row.field ?? '').trim(), years].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(' · ') : null;
}

/** The paid messages line on Services: "₦300 a message · replies within 24 hours" is M2's; a visitor reads the same facts. */
export function paidLine(
  profile: Pick<VisitorProfile['profile'], 'dmEnabled' | 'dmPrice' | 'dmResponseHours'>,
  /** On a phone with a store (R-101 point 10) the price a visitor reads is the store's, and none where no rung sells it. Left out, the list price. */
  shown?: { forKobo: (listKobo: number) => number | null },
): { priceLine: string | null; replyLine: string | null } | null {
  if (!profile.dmEnabled || typeof profile.dmPrice !== 'number' || profile.dmPrice <= 0) return null;
  const hours = profile.dmResponseHours;
  const reply = typeof hours === 'number' && hours > 0 ? `replies within ${hours % 24 === 0 && hours > 24 ? `${hours / 24} days` : `${hours} ${hours === 1 ? 'hour' : 'hours'}`}` : null;
  const kobo = shown ? shown.forKobo(nairaToKobo(profile.dmPrice)) : nairaToKobo(profile.dmPrice);
  return { priceLine: kobo === null ? null : `${formatMoney(kobo, { decimals: false })} a message`, replyLine: reply };
}

/** What the share sheet carries: who this is and their profile link (the same text Share on Me sends, LINKS-01). */
export { profileShareText } from '@/features/me/model';

export const SEE_ALL = (count: number) => `See all ${compactCount(count)}`;
