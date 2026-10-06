/**
 * How long to wait, in words, from the seconds the server answered: never a
 * figure the server did not give. A banner reads "Try again {phrase}."
 */
const MINUTE = 60;
const HOUR = 60 * MINUTE;
/** From here up a wait reads "about an hour". */
const NEAR_AN_HOUR = 45 * MINUTE;
/** From here up minutes are rounded to fives ("about 20 minutes"). */
const ROUND_FROM = 5 * MINUTE;
const FIVE = 5;

export function waitPhrase(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return 'later';
  if (seconds < MINUTE) return 'in under a minute';
  if (seconds < ROUND_FROM) {
    const minutes = Math.ceil(seconds / MINUTE);
    return minutes === 1 ? 'in a minute' : `in ${minutes} minutes`;
  }
  if (seconds < NEAR_AN_HOUR) return `in about ${Math.round(seconds / MINUTE / FIVE) * FIVE} minutes`;
  const hours = Math.round(seconds / HOUR);
  return hours <= 1 ? 'in about an hour' : `in about ${hours} hours`;
}
