import { SAME_CODE_QUIET_MS } from './doorConfig';

/**
 * What the Hub's door route takes as a code: text of 4 to 500 characters (`DoorScanDto`). Anything shorter
 * cannot be sent; the screen answers it "not valid" itself and says so (`canSend`).
 */
export const MIN_SENT_CHARS = 4;

/** A ticket code is printed in groups of four (`K7QX-4M2P-9WLA-3RTE`). */
const GROUP = 4;
/** The most characters a typed code holds: eight groups, well past the 16 a ticket has, so a longer code is never cut short. */
const MAX_TYPED_CHARS = 32;

/**
 * The Hub's ticket codes use letters and digits with the look-alikes taken out: no O, I or L (wawu-backend
 * `event-ticketing.service.ts`, `CODE_ALPHABET`). Someone typing a code from a cracked phone screen who types
 * the letter O means the digit 0, and I or L the digit 1.
 */
const LOOK_ALIKES: Readonly<Record<string, string>> = { O: '0', I: '1', L: '1' };

/**
 * What the code field holds as someone types or pastes: capitals and digits only, look-alikes read as the
 * digit, in groups of four with a hyphen between, exactly as the ticket prints it.
 */
export function formatTypedCode(raw: string): string {
  const kept = raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/[OIL]/g, (c) => LOOK_ALIKES[c])
    .slice(0, MAX_TYPED_CHARS);
  return (kept.match(new RegExp(`.{1,${GROUP}}`, 'g')) ?? []).join('-');
}

/** What a camera read, as the Hub should see it: the text with the spaces around it taken off. Nothing else is touched. */
export const readingText = (data: string): string => data.trim();

/** True when the text is long enough for the Hub's door route to take. */
export const canSend = (text: string): boolean => text.length >= MIN_SENT_CHARS;

/**
 * Decides which camera readings are sent. A phone reports a QR over and over while it is in view, so:
 * - nothing is read while a check or a result is up (`busy`);
 * - a text is not read again until it has been out of view for `quietMs`: every report of a text already
 *   known counts as "still in view", sent or not, so a ticket held up at the camera after its result cleared
 *   is not read twice, and neither are two tickets in one picture that the phone reports in turn;
 * - a text first seen while busy is not remembered, so it is read the moment the scanner is free if it is
 *   still in view then (the next person need not take their ticket away and bring it back).
 */
export function createScanGate(quietMs: number = SAME_CODE_QUIET_MS) {
  const seen = new Map<string, number>();
  return {
    accept(text: string, now: number, busy: boolean): boolean {
      for (const [other, at] of seen) if (now - at >= quietMs) seen.delete(other);
      const before = seen.get(text);
      const stillInView = before !== undefined && now - before < quietMs;
      if (stillInView || !busy) seen.set(text, now);
      return !busy && !stillInView;
    },
    /** Forgets what was in view (a fresh start after the screen was away). */
    reset(): void {
      seen.clear();
    },
  };
}
