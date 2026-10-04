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
  /** The PIN is set (or one already was, BACKEND_GAPS G-41): back to where Open your wallet started. */
  | { kind: 'done' }
  /** Start again at A9, with the server's sentence under the dots. `wrongPin`: the two entries differed (W11's wrong-PIN look). */
  | { kind: 'again'; line: string; wrongPin: boolean }
  /** No answer that says whether the PIN was set (no connection, a server fault): read the wallet to find out. */
  | { kind: 'unknown'; line: string };

const FALLBACK_LINE = "We couldn't set your PIN. Try again.";

/**
 * A refused or unanswered `POST /money/pin` (contract CONVENTIONS sections 3
 * and 5). Every sentence shown is the server's own `message`. Both entries are
 * dropped whatever the answer, so every outcome but `done` starts again at A9.
 */
export function afterPinRefusal(error: unknown): PinOutcome {
  if (!isApiError(error)) return { kind: 'unknown', line: FALLBACK_LINE };
  if (error.code === 'pin_already_set') return { kind: 'done' };
  if (error.code === 'pin_mismatch') return { kind: 'again', line: error.message, wrongPin: true };
  if (error.kind === 'network' || error.kind === 'server' || error.kind === 'unknown') return { kind: 'unknown', line: error.message || FALLBACK_LINE };
  return { kind: 'again', line: error.message || FALLBACK_LINE, wrongPin: false };
}

/** The account number as A8 draws it, "812 345 6789": 3, 3 and 4 for a NUBAN, otherwise as sent. Copy takes the digits as sent. */
export function groupedAccountNumber(accountNumber: string): string {
  return /^\d{10}$/.test(accountNumber) ? `${accountNumber.slice(0, 3)} ${accountNumber.slice(3, 6)} ${accountNumber.slice(6)}` : accountNumber;
}
