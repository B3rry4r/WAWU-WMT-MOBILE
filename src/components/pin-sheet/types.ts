/**
 * The PIN sheet's contract with the payment that opens it (artboard W11, and
 * the same sheet on H15, M13 and every other payment).
 *
 * The sheet never checks a PIN itself and holds no policy: how many tries a
 * person has and how long a lock lasts are the server's (task MONEY-09). The
 * sheet only shows what the server answered.
 */

/**
 * What the server said about a PIN (or a Face ID approval).
 *
 * - `ok`: approved. The caller moves on (receipt, unlocked content).
 * - `wrong`: rejected; `triesLeft` is the server's count.
 * - `locked`: too many wrong tries; `until` is when the server lets the person
 *   try again (a Date or an ISO 8601 string from the API).
 * - `error`: the check could not be made (network, server error).
 * - `cancelled`: Face ID was dismissed; the sheet goes back to the keypad.
 */
export type PinCheckResult =
  | { status: 'ok' }
  | { status: 'wrong'; triesLeft: number }
  | { status: 'locked'; until: Date | string }
  | { status: 'error' }
  | { status: 'cancelled' };

/**
 * The line under "Enter your PIN". `totalKobo` is the TOTAL the payer pays,
 * fees included, in kobo (brief rule 5): never the price alone.
 *
 * With `payee`: "Approve ₦25,065 to Chidinma Okoro" (W11, H15).
 * With `purpose`: "₦2,023.25 for the professional tick" (M13).
 */
export type PinApproval =
  | { totalKobo: number; payee: string; purpose?: never }
  | { totalKobo: number; purpose: string; payee?: never };

/** Face ID (or the platform's biometric) standing in for the PIN. */
export type PinBiometric = {
  /** What the platform calls it, shown to screen readers: "Face ID", "Fingerprint". */
  label: string;
  /** Runs the biometric prompt and the approval; resolves like a PIN check. */
  onPress: () => Promise<PinCheckResult>;
};

export type PinSheetProps = {
  visible: boolean;
  /** Called when the person dismisses the sheet (scrim tap, back button). */
  onClose: () => void;
  approval: PinApproval;
  /** Called with the full PIN once every digit is in. */
  onSubmit: (pin: string) => Promise<PinCheckResult>;
  /** Number of digits. The transaction PIN is 4 digits (W11, W36). */
  pinLength?: number;
  /** Shows the Face ID key. Leave out when biometrics are not set up. */
  biometric?: PinBiometric;
  /** Shows "Forgot PIN?" (W11, opens W37). */
  onForgotPin?: () => void;
  /**
   * The server already said the PIN is locked when the sheet opens
   * (Date or ISO 8601 string). The sheet opens in the locked state.
   */
  lockedUntil?: Date | string;
};
