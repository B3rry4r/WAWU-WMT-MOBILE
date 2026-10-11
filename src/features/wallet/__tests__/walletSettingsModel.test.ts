import { ApiError } from '@/api/errors';

import { accountLine, agoWords, limitsLine, pinLine, savedLine } from '../settings/model';
import { newRequestKey } from '../api/settings';
import { CODE_LENGTH, lengthLine, lockLeftMs, NEW_PIN_LINE, PIN_LENGTH, refusalOf, sentToLine, stepLabel } from '../settings/pinFlow';

const NOW = new Date('2026-10-10T12:00:00.000Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('agoWords: how long ago the PIN was set or changed', () => {
  it.each([
    [0, 'just now'],
    [59_000, 'just now'],
    [MIN, '1 minute ago'],
    [45 * MIN, '45 minutes ago'],
    [HOUR, '1 hour ago'],
    [23 * HOUR, '23 hours ago'],
    [DAY, 'yesterday'],
    [DAY + 23 * HOUR, 'yesterday'],
    [2 * DAY, '2 days ago'],
    [13 * DAY, '13 days ago'],
    [14 * DAY, '2 weeks ago'],
    [55 * DAY, '7 weeks ago'],
    [56 * DAY, '1 month ago'],
    [90 * DAY, '3 months ago'],
    [364 * DAY, '12 months ago'],
    [365 * DAY, '1 year ago'],
    [800 * DAY, '2 years ago'],
  ])('%d ms ago reads "%s"', (elapsed, words) => {
    expect(agoWords(ago(elapsed), NOW)).toBe(words);
  });

  it('a time a little ahead of the phone reads as just now, and no time or a bad one reads as nothing', () => {
    expect(agoWords(new Date(NOW.getTime() + 5 * MIN).toISOString(), NOW)).toBe('just now');
    expect(agoWords(null, NOW)).toBeNull();
    expect(agoWords('not a date', NOW)).toBeNull();
  });
});

describe('the lines W35 draws', () => {
  it('the PIN line: "Changed 3 months ago", "Not set yet" with no PIN, and "Set" when the server sent no time', () => {
    expect(pinLine({ isSet: true, changedAt: ago(90 * DAY), lockedUntil: null }, NOW)).toBe('Changed 3 months ago');
    expect(pinLine({ isSet: false, changedAt: null, lockedUntil: null }, NOW)).toBe('Not set yet');
    expect(pinLine({ isSet: true, changedAt: null, lockedUntil: null }, NOW)).toBe('Set');
  });

  it('beneficiaries are the server count, "None saved" for zero', () => {
    expect(savedLine(6)).toBe('6 saved');
    expect(savedLine(1)).toBe('1 saved');
    expect(savedLine(0)).toBe('None saved');
  });

  it('the limits row names the tier only when the server does, and shows the figures as sent', () => {
    expect(limitsLine({ tier: null, dailyLimitKobo: 500_000_000, remainingTodayKobo: 120_050_000 })).toEqual({
      title: 'Daily limit',
      subtitle: '₦5,000,000 daily · ₦1,200,500 left today',
    });
    expect(limitsLine({ tier: 'Level 2', dailyLimitKobo: 100_000, remainingTodayKobo: 0 }).title).toBe('Level 2');
  });

  it('the account line is the bank, a dot and the number', () => {
    expect(accountLine('Ekiti Trial MFB', '810 000 0417')).toBe('Ekiti Trial MFB · 810 000 0417');
  });

  it('no line carries an em-dash (R-5)', () => {
    const lines = [pinLine({ isSet: true, changedAt: ago(DAY), lockedUntil: null }, NOW), savedLine(2), NEW_PIN_LINE, stepLabel(1), lengthLine()];
    for (const line of lines) expect(line).not.toContain('—');
  });
});

describe('the PIN flow rules', () => {
  it('the PIN is four digits and the code six, and "Four digits." is written from the length', () => {
    expect(PIN_LENGTH).toBe(4);
    expect(CODE_LENGTH).toBe(6);
    expect(lengthLine()).toBe('Four digits.');
    expect(lengthLine(6)).toBe('Six digits.');
    expect(lengthLine(1)).toBe('One digit.');
    expect(stepLabel(2)).toBe('Step 2 of 2');
  });

  it('sentTo reads as a phone when the server names one, and as the email when it names an address', () => {
    expect(sentToLine('+234 *** *** 4412')).toBe('To +234 *** *** 4412');
    expect(sentToLine('a***@example.com')).toBe('To your email, a***@example.com');
    expect(sentToLine('your email address')).toBe('To your email address');
  });

  it('a refusal is told apart by its code, and only a missing or unreadable answer is "unanswered"', () => {
    const refuse = (status: number, code: string | undefined, message = 'The server says no.') =>
      refusalOf(new ApiError(status === 0 ? 'network' : 'unknown', status, message, code));
    expect(refuse(403, 'pin_incorrect', 'Wrong PIN. 3 tries left.')).toEqual({ kind: 'wrong_pin', line: 'Wrong PIN. 3 tries left.' });
    expect(refuse(423, 'pin_locked').kind).toBe('locked');
    expect(refuse(400, 'pin_mismatch').kind).toBe('mismatch');
    expect(refuse(400, 'reset_code_invalid').kind).toBe('bad_code');
    expect(refuse(409, 'pin_not_set').kind).toBe('no_pin');
    // The same request still running on the server is not a refusal and not "no answer": its answer will come.
    expect(refuse(409, 'idempotency_in_progress', 'This request is still going through. Check again in a moment.')).toEqual({
      kind: 'in_progress',
      line: 'This request is still going through. Check again in a moment.',
    });
    expect(refuse(409, 'wallet_not_open').kind).toBe('no_wallet');
    expect(refuse(409, 'wallet_opening').kind).toBe('no_wallet');
    // A frozen wallet is an answer, though its status is not one of the usual ones.
    expect(refuse(423, 'wallet_frozen').kind).toBe('other');
    expect(refuse(429, 'reset_codes_exhausted').kind).toBe('other');
    expect(refuse(0, undefined).kind).toBe('unanswered');
    expect(refuse(503, 'provider_unreachable').kind).toBe('unanswered');
    expect(refuse(200, undefined).kind).toBe('unanswered');
    expect(refusalOf(new Error('boom')).kind).toBe('unanswered');
  });

  it('an Idempotency-Key is in the Hub’s format, never repeats, and says nothing of the PIN', () => {
    const keys = Array.from({ length: 200 }, () => newRequestKey());
    for (const key of keys) expect(key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('where the runtime has no randomUUID the key is made from the time, a counter and random digits, in the same format and still unique', () => {
    const real = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      const keys = Array.from({ length: 200 }, () => newRequestKey());
      for (const key of keys) expect(key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
      expect(new Set(keys).size).toBe(keys.length);
      // Not a UUID: it came from the fallback.
      expect(keys[0]).toMatch(/^w-/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: real, configurable: true });
    }
  });

  it('the lock has time left only while its end is ahead', () => {
    const now = Date.parse('2026-10-10T12:00:00.000Z');
    expect(lockLeftMs('2026-10-10T12:30:00.000Z', now)).toBe(30 * MIN);
    expect(lockLeftMs('2026-10-10T11:59:00.000Z', now)).toBe(0);
    expect(lockLeftMs(null, now)).toBe(0);
    expect(lockLeftMs('nonsense', now)).toBe(0);
  });
});
