import { hasQuotedFee, totalOf } from '@/features/send/quotedFee';

import { feeLines, quoteAddsUp } from '../buyModel';

/** R-139: a payment quote's Fee, VAT (only when on) and Total; and a quote that says none is drawn as before, never refused. */
describe('a payment quote’s fee lines', () => {
  const fee = { providerFeeKobo: 1_575, wawuFeeKobo: 425, totalFeeKobo: 2_000 };
  const quote = { priceKobo: 250_000, fee, totalKobo: 252_000, feeMinor: 2_000, vatMinor: 150, vatOn: true, totalMinor: 252_150, receiveMinor: 250_000 };
  const old: { priceKobo: number; fee: typeof fee; totalKobo: number; feeMinor?: number } = { priceKobo: 250_000, fee, totalKobo: 252_000 };

  it('draws Fee, then VAT only when the Hub says it is on', () => {
    expect(feeLines(quote)).toEqual([{ label: 'Fee', amountKobo: 2_000 }, { label: 'VAT', amountKobo: 150, vat: true }]);
    expect(feeLines({ ...quote, vatOn: false, vatMinor: 0 })).toEqual([{ label: 'Fee', amountKobo: 2_000 }]);
  });

  it('adds up only when price, Fee and VAT make the Hub’s totalMinor, which may differ from totalKobo', () => {
    expect(quoteAddsUp(quote)).toBe(true);
    expect(totalOf(quote)).toBe(252_150);
    expect(quoteAddsUp({ ...quote, totalMinor: 252_151 })).toBe(false);
  });

  it('a quote that says nothing of its fee is drawn as before: Bank charge, then WAWU’s fee, adding up to totalKobo', () => {
    expect(hasQuotedFee({ ...old, feeMinor: undefined })).toBe(false);
    expect(feeLines(old)).toEqual([{ label: 'Bank charge', amountKobo: 1_575 }, { label: "WAWU's fee", amountKobo: 425 }]);
    expect(quoteAddsUp(old)).toBe(true);
    expect(totalOf(old)).toBe(252_000);
  });

  it('a partial set of fields is none (never a mixed draw)', () => {
    expect(hasQuotedFee({ feeMinor: 0, vatMinor: 0, vatOn: false, totalMinor: 1 })).toBe(false);
    expect(hasQuotedFee({ feeMinor: null, vatMinor: 0, vatOn: false, totalMinor: 1, receiveMinor: 1 })).toBe(false);
  });
});
