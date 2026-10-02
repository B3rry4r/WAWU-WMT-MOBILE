import { formatMoney } from '@/components/Money';

import type { PinApproval } from './types';

const KOBO_PER_NAIRA = 100;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

/**
 * Kobo (R-21) to naira as the PIN sheet writes it, through the shared
 * formatter: "₦25,065" for whole naira (W11), "₦2,523.25" when there are kobo.
 */
export function sheetAmount(kobo: number): string {
  return formatMoney(kobo, { decimals: Math.round(kobo) % KOBO_PER_NAIRA !== 0 });
}

/** The line under the title: the total the payer pays, fees included. */
export function approvalLine(approval: PinApproval): string {
  const amount = sheetAmount(approval.totalKobo);
  if (approval.payee !== undefined) return `Approve ${amount} to ${approval.payee}`;
  return `${amount} for ${approval.purpose}`;
}

export function wrongPinLine(triesLeft: number): string {
  if (triesLeft <= 0) return 'Wrong PIN.';
  return `Wrong PIN. ${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left.`;
}

/** Milliseconds from `now` until `lockedUntil` (ISO 8601); 0 once passed or unreadable. */
export function msUntil(lockedUntil: string, now: number): number {
  const at = Date.parse(lockedUntil);
  if (Number.isNaN(at)) return 0;
  return Math.max(0, at - now);
}

const two = (n: number) => String(n).padStart(2, '0');

/**
 * The wait as a running clock, the canvas's countdown format (W37 "Resend in
 * 0:42"): "m:ss" under an hour, "h:mm:ss" from an hour. Nothing is rounded to
 * minutes or hours; seconds are rounded up, so it never reads 0:00 while the
 * PIN is still locked.
 */
export function waitClock(remainingMs: number): string {
  const total = Math.ceil(remainingMs / MS_PER_SECOND);
  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = total % SECONDS_PER_MINUTE;
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${minutes}:${two(seconds)}`;
}

export function lockedLine(remainingMs: number): string {
  return `Too many wrong tries. Try again in ${waitClock(remainingMs)}.`;
}
