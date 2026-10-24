import { countryFollowing, formatTyped, isInternational, maskedNumber, phoneProblem, readPhone } from '../phone';

describe('a user types a phone number in the country they chose and it is read in full international form', () => {
  it('a Nigerian number typed with its leading 0 works with Nigeria chosen, whatever its spacing', () => {
    for (const typed of ['0803 123 4412', '08031234412', '0803-123-4412', '(0803) 1234412', '8031234412', '2348031234412', '+234 803 123 4412', '002348031234412']) {
      expect(readPhone(typed, 'NG')).toEqual({ ok: true, e164: '+2348031234412' });
    }
  });

  it('Nigeria\'s own rule holds: ten digits after +234 starting 7, 8 or 9, and a stray 0 after the code is dropped', () => {
    expect(readPhone('+2340803 123 4412', 'NG')).toEqual({ ok: true, e164: '+2348031234412' });
    expect(readPhone('0603 123 4412', 'NG')).toEqual({ ok: false, reason: 'invalid' });
    expect(readPhone('0803 123 441', 'NG')).toEqual({ ok: false, reason: 'invalid' });
    // A +234 number is Nigerian whichever country is chosen
    expect(readPhone('+2348031234412', 'GH')).toEqual({ ok: true, e164: '+2348031234412' });
  });

  it('a Ghanaian number is read in Ghana\'s format, with or without its leading 0, and sent with +233', () => {
    expect(readPhone('024 123 4567', 'GH')).toEqual({ ok: true, e164: '+233241234567' });
    expect(readPhone('241234567', 'GH')).toEqual({ ok: true, e164: '+233241234567' });
    expect(readPhone('+233 24 123 4567', 'NG')).toEqual({ ok: true, e164: '+233241234567' });
  });

  it('a British mobile typed the way it is written at home is read as British, never as a Nigerian one', () => {
    expect(readPhone('07911 123456', 'GB')).toEqual({ ok: true, e164: '+447911123456' });
    expect(readPhone('+44 7911 123456', 'GB')).toEqual({ ok: true, e164: '+447911123456' });
    expect(readPhone('0044 7911 123456', 'NG')).toEqual({ ok: true, e164: '+447911123456' });
  });

  it('a number that is not valid for its country, empty text, and letters are refused with a reason', () => {
    expect(readPhone('', 'NG')).toEqual({ ok: false, reason: 'empty' });
    expect(readPhone('  +  ', 'NG')).toEqual({ ok: false, reason: 'empty' });
    expect(readPhone('07911 12', 'GB')).toEqual({ ok: false, reason: 'invalid' });
    expect(readPhone('call me', 'GB')).toEqual({ ok: false, reason: 'invalid' });
    expect(readPhone('0803 123 4412', null)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('the line under a refused number names the country and shows how its numbers are written', () => {
    const ghana = { name: 'Ghana', exampleNational: '024 123 4567' };
    expect(phoneProblem(readPhone('12', 'GH'), ghana)).toBe('Enter a valid Ghana number, like 024 123 4567.');
    expect(phoneProblem(readPhone('', 'GH'), ghana)).toBe('Enter your phone number.');
    expect(phoneProblem(readPhone('12', 'GH'), null)).toBe('Enter a valid phone number.');
    expect(phoneProblem(readPhone('024 123 4567', 'GH'), ghana)).toBeUndefined();
  });
});

describe('a user sees the number in the chosen country\'s format as they type', () => {
  it('a Nigerian number is grouped the way it is dialled at home', () => {
    expect(formatTyped('08031234412', 'NG')).toBe('0803 123 4412');
    expect(formatTyped('0803 123', 'NG')).toBe('0803 123');
  });

  it('a number with a country code is grouped as an international number, and 00 becomes +', () => {
    expect(formatTyped('+2348031234412', 'GH')).toBe('+234 803 123 4412');
    expect(formatTyped('00447911123456', 'NG')).toBe('+44 7911 123456');
  });

  it('letters and stray marks are dropped, and deleting a space does not trap the text', () => {
    expect(formatTyped('0803abc 12', 'NG')).toBe('0803 12');
    expect(formatTyped('0803 ', 'NG')).toBe('0803');
  });

  it('only a number written with its code names its own country', () => {
    expect(isInternational('+233 24')).toBe(true);
    expect(isInternational('00233')).toBe(true);
    expect(isInternational('0241234567')).toBe(false);
    expect(isInternational('00')).toBe(false);
  });
});

describe('a number written with its country code moves the country to the one that uses the code', () => {
  const listed = [
    { code: 'NG', dialCode: '+234' },
    { code: 'GH', dialCode: '+233' },
    { code: 'US', dialCode: '+1' },
    { code: 'CA', dialCode: '+1' },
    { code: 'GB', dialCode: '+44' },
  ];
  it('a code only one country uses is enough', () => {
    expect(countryFollowing('+233 24 123 4567', listed)).toBe('GH');
    expect(countryFollowing('+44', listed)).toBe('GB');
  });
  it('a code several countries share waits for the number\'s own digits, and a national number follows nothing', () => {
    expect(countryFollowing('+1', listed)).toBeNull();
    expect(countryFollowing('0241234567', listed)).toBeNull();
    expect(countryFollowing('+999 1', listed)).toBeNull();
  });
});

describe('a masked number on screen keeps its own country code', () => {
  it('a Nigerian number reads as it is dialled at home, as Z2 and A4 draw it', () => {
    expect(maskedNumber('+2348031234412')).toBe('0803 ••• 4412');
    expect(maskedNumber('08031234412')).toBe('0803 ••• 4412');
  });
  it('any other number keeps its code and its last four digits', () => {
    expect(maskedNumber('+447911123456')).toBe('+44 ••• 3456');
    expect(maskedNumber('+233241234567')).toBe('+233 ••• 4567');
    expect(maskedNumber('+14155552671')).toBe('+1 ••• 2671');
  });
  it('the middle is never shown, and a number with nothing to mask shows nothing', () => {
    expect(maskedNumber('+233241234567')).not.toContain('2412');
    expect(maskedNumber('+14155552671')).not.toContain('415555');
    expect(maskedNumber('')).toBe('');
    expect(maskedNumber(null)).toBe('');
  });
});
