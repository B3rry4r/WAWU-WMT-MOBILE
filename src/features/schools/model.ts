import type { ChipItem } from '@/components/FilterChips';

import type { CourseCard, CourseDetail, IntakeView, SchoolCard, SchoolCategory } from './api';

/** What the chip row filters by: every school, or one category the contract accepts. */
export type CategoryChoice = SchoolCategory | 'all';

/** The chips' words, in the canvas's order (SC1: All, Tech, Business, Creative, Languages, Vocational). Typed by the contract's categories, so a new one cannot be left without a label. */
const categoryLabels: Record<SchoolCategory, string> = {
  tech: 'Tech',
  business: 'Business',
  creative: 'Creative',
  languages: 'Languages',
  vocational: 'Vocational',
};

export const categoryChips: readonly ChipItem<CategoryChoice>[] = [
  { value: 'all', label: 'All' },
  ...(Object.keys(categoryLabels) as SchoolCategory[]).map((value) => ({ value, label: categoryLabels[value] })),
];

/** The longest search text the Hub takes (`GET /schools` `q`: 100 characters). */
export const SEARCH_MAX = 100;

/** A control character (C0, DEL, C1), a line or paragraph separator, or a byte order mark: none of them is ever part of a search. */
const CONTROL = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\uFEFF]/g;
/** The text without any UTF-16 half that has no partner (the Hub refuses it as a broken character). */
function withoutLoneHalves(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const unit = text.charCodeAt(i);
    const high = unit >= 0xd800 && unit <= 0xdbff;
    const low = unit >= 0xdc00 && unit <= 0xdfff;
    if (high && i + 1 < text.length && text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) {
      out += text.charAt(i) + text.charAt(i + 1);
      i += 1;
    } else if (!high && !low) {
      out += text.charAt(i);
    }
  }
  return out;
}

/**
 * What goes to the Hub for what a person typed: control characters become spaces (a NUL, a tab or a pasted line break
 * never reaches the request), broken halves of a character are dropped, runs of spaces are one space, the ends are
 * trimmed, and it is cut to the Hub's limit without splitting a character. '' means no search.
 */
export function cleanQuery(typed: string): string {
  const spaced = withoutLoneHalves(typed.replace(CONTROL, ' ')).replace(/\s+/g, ' ').trim();
  if (spaced.length <= SEARCH_MAX) return spaced;
  // A cut between the two halves of an emoji leaves a lone half: drop it.
  return withoutLoneHalves(spaced.slice(0, SEARCH_MAX)).trim();
}

/** "18 courses", "1 course". */
export function courseCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'course' : 'courses'}`;
}

/** SC1's line under a school's name: where it is and how many courses it has (the rating is left off, R-32). */
export function cardLine(card: Pick<SchoolCard, 'location' | 'courseCount'>): string {
  return `${card.location} · ${courseCountLabel(card.courseCount)}`;
}

/** SC2's line under the name: where it is, and since when when the school gave a year. */
export function profileLine(school: Pick<SchoolCard, 'location' | 'foundedYear'>): string {
  return school.foundedYear === null ? school.location : `${school.location} · Since ${school.foundedYear}`;
}

/** "12 weeks", "1 week". */
export function weeksLabel(weeks: number): string {
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
}

type Mode = CourseDetail['mode'];
const modeWords: Record<Mode, string> = { online: 'online', in_person: 'in person', hybrid: 'online + in person' };

/** The way a course is taught, in lower case for a line (SC2: "12 weeks · online"). */
export function modeLabel(mode: Mode): string {
  return modeWords[mode];
}

/** SC2's line under a course's name: its length and how it is taught. */
export function courseLine(course: Pick<CourseCard, 'weeks' | 'mode'>): string {
  return `${weeksLabel(course.weeks)} · ${modeLabel(course.mode)}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** Today as the Hub writes a day (YYYY-MM-DD), on this phone's calendar. */
export function todayOf(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "Mon 3 November" from a day the Hub wrote as YYYY-MM-DD. The day is read as the calendar day it names, never shifted by a time zone. Null when it is not a real day. */
export function dayLabel(day: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const date = Number(m[3]);
  const at = new Date(year, month - 1, date);
  if (at.getFullYear() !== year || at.getMonth() !== month - 1 || at.getDate() !== date) return null;
  return `${WEEKDAYS[at.getDay()]} ${date} ${MONTHS[month - 1]}`;
}

/**
 * The class SC3 tells about: the soonest shown intake that has not started (the Hub lists them soonest first, and does not
 * drop past ones). Null when none is still to come, so the screen does not announce a start date that has passed.
 */
export function upcomingIntake(intakes: readonly IntakeView[], today: string): IntakeView | null {
  return intakes.find((intake) => intake.startDate >= today) ?? null;
}

const capitalised = (text: string): string => (text === '' ? text : `${text.charAt(0).toUpperCase()}${text.slice(1)}`);

/** SC3's "Classes" value: how it is taught, then the class's days and place ("Online, Saturdays in Yaba"). The way it is taught alone when no class is coming. */
export function classesLine(mode: Mode, intake: Pick<IntakeView, 'schedule' | 'location'> | null): string {
  const how = capitalised(modeLabel(mode));
  if (!intake) return how;
  const days = intake.schedule.trim();
  const place = intake.location?.trim() ?? '';
  return [days === '' ? how : `${how}, ${days}`, place === '' ? '' : ` in ${place}`].join('');
}

/** SC3's "You get" value: what the school says the course gives, as a list on one line. */
export function youGetLine(outcomes: readonly string[]): string {
  return outcomes
    .map((outcome) => outcome.trim())
    .filter((outcome) => outcome !== '')
    .join(', ');
}

/** The lines of a list the school wrote, without the empty ones (the syllabus). */
export function nonEmpty(lines: readonly string[]): string[] {
  return lines.map((line) => line.trim()).filter((line) => line !== '');
}

/** The rows of every page read so far, in the order the Hub gave them. A school is listed once even if two pages overlap. */
export function rowsOf(pages: readonly { items: readonly SchoolCard[] }[] | undefined): SchoolCard[] {
  const seen = new Set<string>();
  const rows: SchoolCard[] = [];
  for (const page of pages ?? []) {
    for (const card of page.items) {
      if (seen.has(card.id)) continue;
      seen.add(card.id);
      rows.push(card);
    }
  }
  return rows;
}

/** What an empty list says, by cause: a search with no match (SC10, as drawn), a category nobody is listed in, or no school at all. */
export function emptyCopy(category: CategoryChoice, q: string): { title: string; message: string } {
  if (q !== '') return { title: `No schools for "${q}"`, message: 'Try a shorter search, or browse a category.' };
  if (category !== 'all') return { title: `No ${categoryLabels[category]} schools yet`, message: 'Try another category.' };
  return { title: 'No schools yet', message: 'Check back later.' };
}
