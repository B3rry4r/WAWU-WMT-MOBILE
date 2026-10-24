import type { FeeQuote, Transfer } from '@/features/send/api';

import { amountKobo, blockLine, groupedAmount, maxWithdrawKobo, receiptHeading, receiptTo, sanitizeAmount, timelineSteps, withdrawBlock, withdrawFeeRows, withdrawKey, withdrawLabel, withdrawReceiptRows, withdrawShareText } from '../model';

const quote = (amountKobo_: number, over: Partial<FeeQuote> = {}): FeeQuote => ({
  kind: 'bank_transfer',
  billCategory: null,
  amountKobo: amountKobo_,
  fee: { providerFeeKobo: 4000, wawuFeeKobo: 2500, totalFeeKobo: 6500 },
  parts: [
    { code: 'bank_transfer', source: 'provider', amountKobo: 4000 },
    { code: 'wawu_fee', source: 'wawu', amountKobo: 2500 },
  ],
  totalKobo: amountKobo_ + 6500,
  withinDailyLimit: true,
  remainingTodayKobo: null,
  quoteToken: 'tok',
  expiresAt: '2099-01-01T00:00:00.000Z',
  ...over,
});

describe('the amount a person types (W17)', () => {
  it('keeps digits and one point with two decimals, and drops the naira sign, commas and spaces', () => {
    expect(sanitizeAmount('₦50,000')).toBe('50000');
    expect(sanitizeAmount('1,250.756')).toBe('1250.75');
    expect(sanitizeAmount('12.5.5')).toBe('12.55');
    expect(sanitizeAmount('abc')).toBe('');
    expect(sanitizeAmount('007')).toBe('7');
  });

  it('groups the whole part as it is typed and keeps the point', () => {
    expect(groupedAmount('')).toBe('');
    expect(groupedAmount('50000')).toBe('50,000');
    expect(groupedAmount('1250000.')).toBe('1,250,000.');
    expect(groupedAmount('1250.5')).toBe('1,250.5');
  });

  it('is whole kobo: ₦50,000 is 5,000,000 kobo and ₦1,250.50 is 125,050', () => {
    expect(amountKobo('50,000')).toBe(5_000_000);
    expect(amountKobo('1,250.50')).toBe(125_050);
    expect(amountKobo('')).toBe(0);
  });
});

describe('the fee and the button (R-10, R-53)', () => {
  it('draws the bank charge and WAWU’s fee as their own rows, then Fees, and never the provider’s name', () => {
    const rows = withdrawFeeRows(quote(5_000_000));
    expect(rows).toEqual([
      { key: 'Bank charge', label: 'Bank charge', kobo: 4000 },
      { key: "WAWU's fee", label: "WAWU's fee", kobo: 2500 },
      { key: 'fees', label: 'Fees', kobo: 6500 },
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/Fintava|Nuvion/);
  });

  it('shows the total that leaves the wallet on the button: ₦50,000 with ₦65 of fees is ₦50,065', () => {
    expect(withdrawLabel(5_006_500)).toBe('Withdraw ₦50,065');
    expect(withdrawLabel(null)).toBe('Withdraw');
  });

  it('keeps a withdrawal’s intent apart from a send by hand to the same account', () => {
    expect(withdrawKey({ bankCode: '044', accountNumber: '0987654321' })).toBe('withdraw:044:0987654321');
  });
});

describe('why Withdraw is off', () => {
  const payout = { matchesBvnName: true as boolean | null };
  const input = (over: Partial<Parameters<typeof withdrawBlock>[0]> = {}) => ({ payout, amountKobo: 5_000_000, balanceKobo: 48_525_075, quote: quote(5_000_000), ...over });

  it('is on for an amount the balance and its fees cover', () => {
    expect(withdrawBlock(input())).toBeNull();
  });

  it('says there is no payout account, and that one not in the person’s name cannot be used (R-51)', () => {
    expect(withdrawBlock(input({ payout: null }))).toEqual({ kind: 'no_account' });
    expect(withdrawBlock(input({ payout: { matchesBvnName: false } }))).toEqual({ kind: 'not_your_name' });
    expect(blockLine({ kind: 'not_your_name' })).toBe('This payout account is not in your name. Change it to withdraw.');
    // A name the bank could not compare (null) is the Hub's to decide, not the screen's.
    expect(withdrawBlock(input({ payout: { matchesBvnName: null } }))).toBeNull();
  });

  it('is off with no amount, and over the balance names the bank’s figure', () => {
    expect(withdrawBlock(input({ amountKobo: 0, quote: null }))).toEqual({ kind: 'no_amount' });
    const over = withdrawBlock(input({ amountKobo: 60_000_000, quote: null }));
    expect(over).toEqual({ kind: 'over_balance', balanceKobo: 48_525_075 });
    expect(blockLine(over!)).toBe('Over your balance of ₦485,250.75');
  });

  it('names the shortfall when the amount fits but its fees do not', () => {
    const short = withdrawBlock(input({ amountKobo: 48_525_000, balanceKobo: 48_525_075, quote: quote(48_525_000) }));
    expect(short).toEqual({ kind: 'short_with_fees', balanceKobo: 48_525_075, totalKobo: 48_531_500, shortKobo: 6_425 });
    expect(blockLine(short!)).toContain('₦485,315');
  });

  it('is off over today’s limit with the Hub’s figure, and when a quote’s parts do not make its total', () => {
    expect(withdrawBlock(input({ quote: quote(5_000_000, { withinDailyLimit: false, remainingTodayKobo: 100_000 }) }))).toEqual({
      kind: 'over_limit',
      line: 'This is over your limit for today. You can withdraw ₦1,000 more today.',
    });
    expect(withdrawBlock(input({ quote: quote(5_000_000, { totalKobo: 5_000_001 }) }))).toEqual({ kind: 'no_total' });
  });
});

describe('Max', () => {
  it('is the balance less the Hub’s fee, asked for at the balance and then at what is left', async () => {
    const asked: number[] = [];
    const fee = async (kobo: number) => {
      asked.push(kobo);
      return 6500;
    };
    expect(await maxWithdrawKobo(10_000_000, fee)).toBe(9_993_500);
    expect(asked).toEqual([10_000_000, 9_993_500]);
  });

  it('follows a fee that grows with the amount down until the total fits, and never goes over the balance', async () => {
    const fee = async (kobo: number) => (kobo > 5_000_000 ? 9000 : 6500);
    const max = await maxWithdrawKobo(5_007_000, fee);
    expect(max).toBe(4_998_000);
    expect(max + (await fee(max))).toBeLessThanOrEqual(5_007_000);
  });

  it('is nothing when the balance does not cover the fees', async () => {
    expect(await maxWithdrawKobo(5_000, async () => 6500)).toBe(0);
  });
});

describe('W19', () => {
  const base = {
    createdAt: '2026-10-16T09:42:00.000Z',
    completedAt: null,
    toBankAccount: { bankCode: '044', bankName: 'Access Bank', accountNumber: '0987654321', accountName: 'Test Owner' },
  };

  it('has Requested done and the next step in progress while the Hub has stamped nothing else', () => {
    const steps = timelineSteps({ ...base, status: 'pending', timeline: [{ step: 'requested' }] as Transfer['timeline'] });
    expect(steps.map((s) => [s.key, s.state])).toEqual([['requested', 'done'], ['sent', 'current'], ['arrived', 'upcoming']]);
    expect(steps[1]?.label).toBe('Sent to Access Bank');
    expect(steps[0]?.time).toBe('10:42');
  });

  it('fills in each step as the Hub stamps it, in Lagos time', () => {
    const timeline = [
      { step: 'requested', at: '2026-10-16T09:42:00.000Z' },
      { step: 'sent_to_bank', at: '2026-10-16T09:43:10.000Z' },
    ] as unknown as Transfer['timeline'];
    const steps = timelineSteps({ ...base, status: 'pending', timeline });
    expect(steps.map((s) => [s.key, s.state, s.time])).toEqual([['requested', 'done', '10:42'], ['sent', 'done', '10:43'], ['arrived', 'current', null]]);
  });

  it('has every step done once the bank account has it, and says "sent"', () => {
    const steps = timelineSteps({ ...base, status: 'completed', completedAt: '2026-10-16T09:50:00.000Z', timeline: [] });
    expect(steps.every((s) => s.state === 'done')).toBe(true);
    expect(receiptHeading({ status: 'completed' })).toBe('sent');
    expect(receiptHeading({ status: 'pending' })).toBe('on its way');
  });

  it('says where it goes, and lists the reference, both parts of the fee, Fees and Total paid', () => {
    expect(receiptTo(base)).toBe('To Access Bank · 0987654321');
    const rows = withdrawReceiptRows({ reference: 'wawu-bank-1', fee: { providerFeeKobo: 4000, wawuFeeKobo: 2500, totalFeeKobo: 6500 }, totalKobo: 5_006_500 });
    expect(rows.map((r) => [r.label, r.money ?? r.value])).toEqual([['Reference', 'wawu-bank-1'], ['Bank charge', 4000], ["WAWU's fee", 2500], ['Fees', 6500], ['Total paid', 5_006_500]]);
  });

  it('shares the receipt as text with every figure on screen and the reference', () => {
    const text = withdrawShareText({
      ...base,
      status: 'pending',
      amountKobo: 5_000_000,
      reference: 'wawu-bank-1',
      fee: { providerFeeKobo: 4000, wawuFeeKobo: 2500, totalFeeKobo: 6500 },
      totalKobo: 5_006_500,
      timeline: [],
    } as unknown as Transfer);
    expect(text).toContain('₦50,000 on its way');
    expect(text).toContain('To Access Bank · 0987654321');
    expect(text).toContain('Total paid: ₦50,065');
    expect(text).toContain('Reference: wawu-bank-1');
  });
});
