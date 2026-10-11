const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const DAY_MS = 86_400_000;
/** A day name ("Mon") says which day while it is within the last week; older than that the date is written out. */
const WEEK_DAYS = 6;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const two = (n: number) => String(n).padStart(2, '0');

/** "09:12", on the phone's own clock. */
export function clockTime(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  return `${two(at.getHours())}:${two(at.getMinutes())}`;
}

/**
 * The time on an inbox row, as the design writes it: "09:12" today, "Yest." yesterday, "Mon" within the
 * last week, "12 Sep" before that. Days are the phone's own, not UTC's.
 */
export function rowTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return clockTime(iso);
  if (days === 1) return 'Yest.';
  if (days <= WEEK_DAYS) return WEEKDAYS[at.getDay()] ?? '';
  return `${at.getDate()} ${MONTHS[at.getMonth()] ?? ''}`;
}

/** The label above a run of messages: "Today", "Yesterday", the weekday within the week, then the date. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days <= WEEK_DAYS) return WEEKDAYS[at.getDay()] ?? '';
  return `${at.getDate()} ${MONTHS[at.getMonth()] ?? ''} ${at.getFullYear()}`;
}

/** The calendar day a message belongs to, for grouping: the phone's own day. */
export function dayKey(iso: string): string {
  const at = new Date(iso);
  return `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`;
}

const THOUSAND = 1000;
const MILLION = 1_000_000;

function oneDecimal(value: number): string {
  const rounded = Math.floor(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** "640 members", "2.1K members", "1 member": the list's short form of a head count. */
export function membersShort(count: number): string {
  const whole = Math.max(0, Math.floor(count));
  if (whole === 1) return '1 member';
  if (whole >= MILLION) return `${oneDecimal(whole / MILLION)}M members`;
  if (whole >= THOUSAND) return `${oneDecimal(whole / THOUSAND)}K members`;
  return `${whole} members`;
}

/** "1,204 members", the room header's full form. */
export function membersFull(count: number): string {
  const whole = Math.max(0, Math.floor(count));
  return `${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${whole === 1 ? 'member' : 'members'}`;
}

/** "48 WAWU Credits", "1 WAWU Credit". A count: never a naira value (DECISIONS R-5). */
export function wawuCredits(count: number): string {
  const whole = Math.max(0, Math.floor(count));
  return `${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} WAWU ${whole === 1 ? 'Credit' : 'Credits'}`;
}

/** "Tolu" from "Tolu Balogun": rows name who spoke by first name, as the design does. */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? '';
}

export type LastWords = { text: string | null; hasPhoto: boolean; mine: boolean; senderName: string | null };

/** The line under a room's name: "Tolu: who’s at the meetup Sat?", "You: Thanks", or "Tolu: Photo". Nothing said yet reads "No messages yet". */
export function lastLine({ text, hasPhoto, mine, senderName }: LastWords): string {
  const words = text?.trim() || (hasPhoto ? 'Photo' : '');
  if (!words) return 'No messages yet';
  const who = mine ? 'You' : firstName(senderName);
  return who ? `${who}: ${words}` : words;
}
