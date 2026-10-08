import { EXPORT_FAILED_LINE, EXPORT_IDLE_LINE, EXPORT_PENDING_LINE, exportLineOf, exportStateOf } from '../exportState';
import { NOTIFICATION_GROUPS, PRIVACY_GROUPS, notificationOn, subtitleOf, privacyOn } from '../groups';
import { maskPhone } from '../phone';
import { MAX_LENGTH, MIN_LENGTH, passwordFailure, passwordProblems } from '../passwordFailure';
import { ApiError } from '@/api/errors';
import { waitInWords } from '../failure';

const base = { userWawuId: 'u', newReplies: true, newFollowers: true, dmReminders: true, refunds: true, promotions: false, communityDigest: false };

describe('Z3 switch values', () => {
  it('reads a key the Hub never held as on, and a held key as it is', () => {
    expect(notificationOn(base, 'moneyIn')).toBe(true);
    expect(notificationOn({ ...base, moneyIn: false }, 'moneyIn')).toBe(false);
    expect(notificationOn({ ...base, contentReviews: null }, 'contentReviews')).toBe(true);
    expect(notificationOn(base, 'promotions')).toBe(false);
    expect(notificationOn({ ...base, communityMessages: false }, 'communityMessages')).toBe(false);
  });

  it('draws every switch Z3 draws, in its three groups, each saving one Hub key', () => {
    expect(NOTIFICATION_GROUPS.map((g) => g.title)).toEqual(['Money', 'Messages', 'Content']);
    expect(NOTIFICATION_GROUPS.flatMap((g) => g.switches.map((s) => s.key))).toEqual([
      'moneyIn',
      'refunds',
      'dmReminders',
      'communityMessages',
      'contentReviews',
      'newFollowers',
      'promotions',
    ]);
  });

  it('names the app, not WAWU, where it names the sender (R-37), and writes no em-dash', () => {
    const words = JSON.stringify([NOTIFICATION_GROUPS, PRIVACY_GROUPS]);
    expect(words).not.toMatch(/WAWU|—/);
    expect(words).toContain('From Who Made This');
  });
});

describe('Z4 switch values', () => {
  const privacy = { userWawuId: 'u', showPurchases: false, showSavedItems: true, showFollowing: true, showInMemberLists: false };

  it('reads each key as the Hub holds it', () => {
    expect(privacyOn(privacy, 'showPurchases')).toBe(false);
    expect(privacyOn(privacy, 'showSavedItems')).toBe(true);
    expect(privacyOn(privacy, 'showInMemberLists')).toBe(false);
  });

  it('says the purchases line only when it is off, the one line the canvas draws and the Hub makes true', () => {
    const purchases = PRIVACY_GROUPS[0]!.switches[0]!;
    expect(subtitleOf(purchases, false)).toBe('Off, nobody sees your purchases');
    expect(subtitleOf(purchases, true)).toBeUndefined();
    expect(subtitleOf(PRIVACY_GROUPS[1]!.switches[0]!, true)).toBe('Your messages are visible either way');
    expect(subtitleOf(PRIVACY_GROUPS[0]!.switches[1]!, true)).toBeUndefined();
  });
});

describe('the data request line', () => {
  const request = (status: string, at: string) => ({ id: at, userWawuId: 'u', status, requestedAt: at });

  it('says where an export goes when nothing is waiting', () => {
    expect(exportLineOf(exportStateOf(undefined))).toBe(EXPORT_IDLE_LINE);
    expect(exportLineOf(exportStateOf([]))).toBe(EXPORT_IDLE_LINE);
    expect(exportLineOf(exportStateOf([request('sent', '2026-10-01T10:00:00Z')]))).toBe(EXPORT_IDLE_LINE);
  });

  it('follows the newest request, whatever order the Hub sends them in', () => {
    const older = request('failed', '2026-10-01T10:00:00Z');
    const newer = request('pending', '2026-10-02T10:00:00Z');
    expect(exportLineOf(exportStateOf([older, newer]))).toBe(EXPORT_PENDING_LINE);
    expect(exportLineOf(exportStateOf([newer, older]))).toBe(EXPORT_PENDING_LINE);
    expect(exportLineOf(exportStateOf([request('sent', '2026-10-01T10:00:00Z'), request('failed', '2026-10-03T10:00:00Z')]))).toBe(EXPORT_FAILED_LINE);
  });
});

describe('the phone line', () => {
  it('keeps the first four and last four digits of a Nigerian number as Z2 draws it, and only the last four of any other', () => {
    expect(maskPhone('+2348031234412')).toBe('0803 ••• 4412');
    expect(maskPhone('08031234412')).toBe('0803 ••• 4412');
    expect(maskPhone('+447911123456')).toBe('••• 3456');
  });

  it('shows nothing for a number that is missing or too short', () => {
    expect(maskPhone(null)).toBe('');
    expect(maskPhone('')).toBe('');
    expect(maskPhone('12')).toBe('');
  });

  it('never leaves the middle digits in, nor the whole number', () => {
    expect(maskPhone('+2348031234412')).not.toContain('123');
    expect(maskPhone('+2348031234412')).not.toContain('8031234412');
    expect(maskPhone('+2348031234412').replace(/\D/g, '')).toBe('08034412');
  });
});

describe('the change-password form', () => {
  it('asks for both passwords and holds the new one to the server\'s own length', () => {
    expect(passwordProblems('', '')).toEqual({ current: 'Enter your current password.', next: 'Enter a new password.' });
    expect(passwordProblems('old', 'a'.repeat(MIN_LENGTH - 1)).next).toBe(`Use at least ${MIN_LENGTH} characters.`);
    expect(passwordProblems('old', 'a'.repeat(MAX_LENGTH + 1)).next).toBe(`Use no more than ${MAX_LENGTH} characters.`);
    expect(passwordProblems('old', 'a'.repeat(MIN_LENGTH))).toEqual({ current: undefined, next: undefined });
    expect(passwordProblems('old', 'a'.repeat(MAX_LENGTH))).toEqual({ current: undefined, next: undefined });
  });

  it('puts each refusal where it belongs', () => {
    expect(passwordFailure(new ApiError('validation', 400, 'x', 'CURRENT_PASSWORD_WRONG'))).toEqual({ where: 'current', message: 'That is not your current password.' });
    expect(passwordFailure(new ApiError('validation', 400, 'x', 'PASSWORD_UNCHANGED'))).toMatchObject({ where: 'new' });
    expect(passwordFailure(new ApiError('validation', 400, 'x'))).toMatchObject({ where: 'new' });
    expect(passwordFailure(new ApiError('conflict', 409, 'x', 'PASSWORD_NOT_SET'))).toMatchObject({ where: 'banner', tone: 'warning' });
    expect(passwordFailure(new ApiError('unauthorized', 401, 'x', 'SESSION_INVALID'))).toMatchObject({ where: 'banner', title: 'Your session ended' });
    expect(passwordFailure(new ApiError('network', 0, 'No connection.'))).toMatchObject({ where: 'banner', title: 'No connection' });
    expect(passwordFailure(new Error('boom'))).toMatchObject({ where: 'banner', tone: 'danger' });
  });

  it('says the wait the server asked for, in words', () => {
    expect(passwordFailure(new ApiError('rate_limited', 429, 'x', 'RATE_LIMITED', 600))).toMatchObject({ body: 'Wait 10 minutes and try again.' });
    expect(passwordFailure(new ApiError('rate_limited', 429, 'x', 'RATE_LIMITED'))).toMatchObject({ body: 'Wait a little and try again.' });
    expect(waitInWords(30)).toBe('1 minute');
    expect(waitInWords(61)).toBe('2 minutes');
    expect(waitInWords(3600)).toBe('1 hour');
    expect(waitInWords(7300)).toBe('3 hours');
  });
});
