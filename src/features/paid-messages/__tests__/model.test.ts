import type { PaidMessageSettings } from '../api';
import {
  canSave,
  dayMonth,
  digitsFromKobo,
  digitsOf,
  formOf,
  lockedBody,
  lockedTitle,
  modeOf,
  percentText,
  priceInput,
  priceKoboOf,
  priceProblem,
  saveBody,
  switchLine,
  warningBody,
  warningTitle,
  windowLabel,
} from '../model';

const standing = (over: Partial<PaidMessageSettings['standing']> = {}): PaidMessageSettings['standing'] => ({
  state: 'ok',
  acceptingPaidMessages: true,
  unansweredPct: 4,
  unanswered: 1,
  questions: 25,
  warnAtPct: 20,
  pauseAtPct: 30,
  windowDays: 30,
  pauseDays: 7,
  pausedUntil: null,
  ...over,
});

const settings = (over: Partial<PaidMessageSettings> = {}): PaidMessageSettings => ({
  enabled: true,
  priceKobo: 150_000,
  responseHours: 24,
  creatorSharePct: 85,
  earnPerMessageKobo: 127_500,
  raiseToKobo: 250_000,
  options: { minPriceKobo: 5_000, maxPriceKobo: 1_000_000_000, pricePresets: [{ priceKobo: 10_000 }, { priceKobo: 50_000 }, { priceKobo: 100_000 }, { priceKobo: 250_000 }], responseWindowHours: [24, 48, 72, 168] },
  standing: standing(),
  ...over,
});

describe('the paid message settings model', () => {
  it('reads the screen moment from the standing alone', () => {
    expect(modeOf(standing())).toBe('ok');
    expect(modeOf(standing({ state: 'warning' }))).toBe('warned');
    expect(modeOf(standing({ state: 'paused' }))).toBe('locked');
  });

  it('holds the price as the digits of naira, and draws them as money', () => {
    expect(formOf(settings())).toEqual({ enabled: true, digits: '1500', hours: 24 });
    expect(formOf(settings({ priceKobo: null, enabled: false }))).toEqual({ enabled: false, digits: '', hours: 24 });
    expect(digitsFromKobo(1_000_000_000)).toBe('10000000');
    expect(priceInput('1500')).toBe('₦1,500');
    expect(priceInput('')).toBe('');
  });

  it('keeps only digits from what was typed, drops leading zeros, and stops at ten', () => {
    expect(digitsOf('₦1,500')).toBe('1500');
    expect(digitsOf('0075')).toBe('75');
    expect(digitsOf('abc')).toBe('');
    expect(digitsOf('123456789012')).toBe('1234567890');
  });

  it('writes a share as a whole percent, never over the line it is under', () => {
    expect(percentText(22.22)).toBe('22%');
    expect(percentText(29.99)).toBe('29%');
    expect(percentText(0)).toBe('0%');
  });

  it('says a reply window the way a person does', () => {
    expect(windowLabel(1)).toBe('1 hour');
    expect(windowLabel(24)).toBe('24 hours');
    expect(windowLabel(36)).toBe('36 hours');
    expect(windowLabel(48)).toBe('2 days');
    expect(windowLabel(72)).toBe('3 days');
    expect(windowLabel(168)).toBe('1 week');
    expect(windowLabel(336)).toBe('2 weeks');
    expect(windowLabel(100)).toBe('100 hours');
  });

  it('names the day in Lagos time', () => {
    expect(dayMonth('2026-10-03T09:00:00.000Z')).toBe('3 October');
    // 23:30 UTC is already the next day in Lagos.
    expect(dayMonth('2026-10-02T23:30:00.000Z')).toBe('3 October');
  });

  it('refuses a price outside what the Hub allows, from the Hub\'s own bounds', () => {
    const s = settings();
    expect(priceProblem({ enabled: true, digits: '49', hours: 24 }, s)).toBe('The lowest price is ₦50.');
    expect(priceProblem({ enabled: true, digits: '10000001', hours: 24 }, s)).toBe('The highest price is ₦10,000,000.');
    expect(priceProblem({ enabled: true, digits: '50', hours: 24 }, s)).toBeNull();
    expect(priceProblem({ enabled: true, digits: '', hours: 24 }, s)).toBeNull();
  });

  it('can be saved only with a good price, a price when the switch is on, a reply time, and nothing locked', () => {
    const s = settings();
    expect(canSave({ enabled: true, digits: '1500', hours: 24 }, s)).toBe(true);
    expect(canSave({ enabled: true, digits: '', hours: 24 }, s)).toBe(false);
    expect(canSave({ enabled: false, digits: '', hours: 24 }, s)).toBe(true);
    expect(canSave({ enabled: true, digits: '49', hours: 24 }, s)).toBe(false);
    expect(canSave({ enabled: true, digits: '1500', hours: null }, s)).toBe(false);
    expect(canSave({ enabled: true, digits: '1500', hours: 24 }, settings({ standing: standing({ state: 'paused', pausedUntil: '2026-10-03T09:00:00.000Z' }) }))).toBe(false);
  });

  it('sends the price in kobo only when there is one', () => {
    expect(saveBody({ enabled: true, digits: '2500', hours: 48 })).toEqual({ enabled: true, priceKobo: 250_000, responseHours: 48 });
    expect(saveBody({ enabled: false, digits: '', hours: 24 })).toEqual({ enabled: false, responseHours: 24 });
    expect(priceKoboOf({ enabled: true, digits: '50', hours: 24 })).toBe(5_000);
  });

  it('writes the line under the switch: on with the price, off, and locked until the day', () => {
    const ok = standing();
    expect(switchLine({ enabled: true, digits: '1500', hours: 24 }, 'ok', ok)).toBe('On · ₦1,500 a message');
    expect(switchLine({ enabled: true, digits: '', hours: 24 }, 'ok', ok)).toBe('On');
    expect(switchLine({ enabled: false, digits: '1500', hours: 24 }, 'ok', ok)).toBe('Off');
    expect(switchLine({ enabled: true, digits: '1500', hours: 24 }, 'locked', standing({ state: 'paused', pausedUntil: '2026-10-03T09:00:00.000Z' }))).toBe('Locked until 3 October');
  });

  it('writes the warning from the Hub\'s counts and lines, and the way out only when there is a price to raise to', () => {
    const w = standing({ state: 'warning', unanswered: 4, questions: 18, unansweredPct: 22.22 });
    expect(warningTitle(w)).toBe('You missed 4 of your last 18');
    expect(warningTitle(standing({ unanswered: null, questions: null }))).toBeNull();
    expect(warningBody(w, true)).toBe('Past 30% and paid messages switch off for 7 days. Raise your price for fewer, more serious questions.');
    expect(warningBody(w, false)).toBe('Past 30% and paid messages switch off for 7 days.');
    expect(warningBody(standing({ pauseAtPct: 40, pauseDays: 3 }), false)).toBe('Past 40% and paid messages switch off for 3 days.');
  });

  it('writes the lock as BRIEF I23 changes it: no shop', () => {
    const l = standing({ state: 'paused', pausedUntil: '2026-10-03T09:00:00.000Z' });
    expect(lockedTitle(l)).toBe('Paid messages are off for 7 days');
    expect(lockedBody(l)).toBe('Back on 3 October. Publishing, communities and tips all keep working.');
    expect(lockedBody(l)).not.toMatch(/shop/i);
  });
});
