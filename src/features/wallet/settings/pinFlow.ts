import { isApiError } from '@/api/errors';
import { PIN_LENGTH } from '@/components/pin-sheet';

/**
 * The words and the rules of W36 (change the PIN) and W37 (reset it), apart from the screens. The PIN's length is the
 * one the PIN sheet and the contract use (`^[0-9]{4}$`, MONEY-09), so "Four digits." is written from it, never typed.
 */
export { PIN_LENGTH };

/** The reset code's length: six digits, as W37 draws six boxes and the backend sends (`RESET_CODE_DIGITS`, MONEY-14). */
export const CODE_LENGTH = 6;

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'] as const;

/** "Four digits." for the PIN's length, in words as the canvas draws it. */
export function lengthLine(length: number = PIN_LENGTH): string {
  const word = WORDS[length] ?? String(length);
  return `${word} ${length === 1 ? 'digit' : 'digits'}.`;
}

/** W36's title, the canvas's "Create your transaction PIN" with "create" changed to "change" (BRIEF, W36: R-6, the PIN is made when the wallet opens). */
export const NEW_PIN_TITLE = 'Change your transaction PIN';
/** W36's second step, as A10 draws it ("the confirm step looks the same"). */
export const CONFIRM_TITLE = 'Enter it again';
/** W36's line under the title (wallet.js line 144). */
export const NEW_PIN_LINE = `${lengthLine()} You'll use it to approve every payment, transfer and withdrawal.`;
/** The step the backend needs before it will change a PIN: the PIN in use now (`X-Transaction-Pin`). The canvas draws none. */
export const CURRENT_TITLE = 'Enter your current PIN';
export const CURRENT_LINE = 'To change it, first enter the PIN you use now.';

/** The two numbered steps W36 draws ("Step 1 of 2"). */
export const STEPS = 2;
export const stepLabel = (step: number): string => `Step ${step} of ${STEPS}`;

/** W37's own words (wallet.js line 145). */
export const RESET_NAV = 'Reset PIN';
export const RESET_TITLE = 'Enter the code we sent';

/**
 * Where the code went, as the server says it (`PinResetView.sentTo`): a masked phone number ("+234 *** *** 4412") reads
 * "To +234 *** *** 4412", as W37 draws it. Under Nuvion the code goes by email and the server names a masked address
 * ("a***@example.com"), or "your email address" when the token has none; the canvas draws a phone (BACKEND_GAPS G-402),
 * so the line then says it is the email.
 */
export function sentToLine(sentTo: string): string {
  if (/^\+?\d[\d\s*•-]*\d$/.test(sentTo.trim())) return `To ${sentTo}`;
  if (sentTo.includes('@')) return `To your email, ${sentTo}`;
  return `To ${sentTo}`;
}

/** What a refused or unanswered call means for the screen that made it (contract CONVENTIONS sections 3 and 5). */
export type Refusal =
  /** `pin_incorrect`: the server's own "Wrong PIN. 3 tries left." */
  | { kind: 'wrong_pin'; line: string }
  /** `pin_locked`: five wrong tries in a row; the lock's end is read from `GET /money/pin`. */
  | { kind: 'locked'; line: string }
  /** `pin_mismatch`: the two new entries differ. */
  | { kind: 'mismatch'; line: string }
  /** `reset_code_invalid`: the code is wrong, dead, used or replaced. */
  | { kind: 'bad_code'; line: string }
  /** `pin_not_set`: nothing to change or reset. */
  | { kind: 'no_pin'; line: string }
  /** `wallet_not_open` or `wallet_opening`. */
  | { kind: 'no_wallet'; line: string }
  /** No answer that proves what happened (no connection, a timeout, a server fault). */
  | { kind: 'unanswered'; line: string }
  /** `idempotency_in_progress`: the same request is still running on the server; its answer will be this request's. */
  | { kind: 'in_progress'; line: string }
  /** Anything else the server refused, in its own sentence. */
  | { kind: 'other'; line: string };

const FALLBACK = 'Something went wrong. Try again.';
const SERVER_FAULT = 500;
const OK_FROM = 200;
const OK_TO = 300;

export function refusalOf(error: unknown): Refusal {
  if (!isApiError(error)) return { kind: 'unanswered', line: FALLBACK };
  const line = error.message || FALLBACK;
  switch (error.code) {
    case 'pin_incorrect':
      return { kind: 'wrong_pin', line };
    case 'pin_locked':
      return { kind: 'locked', line };
    case 'pin_mismatch':
      return { kind: 'mismatch', line };
    case 'reset_code_invalid':
      return { kind: 'bad_code', line };
    case 'pin_not_set':
      return { kind: 'no_pin', line };
    case 'idempotency_in_progress':
      return { kind: 'in_progress', line };
    case 'wallet_not_open':
    case 'wallet_opening':
      return { kind: 'no_wallet', line };
    default:
      break;
  }
  // No answer that proves anything: the request never arrived (status 0), the server faulted, or it answered 2xx with a body that could not be read.
  if (error.status === 0 || error.status >= SERVER_FAULT || (error.status >= OK_FROM && error.status < OK_TO)) return { kind: 'unanswered', line };
  return { kind: 'other', line };
}

/**
 * What the screen says when a change or a reset got no answer, and the same request is sent again with the same key
 * until one comes. The words never claim it happened or did not: the server's answer to the repeat is what tells.
 */
export const UNKNOWN_CHANGE = "We couldn't tell whether your PIN was changed.";
export const UNKNOWN_RESET = "We couldn't tell whether your PIN was reset.";

/** The lock's remaining time in ms from the server's `lockedUntil`; 0 when there is none, it has passed or cannot be read. */
export function lockLeftMs(lockedUntil: string | null, now: number): number {
  if (lockedUntil === null) return 0;
  const at = Date.parse(lockedUntil);
  return Number.isNaN(at) ? 0 : Math.max(0, at - now);
}
