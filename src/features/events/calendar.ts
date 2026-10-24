import { createEventInCalendarAsync } from 'expo-calendar/legacy';
import { Linking, Platform } from 'react-native';

import type { WalletOrder } from './buyApi';

/** What a calendar entry needs, all from the order's event: the Hub's own name, times and place. */
export type CalendarEvent = Pick<WalletOrder['event'], 'name' | 'startsAt' | 'endsAt' | 'timezone' | 'location' | 'venueName'>;

/**
 * An event with no end is held for three hours in the calendar: the calendar needs an end and the Hub gives none for these.
 * PROVISIONAL(EVENT-CALENDAR-HOLD, owner=EVENTS-06, why=no ruling or canvas sizes it; the owner may set another length).
 */
const OPEN_ENDED_MS = 3 * 60 * 60 * 1000;

const where = (event: CalendarEvent) => [event.venueName, event.location].map((p) => p?.trim() ?? '').filter(Boolean).join(', ');
const endOf = (event: CalendarEvent) => (event.endsAt ? new Date(event.endsAt) : new Date(new Date(event.startsAt).getTime() + OPEN_ENDED_MS));

/** Google Calendar's own "add event" page, for the browser build: `YYYYMMDDTHHmmssZ` dates in UTC. */
function googleUrl(event: CalendarEvent): string {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${stamp(new Date(event.startsAt))}/${stamp(endOf(event))}`,
    location: where(event),
  });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

/**
 * Add to calendar (E5). On a phone the app opens the phone's own "new event" screen with the event filled in
 * (`createEventInCalendarAsync`), which needs no calendar permission: the person saves it or not. In the browser build it opens
 * the calendar's add page in a new tab. Resolves false when it could not be opened.
 */
export async function addToCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      await Linking.openURL(googleUrl(event));
      return true;
    }
    await createEventInCalendarAsync({
      title: event.name,
      startDate: new Date(event.startsAt),
      endDate: endOf(event),
      location: where(event),
      ...(event.timezone ? { timeZone: event.timezone } : {}),
    });
    return true;
  } catch {
    return false;
  }
}
