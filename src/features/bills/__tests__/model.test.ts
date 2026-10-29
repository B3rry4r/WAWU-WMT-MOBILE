import {
  amountBoxText,
  caretAfter,
  countSignificant,
  insertedText,
  amountKobo,
  amountOk,
  amountProblem,
  amountProblemWords,
  billerInitials,
  groupMeter,
  meterDigits,
  meterLine,
  ownerWords,
  NUMBER_CONFIRMED,
  isNoSuchNumber,
  limitsOf,
  takeNaira,
  groupPhone,
  phoneDigits,
  ownPhone,
  METER_CHECK_DELAY_MS,
  METER_CHECK_MIN_DIGITS,
  METER_MAX_DIGITS,
  presetChosen,
  presetText,
  takeAmount,
  takeAmountChange,
} from '../model';
import { ApiError } from '@/api/errors';

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
  it('has a badge of the first letters of its first two words', () => {
    expect(billerInitials('Ikeja Electric')).toBe('IE');
    expect(billerInitials('Port Harcourt Electric')).toBe('PH');
    expect(billerInitials('BEDC')).toBe('B');
    expect(billerInitials('  aba   power ')).toBe('AP');
    expect(billerInitials('')).toBe('');
  });
});

describe('what is said under the number box', () => {
  const idle = { isFetching: false, isError: false, error: null as unknown, data: undefined };
  const owner = { name: 'Chidinma Okoro' };
  const refused = new ApiError('server', 502, 'Customer not found');
  const down = new ApiError('server', 502, 'Could not reach the bill payment provider.');

  it('is the name the provider holds, or neutral words when it names no one, and never "Meter found" (D2)', () => {
    expect(ownerWords('Chidinma Okoro')).toBe('Chidinma Okoro');
    expect(ownerWords(null)).toBe(NUMBER_CONFIRMED);
    expect(ownerWords('  ')).toBe(NUMBER_CONFIRMED);
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
    for (const n of ['04123', '041234', '0412345', '04123456', '041234567']) {
      expect(meterLine(n, n, { ...idle, isFetching: true })).toEqual({ kind: 'none' });
      expect(meterLine(n, n, { ...idle, isError: true, error: refused })).toEqual({ kind: 'none' });
    }
  });

  it('is checking while the answer is out, found with it, and S10 on a number the provider refused', () => {
    expect(meterLine('0412345678', '0412345678', { ...idle, isFetching: true })).toEqual({ kind: 'checking' });
    expect(meterLine('0412345678', '0412345678', { ...idle, data: owner })).toEqual({ kind: 'found', words: 'Chidinma Okoro' });
    expect(meterLine('0412345678', '0412345678', { ...idle, isError: true, error: refused })).toEqual({ kind: 'not_found' });
  });

  it('takes a phone number after eleven digits, not ten', () => {
    expect(meterLine('0803123441', '0803123441', { ...idle, isFetching: true }, 11)).toEqual({ kind: 'none' });
    expect(meterLine('08031234412', '08031234412', { ...idle, isFetching: true }, 11)).toEqual({ kind: 'checking' });
  });

  it('is the Hub’s own words for any other failure (it could not reach the provider, no connection), never "not found"', () => {
    expect(isNoSuchNumber(refused)).toBe(true);
    expect(isNoSuchNumber(down)).toBe(false);
    expect(isNoSuchNumber(new ApiError('server', 502, 'Bill payments are not configured on this server.'))).toBe(false);
    expect(isNoSuchNumber(new ApiError('validation', 400, 'customer must be shorter'))).toBe(false);
    expect(isNoSuchNumber(new Error('x'))).toBe(false);
    expect(meterLine('0412345678', '0412345678', { ...idle, isError: true, error: down })).toEqual({ kind: 'problem', message: 'Could not reach the bill payment provider.' });
    expect(meterLine('0412345678', '0412345678', { ...idle, isError: true, error: new ApiError('network', 0, 'No connection.') })).toEqual({ kind: 'problem', message: 'No connection.' });
  });
});

describe('what a bill may cost', () => {
  it('is the Hub’s ₦50 floor, raised by the company’s minimum and capped by its maximum when it named them', () => {
    expect(limitsOf(undefined)).toEqual({ minimumKobo: 5000, maximumKobo: Number.MAX_SAFE_INTEGER });
    expect(limitsOf({ minimum: 0, maximum: 0 })).toEqual({ minimumKobo: 5000, maximumKobo: Number.MAX_SAFE_INTEGER });
    expect(limitsOf({ minimum: 1000, maximum: 500000 })).toEqual({ minimumKobo: 100000, maximumKobo: 50000000 });
    expect(limitsOf({ minimum: 10, maximum: 500000 })).toEqual({ minimumKobo: 5000, maximumKobo: 50000000 });
  });

  it('takes whole naira only: digits, no point, no leading zero, ten at most', () => {
    expect(takeNaira('1,500', '')).toBe('1500');
    expect(takeNaira('1500.50', '1500')).toBe('150050');
    expect(takeNaira('007', '')).toBe('7');
    expect(takeNaira('abc', '12')).toBe('');
    expect(takeNaira('12345678901', '1234567890')).toBe('1234567890');
  });
});

describe('the phone number', () => {
  it('keeps eleven digits and is drawn as "0803 123 4412"', () => {
    expect(phoneDigits('0803 123 4412 99')).toBe('08031234412');
    expect(groupPhone('08031234412')).toBe('0803 123 4412');
    expect(groupPhone('0803')).toBe('0803');
    expect(groupPhone('08031')).toBe('0803 1');
  });

  it('is the account’s own number as the box takes it, and nothing for one that is not a Nigerian number', () => {
    expect(ownPhone('+2348031234412')).toBe('08031234412');
    expect(ownPhone('08031234412')).toBe('08031234412');
    expect(ownPhone('+14155550123')).toBeNull();
    expect(ownPhone(null)).toBeNull();
  });
});

describe('digits of other scripts are not digits (round 2 survivor T5)', () => {
  it('reads Arabic-Indic and full-width digits as nothing, so a typed key of them is ignored', () => {
    expect(takeAmount('\u0661\u0660\u0660\u0660', '')).toBe('');
    expect(takeAmount('1\u0660\u0660\u0660', '')).toBe('1');
    expect(takeAmount('\uff11\uff15\uff10\uff10', '')).toBe('');
    // Typed after digits that are there: the box keeps them and takes nothing from the other script.
    expect(takeAmount('15\u0663', '15')).toBe('15');
  });
});

describe('what a change to the amount box added', () => {
  it.each([
    ['one key typed at the end', '1,234', '1,2345', '5'],
    ['one key typed in the middle', '1,234', '1,2a34', 'a'],
    ['one key typed at the start', '1,234', '91,234', '9'],
    ['the same key as its neighbour', '1', '11', '1'],
    ['a key that equals the ones round it', '1,111', '1,1111', '1'],
    ['a deletion', '1,234', '1,23', ''],
    ['a deletion in the middle', '1,234', '1,34', ''],
    ['a paste into an empty box', '', '10,000.00', '10,000.00'],
    ['a paste over everything', '5,000', '1e3', '1e3'],
    ['a paste at the end', '5,000', '5,00012', '12'],
    ['one key over a selection', '5,000', '7', '7'],
    ['nothing', '1,234', '1,234', ''],
  ])('%s', (_k, before, typed, added) => {
    expect(insertedText(before, typed)).toBe(added);
  });
});

describe('a paste of anything but ASCII digits, commas and one point is refused whole (R2-3)', () => {
  /** The person changes the box from what it shows (the words of `previous`) to `typed`. */
  const change = (typed: string, previous = '') => takeAmountChange(amountBoxText(previous), typed, previous);

  it.each([
    ['1e3 (a power of ten)', '1e3'],
    ['10k', '10k'],
    ['1.5m', '1.5m'],
    ['a naira sign', '\u20a61,500'],
    ['NGN and a space', 'NGN 1 500'],
    ['a space inside the figure', '1 500'],
    ['a no-break space', '1\u00a0500'],
    ['Arabic-Indic digits', '\u0661\u0660\u0660\u0660'],
    ['one Arabic-Indic digit among the digits', '1\u0660\u0660\u0660'],
    ['full-width digits', '\uff11\uff0c\uff15\uff10\uff10\uff0e\uff15\uff10'],
    ['a minus sign', '-1500'],
    ['a plus sign', '+1500'],
    ['a letter between digits', '15x00'],
    ['a newline', '1500\n'],
    ['a zero-width space', '15\u200b00'],
  ])('refuses a paste with %s and the box keeps what it held', (_k, pasted) => {
    expect(change(pasted)).toBe('');
    expect(change(pasted, '75')).toBe('75');
    expect(change(pasted, '1500.50')).toBe('1500.50');
  });

  it('refuses it when it is pasted over a selection too', () => {
    // The box showed "5,000" and the person selected all of it and pasted "1e3": shorter than the box, still a paste.
    expect(change('1e3', '5000')).toBe('5000');
    expect(change('10k', '5000')).toBe('5000');
  });

  it('refuses it in the middle of what is there', () => {
    expect(change('1,5a00', '1500')).toBe('1500');
    expect(change('1,5NGN00', '1500')).toBe('1500');
  });

  it('takes a paste that holds only ASCII digits, commas and one point, as before', () => {
    expect(change('1,500.50')).toBe('1500.50');
    expect(change('10,000.00')).toBe('10000.00');
    expect(change('1500')).toBe('1500');
    expect(change('1,5,0,0')).toBe('1500');
    expect(change(',1500')).toBe('1500');
    expect(change('.5')).toBe('0.5');
    // Pasted over everything in the box, it replaces it; pasted at the end, it is added.
    expect(change('12', '5000')).toBe('12');
    expect(change('5,00012', '5000')).toBe('500012');
  });

  it('still refuses a second point, pasted whole, as D1 does', () => {
    expect(change('1.2.3')).toBe('');
    expect(change('1.2.3', '75')).toBe('75');
    expect(change('1.500,50')).toBe('');
    expect(change('1,500.50.', '1500.50')).toBe('1500.50');
  });

  it('keeps today’s rule for one key typed: a letter or a naira sign typed is ignored, not refused', () => {
    expect(change('1,500x', '1500')).toBe('1500');
    expect(change('1,500\u20a6', '1500')).toBe('1500');
    expect(change('1,5 00', '1500')).toBe('1500');
    expect(change('1,5001', '1500')).toBe('15001');
    expect(change('7', '5000')).toBe('7');
    // One letter typed over a selected box replaces the selection with nothing, as it always did; it is not a paste.
    expect(change('x', '5000')).toBe('');
  });

  it('keeps today’s rule for a deletion', () => {
    expect(change('1,50', '1500')).toBe('150');
    expect(change('', '1500')).toBe('');
  });
});

describe('where the caret goes after the box redraws its commas (R2-2)', () => {
  it('counts the digits and points, not the commas', () => {
    expect(countSignificant('')).toBe(0);
    expect(countSignificant('1,234.5')).toBe(6);
    expect(countSignificant(',,,')).toBe(0);
    expect(countSignificant('\u20a61,5x0')).toBe(3);
  });

  it.each([
    ['before every digit', '1,234,567', 0, 0],
    ['after the first digit', '1,234,567', 1, 1],
    ['after the comma follows the second digit (no comma stands between them)', '17,234,568', 2, 2],
    ['after the third digit, past a comma', '1,723,456', 3, 4],
    ['after a digit that sits before a comma, the caret stays before the comma', '1,234', 1, 1],
    ['after the last digit', '1,234', 4, 5],
    ['past the end', '1,234', 9, 5],
    ['after the point', '1,500.50', 5, 6],
    ['after a kobo digit', '1,500.50', 6, 7],
    ['in an empty box', '', 3, 0],
  ])('%s', (_k, words, count, at) => {
    expect(caretAfter(words, count)).toBe(at);
  });

  it('is the verifier’s case: 123456, Home, one key right, then 7 and 8 gives 17,823,456 with the caret after the 8', () => {
    // 123,456 with a 7 typed after the 1: the browser shows 17,23,456 with the caret at 2.
    const afterSeven = takeAmount('17,23,456', '123456');
    expect(amountBoxText(afterSeven)).toBe('1,723,456');
    expect(caretAfter(amountBoxText(afterSeven), countSignificant('17,23,456'.slice(0, 2)))).toBe(3);
    // The box now shows 1,723,456 and the caret sits after the 7 (3); an 8 typed there shows 1,78,23,456 with the caret at 4.
    const afterEight = takeAmount('1,78' + '23,456', afterSeven);
    expect(amountBoxText(afterEight)).toBe('17,823,456');
    expect(caretAfter(amountBoxText(afterEight), countSignificant('1,78'))).toBe(4);
  });
});
