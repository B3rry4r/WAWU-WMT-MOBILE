import * as rtl from '@testing-library/react-native';

import { MoneyCard } from '@/features/home/MoneyCard';
import { actionTileSize } from '@/features/wallet/home/WalletActions';

import type { Transfer } from '../api';
import { CONFIRMING_LINE, RETRY_LINE, feeLinesOf, firstName, limitLine, payeeFromParams, payeeLine, payeeParams, quoteAddsUp, quoteSpent, receiptRows, shareText, toLine } from '../model';

const AMAKA = { wawuUserId: '11111111-1111-4111-8111-111111111111', name: 'Amaka Nwosu', handle: 'amaka', avatarUrl: null, tick: 'creator' as const };

const sent: Transfer = {
  id: 's1',
  kind: 'wawu_user',
  status: 'completed',
  amountKobo: 2_500_000,
  fee: { providerFeeKobo: 1575, wawuFeeKobo: 1000, totalFeeKobo: 2575 },
  totalKobo: 2_502_575,
  note: 'Rent',
  reference: 'wawu-send-8f2k91qx',
  toWawuUser: { wawuUserId: AMAKA.wawuUserId, displayName: 'Amaka Nwosu', handle: 'amaka', avatarUrl: null, tick: 'creator' },
  toBankAccount: null,
  timeline: [],
  failureReason: null,
  reversal: null,
  statusMessage: null,
  transactionId: null,
  createdAt: '2026-10-16T09:42:00.000Z',
  completedAt: '2026-10-16T09:42:05.000Z',
} as Transfer;

describe('what the send screens read and write', () => {
  it('a person rides the route as strings and comes back whole; a route without an id or a name carries nobody', () => {
    expect(payeeFromParams(payeeParams(AMAKA))).toEqual(AMAKA);
    expect(payeeFromParams({ id: 'x' })).toBeNull();
    expect(payeeFromParams({ name: 'x' })).toBeNull();
    expect(payeeFromParams({ id: 'x', name: 'Y', tick: 'gold' })?.tick).toBeNull();
  });

  it('the line under a name is the handle and what the tick means', () => {
    expect(payeeLine({ handle: 'amaka', tick: 'creator' })).toBe('@amaka · Creator');
    expect(payeeLine({ handle: 'chidieze', tick: 'professional' })).toBe('@chidieze · Professional');
    expect(payeeLine({ handle: 'kemi.designs', tick: null })).toBe('@kemi.designs');
    expect(payeeLine({ handle: null, tick: null })).toBe('');
    expect(firstName('Amaka Nwosu')).toBe('Amaka');
  });

  it('the quote’s parts are Fintava’s charge then WAWU’s fee, and a total that is not amount plus parts is refused', () => {
    const quote = { amountKobo: 2_500_000, parts: [{ code: 'balance_transfer', source: 'provider', amountKobo: 1575 }, { code: 'wawu_fee', source: 'wawu', amountKobo: 1000 }], totalKobo: 2_502_575 } as never;
    expect(feeLinesOf(quote)).toEqual([
      { label: "Fintava's charge", amountKobo: 1575 },
      { label: "WAWU's fee", amountKobo: 1000 },
    ]);
    expect(quoteAddsUp(quote)).toBe(true);
    expect(quoteAddsUp({ ...(quote as object), totalKobo: 2_502_576 } as never)).toBe(false);
    expect(feeLinesOf({ parts: [{ code: 'a', source: 'provider', amountKobo: 1 }, { code: 'b', source: 'provider', amountKobo: 2 }] } as never)).toEqual([{ label: "Fintava's charge", amountKobo: 3 }]);
  });

  it('a limit is said with the Hub’s own figure, and only when the send is over it', () => {
    expect(limitLine({ withinDailyLimit: true, remainingTodayKobo: 100, totalKobo: 1 })).toBeNull();
    expect(limitLine({ withinDailyLimit: false, remainingTodayKobo: 1_000_000, totalKobo: 1 })).toBe('This send is over your limit for today. You can send ₦10,000 more today.');
    expect(limitLine({ withinDailyLimit: false, remainingTodayKobo: null, totalKobo: 1 })).toBe('This send is over your limit for today.');
  });

  it('a quote with a time that has passed, or none that can be read, is spent', () => {
    expect(quoteSpent({ expiresAt: '2026-10-16T09:00:00.000Z' }, Date.parse('2026-10-16T09:00:01.000Z'))).toBe(true);
    expect(quoteSpent({ expiresAt: '2026-10-16T09:00:00.000Z' }, Date.parse('2026-10-16T08:59:59.000Z'))).toBe(false);
    expect(quoteSpent({ expiresAt: 'soon' }, 0)).toBe(true);
  });

  it('the receipt lists the reference, the Lagos date, the wallet, the note, each charge, the fees and the total paid, all from the send', () => {
    expect(receiptRows(sent).map((r) => [r.key, r.value || r.money])).toEqual([
      ['reference', 'wawu-send-8f2k91qx'],
      ['date', '16 Oct 2026, 10:42'],
      ['from', 'Naira wallet'],
      ['note', 'Rent'],
      ['provider', 1575],
      ['wawu', 1000],
      ['fees', 2575],
      ['total', 2_502_575],
    ]);
    expect(toLine(sent)).toBe('To Amaka Nwosu · @amaka');
  });

  it('the shared text holds the receipt and its reference, with every figure the one on screen', () => {
    expect(shareText(sent)).toBe(
      [
        'Who Made This receipt',
        '₦25,000 sent',
        'To Amaka Nwosu · @amaka',
        'Date: 16 Oct 2026, 10:42',
        'From: Naira wallet',
        'Note: Rent',
        "Fintava's charge: ₦15.75",
        "WAWU's fee: ₦10.00",
        'Fees: ₦25.75',
        'Total paid: ₦25,025.75',
        'Reference: wawu-send-8f2k91qx',
      ].join('\n'),
    );
  });

  it('Send keeps the column the board gives it (one of five), so adding Add money, Withdraw and the rest resizes nothing', () => {
    expect(actionTileSize(350)).toBe(54);
    expect(actionTileSize(0)).toBe(0);
  });

  it('Home’s balance card has Send, first, and it calls the send', async () => {
    const onSend = jest.fn();
    await rtl.render(
      <MoneyCard state={{ kind: 'figure', kobo: 48_525_075 }} masked={false} onToggleMask={() => undefined} onOpenWallet={() => undefined} onRetryWallet={() => undefined} onRetryBalance={() => undefined} retrying={false} onSend={onSend} onAdd={() => undefined} onOpenBills={() => undefined} />,
    );
    const names = rtl.screen.getAllByRole('button').map((b) => b.props.accessibilityLabel);
    expect(names.indexOf('Send')).toBeGreaterThanOrEqual(0);
    expect(names.indexOf('Send')).toBeLessThan(names.indexOf('Bills'));
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});

describe('the sentences a send shows while it waits (round 2)', () => {
  it('a send still confirming points to Wallet activity and promises no notice the Hub never sends', () => {
    expect(CONFIRMING_LINE).toContain('Wallet activity');
    expect(CONFIRMING_LINE).not.toMatch(/let you know|notify|we'll tell/i);
    expect(CONFIRMING_LINE).not.toContain('—');
  });

  it('a send tried again after no answer says it is checked first', () => {
    expect(RETRY_LINE).toContain('checks it first');
    expect(RETRY_LINE).not.toContain('—');
  });
});
