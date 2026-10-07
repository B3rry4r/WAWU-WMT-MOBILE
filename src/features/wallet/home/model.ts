import type { AvatarHue } from '@/components/Avatar';
import type { IconName } from '@/components/icon';
import type { IconTileTone } from '@/components/IconTile';
import { isApiError } from '@/api/errors';
import { balanceProblem } from '@/api/money';
import { hueFor } from '@/features/feed/model';

import type { WalletHome, WalletTransaction } from '../api/home';

/**
 * What the Wallet tab shows, decided from its reads alone (pure, for the tests):
 *
 * - `loading`: W4, until the wallet and its balance are both in (the account
 *   number stays hidden until the balance loads, W4's note);
 * - `wallet_error`: `GET /money/wallet` failed (no connection, a server fault);
 * - `no_wallet`: nobody has a wallet until they open one (R-6); the tab leads
 *   to Open your wallet (A26) and shows the way in under it;
 * - `opening`: Open your wallet finished and the bank is still making the account;
 * - `unreachable`: W6, the bank did not answer the balance (`503 provider_unreachable`);
 * - `frozen`: the bank has the wallet frozen (`423 wallet_frozen`);
 * - `balance_error`: any other failed balance read;
 * - `ready`: W1, and W5 when the balance is 0 and there are no transactions yet.
 */
export type HomeView =
  | { kind: 'loading' }
  | { kind: 'wallet_error'; error: unknown }
  | { kind: 'no_wallet' }
  | { kind: 'opening' }
  | { kind: 'unreachable'; message: string }
  | { kind: 'frozen'; message: string }
  | { kind: 'balance_error'; error: unknown }
  | { kind: 'ready'; account: NonNullable<WalletHome['account']>; availableKobo: number };

type Read<T> = { data: T | undefined; error: unknown; isPending: boolean };

/** The sentence the server sent with a refusal, which the money contract says the app may show as it is. */
export function serverSentence(error: unknown, fallback: string): string {
  return isApiError(error) && error.message ? error.message : fallback;
}

export function homeView(wallet: Read<WalletHome>, balance: Read<{ availableKobo: number }>): HomeView {
  if (wallet.data === undefined) {
    if (wallet.error) return { kind: 'wallet_error', error: wallet.error };
    return { kind: 'loading' };
  }
  const { state, account } = wallet.data;
  if (state === 'not_open') return { kind: 'no_wallet' };
  if (state === 'opening') return { kind: 'opening' };
  if (!account) return { kind: 'wallet_error', error: wallet.error };
  if (balance.data !== undefined) return { kind: 'ready', account, availableKobo: balance.data.availableKobo };
  if (!balance.error) return { kind: 'loading' };
  switch (balanceProblem(balance.error)) {
    case 'unreachable':
      return { kind: 'unreachable', message: serverSentence(balance.error, '') };
    case 'frozen':
      return { kind: 'frozen', message: serverSentence(balance.error, '') };
    case 'no_wallet':
      return { kind: 'no_wallet' };
    case 'opening':
      return { kind: 'opening' };
    default:
      return { kind: 'balance_error', error: balance.error };
  }
}

/** "WAWU · " then the bank the server names (BRIEF W1: a slot the app fills, "Loma Bank"; R-1). */
export function bankLine(bankName: string): string {
  return `WAWU · ${bankName}`;
}

/** W5's line under "No transactions yet", with the account's own number (the server's, never the canvas's). */
export function fundingLine(groupedNumber: string): string {
  return `Send to ${groupedNumber} from any Nigerian bank.`;
}

/** Africa/Lagos is UTC+1 all year (no daylight saving): the zone the history's months are counted in (MONEY-15). */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** A row from the last six days shows its weekday ("Mon"); older ones show the date. */
const WEEKDAY_DAYS = 6;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const lagos = (at: Date) => new Date(at.getTime() + LAGOS_OFFSET_MS);
const lagosDay = (at: Date) => Math.floor(lagos(at).getTime() / DAY_MS);
const twoDigits = (n: number) => String(n).padStart(2, '0');

/**
 * When a row happened, as W1 writes it: "10:24" today, "Yesterday", "Mon"
 * within the week, then "22 Sep" (with the year when it is not this one).
 * Lagos time. Default (agent), owner may override.
 */
export function rowTime(createdAt: string, now: Date): string {
  const at = new Date(createdAt);
  if (Number.isNaN(at.getTime())) return '';
  const local = lagos(at);
  const days = lagosDay(now) - lagosDay(at);
  if (days <= 0) return `${twoDigits(local.getUTCHours())}:${twoDigits(local.getUTCMinutes())}`;
  if (days === 1) return 'Yesterday';
  if (days <= WEEKDAY_DAYS) return WEEKDAYS[local.getUTCDay()];
  const date = `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
  return local.getUTCFullYear() === lagos(now).getUTCFullYear() ? date : `${date} ${local.getUTCFullYear()}`;
}

const statusWords: Partial<Record<WalletTransaction['status'], string>> = {
  pending: 'Pending',
  failed: 'Failed',
  reversed: 'Reversed',
};

/** One recent row as W1 draws it: who or what, the line under it, the signed total and when. */
export type RecentRow = {
  id: string;
  title: string;
  subtitle?: string;
  /** Kobo, negative when money left: a debit is the total that left the wallet, fees included (BRIEF W1, rule 5). */
  amountKobo: number;
  meta: string;
  lead: { kind: 'avatar'; name: string; hue: AvatarHue; source?: string } | { kind: 'icon'; icon: IconName; tone: IconTileTone };
};

function rowIcon(row: WalletTransaction): IconName {
  if (row.category === 'bill' || row.link?.kind === 'bill') return 'Receipt';
  if (row.link?.kind === 'content_unlock') return 'LockOpen';
  if (row.category === 'refund' || row.category === 'reversal') return 'RotateCcw';
  return row.direction === 'in' ? 'ArrowDownLeft' : 'ArrowUpRight';
}

export function recentRow(row: WalletTransaction, now: Date): RecentRow {
  const name = row.counterparty?.name?.trim();
  const title = name || row.description;
  const subtitle = name && row.description ? row.description : undefined;
  const signed = row.direction === 'out' ? -row.totalKobo : row.totalKobo;
  const time = rowTime(row.createdAt, now);
  const status = statusWords[row.status];
  const meta = status ? [status, time].filter(Boolean).join(' · ') : time;
  const person = row.counterparty?.kind === 'wawu_user' && name;
  const lead: RecentRow['lead'] = person
    ? { kind: 'avatar', name, hue: hueFor(row.counterparty?.wawuUserId ?? row.id), source: row.counterparty?.avatarUrl ?? undefined }
    : { kind: 'icon', icon: rowIcon(row), tone: row.direction === 'in' ? 'in' : 'neutral' };
  return { id: row.id, title, subtitle, amountKobo: signed, meta, lead };
}

/**
 * The balance's font size: the design's size when the whole figure fits on one line, otherwise the largest
 * size, in whole steps down from it, at which it does (the figure's width grows with its size, tracking
 * included, so it scales by the ratio). Never below `floor`; a figure that does not fit even there keeps
 * the floor (lead ruling, WALLET-01 round 2: a balance is never cut off, its kobo never wraps). `natural`
 * is the figure's width drawn at `base`, `available` the width it has; 0 for either means not measured yet.
 */
export function fitFigureSize(natural: number, available: number, base: number, floor: number, step: number): number {
  if (natural <= 0 || available <= 0 || natural <= available) return base;
  const exact = (base * available) / natural;
  const stepped = Math.floor(exact / step) * step;
  return Math.max(floor, Math.min(base, stepped));
}
