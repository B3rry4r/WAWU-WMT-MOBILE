import type { PinApproval } from './types';

const KOBO_PER_NAIRA = 100;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

function groupThousands(whole: number): string {
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Kobo (integer) to naira as the canvas writes it on the PIN sheet:
 * "₦25,065" for whole naira, "₦2,523.25" when there are kobo.
 */
export function formatNaira(kobo: number): string {
  const safe = Math.max(0, Math.round(kobo));
  const naira = Math.floor(safe / KOBO_PER_NAIRA);
  const rest = safe % KOBO_PER_NAIRA;
  const whole = `₦${groupThousands(naira)}`;
  return rest === 0 ? whole : `${whole}.${String(rest).padStart(2, '0')}`;
}

/** The line under the title: the total the payer pays, fees included. */
export function approvalLine(approval: PinApproval): string {
  const amount = formatNaira(approval.totalKobo);
  if (approval.payee !== undefined) return `Approve ${amount} to ${approval.payee}`;
  return `${amount} for ${approval.purpose}`;
}

export function wrongPinLine(triesLeft: number): string {
  if (triesLeft <= 0) return 'Wrong PIN.';
  return `Wrong PIN. ${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left.`;
}

/** Milliseconds from `now` until `until`; 0 once it has passed or cannot be read. */
export function msUntil(until: Date | string, now: number): number {
  const at = until instanceof Date ? until.getTime() : Date.parse(until);
  if (Number.isNaN(at)) return 0;
  return Math.max(0, at - now);
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Try again in 14 minutes." Rounded up, so it never reads 0 while still locked. */
export function lockedLine(remainingMs: number): string {
  const seconds = Math.ceil(remainingMs / MS_PER_SECOND);
  if (seconds < SECONDS_PER_MINUTE) {
    return `Too many wrong tries. Try again in ${plural(seconds, 'second', 'seconds')}.`;
  }
  const minutes = Math.ceil(seconds / SECONDS_PER_MINUTE);
  if (minutes < MINUTES_PER_HOUR) {
    return `Too many wrong tries. Try again in ${plural(minutes, 'minute', 'minutes')}.`;
  }
  const hours = Math.ceil(minutes / MINUTES_PER_HOUR);
  return `Too many wrong tries. Try again in ${plural(hours, 'hour', 'hours')}.`;
}
