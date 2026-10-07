import { ApiError } from '@/api/errors';

import type { WalletTransaction } from '../api/home';
import { bankLine, fitFigureSize, fundingLine, homeView, recentRow, rowTime } from '../home/model';

const ACCOUNT = { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB' };
const read = <T>(data: T | undefined, error: unknown = null, isPending = data === undefined) => ({ data, error, isPending });

/** A made-up ledger row in the contract's shape (MONEY-15). */
function row(over: Partial<WalletTransaction> = {}): WalletTransaction {
  return {
    id: 'row-1',
    direction: 'out',
    category: 'transfer',
    status: 'completed',
    amountKobo: 2_500_000,
    fee: { providerFeeKobo: 4_000, wawuFeeKobo: 2_500, totalFeeKobo: 6_500 },
    totalKobo: 2_506_500,
    description: 'Transfer · GTBank',
    counterparty: { kind: 'bank_account', name: 'Chidinma Okoro', avatarUrl: null, wawuUserId: null, bankName: 'GTBank', accountNumberLast4: '6789' },
    link: null,
    note: null,
    reference: 'WAW-TEST-0001',
    transferId: null,
    paymentId: null,
    group: null,
    createdAt: '2026-10-07T09:24:00.000Z',
    ...over,
  };
}

describe('the Wallet tab picks its state from its reads', () => {
  it('shows W4 until the wallet and its balance are both in', () => {
    expect(homeView(read(undefined), read(undefined)).kind).toBe('loading');
    expect(homeView(read({ state: 'open', account: ACCOUNT }), read(undefined)).kind).toBe('loading');
  });

  it('shows the balance once both are in', () => {
    expect(homeView(read({ state: 'open', account: ACCOUNT }), read({ availableKobo: 0 }))).toEqual({ kind: 'ready', account: ACCOUNT, availableKobo: 0 });
  });

  it('leads a person with no wallet to Open your wallet, and waits while one is opening', () => {
    expect(homeView(read({ state: 'not_open', account: null }), read(undefined)).kind).toBe('no_wallet');
    expect(homeView(read({ state: 'opening', account: null }), read(undefined)).kind).toBe('opening');
  });

  it('shows W6 with the server’s own sentence when the bank does not answer, never a figure', () => {
    const down = new ApiError('server', 503, 'We could not reach your account. Your money is safe. Try again in a moment.', 'provider_unreachable');
    expect(homeView(read({ state: 'open', account: ACCOUNT }), read(undefined, down))).toEqual({
      kind: 'unreachable',
      message: 'We could not reach your account. Your money is safe. Try again in a moment.',
    });
  });

  it('tells a frozen wallet, a failed wallet read and any other failed balance apart', () => {
    const frozen = new ApiError('unknown', 423, 'Your wallet is frozen.', 'wallet_frozen');
    expect(homeView(read({ state: 'open', account: ACCOUNT }), read(undefined, frozen)).kind).toBe('frozen');
    const offline = new ApiError('network', 0, 'No connection. Check your internet and try again.');
    expect(homeView(read(undefined, offline), read(undefined)).kind).toBe('wallet_error');
    expect(homeView(read({ state: 'open', account: ACCOUNT }), read(undefined, offline)).kind).toBe('balance_error');
  });
});

describe('the words the card and the empty state use', () => {
  it('names the bank the server sends after "WAWU · "', () => {
    expect(bankLine('Loma Bank')).toBe('WAWU · Loma Bank');
    expect(bankLine('Ekiti Trial MFB')).toBe('WAWU · Ekiti Trial MFB');
  });

  it('puts the account’s own number in W5’s line', () => {
    expect(fundingLine('810 000 0417')).toBe('Send to 810 000 0417 from any Nigerian bank.');
  });
});

describe('a recent row', () => {
  const now = new Date('2026-10-07T15:00:00.000Z');

  it('shows a debit as the total that left the wallet, fees included (BRIEF W1)', () => {
    const shown = recentRow(row(), now);
    expect(shown.amountKobo).toBe(-2_506_500);
    expect(shown.title).toBe('Chidinma Okoro');
    expect(shown.subtitle).toBe('Transfer · GTBank');
    expect(shown.lead).toEqual({ kind: 'icon', icon: 'ArrowUpRight', tone: 'neutral' });
  });

  it('shows money in as a plus, with the person’s avatar when they are on Who Made This', () => {
    const shown = recentRow(
      row({
        direction: 'in',
        category: 'earning',
        amountKobo: 200_000,
        fee: { providerFeeKobo: 0, wawuFeeKobo: 0, totalFeeKobo: 0 },
        totalKobo: 200_000,
        description: 'Tip on your video',
        counterparty: { kind: 'wawu_user', name: 'Amaka Nwosu', avatarUrl: null, wawuUserId: 'user-7', bankName: null, accountNumberLast4: null },
      }),
      now,
    );
    expect(shown.amountKobo).toBe(200_000);
    expect(shown.lead.kind).toBe('avatar');
  });

  it('says when a movement is not settled', () => {
    expect(recentRow(row({ status: 'pending' }), now).meta).toBe('Pending · 10:24');
    expect(recentRow(row({ status: 'failed' }), now).meta).toBe('Failed · 10:24');
  });

  it('falls back to the description when nobody is named', () => {
    const shown = recentRow(row({ counterparty: null, category: 'bill', description: 'Ikeja Electric · Prepaid' }), now);
    expect(shown.title).toBe('Ikeja Electric · Prepaid');
    expect(shown.subtitle).toBeUndefined();
    expect(shown.lead).toEqual({ kind: 'icon', icon: 'Receipt', tone: 'neutral' });
  });
});

describe('when a row happened, in Lagos time', () => {
  const now = new Date('2026-10-07T15:00:00.000Z'); // a Wednesday, 16:00 in Lagos

  it('writes today as the time, then Yesterday, then the weekday, then the date', () => {
    expect(rowTime('2026-10-07T09:24:00.000Z', now)).toBe('10:24');
    expect(rowTime('2026-10-06T22:59:00.000Z', now)).toBe('Yesterday');
    expect(rowTime('2026-10-06T23:30:00.000Z', now)).toBe('00:30');
    expect(rowTime('2026-10-05T08:00:00.000Z', now)).toBe('Mon');
    expect(rowTime('2026-09-22T08:00:00.000Z', now)).toBe('22 Sep');
    expect(rowTime('2025-12-31T08:00:00.000Z', now)).toBe('31 Dec 2025');
  });

  it('a row exactly six days old still shows its weekday; seven days old shows the date', () => {
    expect(rowTime('2026-10-01T08:00:00.000Z', now)).toBe('Thu');
    expect(rowTime('2026-09-30T08:00:00.000Z', now)).toBe('30 Sep');
  });

  it('writes nothing for a time it cannot read', () => {
    expect(rowTime('not a time', now)).toBe('');
  });
});

describe('the balance’s size (a balance is never cut off)', () => {
  it('keeps the design’s 42 while the figure fits', () => {
    expect(fitFigureSize(220, 300, 42, 18, 2)).toBe(42);
    expect(fitFigureSize(300, 300, 42, 18, 2)).toBe(42);
  });

  it('steps down to the largest size that fits', () => {
    // 42 * 232 / 300 = 32.48, so 32
    expect(fitFigureSize(300, 232, 42, 18, 2)).toBe(32);
    const size = fitFigureSize(410, 232, 42, 18, 2);
    expect((410 * size) / 42).toBeLessThanOrEqual(232);
    expect((410 * (size + 2)) / 42).toBeGreaterThan(232);
  });

  it('never goes below the floor', () => {
    expect(fitFigureSize(2000, 232, 42, 18, 2)).toBe(18);
  });

  it('draws the design’s size until both widths are measured', () => {
    expect(fitFigureSize(0, 232, 42, 18, 2)).toBe(42);
    expect(fitFigureSize(410, 0, 42, 18, 2)).toBe(42);
  });
});
