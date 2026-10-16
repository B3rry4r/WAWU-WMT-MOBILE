import { AMOUNT_MAX_WHOLE_DIGITS, deleteLast, koboOfText, pressKey, textOfKobo } from '../amount';

const type = (keys: string) => [...keys].reduce(pressKey, '');

describe('the amount typed on the keypad', () => {
  it('whole naira: the digits typed, in kobo', () => {
    expect(type('25000')).toBe('25000');
    expect(koboOfText(type('25000'))).toBe(2_500_000);
    expect(koboOfText('')).toBe(0);
  });

  it('kobo: one or two digits after the point, whole numbers only', () => {
    expect(koboOfText(type('12.5'))).toBe(1250);
    expect(koboOfText(type('12.56'))).toBe(1256);
    expect(koboOfText(type('0.1'))).toBe(10);
    expect(koboOfText(type('0.07'))).toBe(7);
    expect(koboOfText(type('1234.56'))).toBe(123_456);
    // a float would give 1129.9999999999998 here
    expect(koboOfText(type('11.30'))).toBe(1130);
    expect(koboOfText('7.')).toBe(700);
  });

  it('a point first reads as 0., a second point and a third decimal do nothing', () => {
    expect(type('.')).toBe('0.');
    expect(type('.5')).toBe('0.5');
    expect(type('1.2.3')).toBe('1.23');
    expect(type('1.234')).toBe('1.23');
  });

  it('a leading zero never stays: 0 then 5 is 5, and 000 is one 0', () => {
    expect(type('05')).toBe('5');
    expect(type('000')).toBe('0');
    expect(type('0.05')).toBe('0.05');
  });

  it('stops at the most whole digits an amount takes', () => {
    const full = '9'.repeat(AMOUNT_MAX_WHOLE_DIGITS);
    expect(type(full + '9')).toBe(full);
    expect(Number.isSafeInteger(koboOfText(full + '.99'))).toBe(true);
    expect(type(full + '.5')).toBe(`${full}.5`);
  });

  it('anything that is not a digit or a point is ignored', () => {
    expect(pressKey('12', 'a')).toBe('12');
    expect(pressKey('12', '')).toBe('12');
    expect(pressKey('12', '-')).toBe('12');
  });

  it('delete takes the last key, down to nothing', () => {
    expect(deleteLast('12.5')).toBe('12.');
    expect(deleteLast('1')).toBe('');
    expect(deleteLast('')).toBe('');
  });

  it('a quick amount, in kobo, becomes the text that shows it and back', () => {
    expect(textOfKobo(500_000)).toBe('5000');
    expect(textOfKobo(123_450)).toBe('1234.5');
    expect(textOfKobo(123_456)).toBe('1234.56');
    expect(textOfKobo(5)).toBe('0.05');
    for (const kobo of [500_000, 123_450, 123_456, 5, 100, 99]) expect(koboOfText(textOfKobo(kobo))).toBe(kobo);
    expect(textOfKobo(0)).toBe('');
    expect(textOfKobo(-1)).toBe('');
  });
});
