import {
  cardsShown,
  expiryLine,
  isLive,
  summaryLine,
  feeRows,
  groupedCardNumber,
  kindTitle,
  statusLine,
  transactionAmount,
  transactionTitle,
  usd,
  whenLine,
  WORDS,
} from '../model';

describe('WALLET-22: the words and figures of the card screens', () => {
  it('money is dollars from whole cents, with a minus on a payment and a plus on money back', () => {
    expect(usd(728)).toBe('$7.28');
    expect(transactionAmount({ kind: 'purchase', amountCents: 728 })).toBe('−$7.28');
    expect(transactionAmount({ kind: 'reversal', amountCents: 728 })).toBe('+$7.28');
    expect(transactionAmount({ kind: 'refund', amountCents: 1500 })).toBe('+$15.00');
  });

  it('a payment is named for its merchant, else its narration, else what it was', () => {
    expect(transactionTitle({ kind: 'purchase', merchant: 'Acme Corp', narration: 'x' })).toBe('Acme Corp');
    expect(transactionTitle({ kind: 'purchase', merchant: null, narration: 'Payment to Acme' })).toBe('Payment to Acme');
    expect(transactionTitle({ kind: 'purchase', merchant: ' ', narration: null })).toBe('Card payment');
    expect(transactionTitle({ kind: 'reversal', merchant: 'Acme', narration: null })).toBe('Payment reversed');
    expect(transactionTitle({ kind: 'refund', merchant: null, narration: null })).toBe('Refund');
  });

  it('the number is shown four by four and the expiry as MM/YY', () => {
    expect(groupedCardNumber('4111111111119916')).toBe('4111 1111 1111 9916');
    expect(expiryLine('9', '2028')).toBe('09/28');
    expect(expiryLine('09', '28')).toBe('09/28');
  });

  it('says what a card is doing in plain words, and the kind by its name', () => {
    expect(statusLine({ status: 'active', frozenBySupport: false })).toBe('Active');
    expect(statusLine({ status: 'frozen', frozenBySupport: false })).toBe('Frozen');
    expect(statusLine({ status: 'frozen', frozenBySupport: true })).toBe('Frozen by support');
    expect(statusLine({ status: 'blocked', frozenBySupport: false })).toBe('Blocked');
    expect(statusLine({ status: 'pending', frozenBySupport: false })).toBe('Being made');
    expect(kindTitle('single_use')).toBe('Single-use card');
    expect(kindTitle('virtual')).toBe('Virtual card');
  });

  it("the fee rows show the bank's charge even at 0 and WAWU's only when there is one (R-10)", () => {
    expect(feeRows({ providerFeeKobo: 65772, wawuFeeKobo: 0, totalFeeKobo: 65772 })).toEqual([{ label: 'Bank charge', kobo: 65772 }]);
    expect(feeRows({ providerFeeKobo: 65772, wawuFeeKobo: 500, totalFeeKobo: 66272 })).toEqual([
      { label: 'Bank charge', kobo: 65772 },
      { label: 'WAWU’s fee', kobo: 500 },
    ]);
  });

  it('a day reads Today, Yesterday, or the day and month', () => {
    const now = new Date(2026, 9, 24, 15, 0, 0);
    expect(whenLine(new Date(2026, 9, 24, 8, 0, 0).toISOString(), now)).toBe('Today');
    expect(whenLine(new Date(2026, 9, 23, 23, 0, 0).toISOString(), now)).toBe('Yesterday');
    expect(whenLine(new Date(2026, 9, 1, 9, 0, 0).toISOString(), now)).toMatch(/1/);
    expect(whenLine(null, now)).toBe('');
  });

  it('draws nothing that Nuvion does not serve: no Physical card, no card PIN, no ATM, no limits, no em-dash', () => {
    const words = Object.values(WORDS).join(' ');
    expect(words).not.toMatch(/physical|\batm\b|verve|\blimits?\b|card pin/i);
    expect(words).not.toContain('—');
  });

  it('a used single-use card reads Used, and is not a card with anything left to do (round 1, L2)', () => {
    expect(statusLine({ status: 'used', frozenBySupport: false })).toBe('Used');
    expect(isLive({ status: 'used' })).toBe(false);
    expect(isLive({ status: 'blocked' })).toBe(false);
    expect(isLive({ status: 'frozen' })).toBe(true);
    expect(isLive({ status: 'pending' })).toBe(true);
  });

  it("W1's row says how to get a card when none is left to use, and names the live one otherwise (round 1, L4)", () => {
    const card = (status: 'active' | 'blocked' | 'used' | 'frozen', last4: string | null = null) => ({
      kind: 'virtual' as const,
      status,
      last4,
      frozenBySupport: false,
    });
    expect(summaryLine([], true)).toBe('Get your card');
    expect(summaryLine([card('blocked'), card('used')], true)).toBe('Get a new card');
    expect(summaryLine([card('blocked'), card('active', '4821')], true)).toBe('Virtual card · ••4821 · Active');
    expect(summaryLine([card('frozen')], false)).toBe('Virtual card');
  });

  it('while cards are off the rows are still drawn for a person who holds a live card, so they can stop it (round 1, L5)', () => {
    expect(cardsShown({ enabled: true, cards: [] })).toBe(true);
    expect(cardsShown({ enabled: false, cards: [] })).toBe(false);
    expect(cardsShown({ enabled: false, cards: [{ status: 'blocked' }, { status: 'used' }] })).toBe(false);
    expect(cardsShown({ enabled: false, cards: [{ status: 'frozen' }] })).toBe(true);
  });
});
