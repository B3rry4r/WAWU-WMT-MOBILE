import { readConvertQuote, readConversion, readMyPoints } from '../api';
import { readIntent } from '../intent';
import { blockLine, cashText, digitsOf, endsFirst, endsLine, endsOn, movementLine, movementLook, pointsInput, pointsOf, quoteMoved, rateText, signedPoints } from '../model';

const NOW = new Date('2026-10-17T12:00:00.000Z');

const quote = (over: Record<string, unknown> = {}) => ({
  currency: 'NGN',
  balancePoints: 2350,
  cashablePoints: 2350,
  minimumPoints: 500,
  maximumPoints: null,
  rate: { points: 1000, kobo: 40_000 },
  points: 1000,
  cashKobo: 40_000,
  feeKobo: 0,
  wawuPaysProviderCharge: true,
  canConvert: true,
  blockedBy: null,
  quoteToken: 'tok',
  expiresAt: '2026-10-17T12:05:00.000Z',
  ...over,
});

describe('what a person is told, in Lagos time and in the Hub\'s figures', () => {
  it('writes a lot\'s end day without the year in this year and with it in any other', () => {
    expect(endsOn('2026-12-28T10:00:00.000Z', NOW)).toBe('28 Dec');
    expect(endsOn('2027-09-30T10:00:00.000Z', NOW)).toBe('30 Sep 2027');
    // 23:30 UTC is already the next day in Lagos (UTC+1).
    expect(endsOn('2026-12-31T23:30:00.000Z', NOW)).toBe('1 Jan 2027');
    expect(endsOn('not a time', NOW)).toBe('');
  });

  it('marks the lots that end at the Hub\'s next end, and no others', () => {
    const next = { points: 400, expiresAt: '2027-01-12T10:00:00.000Z' };
    expect(endsFirst({ expiresAt: '2027-01-12T10:00:00.000Z' }, next)).toBe(true);
    expect(endsFirst({ expiresAt: '2027-09-30T10:00:00.000Z' }, next)).toBe(false);
    expect(endsFirst({ expiresAt: '2027-01-12T10:00:00.000Z' }, null)).toBe(false);
  });

  it('dates a movement today or by its day, and says Pending for a hold still running', () => {
    expect(movementLine({ createdAt: '2026-10-17T08:00:00.000Z', pending: false }, NOW)).toBe('today');
    expect(movementLine({ createdAt: '2026-10-02T08:00:00.000Z', pending: false }, NOW)).toBe('2 Oct');
    expect(movementLine({ createdAt: '2026-10-17T08:00:00.000Z', pending: true }, NOW)).toBe('Pending · today');
  });

  it('signs points with a plus or a minus sign and no naira', () => {
    expect(signedPoints(600)).toBe('+600');
    expect(signedPoints(-1250)).toBe('−1,250');
    expect(movementLook({ reason: 'grant', points: 5 })).toEqual({ icon: 'Gift', tone: 'in' });
    expect(movementLook({ reason: 'hold', points: -5 }).tone).toBe('neutral');
    expect(movementLook({ reason: 'expire', points: -5 }).icon).toBe('Clock');
  });

  it('prints the rate and the cash from kobo: whole naira plain, kobo kept', () => {
    expect(rateText({ points: 1000, kobo: 50_000 })).toBe('1,000 points = ₦500');
    expect(cashText(50_050)).toBe('₦500.50');
    expect(cashText(0)).toBe('₦0');
  });

  it('reads the points typed as digits only, with commas shown', () => {
    expect(digitsOf('1,000')).toBe('1000');
    expect(digitsOf('1e3')).toBe('13');
    expect(digitsOf('007')).toBe('7');
    expect(pointsInput('1000')).toBe('1,000');
    expect(pointsOf('')).toBeNull();
    expect(pointsOf('0')).toBeNull();
    expect(pointsOf('2147483648')).toBeNull();
    expect(pointsOf('1000')).toBe(1000);
  });

  it('writes why points cannot be converted from the quote\'s own figures', () => {
    const base = { balancePoints: 600, cashablePoints: 250, minimumPoints: 500, maximumPoints: 90_000 };
    expect(blockLine({ ...base, blockedBy: 'below_minimum' })).toBe('The minimum is 500 points.');
    expect(blockLine({ ...base, blockedBy: 'insufficient_points' })).toBe('You have 600 points.');
    expect(blockLine({ ...base, blockedBy: 'above_maximum' })).toBe('The most you can convert at once is 90,000 points.');
    expect(blockLine({ ...base, blockedBy: 'not_cashable' })).toBe('You can convert 250 points.');
    expect(blockLine({ ...base, blockedBy: null })).toBeNull();
  });

  it('knows the figures moved when the rate, the cash or a limit is not what was shown', () => {
    const a = readConvertQuote(quote());
    expect(quoteMoved(a, readConvertQuote(quote({ quoteToken: 'other' })))).toBe(false);
    expect(quoteMoved(a, readConvertQuote(quote({ cashKobo: 45_000, rate: { points: 1000, kobo: 45_000 } })))).toBe(true);
    expect(quoteMoved(a, readConvertQuote(quote({ minimumPoints: 600 })))).toBe(true);
  });
});

describe('what the screens refuse to draw half empty', () => {
  it('refuses an answer that is not whole', () => {
    expect(() => readMyPoints({ balance: 5, lots: 'x', movements: [] })).toThrow();
    expect(() => readMyPoints({ balance: 5, nextExpiry: null, lots: [{ id: 'a', points: 5, expiresAt: 'soon' }], movements: [] })).toThrow();
    expect(() => readConvertQuote(quote({ cashKobo: 12.5 }))).toThrow();
    expect(() => readConvertQuote(quote({ currency: 'USD' }))).toThrow();
    expect(() => readConvertQuote(quote({ blockedBy: 'whatever' }))).toThrow();
    expect(() => readConversion({ id: 'c', status: 'weird', points: 1, cashKobo: 1, createdAt: 'x' })).toThrow();
    expect(readMyPoints({ balance: 0, nextExpiry: null, lots: [], movements: [] }).lotCount).toBe(0);
  });

  it('keeps only a whole intent', () => {
    const good = { key: 'k-12345678', points: 1000, quoteToken: 't', phase: 'unknown', conversionId: null, at: 1 };
    expect(readIntent(good)).toEqual(good);
    expect(readIntent({ ...good, phase: 'pending' })).toBeNull();
    expect(readIntent({ ...good, phase: 'pending', conversionId: 'c1' })?.conversionId).toBe('c1');
    expect(readIntent({ ...good, points: 0 })).toBeNull();
    expect(readIntent({ ...good, key: '' })).toBeNull();
    expect(readIntent(null)).toBeNull();
  });
});

describe('POINTS-BOUGHT · bought points never end and are never cashable (R-101 point 7)', () => {
  const lot = (over: Record<string, unknown> = {}) => ({ id: 'a', points: 5, granted: 5, source: 'pack', label: 'Bought points', expiresAt: null, cashable: false, ...over });

  it('reads a lot with no end, and a points answer that says what can be cashed out', () => {
    const read = readMyPoints({ balance: 105, cashablePoints: 100, nextExpiry: null, lots: [lot(), lot({ id: 'b', source: 'tier_bonus', expiresAt: '2027-01-12T10:00:00.000Z', cashable: true, points: 100 })], movements: [] });
    expect(read.cashablePoints).toBe(100);
    expect(read.lots.map((l) => [l.expiresAt, l.cashable])).toEqual([[null, false], ['2027-01-12T10:00:00.000Z', true]]);
    expect(() => readMyPoints({ balance: 5, nextExpiry: null, lots: [lot({ expiresAt: undefined })], movements: [] })).toThrow();
  });

  it('says a lot of bought points never expires and never draws it as the soonest to end', () => {
    expect(endsLine(null, NOW)).toBe('never expires');
    expect(endsFirst({ expiresAt: null }, { points: 400, expiresAt: '2027-01-12T10:00:00.000Z' })).toBe(false);
  });

  it('refuses a convert quote with no cashablePoints, and reads one blocked as not_cashable', () => {
    const { cashablePoints: _drop, ...without } = quote();
    expect(() => readConvertQuote(without)).toThrow();
    expect(readConvertQuote(quote({ canConvert: false, blockedBy: 'not_cashable' })).blockedBy).toBe('not_cashable');
  });
});
