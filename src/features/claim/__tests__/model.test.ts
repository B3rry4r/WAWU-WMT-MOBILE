import type { ClaimResult } from '../api';
import { CODE_PROBLEM_WORDS, codeProblem, compactCode, formatCode, planLines, readyLine } from '../model';

const NOW = new Date('2026-10-17T10:00:00.000Z').getTime();

const result = (over: Partial<ClaimResult> = {}, tier: Partial<ClaimResult['tier']> = {}): ClaimResult => ({
  offerName: 'Event registration',
  days: 30,
  extended: false,
  pointsGranted: 100,
  pointsExpireAt: '2027-01-15T10:00:00.000Z',
  tier: {
    state: 'active',
    tier: { id: 'verify', name: 'Verify', badge: { id: 'verified', numbered: false } },
    activeFrom: '2026-10-17T10:00:00.000Z',
    activeUntil: '2026-11-16T10:00:00.000Z',
    productsAllowed: 3,
    extraProducts: 0,
    pointsIncluded: 100,
    firstVoiceIntroIncluded: true,
    eventPass: { id: 'watch_apply', name: 'Watch live, apply' },
    ...tier,
  },
  ...over,
});

describe('the access code as a person types it (JOIN-03)', () => {
  it('is shown upper case in two groups of four, however it is typed or pasted', () => {
    expect(formatCode('5f6c15e4')).toBe('5F6C 15E4');
    expect(formatCode('5F6C 15E4')).toBe('5F6C 15E4');
    expect(formatCode(' 5f6c-15e4 ')).toBe('5F6C 15E4');
    expect(formatCode('5f6c')).toBe('5F6C');
    expect(formatCode('5f6c1')).toBe('5F6C 1');
    expect(formatCode('')).toBe('');
  });

  it('stops at eight characters and drops everything that is not a letter or a number', () => {
    expect(formatCode('5F6C15E4999')).toBe('5F6C 15E4');
    expect(formatCode('5F6C.15E4!!')).toBe('5F6C 15E4');
  });

  it('is sent without the space', () => {
    expect(compactCode('5F6C 15E4')).toBe('5F6C15E4');
  });

  it('is checked on the phone before anything is sent: empty, short, or a letter after F', () => {
    expect(codeProblem('')).toBe('empty');
    expect(codeProblem('5F6C 15E')).toBe('short');
    expect(codeProblem('5F6C 15EG')).toBe('letters');
    expect(codeProblem('5F6C 15E4')).toBeNull();
    for (const words of Object.values(CODE_PROBLEM_WORDS)) expect(words).not.toContain('—');
  });
});

describe('what the code gave, from the Hub answer (JOIN-03)', () => {
  it('lists the plan, when it runs until, the products, the points and when they end, the pass and the Voice Intro', () => {
    expect(planLines(result(), NOW)).toEqual([
      { label: 'Plan', value: 'Verify' },
      { label: 'Runs until', value: '16 Nov' },
      { label: 'Products you can publish', value: '3' },
      { label: 'Points added', value: '100' },
      { label: 'Points last until', value: '15 Jan 2027' },
      { label: 'Event pass', value: 'Watch live, apply' },
      { label: 'Voice Intro', value: 'First one included' },
    ]);
  });

  it('leaves a line out when the Hub sent nothing for it', () => {
    const lines = planLines(result({ pointsGranted: 0, pointsExpireAt: null }, { eventPass: null, firstVoiceIntroIncluded: false, productsAllowed: 0 }), NOW);
    expect(lines.map((l) => l.label)).toEqual(['Plan', 'Runs until']);
  });

  it('says the days were added when the person already had a plan', () => {
    expect(readyLine(result())).toBe('Verify for 30 days, starting today.');
    expect(readyLine(result({ extended: true }))).toBe('30 days were added to the plan you already have.');
    expect(readyLine(result({ days: 1 }))).toBe('Verify for 1 day, starting today.');
    expect(planLines(result({ extended: true }), NOW)[1].label).toBe('Now runs until');
  });
});
