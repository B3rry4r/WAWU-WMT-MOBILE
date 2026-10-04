import { ApiError } from '@/api/errors';

import { afterPinRefusal, groupedAccountNumber, lengthLine, PIN_LENGTH, PIN_PURPOSE } from '../pin';

describe('A9 and A10’s words and answers', () => {
  it('the length line is written from the PIN’s length, never typed in', () => {
    expect(PIN_LENGTH).toBe(4);
    expect(lengthLine()).toBe('Four digits.');
    expect(lengthLine(6)).toBe('Six digits.');
    expect(lengthLine(1)).toBe('One digit.');
    expect(lengthLine(12)).toBe('12 digits.');
    expect(`${lengthLine()} ${PIN_PURPOSE}`).not.toContain('—');
  });

  it('a user whose two entries differ is told in the server’s words, in the wrong-PIN look', () => {
    expect(afterPinRefusal(new ApiError('validation', 400, 'The two PINs do not match. Enter the same PIN twice.', 'pin_mismatch'))).toEqual({
      kind: 'again',
      line: 'The two PINs do not match. Enter the same PIN twice.',
      wrongPin: true,
    });
  });

  it('a PIN already set is never "set": the earlier one stands; a refusal starts again with its sentence; no answer asks where the PIN stands', () => {
    expect(afterPinRefusal(new ApiError('conflict', 409, 'You already have a transaction PIN.', 'pin_already_set'))).toEqual({ kind: 'already' });
    expect(afterPinRefusal(new ApiError('conflict', 409, 'Your account is still being opened. Check again in a moment.', 'wallet_opening'))).toEqual({
      kind: 'again',
      line: 'Your account is still being opened. Check again in a moment.',
      wrongPin: false,
    });
    expect(afterPinRefusal(new ApiError('network', 0, 'No connection. Check your internet and try again.'))).toEqual({
      kind: 'unknown',
      line: 'No connection. Check your internet and try again.',
    });
    expect(afterPinRefusal(new ApiError('server', 500, 'Something went wrong. Please try again.'))).toEqual({ kind: 'unknown', line: 'Something went wrong. Please try again.' });
    expect(afterPinRefusal(new Error('boom'))).toEqual({ kind: 'unknown', line: "We couldn't set your PIN. Try again." });
  });

  it('a NUBAN is shown 3, 3 and 4 as A8 draws it; anything else as sent', () => {
    expect(groupedAccountNumber('8123456789')).toBe('812 345 6789');
    expect(groupedAccountNumber('81234567')).toBe('81234567');
  });
});
