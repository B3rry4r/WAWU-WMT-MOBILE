import { afterNext, codeFromLink, formatMultiplier, levelPills, momentCopy, momentsOf, nextCard, rulesOf } from '../model';

import { emptyReferrals, ladder, milestones, referrals, reward } from './fixtures';

describe('REF-03: what the screens say, from the Hub', () => {
  it('writes the Hub multipliers without trailing zeros', () => {
    expect([1, 1.25, 1.5, 2, 3].map(formatMultiplier)).toEqual(['×1', '×1.25', '×1.5', '×2', '×3']);
    expect(formatMultiplier(1.2500000001)).toBe('×1.25');
  });

  it('marks the level reached, the levels behind it and the levels ahead (RF1, RF1a)', () => {
    expect(levelPills(ladder(2)).map((p) => `${p.label} ${p.state}`)).toEqual(['×1 done', '×1.25 current', '×1.5 ahead', '×2 ahead', '×3 ahead']);
    // Nobody has reached a step yet: the first multiplier is already what a new reward earns, and it is drawn solid.
    expect(levelPills(ladder(0)).map((p) => p.state)).toEqual(['current', 'ahead', 'ahead', 'ahead', 'ahead']);
    expect(levelPills(ladder(5)).map((p) => p.state)).toEqual(['done', 'done', 'done', 'done', 'current']);
  });

  it('names the next milestone and the one after it from the Hub (RF1)', () => {
    expect(nextCard(referrals())).toEqual({ kind: 'next', title: 'Next: +500 points at 5 verified', line: '3 more to go · then +1,500 at 10' });
    // A different ladder from the Hub changes the words.
    const other = referrals({ nextMilestone: { verified: 8, points: 900, remaining: 2 }, milestones: [{ verified: 8, points: 900, reached: false, grantedAt: null }] });
    expect(nextCard(other)).toEqual({ kind: 'next', title: 'Next: +900 points at 8 verified', line: '2 more to go' });
  });

  it('turns the card into the "one more" note when one more person reaches it (RF1b)', () => {
    const close = referrals({ nextMilestone: { verified: 10, points: 1500, remaining: 1 }, milestones: milestones(9) });
    expect(nextCard(close)).toEqual({ kind: 'close', title: 'One more verified person', body: 'Get +1,500 points at 10 verified.' });
  });

  it('draws no next milestone once every one is reached', () => {
    expect(nextCard(referrals({ nextMilestone: null, milestones: milestones(30) }))).toBeNull();
    expect(afterNext({ verified: 25, points: 5000, remaining: 1 }, milestones(24))).toBeNull();
  });

  it('prints the Hub hold days in the rules (RF4), never a literal', () => {
    expect(rulesOf(referrals({ holdDays: 7 }))).toContain('Rewards are held for 7 days.');
    expect(rulesOf(referrals({ holdDays: 3 }))).toContain('Rewards are held for 3 days.');
    expect(rulesOf(referrals({ holdDays: 3 })).join(' ')).not.toContain('7');
    expect(rulesOf(referrals({ holdDays: 1 }))).toContain('Rewards are held for 1 day.');
    // No hold, no rule about one: five rules.
    expect(rulesOf(referrals({ holdDays: 0 }))).toHaveLength(5);
    expect(rulesOf(referrals())).toHaveLength(6);
  });

  it('says rewards are points, never cash, and promises no cash-out the app cannot do yet', () => {
    const words = rulesOf(referrals()).join(' ');
    expect(words).toContain('Rewards are points, never cash.');
    expect(words).not.toMatch(/convert/i);
  });

  it('lists a reward once it is available and a milestone once it is granted, oldest first (RF3, RF3a)', () => {
    const view = referrals({
      rewards: [reward({ id: 'b', settledAt: '2026-10-12T00:00:00.000Z' }), reward({ id: 'a', settledAt: '2026-10-11T00:00:00.000Z' }), reward({ id: 'p', state: 'pending', settledAt: null }), reward({ id: 'c', state: 'cancelled' })],
      milestones: milestones(5, { 5: '2026-10-11T12:00:00.000Z' }),
    });
    expect(momentsOf(view).map((m) => m.id)).toEqual(['reward:a', 'milestone:5', 'reward:b']);
  });

  it('writes RF3 from the reward the Hub made', () => {
    const [moment] = momentsOf(referrals({ rewards: [reward()] }));
    expect(momentCopy(moment, { multiplier: 1.25 })).toEqual({
      icon: 'Sparkles',
      title: 'You earned 125 points',
      body: 'Kemi Okafor paid and is verified. 100 points ×1.25.',
      points: 125,
    });
    const [nameless] = momentsOf(referrals({ rewards: [reward({ name: '', points: 1, basePoints: 1, multiplier: 1 })] }));
    expect(momentCopy(nameless, { multiplier: 1 })).toMatchObject({ title: 'You earned 1 point', body: 'Someone you invited paid and is verified. 1 point ×1.' });
  });

  it('writes RF3a from the milestone the Hub granted', () => {
    const [moment] = momentsOf(referrals({ milestones: milestones(5, { 5: '2026-10-11T12:00:00.000Z' }) }));
    expect(momentCopy(moment, { multiplier: 1.25 })).toEqual({
      icon: 'Trophy',
      title: 'You reached 5 verified',
      body: '+500 bonus points. Your level is now ×1.25.',
      points: 500,
    });
  });

  it('reads the code from a link, or the code itself, and nothing else', () => {
    expect(codeFromLink('lennox')).toBe('lennox');
    expect(codeFromLink('wawu/r/lennox')).toBe('lennox');
    expect(codeFromLink('LENNOX')).toBe('LENNOX');
    expect(codeFromLink('wawu%2Fr%2Flennox')).toBe('lennox');
    expect(codeFromLink('')).toBeNull();
    expect(codeFromLink(undefined)).toBeNull();
    expect(codeFromLink('len nox')).toBeNull();
    expect(codeFromLink('%E0%A4%A')).toBeNull();
    expect(emptyReferrals().brought).toBe(0);
  });
});
