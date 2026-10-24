import type { FeedScope } from '@/features/feed/api';
import type { TgifDay } from '@/features/tgif/api/tgif';
import { cardOrder, cardText, compactCount, dateText } from '@/features/tgif/model';
import { stateWords, type HomeView as WalletHomeView } from '@/features/wallet/home/model';

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
 * What Home's balance card shows (H1). It reads what the Wallet tab reads (`GET /money/wallet`, then the
 * balance once a wallet is open, through WALLET-01's queries, so the two share one cached answer) and
 * decides with WALLET-01's `homeView`, so the card and the tab never disagree:
 * - `loading` until both have answered;
 * - `figure`: the bank's available balance, never one worked out here;
 * - `notice`: the Wallet tab's own words for the state, and what the card's one button does: open A26
 *   (no wallet yet, R-6), ask about the wallet again (opening, or the wallet read failed), or ask for the
 *   balance again (the bank did not answer, frozen, or the balance read failed).
 */
export type MoneyCardState =
  | { kind: 'loading' }
  | { kind: 'figure'; kobo: number }
  | {
      kind: 'notice';
      state: 'no_wallet' | 'opening' | 'unreachable' | 'frozen' | 'wallet_error' | 'balance_error';
      title: string;
      message: string;
      action: 'open_wallet' | 'check_wallet' | 'retry_wallet' | 'retry_balance';
    };

const actions = {
  no_wallet: 'open_wallet',
  opening: 'check_wallet',
  wallet_error: 'retry_wallet',
  unreachable: 'retry_balance',
  frozen: 'retry_balance',
  balance_error: 'retry_balance',
} as const;

export function moneyCard(view: WalletHomeView): MoneyCardState {
  if (view.kind === 'loading') return { kind: 'loading' };
  if (view.kind === 'ready') return { kind: 'figure', kobo: view.availableKobo };
  return { kind: 'notice', state: view.kind, ...stateWords(view), action: actions[view.kind] };
}

/** A read as Today needs to know it: still on its way, answered, or failed. */
export type ReadState = { pending: boolean; failed: boolean };

/**
 * Where the page as a whole stands:
 * - `loading` (H11) until the first answer of each read Today draws from has come: the balance and the creators;
 * - `error` when every one of them failed and none of the failures is the wallet's own answer
 *   (no wallet, opening, unreachable): nothing on the page can be drawn, which is a lost
 *   connection or a Hub that is down;
 * - `ready` otherwise: each part draws what it has, and a part that failed says so in place.
 * Today reads no TGIF (R-59: TGIF is on Explore and in the morning notification).
 */
export function todayPhase(reads: { balance: ReadState & { walletAnswer: boolean }; creators: ReadState }) {
  const all: ReadState[] = [reads.balance, reads.creators];
  if (all.some((read) => read.pending)) return 'loading' as const;
  if (all.every((read) => read.failed) && !reads.balance.walletAnswer) return 'error' as const;
  return 'ready' as const;
}
