const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

function unit(count: number, name: string): string {
  return `${count} ${name}${count === 1 ? '' : 's'}`;
}

/**
 * "1 hour", "30 minutes": the lifetime the server reported for the emailed
 * link, in words. Rounds down to whole minutes so the screen never promises more
 * time than there is. Null when the server did not say, and the screen then
 * leaves the line out.
 */
export function describeExpiry(seconds: number | null): string | null {
  if (seconds === null || !(seconds > 0)) return null;
  const minutes = Math.max(1, Math.floor(seconds / SECONDS_PER_MINUTE));
  if (minutes % MINUTES_PER_HOUR === 0) return unit(minutes / MINUTES_PER_HOUR, 'hour');
  return unit(minutes, 'minute');
}
