import type { ClaimResult } from '../api';
import { CODE_PROBLEM_WORDS, claimHeading, claimStanding, codeProblem, compactCode, formatCode, planLines, readyLine } from '../model';

const NOW = new Date('2026-10-17T10:00:00.000Z').getTime();

const result = (over: Partial<ClaimResult> = {}, tier: Partial<ClaimResult['tier']> = {}): ClaimResult => ({
  offerName: 'Event registration',
  days: 30,
  extended: false,
  pointsGranted: 100,
  pointsExpireAt: '2027-01-15T10:00:00.000Z',
  claimedAt: '2026-10-17T10:00:00.000Z',
  tier: {
    state: 'active',
    tier: { id: 'verify', name: 'Verify', badge: { id: 'verified', numbered: false } },
    activeFrom: '2026-10-17T10:00:00.000Z',
    activeUntil: '2026-11-16T10:00:00.000Z',
    productsAllowed: 3,
    productsUsed: 0,
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
  it('lists only the plan, when it runs until and the points with when they end: the products, the pass and the Voice Intro are granted but not in force in the app (round 2, N2)', () => {
    expect(planLines(result(), NOW)).toEqual([
      { label: 'Plan', value: 'Verify' },
      { label: 'Runs until', value: '16 Nov' },
      { label: 'Points added', value: '100' },
      { label: 'Points last until', value: '15 Jan 2027' },
    ]);
    // The Hub did send all three (the result above carries them) and none is drawn.
    const drawn = JSON.stringify(planLines(result(), NOW));
    for (const unbuilt of ['Products', 'Event pass', 'Watch live', 'Voice Intro', 'First one']) expect(drawn).not.toContain(unbuilt);
  });

  it('leaves a line out when the Hub sent nothing for it', () => {
    const lines = planLines(result({ pointsGranted: 0, pointsExpireAt: null }, { eventPass: null, firstVoiceIntroIncluded: false, productsAllowed: 0 }), NOW);
    expect(lines.map((l) => l.label)).toEqual(['Plan', 'Runs until']);
    // No points credited: no points lines, whatever the plan includes.
    expect(planLines(result({ pointsGranted: 0, pointsExpireAt: '2027-01-15T10:00:00.000Z' }), NOW).map((l) => l.label)).toEqual(['Plan', 'Runs until']);
    // Points credited but no end date sent: the points line only.
    expect(planLines(result({ pointsExpireAt: null }), NOW).map((l) => l.label)).toEqual(['Plan', 'Runs until', 'Points added']);
  });

  it('says the days were added when the person already had a plan', () => {
    expect(readyLine(result(), NOW)).toBe('Verify for 30 days, starting today.');
    expect(readyLine(result({ extended: true }), NOW)).toBe('30 days were added to the plan you already have.');
    expect(readyLine(result({ days: 1 }), NOW)).toBe('Verify for 1 day, starting today.');
    expect(planLines(result({ extended: true }), NOW)[1].label).toBe('Now runs until');
  });
});

describe('the same answer shown again after the day it was claimed (JOIN-03 round 3, D4)', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const later = (days: number) => NOW + days * DAY;
  const ended = (over: Partial<ClaimResult['tier']> = {}) => ({ state: 'ended' as const, activeUntil: '2026-11-16T10:00:00.000Z', ...over });

  it('is "ready", starting today, only on the day it was claimed (read in the zone the dates are drawn in)', () => {
    expect(claimStanding(result(), NOW)).toBe('fresh');
    expect(claimHeading(result(), NOW)).toBe('Your plan is ready');
    // 23:30 Lagos the evening before is still "yesterday" at 00:30 Lagos the next morning.
    expect(claimStanding(result({ claimedAt: '2026-10-16T22:30:00.000Z' }), new Date('2026-10-16T23:30:00.000Z').getTime())).toBe('running');
    expect(claimStanding(result({ claimedAt: '2026-10-16T21:30:00.000Z' }), new Date('2026-10-16T22:30:00.000Z').getTime())).toBe('fresh');
  });

  it('says when the plan started once the day has passed, and never says "starting today"', () => {
    for (const days of [1, 10, 29]) {
      const at = later(days);
      expect(claimStanding(result(), at)).toBe('running');
      expect(claimHeading(result(), at)).toBe('Your plan is active');
      expect(readyLine(result(), at)).toBe('Verify started on 17 Oct.');
      expect(readyLine(result({ extended: true }), at)).toBe('30 days were added to your plan on 17 Oct.');
      expect(readyLine(result({ days: 1 }), at)).toBe('Verify started on 17 Oct.');
    }
    // A plan whose name the Hub did not send is still told without a name.
    expect(readyLine(result({}, { tier: null }), later(2))).toBe('Your plan started on 17 Oct.');
  });

  it('says the plan ended when the Hub says so, with the date it ended, and lists the end as "Ended"', () => {
    const gone = result({}, ended());
    expect(claimStanding(gone, later(60))).toBe('ended');
    expect(claimHeading(gone, later(60))).toBe('Your plan has ended');
    expect(readyLine(gone, later(60))).toBe('Verify ended on 16 Nov.');
    expect(planLines(gone, later(60)).slice(0, 2)).toEqual([
      { label: 'Plan', value: 'Verify' },
      { label: 'Ended', value: '16 Nov' },
    ]);
    // Even on the day of the claim: a plan the Hub reports as over is over.
    expect(claimHeading(gone, NOW)).toBe('Your plan has ended');
    // An extended plan that ended too.
    expect(planLines(result({ extended: true }, ended()), later(60))[1].label).toBe('Ended');
  });

  it('an account with no plan now says the day the code was claimed, and lists no end', () => {
    const none = result({ pointsGranted: 0, pointsExpireAt: null }, { state: 'none', tier: null, activeFrom: null, activeUntil: null });
    expect(claimHeading(none, later(5))).toBe('Your plan has ended');
    expect(readyLine(none, later(5))).toBe('You claimed this code on 17 Oct.');
    expect(planLines(none, later(5))).toEqual([]);
  });

  it('labels points whose end has passed as ended, not as lasting until a past date', () => {
    expect(planLines(result({ pointsExpireAt: '2026-11-01T10:00:00.000Z' }), later(30)).map((l) => l.label)).toEqual(['Plan', 'Runs until', 'Points added', 'Points ended']);
    expect(planLines(result({ pointsExpireAt: '2026-11-01T10:00:00.000Z' }), later(10)).map((l) => l.label)).toEqual(['Plan', 'Runs until', 'Points added', 'Points last until']);
  });

  it('writes no em-dash in any state', () => {
    for (const at of [NOW, later(10), later(60)]) {
      for (const r of [result(), result({ extended: true }), result({}, ended()), result({}, { state: 'none', tier: null, activeUntil: null })]) {
        expect(`${claimHeading(r, at)} ${readyLine(r, at)} ${JSON.stringify(planLines(r, at))}`).not.toContain('—');
      }
    }
  });
});
