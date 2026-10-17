import type { Bank, PayoutAccount } from '../api/payoutAccount';
import { canSave, digitsOnly, filterBanks, formFrom, isComplete, isSaved, nameLine, shouldCheckName, type NameCheck, type PayoutForm } from '../payoutForm';

const saved: PayoutAccount = {
  bankCode: '000013',
  bankName: 'GTBANK PLC',
  accountNumber: '0123456789',
  accountName: 'SIMI MICHELLE',
  matchesBvnName: true,
  updatedAt: '2026-10-03T11:35:39.000Z',
};

const gtb = { code: '000013', name: 'GTBANK PLC' };
const access = { code: '000014', name: 'ACCESS BANK' };
const idle: NameCheck = { status: 'idle' };

describe('A21 form rules', () => {
  it('a user with nothing saved starts with an empty form; a saved account fills it', () => {
    expect(formFrom(null)).toEqual({ bank: null, accountNumber: '' });
    expect(formFrom(saved)).toEqual({ bank: gtb, accountNumber: '0123456789' });
  });

  it('a user can only type digits, at most ten, whatever is pasted', () => {
    expect(digitsOnly('0123 456-789')).toBe('0123456789');
    expect(digitsOnly('01234567891234')).toBe('0123456789');
    expect(digitsOnly('abc')).toBe('');
  });

  it('the bank is asked only for a complete form that is not the saved account', () => {
    expect(shouldCheckName({ bank: null, accountNumber: '0123456789' }, null)).toBe(false);
    expect(shouldCheckName({ bank: gtb, accountNumber: '012345678' }, null)).toBe(false);
    expect(shouldCheckName({ bank: gtb, accountNumber: '0123456789' }, null)).toBe(true);
    expect(shouldCheckName({ bank: gtb, accountNumber: '0123456789' }, saved)).toBe(false);
    expect(shouldCheckName({ bank: access, accountNumber: '0123456789' }, saved)).toBe(true);
    expect(shouldCheckName({ bank: gtb, accountNumber: '0123456788' }, saved)).toBe(true);
  });

  it('a user sees the saved name and the server’s BVN answer for the saved account, whatever it is', () => {
    const form = formFrom(saved);
    expect(isSaved(form, saved)).toBe(true);
    expect(nameLine(form, saved, idle)).toEqual({ kind: 'resolved', name: 'SIMI MICHELLE', match: true });
    expect(nameLine(form, { ...saved, matchesBvnName: false }, idle)).toEqual({ kind: 'resolved', name: 'SIMI MICHELLE', match: false });
    expect(nameLine(form, { ...saved, matchesBvnName: null }, idle)).toEqual({ kind: 'resolved', name: 'SIMI MICHELLE', match: null });
  });

  it('before saving, the bank’s name shows with no BVN claim, since the name check does not compare it (G-58)', () => {
    const form: PayoutForm = { bank: access, accountNumber: '0987654321' };
    const ok: NameCheck = { status: 'success', data: { bankCode: access.code, bankName: access.name, accountNumber: '0987654321', accountName: 'LENNOX EMMANUEL', nameToken: 'x' } };
    expect(nameLine(form, saved, ok)).toEqual({ kind: 'resolved', name: 'LENNOX EMMANUEL', match: null });
    expect(nameLine(form, saved, { status: 'pending' })).toEqual({ kind: 'checking' });
    expect(nameLine(form, saved, { status: 'error', unconfirmed: true, message: 'We could not confirm that account.' })).toEqual({
      kind: 'unconfirmed',
      message: 'We could not confirm that account.',
    });
    expect(nameLine(form, saved, { status: 'error', unconfirmed: false, message: 'x' })).toEqual({ kind: 'unchecked' });
    expect(nameLine({ bank: access, accountNumber: '09876' }, saved, ok)).toEqual({ kind: 'none' });
  });

  it('a user can save a new account once the bank answered or could not be asked, never one the bank refused', () => {
    const form: PayoutForm = { bank: access, accountNumber: '0987654321' };
    expect(isComplete(form)).toBe(true);
    expect(canSave(form, saved, { kind: 'resolved', name: 'LENNOX EMMANUEL', match: null }, false)).toBe(true);
    expect(canSave(form, saved, { kind: 'unchecked' }, false)).toBe(true);
    expect(canSave(form, saved, { kind: 'unconfirmed', message: 'no' }, false)).toBe(false);
    expect(canSave(form, saved, { kind: 'checking' }, false)).toBe(false);
    expect(canSave(form, saved, { kind: 'resolved', name: 'LENNOX EMMANUEL', match: null }, true)).toBe(false);
    expect(canSave(formFrom(saved), saved, { kind: 'resolved', name: 'SIMI MICHELLE', match: true }, false)).toBe(false);
    expect(canSave({ bank: null, accountNumber: '0987654321' }, null, { kind: 'none' }, false)).toBe(false);
  });

  it('a user can find a bank by any part of its name, any case; the list keeps the API’s order', () => {
    const banks: Bank[] = [gtb, access, { code: '090267', name: 'KUDA MICROFINANCE BANK' }];
    expect(filterBanks(banks, '')).toEqual(banks);
    expect(filterBanks(banks, '  Kuda ')).toEqual([banks[2]]);
    expect(filterBanks(banks, 'bank')).toEqual(banks);
    expect(filterBanks(banks, 'gtb')).toEqual([gtb]);
    expect(filterBanks(banks, 'zenith')).toEqual([]);
  });
});
