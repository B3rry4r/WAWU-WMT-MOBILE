import { failedPaymentLine } from '../model';

describe('PAY-FX (R-91): the legal fee line when a payment is paid back', () => {
  const usd = { currency: 'USD', decimals: 2, amountMinor: 23, providerFeeMinor: 0, wawuFeeMinor: 0, totalMinor: 23, rate: '0.000741', refundedMinor: null };

  it('names the USD account the price goes back to, not the wallet', () => {
    expect(failedPaymentLine({ status: 'refunded', statusMessage: null, payment: { source: usd } })).toBe('This fee could not be applied, so the price is going back to your USD account.');
  });

  it('a naira payment reads as it always did, and the Hub\'s own sentence still leads', () => {
    expect(failedPaymentLine({ status: 'refunded', statusMessage: null })).toBe('This fee could not be applied, so the price is going back to your wallet.');
    expect(failedPaymentLine({ status: 'refunded', statusMessage: 'The Hub says so.', payment: { source: usd } })).toBe('The Hub says so.');
  });
});
