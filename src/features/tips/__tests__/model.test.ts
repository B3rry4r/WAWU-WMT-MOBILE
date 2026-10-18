import { amountOf, cleanAmountText, firstName, koboOfTyped, noteEcho, QUICK_AMOUNTS_KOBO, sentHeading, tipTitle } from '../model';

describe('what the tip sheet decides', () => {
  it('reads a typed amount as whole naira, in kobo, and nothing else', () => {
    expect(koboOfTyped('1250')).toBe(125000);
    expect(koboOfTyped('1,250')).toBe(125000);
    expect(koboOfTyped('₦ 2 000')).toBe(200000);
    expect(koboOfTyped('12.50')).toBe(1200); // a tip is whole naira: everything from the dot on is ignored (never 1250 naira)
    expect(koboOfTyped('12.5')).toBe(1200); // never 125 naira
    expect(koboOfTyped('12.')).toBe(1200);
    expect(koboOfTyped('1,250.75')).toBe(125000); // a comma groups thousands, the dot ends the whole naira
    expect(koboOfTyped('0.99')).toBeNull(); // under one whole naira: nothing to send
    expect(koboOfTyped('.50')).toBeNull();
    expect(koboOfTyped('')).toBeNull();
    expect(koboOfTyped('abc')).toBeNull();
    expect(koboOfTyped('0')).toBeNull();
    expect(koboOfTyped('000')).toBeNull();
  });

  it('keeps a typed amount to digits, without leading zeros, and to ten of them', () => {
    expect(cleanAmountText('007,5')).toBe('75');
    expect(cleanAmountText('12.50')).toBe('12');
    expect(cleanAmountText('12.5')).toBe('12');
    expect(cleanAmountText('0.99')).toBe('0');
    expect(cleanAmountText('1,250')).toBe('1250');
    expect(cleanAmountText('123456789012345')).toBe('1234567890');
  });

  it('a typed amount wins over the chosen quick amount; with nothing typed the chosen one stands', () => {
    expect(amountOf(200000, '')).toBe(200000);
    expect(amountOf(200000, '300')).toBe(30000);
    expect(amountOf(null, '')).toBeNull();
    expect(amountOf(200000, 'x')).toBeNull();
  });

  it("names the creator by first name: 'Tip Tife', '₦2,000 sent to Tife'", () => {
    expect(firstName('  Tife Adeola ')).toBe('Tife');
    expect(tipTitle('Tife Adeola')).toBe('Tip Tife');
    expect(tipTitle(null)).toBe('Tip this creator');
    expect(sentHeading(200000, 'Tife Adeola')).toBe('₦2,000 sent to Tife');
    expect(sentHeading(125050, null)).toBe('₦1,250.50 sent');
  });

  it('echoes a note only when one was written', () => {
    expect(noteEcho('  That orbit shot is clean. ')).toBe('That orbit shot is clean.');
    expect(noteEcho('   ')).toBeNull();
    expect(noteEcho(null)).toBeNull();
  });

  it("offers the board's four quick amounts, in whole naira", () => {
    expect(QUICK_AMOUNTS_KOBO).toEqual([50000, 100000, 200000, 500000]);
    expect(QUICK_AMOUNTS_KOBO.every((k) => k % 100 === 0)).toBe(true);
  });
});
