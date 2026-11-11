import { hasQuotedFee } from '../buyApi';
import { feeLines, quoteAddsUp } from '../buyModel';

/** R-139: a payment quote's Fee, VAT (only when on), Total, and a quote that does not say them is refused. */
describe('a payment quote’s fee lines', () => {
  const quote = { priceKobo: 250_000, feeMinor: 2_000, vatMinor: 150, vatOn: true, totalMinor: 252_150 };

  it('draws Fee, then VAT only when the Hub says it is on', () => {
    expect(feeLines(quote)).toEqual([{ label: 'Fee', amountKobo: 2_000 }, { label: 'VAT', amountKobo: 150, vat: true }]);
    expect(feeLines({ ...quote, vatOn: false, vatMinor: 0 })).toEqual([{ label: 'Fee', amountKobo: 2_000 }]);
  });

  it('adds up only when price, Fee and VAT make the Hub’s total', () => {
    expect(quoteAddsUp(quote)).toBe(true);
    expect(quoteAddsUp({ ...quote, totalMinor: 252_151 })).toBe(false);
  });

  it('refuses a quote that leaves a field out', () => {
    const whole = { currency: 'NGN', feeMinor: 0, vatMinor: 0, vatOn: false, totalMinor: 1, receiveMinor: 1 };
    expect(hasQuotedFee(whole)).toBe(true);
    expect(hasQuotedFee({ ...whole, vatOn: undefined })).toBe(false);
    expect(hasQuotedFee({ ...whole, feeMinor: null })).toBe(false);
    expect(hasQuotedFee({ ...whole, currency: undefined })).toBe(false);
  });
});
