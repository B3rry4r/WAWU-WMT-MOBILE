import { balanceProblem, type WalletBalance } from '@/api/money';
import { isApiError } from '@/api/errors';
import type { FeedScope } from '@/features/feed/api';
import type { TgifPreference } from '@/features/settings/api/hub';
import type { TgifDay } from '@/features/tgif/api/tgif';
import { cardOrder, cardText, compactCount, dateText } from '@/features/tgif/model';

import type { CreatorSuggestion } from './api';

/** Home's three tabs (H1): Today is this screen, Following and For you are the feed (HOME-02). */
export type HomeView = 'today' | FeedScope;

export const homeViews: readonly { view: HomeView; label: string }[] = [
  { view: 'today', label: 'Today' },
  { view: 'following', label: 'Following' },
  { view: 'for_you', label: 'For you' },
];

/** The month's first three letters: H1 writes "FRIDAY 26 SEP". */
const SHORT_MONTH = 3;

/**
 * The small capitals over the TGIF card: "TGIF · FRIDAY 26 SEP" for the day the Hub served.
 * Written out by `dateText`, as the reader writes its own header, so every phone reads the same.
 */
export function tgifDayLabel(date: string): string {
  const [weekday, day, month] = dateText(date).split(' ');
  return `TGIF · ${weekday} ${day} ${month.slice(0, SHORT_MONTH)}`.toUpperCase();
}

/** How many of the day's cards have words: the reader shows one per card. */
export function tgifCardCount(day: TgifDay): number {
  return cardOrder.filter((card) => cardText(day, card).trim().length > 0).length;
}

/**
 * The line under the series: "5 cards · 12.4K reading today". The cards are counted from the
 * day the Hub served and the readers are the Hub's count for the day (HOME-10), written as the
 * reader writes its counts. No readers yet, or a count that has not come, leaves that part out
 * rather than claim a figure. H1's "2 min" has nothing behind it and is not drawn (G-280).
 */
export function tgifMeta(day: TgifDay, readers: number | null | undefined): string {
  const count = tgifCardCount(day);
  const parts = [`${count} ${count === 1 ? 'card' : 'cards'}`];
  if (typeof readers === 'number' && readers > 0) parts.push(`${compactCount(readers)} reading today`);
  return parts.join(' · ');
}

/**
 * Whether Today shows the TGIF card. The person's own switch (Z2, `GET /settings/tgif`) decides.
 * While it cannot be read the Hub's own default stands (shown: nobody has turned it off until
 * they do, HOME-11), so a failed read never hides TGIF from someone who wants it.
 */
export function showsTgif(preference: TgifPreference | undefined, failed: boolean): boolean {
  if (preference) return preference.show;
  return failed;
}

/** The people the rail offers: the Hub's list without the viewer, who can never follow themselves. */
export function discoverable(items: readonly CreatorSuggestion[], myId: string | null | undefined): CreatorSuggestion[] {
  return items.filter((item) => item.wawuId !== myId);
}

/** Which tick follows the name on a card: the creator tick (purple), else the professional tick (blue). */
export function suggestionTick(item: CreatorSuggestion): 'creator' | 'pro' | null {
  if (item.verification?.creator?.verified) return 'creator';
  if (item.verification?.professional?.verified) return 'pro';
  return null;
}

/** The line under a creator's name: what they do, as they listed it. Nothing when they listed nothing. */
export function suggestionLine(item: CreatorSuggestion): string | null {
  const field = item.field?.trim();
  return field ? field : null;
}

/**
 * What the balance card shows (H1, MONEY-11, MONEY-13):
 * - `figure`: Fintava's available balance, never one worked out here;
 * - `no_wallet`: nobody has a wallet until they open one (R-6); the card leads to A26;
 * - `opening`: Open your wallet finished and the account is still being made;
 * - `unreachable`: the bank did not answer (W6's words);
 * - `frozen`: the bank holds the wallet;
 * - `error`: anything else (no connection, a server fault), with Try again.
 * Each refusal carries the Hub's own sentence where it sent one.
 */
export type BalanceView =
  | { kind: 'loading' }
  | { kind: 'figure'; kobo: number }
  | { kind: 'no_wallet' | 'opening' | 'frozen' | 'unreachable' | 'error'; message: string };

const fallbacks: Record<'no_wallet' | 'opening' | 'frozen' | 'unreachable' | 'error', string> = {
  no_wallet: "You don't have a wallet yet. Open your wallet to continue.",
  opening: 'Your account is still being opened. Check again in a moment.',
  frozen: 'Your wallet is on hold at the bank.',
  unreachable: 'Your money is safe. This is a connection problem between us and the bank.',
  error: 'Your balance could not be read. Try again.',
};

export function balanceView(data: WalletBalance | undefined, error: unknown): BalanceView {
  if (data) return { kind: 'figure', kobo: data.availableKobo };
  if (!error) return { kind: 'loading' };
  const problem = balanceProblem(error);
  const kind = problem === 'other' ? 'error' : problem;
  // W6 draws its own sentence for an unreachable bank; every other refusal says the Hub's.
  const said = kind !== 'unreachable' && isApiError(error) ? error.message.trim() : '';
  return { kind, message: said || fallbacks[kind] };
}

/** A read as Today needs to know it: still on its way, answered, or failed. */
export type ReadState = { pending: boolean; failed: boolean };

/**
 * Where the page as a whole stands:
 * - `loading` (H11) until the first answer of each read Today draws from has come: the balance,
 *   the TGIF switch and, when TGIF shows, the day, and the creators;
 * - `error` when every one of them failed and none of the failures is the wallet's own answer
 *   (no wallet, opening, unreachable): nothing on the page can be drawn, which is a lost
 *   connection or a Hub that is down;
 * - `ready` otherwise: each part draws what it has, and a part that failed says so in place.
 */
export function todayPhase(reads: { balance: ReadState & { walletAnswer: boolean }; tgifSwitch: ReadState; tgifDay: ReadState | null; creators: ReadState }) {
  const all: ReadState[] = [reads.balance, reads.tgifSwitch, reads.creators, ...(reads.tgifDay ? [reads.tgifDay] : [])];
  if (all.some((read) => read.pending)) return 'loading' as const;
  if (all.every((read) => read.failed) && !reads.balance.walletAnswer) return 'error' as const;
  return 'ready' as const;
}
