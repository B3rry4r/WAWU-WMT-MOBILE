import {
  amountDigits,
  amountField,
  amountKobo,
  amountOk,
  amountProblem,
  amountProblemWords,
  billerChipWords,
  billerInitials,
  groupMeter,
  meterDigits,
  meterLine,
  meterOwnerWords,
  METER_MAX_DIGITS,
  planWord,
  presetChosen,
  presetDigits,
} from '../model';

const limits = { minimumKobo: 100000, maximumKobo: 50000000 };

describe('the meter number', () => {
  it('keeps digits only, whatever was typed or pasted, and at most twenty', () => {
    expect(meterDigits('0412 3456 789')).toBe('04123456789');
    expect(meterDigits('ab04-12 34x56789')).toBe('04123456789');
    expect(meterDigits('')).toBe('');
    expect(meterDigits('1'.repeat(40))).toHaveLength(METER_MAX_DIGITS);
  });

  it('is drawn in groups of four, as S4 draws it', () => {
    expect(groupMeter('04123456789')).toBe('0412 3456 789');
    expect(groupMeter('0412')).toBe('0412');
    expect(groupMeter('041234')).toBe('0412 34');
    expect(groupMeter('')).toBe('');
    expect(groupMeter('1'.repeat(20))).toBe('1111 1111 1111 1111 1111');
  });
});

describe('the amount', () => {
  it('is whole naira with no leading zero and at most ten digits', () => {
    expect(amountDigits('₦12,500')).toBe('12500');
    expect(amountDigits('000')).toBe('');
    expect(amountDigits('0012')).toBe('12');
    expect(amountDigits('9'.repeat(15))).toHaveLength(10);
  });

  it('is drawn as naira with commas, and as nothing before the first digit', () => {
    expect(amountField('')).toBe('');
    expect(amountField('5')).toBe('₦5');
    expect(amountField('10000')).toBe('₦10,000');
    expect(amountField('1234567')).toBe('₦1,234,567');
  });

  it('is kobo for the Hub: naira times 100, and null when nothing is typed', () => {
    expect(amountKobo('')).toBeNull();
    expect(amountKobo('10000')).toBe(1000000);
    expect(amountKobo('1')).toBe(100);
  });

  it('is inside a company’s own limits or says which one it passes', () => {
    expect(amountProblem(limits, null)).toBeNull();
    expect(amountProblem(limits, 99900)).toEqual({ kind: 'below', minimumKobo: 100000 });
    expect(amountProblem(limits, 100000)).toBeNull();
    expect(amountProblem(limits, 50000000)).toBeNull();
    expect(amountProblem(limits, 50000100)).toEqual({ kind: 'above', maximumKobo: 50000000 });
  });

  it('is payable when typed, positive and inside the limits', () => {
    expect(amountOk(limits, '')).toBe(false);
    expect(amountOk(limits, '999')).toBe(false);
    expect(amountOk(limits, '1000')).toBe(true);
    expect(amountOk(limits, '500001')).toBe(false);
    // A company that lists a minimum of 0 still takes no zero.
    expect(amountOk({ minimumKobo: 0, maximumKobo: 100000000 }, '')).toBe(false);
    expect(amountOk({ minimumKobo: 0, maximumKobo: 100000000 }, '1')).toBe(true);
  });

  it('says the limit it passes, in whole naira from the company’s own figure', () => {
    expect(amountProblemWords({ kind: 'below', minimumKobo: 100000 })).toBe('The least you can pay is ₦1,000.');
    expect(amountProblemWords({ kind: 'above', maximumKobo: 10000000 })).toBe('The most you can pay is ₦100,000.');
  });

  it('a quick amount is chosen when the typed amount equals it', () => {
    expect(presetChosen('5000', 500000)).toBe(true);
    expect(presetChosen('5001', 500000)).toBe(false);
    expect(presetChosen('', 500000)).toBe(false);
    expect(presetDigits(500000)).toBe('5000');
  });
});

describe('the company', () => {
  it('says its plan and shows it after the name on the S4 chip', () => {
    expect(planWord('prepaid')).toBe('Prepaid');
    expect(planWord('postpaid')).toBe('Postpaid');
    expect(billerChipWords({ name: 'Ikeja Electric', plan: 'prepaid' })).toBe('Ikeja Electric · Prepaid');
  });

  it('has a badge of the first letters of its first two words', () => {
    expect(billerInitials('Ikeja Electric')).toBe('IE');
    expect(billerInitials('Port Harcourt Electric')).toBe('PH');
    expect(billerInitials('BEDC')).toBe('B');
    expect(billerInitials('  aba   power ')).toBe('AP');
    expect(billerInitials('')).toBe('');
  });
});

describe('what is said under the meter box', () => {
  const idle = { isFetching: false, isError: false, error: null, data: undefined };
  const owner = { name: 'Chidinma Okoro', address: '14 Admiralty Way' };

  it('is the name and address, the name alone, the address alone or that the meter was found', () => {
    expect(meterOwnerWords(owner)).toBe('Chidinma Okoro · 14 Admiralty Way');
    expect(meterOwnerWords({ name: 'Chidinma Okoro', address: null })).toBe('Chidinma Okoro');
    expect(meterOwnerWords({ name: null, address: '14 Admiralty Way' })).toBe('14 Admiralty Way');
    expect(meterOwnerWords({ name: null, address: null })).toBe('Meter found');
  });

  it('says nothing until five digits are typed and the person has stopped', () => {
    expect(meterLine('0412', '0412', { ...idle, data: owner })).toEqual({ kind: 'none' });
    expect(meterLine('04123', '0412', { ...idle, data: owner })).toEqual({ kind: 'none' });
    expect(meterLine('04123', '04123', idle)).toEqual({ kind: 'none' });
  });

  it('is checking while the answer is out, found with it, and S10 on a meter that is not found', () => {
    expect(meterLine('04123', '04123', { ...idle, isFetching: true })).toEqual({ kind: 'checking' });
    expect(meterLine('04123', '04123', { ...idle, data: owner })).toEqual({ kind: 'found', words: 'Chidinma Okoro · 14 Admiralty Way' });
    expect(meterLine('04123', '04123', { ...idle, isError: true, error: { code: 'meter_not_found', message: 'x' } })).toEqual({ kind: 'not_found' });
  });

  it('is the Hub’s own words for any other failure, never "not found"', () => {
    expect(meterLine('04123', '04123', { ...idle, isError: true, error: { code: 'provider_unreachable', message: 'Try again in a moment.' } })).toEqual({
      kind: 'problem',
      message: 'Try again in a moment.',
    });
    expect(meterLine('04123', '04123', { ...idle, isError: true, error: { message: 'No connection.' } })).toEqual({ kind: 'problem', message: 'No connection.' });
  });
});
