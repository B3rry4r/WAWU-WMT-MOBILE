import { useState } from 'react';

import { todayOf } from './model';

/**
 * Today as the Hub writes a day (YYYY-MM-DD), on this phone's own calendar, read once when the screen opens so the screen
 * does not change under a person reading it at midnight. Every place the schools screens need "today" (SC2's course days,
 * SC3's Starts) reads it here, so no screen reads the day in UTC by itself.
 */
export function useToday(): string {
  const [today] = useState(() => todayOf(new Date()));
  return today;
}
