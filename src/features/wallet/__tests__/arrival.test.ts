import { ARRIVES_LABEL, arrivalMinutesOf, arrivesValue, durationWords, sendArrivesLine, usuallyAbout, usuallyWithin } from '../arrival';

describe('FIX-109: arrival words are the Hub minutes, written out', () => {
  it('reads only whole minutes from 1 to a day', () => {
    expect(arrivalMinutesOf(5)).toBe(5);
    expect(arrivalMinutesOf(1440)).toBe(1440);
    for (const bad of [0, -1, 1.5, 1441, '5', null, undefined, NaN]) expect(arrivalMinutesOf(bad)).toBeNull();
  });

  it('says a duration the way a person would', () => {
    expect(durationWords(1)).toBe('a minute');
    expect(durationWords(10)).toBe('10 minutes');
    expect(durationWords(60)).toBe('an hour');
    expect(durationWords(90)).toBe('90 minutes');
    expect(durationWords(120)).toBe('2 hours');
    expect(durationWords(1440)).toBe('a day');
  });

  it('writes each line of the four screens from the minutes', () => {
    expect(ARRIVES_LABEL).toBe('Arrives');
    expect(arrivesValue(10)).toBe('In about 10 minutes');
    expect(usuallyWithin(10)).toBe('Usually within 10 minutes');
    expect(sendArrivesLine(10)).toBe('Money you send arrives in about 10 minutes.');
    expect(usuallyAbout(10)).toBe('Usually about 10 minutes');
  });
});
