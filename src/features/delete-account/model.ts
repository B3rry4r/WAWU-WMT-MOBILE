import { isApiError } from '@/api/client';
import { formatMoney } from '@/components/Money';
import { sentenceOf } from '@/features/settings/failure';
import { lagos, parseTime } from '@/features/wallet/history/lagosTime';
import { stateWords, type HomeView } from '@/features/wallet/home/model';

import type { LeavingReason } from './api';

/** Z7's choices, in the words the person reads. The Hub keeps the code (`DeleteAccountDto.reason`); a new choice is added there and here. */
const LABEL: Record<LeavingReason, string> = {
  not_using_enough: "I don't use it enough",
  another_account: 'I have another account',
  privacy: "I'm worried about my privacy",
  too_many_notifications: 'I get too many notifications',
  something_else: 'Something else',
};

export const LEAVING_REASONS: readonly { code: LeavingReason; label: string }[] = (Object.keys(LABEL) as LeavingReason[]).map((code) => ({
  code,
  label: LABEL[code],
}));

export const reasonLabel = (code: LeavingReason): string => LABEL[code];

/** Z7: the word the person types, and the check on it. */
export const CONFIRM_WORD = 'DELETE';
export const isConfirmed = (typed: string): boolean => typed.trim() === CONFIRM_WORD;

/**
 * What Z6 shows of the wallet (R-17: the wallet is empty first), decided from the Wallet tab's own reads (`homeView`), so the
 * screen and the tab never disagree and the figure is the bank's, never a sum of ours:
 * - `loading`: the reads are on their way, Continue waits;
 * - `clear`: no wallet (R-6, nobody has one until they open it: no warning at all) or a balance of 0: Continue is open;
 * - `money`: the bank's available balance is above 0: Withdraw, and Continue waits;
 * - `notice`: the balance could not be read (opening, bank unreachable, frozen, a failed read). Never guessed as empty: Continue waits.
 */
export type WalletView =
  | { kind: 'loading' }
  | { kind: 'clear'; hasWallet: boolean }
  | { kind: 'money'; kobo: number }
  | { kind: 'notice'; title: string; message: string; action: string };

export function walletView(view: HomeView): WalletView {
  switch (view.kind) {
    case 'loading':
      return { kind: 'loading' };
    case 'no_wallet':
      return { kind: 'clear', hasWallet: false };
    // WALLET-41: no naira wallet to empty first; the Hub's own check of the person's accounts stands (BACKEND_GAPS G-WALLET-41-6).
    case 'world':
      return { kind: 'clear', hasWallet: false };
    case 'ready':
      return view.availableKobo > 0 ? { kind: 'money', kobo: view.availableKobo } : { kind: 'clear', hasWallet: true };
    default:
      return { kind: 'notice', ...stateWords(view), action: view.kind === 'opening' ? 'Check again' : 'Try again' };
  }
}

export const canContinue = (view: WalletView): boolean => view.kind === 'clear';

/** Z6's warning body: "You have ₦485,250.75. Withdraw it to your bank before deleting." The figure is the bank's. */
export const moneyLine = (kobo: number): string => `You have ${formatMoney(kobo)}. Withdraw it to your bank before deleting.`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** "26 October" (the year too when it is not this year's), the Lagos day the Hub's date falls on. Empty when the date cannot be read. */
export function deletionDate(iso: string, now: Date): string {
  const at = parseTime(iso);
  if (!at) return '';
  const day = lagos(at);
  const year = day.getUTCFullYear() === lagos(now).getUTCFullYear() ? '' : ` ${day.getUTCFullYear()}`;
  return `${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}${year}`;
}

/** Z8's line: "On 26 October. Sign in before then to cancel." */
export function scheduledLine(iso: string, now: Date): string {
  const date = deletionDate(iso, now);
  return date ? `On ${date}. Sign in before then to cancel.` : 'Sign in before the deletion date to cancel.';
}

const NOT_SCHEDULED = 'Your account could not be scheduled for deletion. Try again.';

/**
 * What Z7 says when the request fails for a reason other than the money rules. The bank not answering is the Hub's own sentence ("Your money is
 * safe. Try again in a moment.": the money contract lets the app show a refusal's message as it is); anything else is the app's short sentence for
 * that kind of failure, never a server's raw words.
 */
export function problemOf(error: unknown): string {
  if (isApiError(error) && error.code === 'provider_unreachable' && error.message) return error.message;
  return sentenceOf(error, NOT_SCHEDULED);
}
