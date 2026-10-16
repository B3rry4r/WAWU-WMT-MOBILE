import { formatMoney } from '@/components/Money';

import type { WalletSettings } from '../api/settings';

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
const WEEKS_BEFORE_MONTHS = 8;

function unit(count: number, name: string): string {
  return `${count} ${name}${count === 1 ? '' : 's'} ago`;
}

/**
 * How long ago a time was, in the words W35 draws under Transaction PIN ("Changed 3 months ago"). Elapsed time, not
 * calendar days, so it never reads "yesterday" for a PIN changed a minute before midnight. Null when the server sent
 * no time, or one that cannot be read. A time a little ahead of this phone's clock reads as "just now".
 */
export function agoWords(iso: string | null, now: Date): string | null {
  if (iso === null) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  const minutes = Math.max(0, Math.floor((now.getTime() - at) / MS_PER_MINUTE));
  if (minutes < 1) return 'just now';
  if (minutes < MINUTES_PER_HOUR) return unit(minutes, 'minute');
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) return unit(hours, 'hour');
  const days = Math.floor(hours / HOURS_PER_DAY);
  if (days < 2) return 'yesterday';
  if (days < DAYS_PER_WEEK * 2) return unit(days, 'day');
  if (days < DAYS_PER_WEEK * WEEKS_BEFORE_MONTHS) return unit(Math.floor(days / DAYS_PER_WEEK), 'week');
  if (days < DAYS_PER_YEAR) return unit(Math.floor(days / DAYS_PER_MONTH), 'month');
  return unit(Math.floor(days / DAYS_PER_YEAR), 'year');
}

/**
 * W35's Transaction PIN line. The server records when the PIN was set or last changed (`PinStateView.changedAt`), so a
 * PIN set when the wallet opened reads as changed then: it is the time the current PIN began. No PIN yet says so, and
 * the row then leads to creating one.
 */
export function pinLine(pin: WalletSettings['pin'], now: Date): string {
  if (!pin.isSet) return 'Not set yet';
  const ago = agoWords(pin.changedAt, now);
  return ago === null ? 'Set' : `Changed ${ago}`;
}

/** The beneficiaries line: "6 saved", "1 saved", "None saved". The count is the server's (`WalletView.beneficiaryCount`). */
export function savedLine(count: number): string {
  return count === 0 ? 'None saved' : `${count} saved`;
}

/**
 * The limits row, only as the server sends it: its tier name when it names one, else "Daily limit", with the day's
 * limit and what is left of it. No tier is ever written here, and nothing is said about how the limit was reached.
 */
export function limitsLine(limits: NonNullable<WalletSettings['limits']>): { title: string; subtitle: string } {
  return {
    title: limits.tier ?? 'Daily limit',
    subtitle: `${formatMoney(limits.dailyLimitKobo, { decimals: false })} daily · ${formatMoney(limits.remainingTodayKobo, { decimals: false })} left today`,
  };
}

/** The Account details line, as W35 draws it: the bank, a dot, then the account number in the groups A8 uses. */
export function accountLine(bankName: string, groupedNumber: string): string {
  return `${bankName} · ${groupedNumber}`;
}
