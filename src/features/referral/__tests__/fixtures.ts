import type { Referrals } from '../api';

/** A referrals answer as the Hub serves it, with the launch ladder and milestones (plans.config.json), for tests only. */
export const ladder = (reached: number) =>
  [
    { verified: 1, multiplier: 1 },
    { verified: 3, multiplier: 1.25 },
    { verified: 6, multiplier: 1.5 },
    { verified: 11, multiplier: 2 },
    { verified: 26, multiplier: 3 },
  ].map((step, at) => ({ ...step, reached: at < reached }));

export const milestones = (verified: number, granted: Record<number, string> = {}) =>
  [
    { verified: 5, points: 500 },
    { verified: 10, points: 1500 },
    { verified: 25, points: 5000 },
  ].map((m) => ({ ...m, reached: verified >= m.verified, grantedAt: granted[m.verified] ?? null }));

export function referrals(over: Partial<Referrals> = {}): Referrals {
  return {
    link: 'wawu/r/lennox',
    code: 'LENNOX',
    brought: 7,
    verified: 2,
    pending: 3,
    pointsEarned: 400,
    pendingPoints: 300,
    multiplier: 1,
    level: 1,
    ladder: ladder(1),
    nextMilestone: { verified: 5, points: 500, remaining: 3 },
    milestones: milestones(2),
    holdDays: 7,
    claimDays: 14,
    rewards: [],
    ...over,
  };
}

export const emptyReferrals = () =>
  referrals({ brought: 0, verified: 0, pending: 0, pointsEarned: 0, pendingPoints: 0, level: 0, ladder: ladder(0), nextMilestone: { verified: 5, points: 500, remaining: 5 }, milestones: milestones(0) });

export const reward = (over: Record<string, unknown> = {}) => ({
  id: 'rw1',
  name: 'Kemi Okafor',
  tierId: 'verify',
  tierName: 'Verify',
  basePoints: 100,
  multiplier: 1.25,
  points: 125,
  state: 'available' as const,
  availableAt: '2026-10-10T09:00:00.000Z',
  settledAt: '2026-10-10T09:01:00.000Z',
  ...over,
});
