import { isApiError } from '@/api/errors';
import { balanceProblem } from '@/api/money';

import type { WalletHome, WalletTransaction } from '../api/home';
import { rowTime } from '../history/lagosTime';
import { rowFace, type RowLead } from '../history/model';

/** W1's row times. They live with the history's Lagos clock since WALLET-04, so W1 and W26 never disagree about the day. */
export { rowTime };

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

/**
 * The words for each state without a balance, one set for the Wallet tab (W1, W6) and Home's balance card
 * (H1, HOME-01), so the two never say different things about the same answer.
 */
export function stateWords(view: Exclude<HomeView, { kind: 'loading' } | { kind: 'ready' }>): { title: string; message: string } {
  switch (view.kind) {
    case 'wallet_error':
      return { title: "We couldn't load your wallet", message: serverSentence(view.error, 'Something went wrong. Try again.') };
    case 'no_wallet':
      return { title: "You don't have a wallet yet", message: 'Open your wallet to continue.' };
    case 'opening':
      return { title: 'Your account is opening', message: 'Check again in a moment.' };
    case 'unreachable':
      return { title: "We couldn't reach your account", message: view.message };
    case 'frozen':
      return { title: 'Your wallet is frozen', message: view.message };
    case 'balance_error':
      return { title: "We couldn't load your balance", message: serverSentence(view.error, 'Something went wrong. Try again.') };
  }
}

/**
 * What the recent-transactions region of W1 shows, decided from the read alone (pure, for the tests):
 *
 * - `loading`: the read has not answered yet, so nobody knows whether there are rows. W4's three row shapes stand
 *   there, and the "Transactions" heading is not drawn as if there were rows (round 2, defect 2: a new account used to
 *   see it for a moment and lose it to W5);
 * - `none`: the read answered with no rows, so W5's empty card stands;
 * - `some`: W1's heading and the rows;
 * - `failed`: the read failed and is not being retried. The account may well have rows, so W1's layout stays,
 *   with the rows' own message and Try again in place of them.
 *
 * A refresh keeps the rows it has, so it never goes back to `loading`.
 */
export type RecentView = 'loading' | 'none' | 'some' | 'failed';

export function recentView(read: { rows: readonly unknown[] | undefined; failed: boolean; pending: boolean }): RecentView {
  if (read.rows) return read.rows.length === 0 ? 'none' : 'some';
  return read.failed && !read.pending ? 'failed' : 'loading';
}

/** The app's name, then the bank the Hub names (W1, 16 Oct: "Who Made This? · Nuvion"; R-69, R-67). */
export function bankLine(bankName: string): string {
  return `Who Made This? · ${bankName}`;
}

/** W5's line under "No transactions yet", with the account's own number (the server's, never the canvas's). */
export function fundingLine(groupedNumber: string): string {
  return `Send to ${groupedNumber} from any Nigerian bank.`;
}

/** One recent row as W1 draws it: who or what, the line under it, the signed total and when. */
export type RecentRow = {
  id: string;
  title: string;
  subtitle?: string;
  /** Kobo, negative when money left: a debit is the total that left the wallet, fees included (BRIEF W1, rule 5). */
  amountKobo: number;
  meta: string;
  lead: RowLead;
  /** Set when the row stands for several movements (three unlocks of one piece): the key of the list they open to (W26's `?group=`). */
  groupKey?: string;
};

export function recentRow(row: WalletTransaction, now: Date): RecentRow {
  const face = rowFace(row);
  const time = rowTime(row.createdAt, now);
  return {
    id: face.id,
    title: face.title,
    subtitle: face.subtitle,
    amountKobo: face.amountKobo,
    meta: face.status ? [face.status, time].filter(Boolean).join(' \u00b7 ') : time,
    lead: face.lead,
    groupKey: row.group?.key,
  };
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
