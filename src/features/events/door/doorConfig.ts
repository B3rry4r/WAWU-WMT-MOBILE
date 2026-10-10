/**
 * How the door's scanner behaves, in time. Nothing here is money or a promise to a person: they are the
 * numbers a hand-held scanner needs so one ticket is one verdict and the next person is not kept waiting.
 */

/**
 * How long a result (E20, E23, E24) stays over the camera before the scanner is ready for the next ticket.
 * A tap on the result clears it at once. PROVISIONAL(DOOR-HOLD, owner=EVENTS-09, why=no ruling or canvas sizes it; the verifier may change it after a walk at a real door).
 */
export const RESULT_HOLD_MS = 3000;

/**
 * How long a code must be out of the camera's view before the same code is read again. A phone reports a QR
 * every few hundred milliseconds for as long as it is in view, so without this a ticket just let in would be
 * read again at once and answered "already used". PROVISIONAL(DOOR-QUIET, owner=EVENTS-09, why=no ruling or canvas sizes it; must stay above the camera's report gap, about 300 ms on the web build).
 */
export const SAME_CODE_QUIET_MS = 1500;
