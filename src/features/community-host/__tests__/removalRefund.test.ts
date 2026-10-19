import { removalRefundLine } from '../model';

describe('the remove sheet line (INBOX-25, R-71)', () => {
  it('says what the member gets back from the Hub quote, in naira, with the unused days', () => {
    expect(removalRefundLine({ refundKobo: 193_333, unusedDays: 29 })).toBe('They get back ₦1,933.33 for 29 unused days on their pass.');
    expect(removalRefundLine({ refundKobo: 100_000, unusedDays: 15 })).toBe('They get back ₦1,000 for 15 unused days on their pass.');
    expect(removalRefundLine({ refundKobo: 6_666, unusedDays: 1 })).toBe('They get back ₦66.66 for 1 unused day on their pass.');
  });

  it('says nothing about money when there is nothing to give back or the quote is missing', () => {
    expect(removalRefundLine({ refundKobo: 0, unusedDays: 0 })).toBeUndefined();
    expect(removalRefundLine(undefined)).toBeUndefined();
    expect(removalRefundLine({ refundKobo: Number.NaN, unusedDays: 3 })).toBeUndefined();
  });

  it('has no em-dash or en-dash', () => {
    expect(removalRefundLine({ refundKobo: 193_333, unusedDays: 29 })).not.toMatch(/[—–]/);
  });
});
