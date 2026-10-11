import { SAME_CODE_QUIET_MS } from './doorConfig';

/**
 * What the Hub's door route takes as a code: text of 4 to 500 characters (`DoorScanDto`). Text outside that is
 * never sent: the screen answers it "not a valid ticket" itself (`canSend`, EVENTS-09 round 2), so the Hub's
 * validator never speaks to a person at a door. The Hub counts characters as `validator.isLength` does, a
 * surrogate pair as one, so does `lengthOf`.
 */
export const MIN_SENT_CHARS = 4;
export const MAX_SENT_CHARS = 500;

/** Characters as the Hub counts them: one for an emoji, not two. */
export const lengthOf = (text: string): number => Array.from(text).length;

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

/** True when the text is one the Hub's door route takes: 4 to 500 characters. Anything else is not a ticket, and is not sent. */
export const canSend = (text: string): boolean => {
  const length = lengthOf(text);
  return length >= MIN_SENT_CHARS && length <= MAX_SENT_CHARS;
};

/**
 * The key one scan carries (`Idempotency-Key`): made once when a ticket is first read or its code is sent, and
 * sent again unchanged by Try again for that scan, so a check the Hub made whose answer was lost is answered with
 * its first verdict and not "already used". A new scan, even of the same ticket, gets a new key. A UUID v4; the
 * phone's own generator when it has one, else random digits (the key only has to be unique, it protects nothing).
 */
export function newScanKey(): string {
  const generator = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (generator?.randomUUID) return generator.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const n = Math.floor(Math.random() * 16);
    return (c === 'x' ? n : (n & 0x3) | 0x8).toString(16);
  });
}

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
