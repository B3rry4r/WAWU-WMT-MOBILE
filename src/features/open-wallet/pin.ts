import { isApiError } from '@/api/errors';
import { PIN_LENGTH } from '@/components/pin-sheet';

/**
 * A9 and A10's rules, apart from the screen. The PIN's length is the one the
 * PIN sheet and the contract use (`^[0-9]{4}$`, MONEY-09), so the line
 * "Four digits." is written from it, never typed in.
 */
export { PIN_LENGTH };

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'] as const;

/** "Four digits." for the PIN's length, in words as A9 and A10 draw it; the figure itself past ten. */
export function lengthLine(length: number = PIN_LENGTH): string {
  const word = WORDS[length] ?? String(length);
  return `${word} ${length === 1 ? 'digit' : 'digits'}.`;
}

/**
 * What the PIN is for, A9 and A10's second sentence. Backed by the money
 * contract (wawu-backend docs/contract/CONVENTIONS.md section 5): the PIN is
 * sent on every request that moves money, and a debit route without
 * `@RequireTransactionPin()` (or `@RequireApproval()`, the phone's own
 * biometric standing in for it, MONEY-14) fails the backend's own coverage
 * test (`wallet-gate-coverage.spec.ts`).
 */
export const PIN_PURPOSE = 'It approves every payment and transfer.';

/** Where A10's answer leaves the step. */
export type PinOutcome =
  /**
   * The server already holds a PIN (`409 pin_already_set`) though this screen
   * arrived with none. The app cannot tell whether this person's own request
   * landed first (the network sent it twice, so the PIN typed IS the stored
   * one) or a PIN was set earlier or on another phone, so the words say only
   * what is true in both (`ALREADY_SET`). Never shown as "your PIN is set"
   * or as "not saved" (BACKEND_GAPS G-116 for how to reset it).
   */
  | { kind: 'already' }
  /** Start again at A9, with the server's sentence under the dots. `wrongPin`: the two entries differed (W11's wrong-PIN look). */
  | { kind: 'again'; line: string; wrongPin: boolean }
  /** No answer that says whether the PIN was set (no connection, a server fault): read the wallet to find out. */
  | { kind: 'unknown'; line: string };

const FALLBACK_LINE = "We couldn't set your PIN. Try again.";

/**
 * A refused or unanswered `POST /money/pin` (contract CONVENTIONS sections 3
 * and 5). Every sentence shown is the server's own `message`. Both entries are
 * dropped whatever the answer: a refusal starts again at A9, `already` ends
 * the step with what the server holds, and `unknown` asks the wallet first.
 */
export function afterPinRefusal(error: unknown): PinOutcome {
  if (!isApiError(error)) return { kind: 'unknown', line: FALLBACK_LINE };
  if (error.code === 'pin_already_set') return { kind: 'already' };
  if (error.code === 'pin_mismatch') return { kind: 'again', line: error.message, wrongPin: true };
  if (error.kind === 'network' || error.kind === 'server' || error.kind === 'unknown') return { kind: 'unknown', line: error.message || FALLBACK_LINE };
  return { kind: 'again', line: error.message || FALLBACK_LINE, wrongPin: false };
}

/**
 * A10 when the server already held a PIN this screen did not know of (KYC-04
 * round 3, Default (agent), owner may override; BRIEF section 12, A10). The
 * app cannot tell two causes apart, and each makes one sentence true, so the
 * words say what holds in both: (a) this person's own set landed first and
 * its answer arrived twice, so the stored PIN is the one just typed; (b) a PIN
 * was set earlier or on another phone, so that one still approves payments.
 * It never says the typed PIN was not saved, and never that it was.
 */
export const ALREADY_SET = {
  title: 'You already have a transaction PIN',
  message: 'Your account has a transaction PIN. If you just set it, it is the one you typed. If you set one before, that earlier PIN still approves payments.',
} as const;

/**
 * A10's end for a person who reset the PIN from it (W37, WALLET-06 round 2, D5). The earlier PIN no longer approves:
 * the reset replaced it, so the words name the new one and say nothing of an earlier one.
 */
export const ALREADY_SET_AFTER_RESET = {
  title: ALREADY_SET.title,
  message: 'Your PIN was reset. The new PIN you just chose is the one that approves payments.',
} as const;

/**
 * A10 when the set got no answer and the wallet read that would say whether
 * it was set got none either: the read's own words (for example "No
 * connection. Check your internet and try again.") after what is not known.
 */
export function unconfirmedLine(said: string | null): string {
  return `We couldn't check whether your PIN was set. ${said ?? 'Try again.'}`;
}

/** The account number as A8 draws it, "812 345 6789": 3, 3 and 4 for a NUBAN, otherwise as sent. Copy takes the digits as sent. */
export function groupedAccountNumber(accountNumber: string): string {
  return /^\d{10}$/.test(accountNumber) ? `${accountNumber.slice(0, 3)} ${accountNumber.slice(3, 6)} ${accountNumber.slice(6)}` : accountNumber;
}
