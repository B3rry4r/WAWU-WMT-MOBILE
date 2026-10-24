/** W44's date line while the Hub serves no day for the event (TIER-06, G-804). */
export const DATE_TO_BE_ANNOUNCED = 'Date to be announced';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * The line that says when the event is: the Hub's day written out ("Sun 20 Dec 2026"), or "Date to be announced" until
 * it sends one. The day is a calendar day with no time or zone, so it is read as written and never moved by the phone's zone.
 */
export function eventLine(eventDate: string | null): string {
  if (eventDate === null) return DATE_TO_BE_ANNOUNCED;
  const [year, month, day] = eventDate.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]} ${day} ${MONTHS[month - 1]} ${year}`;
}
