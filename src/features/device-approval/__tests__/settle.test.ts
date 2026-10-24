import { asBiometricResult, asPinResult, notApproved } from '../settle';

/*
 * The one rule every payment sheet settles a closed or refused fingerprint or face approval by (FIX-108): it proves nothing about an
 * earlier try under the same Idempotency-Key, so only a first try lets go of the record it wrote itself, and the key is never touched.
 */
describe('notApproved', () => {
  it('a first try lets go of the record it wrote itself, and answers cancelled or failed', () => {
    const forget = jest.fn();
    expect(notApproved('cancelled', false, forget)).toEqual({ code: 'cancelled' });
    expect(notApproved('failed', false, forget)).toEqual({ code: 'failed' });
    expect(forget).toHaveBeenCalledTimes(2);
  });

  it('a repeat of an earlier try (its answer was lost) lets go of nothing, whichever way the approval did not happen', () => {
    const forget = jest.fn();
    expect(notApproved('cancelled', true, forget)).toEqual({ code: 'cancelled' });
    expect(notApproved('failed', true, forget)).toEqual({ code: 'failed' });
    expect(forget).not.toHaveBeenCalled();
  });

  it('the sheet takes the answer as a biometric answer, and a PIN sheet reads it as "no answer"', () => {
    expect(asBiometricResult(notApproved('failed', true, jest.fn()))).toEqual({ code: 'failed' });
    expect(asPinResult(notApproved('cancelled', true, jest.fn()))).toEqual({ code: 'unanswered' });
  });
});
