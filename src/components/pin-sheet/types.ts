/**
 * The PIN sheet's contract with the payment that opens it (artboard W11, and
 * the same sheet on H15, M13 and every other payment).
 *
 * The sheet never checks a PIN itself and holds no policy. It shows what the
 * money contract answers (wawu-backend `docs/contract/CONVENTIONS.md`,
 * sections 3 to 5, task MONEY-04; the PIN itself is MONEY-09):
 *
 * - the PIN travels in the `X-Transaction-Pin` header of the debit
 *   (`POST /money/transfers/wawu`, `/money/transfers/bank`, `/money/payments`)
 *   or of `POST /money/pin/verify`; `onSubmit` receives it for that header
 *   and nothing in the sheet keeps it;
 * - a wrong PIN is `403` with `reason: { code: 'pin_incorrect', triesLeft }`;
 * - a locked PIN is `423` with `reason: { code: 'pin_locked', lockedUntil }`.
 *
 * Idempotency-Key: the caller makes one key per payment and sends the SAME
 * key again after a wrong PIN and after a request that got no answer. The
 * contract stores no refusal made before money moves (PIN, funds, limit), so
 * the key is free again (CONVENTIONS.md section 4, rule 6), and a request that
 * got no answer may have moved money, so only the same key is safe.
 */

/**
 * The two refusals, exactly as the contract's `reason` carries them, so the
 * caller passes `error.reason` straight through.
 */
export type PinRefusal =
  | { code: 'pin_incorrect'; triesLeft: number }
  | { code: 'pin_locked'; lockedUntil: string };

/**
 * What became of one PIN.
 *
 * - `approved`: the request went through. The caller moves on (receipt).
 * - a `PinRefusal`: shown on the sheet; the keypad comes back (or locks).
 * - `unanswered`: no answer that proves anything (network, timeout, 5xx).
 *   The sheet asks for the PIN again; the caller retries with the same
 *   Idempotency-Key.
 */
export type PinCheckResult = { code: 'approved' } | PinRefusal | { code: 'unanswered' };

/** The biometric the phone approves with (see `biometric.ts`). */
export type BiometricKind = 'fingerprint' | 'face';

/**
 * What became of a biometric approval (fingerprint or face). The server side
 * is MONEY-14's (`X-Device-Approval`, not declared yet; BACKEND_GAPS G-9).
 *
 * - `approved`: the request went through.
 * - `failed`: not recognised, refused, or it went wrong. The sheet shows
 *   "<Name> failed. Use your PIN." (owner, 2 Oct 2026) and the keypad. It
 *   uses up no PIN try: the sheet counts nothing, and the owner's ruling is
 *   that the server must not either.
 * - `cancelled`: the person closed the prompt. Back to the keypad, no message.
 */
export type BiometricResult = { code: 'approved' } | { code: 'failed' } | { code: 'cancelled' };

/**
 * The line under "Enter your PIN". `totalKobo` is the TOTAL the payer pays,
 * fees included, in kobo (brief rule 5; the quote's `totalKobo`), never the
 * price alone.
 *
 * With `payee`: "Approve ₦25,065 to Chidinma Okoro" (W11, H15).
 * With `purpose`: "₦2,023.25 for the professional tick" (M13).
 */
export type PinApproval =
  | { totalKobo: number; payee: string; purpose?: never }
  | { totalKobo: number; purpose: string; payee?: never };

/**
 * The phone's biometric standing in for the PIN. The sheet reads which one the
 * phone has (`expo-local-authentication`) and shows no key when there is none.
 */
export type PinBiometric = {
  /** Runs the biometric prompt and the approved request for that kind. */
  onPress: (kind: BiometricKind) => Promise<BiometricResult>;
  /** Already known (for example from wallet settings, W35): skips reading the phone. */
  kind?: BiometricKind;
};

export type PinSheetProps = {
  visible: boolean;
  /** Called when the person dismisses the sheet (scrim tap, back button). */
  onClose: () => void;
  approval: PinApproval;
  /** Called with the full PIN once every digit is in: send it as `X-Transaction-Pin`. */
  onSubmit: (pin: string) => Promise<PinCheckResult>;
  /** Number of digits. The contract's PIN is 4 digits, `^[0-9]{4}$` (W11, W36). */
  pinLength?: number;
  /** Offers the biometric key when the phone has one. Leave out when biometric approval is not set up. */
  biometric?: PinBiometric;
  /** Shows "Forgot PIN?" (W11, opens W37). */
  onForgotPin?: () => void;
  /**
   * The PIN is already locked when the sheet opens: `GET /money/pin` →
   * `PinStateView.lockedUntil` (ISO 8601, null when not locked).
   */
  lockedUntil?: string | null;
  /**
   * The line for an answer that never arrived. Left out, it reads "We couldn't check your PIN. Try again." (right for a send,
   * where the PIN was the thing in doubt). A sheet that pays passes `PAYMENT_UNANSWERED_LINE`: the payment may have gone
   * through, and the retry goes with the same Idempotency-Key, so it happens once.
   */
  unansweredLine?: string;
};
