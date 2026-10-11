import {
  amountBoxText,
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
  METER_CHECK_DELAY_MS,
  METER_CHECK_MIN_DIGITS,
  METER_MAX_DIGITS,
  planWord,
  presetChosen,
  presetText,
  takeAmount,
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

describe('the amount box takes naira, with commas and at most two kobo digits (D1)', () => {
  /** What the box holds after the person typed or pasted `typed` into a box that held `previous`. */
  const take = (typed: string, previous = '') => takeAmount(typed, previous);

  it('reads whole naira with commas, and drops a leading zero', () => {
    expect(take('12500')).toBe('12500');
    expect(take('12,500')).toBe('12500');
    expect(take('₦12,500')).toBe('12500');
    expect(take('0012')).toBe('12');
    expect(take('000')).toBe('');
    expect(take('0')).toBe('');
    expect(take('')).toBe('');
  });

  it('ignores anything that is not a digit or a point (a pasted "NGN", a space, a letter)', () => {
    expect(take('₦12,500x9')).toBe('125009');
    expect(take('NGN 1 500')).toBe('1500');
  });

  it('takes one decimal point and up to two kobo digits, as typed', () => {
    expect(take('1,500.50')).toBe('1500.50');
    expect(take('10,000.00')).toBe('10000.00');
    expect(take('1500.5')).toBe('1500.5');
    expect(take('1500.05')).toBe('1500.05');
    // A point on its own is waiting for kobo; it is not an amount of its own.
    expect(take('1500.')).toBe('1500.');
    expect(take('.5')).toBe('0.5');
    expect(take('.')).toBe('0.');
  });

  it('does not take a second point: the box keeps what it held', () => {
    expect(take('1,500.50.', '1500.50')).toBe('1500.50');
    expect(take('1.2.3', '1.2')).toBe('1.2');
    expect(take('1..', '1.')).toBe('1.');
    expect(take('1.2.3')).toBe('');
  });

  it('does not take a third kobo digit, and never floors or rounds it away', () => {
    expect(take('1,500.505', '1500.50')).toBe('1500.50');
    expect(take('0.999', '0.99')).toBe('0.99');
    // A paste of more kobo than there is room for is not taken at all, not cut to fit.
    expect(take('10.999')).toBe('');
    expect(take('10.999', '5')).toBe('5');
  });

  it('does not take a whole-naira part past ten digits, whether typed or pasted', () => {
    expect(take('1'.repeat(10))).toBe('1'.repeat(10));
    expect(take('1'.repeat(11), '1'.repeat(10))).toBe('1'.repeat(10));
    expect(take('1'.repeat(15), '7')).toBe('7');
    expect(take(`${'9'.repeat(10)}.99`)).toBe(`${'9'.repeat(10)}.99`);
  });

  it('is drawn with commas in the whole part and the kobo as typed, and as nothing before the first digit', () => {
    expect(amountBoxText('')).toBe('');
    expect(amountBoxText('5')).toBe('5');
    expect(amountBoxText('10000')).toBe('10,000');
    expect(amountBoxText('1234567')).toBe('1,234,567');
    expect(amountBoxText('1500.50')).toBe('1,500.50');
    expect(amountBoxText('1500.5')).toBe('1,500.5');
    expect(amountBoxText('1500.')).toBe('1,500.');
    expect(amountBoxText('0.5')).toBe('0.5');
    expect(amountBoxText('10000.00')).toBe('10,000.00');
  });

  it('is kobo for the Hub: the naira times 100 and the kobo as typed, and null when nothing is typed', () => {
    expect(amountKobo('')).toBeNull();
    expect(amountKobo('10000')).toBe(1000000);
    expect(amountKobo('1')).toBe(100);
    expect(amountKobo('1500.50')).toBe(150050);
    expect(amountKobo('10000.00')).toBe(1000000);
    expect(amountKobo('1500.5')).toBe(150050);
    expect(amountKobo('1500.05')).toBe(150005);
    expect(amountKobo('1500.')).toBe(150000);
    expect(amountKobo('0.5')).toBe(50);
    expect(amountKobo('0.')).toBe(0);
    expect(amountKobo(`${'9'.repeat(10)}.99`)).toBe(999999999999);
  });

  it('makes "10,000.00" ten thousand naira, not a million (the verifier’s reproduction)', () => {
    expect(amountKobo(take('10,000.00'))).toBe(1_000_000);
    expect(amountKobo(take('1,500.50'))).toBe(150_050);
    expect(amountKobo(take('1500.50'))).not.toBe(15_005_000);
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
    expect(amountOk(limits, '999.99')).toBe(false);
    expect(amountOk(limits, '1000.50')).toBe(true);
    expect(amountOk(limits, '500001')).toBe(false);
    expect(amountOk(limits, '500000.01')).toBe(false);
    expect(amountOk(limits, '500000.00')).toBe(true);
    // A company that lists a minimum of 0 still takes no zero.
    expect(amountOk({ minimumKobo: 0, maximumKobo: 100000000 }, '')).toBe(false);
    expect(amountOk({ minimumKobo: 0, maximumKobo: 100000000 }, '0.')).toBe(false);
    expect(amountOk({ minimumKobo: 0, maximumKobo: 100000000 }, '1')).toBe(true);
    expect(amountOk({ minimumKobo: 0, maximumKobo: 100000000 }, '0.5')).toBe(true);
  });

  it('says the limit it passes from the company’s own figure, with kobo when the figure has them', () => {
    expect(amountProblemWords({ kind: 'below', minimumKobo: 100000 })).toBe('The least you can pay is ₦1,000.');
    expect(amountProblemWords({ kind: 'above', maximumKobo: 10000000 })).toBe('The most you can pay is ₦100,000.');
    // A limit of ₦1,000.50 is never worded as ₦1,000 or ₦1,001.
    expect(amountProblemWords({ kind: 'below', minimumKobo: 100050 })).toBe('The least you can pay is ₦1,000.50.');
    expect(amountProblemWords({ kind: 'above', maximumKobo: 10000005 })).toBe('The most you can pay is ₦100,000.05.');
  });

  it('a quick amount is chosen when the typed amount equals it, kobo included', () => {
    expect(presetChosen('5000', 500000)).toBe(true);
    expect(presetChosen('5000.00', 500000)).toBe(true);
    expect(presetChosen('5000.0', 500000)).toBe(true);
    expect(presetChosen('5000.50', 500000)).toBe(false);
    expect(presetChosen('5001', 500000)).toBe(false);
    expect(presetChosen('', 500000)).toBe(false);
    expect(presetText(500000)).toBe('5000');
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

  it('is the name and address, or the name alone, and never "Meter found" (D2)', () => {
    expect(meterOwnerWords(owner)).toBe('Chidinma Okoro · 14 Admiralty Way');
    expect(meterOwnerWords({ name: 'Chidinma Okoro', address: null })).toBe('Chidinma Okoro');
    expect(meterOwnerWords({ name: 'Chidinma Okoro', address: '' })).toBe('Chidinma Okoro');
  });

  it('checks a meter once ten digits are typed, after 600 ms of quiet (U3, D3)', () => {
    // The two figures are written out here, not read from the constants, so a change to either is seen.
    expect(METER_CHECK_DELAY_MS).toBe(600);
    expect(METER_CHECK_MIN_DIGITS).toBe(10);
  });

  it('says nothing until ten digits are typed and the person has stopped', () => {
    expect(meterLine('041234567', '041234567', { ...idle, data: owner })).toEqual({ kind: 'none' });
    expect(meterLine('0412345678', '041234567', { ...idle, data: owner })).toEqual({ kind: 'none' });
    expect(meterLine('0412345678', '0412345678', idle)).toEqual({ kind: 'none' });
    // Five to nine digits show no answer, no red sentence and no "Checking", whatever an earlier check left.
    for (const n of ['04123', '041234', '0412345', '04123456', '041234567']) {
      expect(meterLine(n, n, { ...idle, isFetching: true })).toEqual({ kind: 'none' });
      expect(meterLine(n, n, { ...idle, isError: true, error: { code: 'meter_not_found', message: 'x' } })).toEqual({ kind: 'none' });
    }
  });

  it('is checking while the answer is out, found with it, and S10 on a meter that is not found', () => {
    expect(meterLine('0412345678', '0412345678', { ...idle, isFetching: true })).toEqual({ kind: 'checking' });
    expect(meterLine('0412345678', '0412345678', { ...idle, data: owner })).toEqual({ kind: 'found', words: 'Chidinma Okoro · 14 Admiralty Way' });
    expect(meterLine('0412345678', '0412345678', { ...idle, isError: true, error: { code: 'meter_not_found', message: 'x' } })).toEqual({ kind: 'not_found' });
  });

  it('is "could not confirm" for an answer the Hub could not confirm, with Try again, never found and never "not found" (D2)', () => {
    expect(meterLine('0412345678', '0412345678', { ...idle, isError: true, error: { code: 'meter_unconfirmed', message: 'x' } })).toEqual({ kind: 'unconfirmed' });
  });

  it('is the Hub’s own words for any other failure, never "not found"', () => {
    expect(meterLine('0412345678', '0412345678', { ...idle, isError: true, error: { code: 'provider_unreachable', message: 'Try again in a moment.' } })).toEqual({
      kind: 'problem',
      message: 'Try again in a moment.',
    });
    expect(meterLine('0412345678', '0412345678', { ...idle, isError: true, error: { message: 'No connection.' } })).toEqual({ kind: 'problem', message: 'No connection.' });
  });
});
