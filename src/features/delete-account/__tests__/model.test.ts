import { canContinue, CONFIRM_WORD, deletionDate, isConfirmed, LEAVING_REASONS, moneyLine, scheduledLine, walletView } from '../model';

describe('Z6 · what the wallet allows', () => {
  const account = { accountNumber: '8012345678', accountName: 'Ada Okafor', bankName: 'Nuvion' };

  it('money in the wallet blocks Continue and carries the bank\'s figure unchanged', () => {
    const view = walletView({ kind: 'ready', account, availableKobo: 48_525_075 });
    expect(view).toEqual({ kind: 'money', kobo: 48_525_075 });
    expect(canContinue(view)).toBe(false);
    expect(moneyLine(48_525_075)).toBe('You have ₦485,250.75. Withdraw it to your bank before deleting.');
  });

  it('one kobo is money: the wallet is empty only at 0', () => {
    expect(walletView({ kind: 'ready', account, availableKobo: 1 })).toEqual({ kind: 'money', kobo: 1 });
    expect(canContinue(walletView({ kind: 'ready', account, availableKobo: 0 }))).toBe(true);
  });

  it('no wallet (R-6) is clear and has no wallet to name', () => {
    expect(walletView({ kind: 'no_wallet' })).toEqual({ kind: 'clear', hasWallet: false });
    expect(canContinue(walletView({ kind: 'no_wallet' }))).toBe(true);
  });

  it('a balance that cannot be read, or is still loading, is never empty', () => {
    expect(canContinue(walletView({ kind: 'loading' }))).toBe(false);
    for (const view of [
      { kind: 'opening' },
      { kind: 'unreachable', message: 'We could not reach your account.' },
      { kind: 'frozen', message: 'Frozen.' },
      { kind: 'wallet_error', error: new Error('x') },
      { kind: 'balance_error', error: new Error('x') },
    ] as const) {
      expect(canContinue(walletView(view))).toBe(false);
    }
    expect(walletView({ kind: 'opening' })).toMatchObject({ kind: 'notice', action: 'Check again' });
    expect(walletView({ kind: 'unreachable', message: 'm' })).toMatchObject({ kind: 'notice', message: 'm', action: 'Try again' });
  });
});

describe('Z7 · the confirmation', () => {
  it('only the word DELETE confirms', () => {
    expect(CONFIRM_WORD).toBe('DELETE');
    expect(isConfirmed('DELETE')).toBe(true);
    expect(isConfirmed(' DELETE ')).toBe(true);
    for (const typed of ['', 'delete', 'DELET', 'DELETE ME', 'Delete']) expect(isConfirmed(typed)).toBe(false);
  });

  it('offers the five choices the Hub keeps, each with words', () => {
    expect(LEAVING_REASONS.map((r) => r.code)).toEqual(['not_using_enough', 'another_account', 'privacy', 'too_many_notifications', 'something_else']);
    expect(LEAVING_REASONS[0].label).toBe("I don't use it enough");
    for (const r of LEAVING_REASONS) expect(r.label.trim().length).toBeGreaterThan(0);
  });
});

describe('Z8 · the date is the Hub\'s, on the Lagos clock', () => {
  const now = new Date('2026-10-17T10:00:00.000Z');

  it('writes the day the Hub named', () => {
    expect(deletionDate('2026-11-16T10:00:00.000Z', now)).toBe('16 November');
    expect(scheduledLine('2026-11-16T10:00:00.000Z', now)).toBe('On 16 November. Sign in before then to cancel.');
  });

  it('counts the Lagos day, one hour ahead of UTC: 23:30 UTC is already the next morning in Lagos', () => {
    expect(deletionDate('2026-10-25T23:30:00.000Z', now)).toBe('26 October');
    expect(deletionDate('2026-10-25T22:59:00.000Z', now)).toBe('25 October');
  });

  it('adds the year only when it is not this year', () => {
    expect(deletionDate('2027-01-05T10:00:00.000Z', now)).toBe('5 January 2027');
  });

  it('says nothing about a day it cannot read', () => {
    expect(deletionDate('soon', now)).toBe('');
    expect(scheduledLine('soon', now)).toBe('Sign in before the deletion date to cancel.');
  });
});
