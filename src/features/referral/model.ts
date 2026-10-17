import { formatPoints, formatPointsCount } from '@/components/PointsFigure';

import type { LadderStep, NextMilestone, ReferralMilestone, ReferralReward, Referrals } from './api';

/**
 * What RF1 to RF4 say, worked out from `GET /me/referrals` and nothing else (R-65, R-47): the multipliers, the hold
 * days, the milestones and every count come from the Hub's answer, never from a literal here. Points are a count,
 * never naira.
 */

/** "×1.25", "×1.5", "×2": the Hub's multiplier as the boards write it, without trailing zeros or float noise. */
export function formatMultiplier(multiplier: number): string {
  return `×${Number(multiplier.toFixed(2))}`;
}

/** The people count with thousands commas ("1,240"), as a tile prints it. */
export const formatCount = formatPointsCount;

export type LevelPillState = 'current' | 'done' | 'ahead';
export type LevelPill = { label: string; state: LevelPillState };

/**
 * The level row (RF1): one pill per step of the Hub's ladder. The pill of the highest step reached is solid, the steps
 * before it are tinted and the steps ahead are outlined. Before the first step is reached the first pill is solid, as
 * RF1a draws it: a new person already earns the first multiplier.
 */
export function levelPills(ladder: readonly LadderStep[]): LevelPill[] {
  let current = 0;
  ladder.forEach((step, at) => {
    if (step.reached) current = at;
  });
  return ladder.map((step, at) => ({ label: formatMultiplier(step.multiplier), state: at === current ? 'current' : at < current ? 'done' : 'ahead' }));
}

/** The milestone after the next one, which RF1 names as "then +5,000 at 25" (none when the next is the last). */
export function afterNext(next: NextMilestone, milestones: readonly ReferralMilestone[]): ReferralMilestone | null {
  const later = milestones.filter((m) => !m.reached && m.verified > next.verified).sort((a, b) => a.verified - b.verified);
  return later[0] ?? null;
}

export type NextCard =
  /** RF1's card with the trophy: "Next: +500 points at 5 verified". */
  | { kind: 'next'; title: string; line: string }
  /** RF1b: one more verified person reaches the milestone. */
  | { kind: 'close'; title: string; body: string };

/** The next milestone, or nothing when every one is reached (no board draws an end to the ladder, so none is drawn, R-47). */
export function nextCard(view: Pick<Referrals, 'nextMilestone' | 'milestones'>): NextCard | null {
  const next = view.nextMilestone;
  if (!next) return null;
  if (next.remaining === 1) {
    return { kind: 'close', title: 'One more verified person', body: `Get +${formatPoints(next.points)} at ${next.verified} verified.` };
  }
  const later = afterNext(next, view.milestones);
  const then = later ? ` · then +${formatPointsCount(later.points)} at ${later.verified}` : '';
  return { kind: 'next', title: `Next: +${formatPoints(next.points)} at ${next.verified} verified`, line: `${next.remaining} more to go${then}` };
}

/** RF1a's line under the cards, drawn only while nobody has used the link. */
export const NOBODY_YET = 'Nobody yet. Share your link to start.';

/** RF4: the rules, with the Hub's hold days in the fourth. A hold of no days is not a rule, so it is left out. */
export function rulesOf(view: Pick<Referrals, 'holdDays'>): string[] {
  const days = view.holdDays;
  const hold = days > 0 ? [`Rewards are held for ${days} ${days === 1 ? 'day' : 'days'}.`] : [];
  return [
    'Only verified people earn.',
    'You earn when the person you invited pays for a tier and is verified.',
    "One level only. You don't earn from the people they invite.",
    ...hold,
    'No reward if they get a refund.',
    'Rewards are points, never cash.',
  ];
}

export type Moment =
  | { id: string; kind: 'reward'; at: number; reward: ReferralReward }
  | { id: string; kind: 'milestone'; at: number; milestone: ReferralMilestone };

const time = (iso: string | null | undefined): number => {
  const at = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(at) ? at : 0;
};

export const rewardMomentId = (reward: Pick<ReferralReward, 'id'>) => `reward:${reward.id}`;
export const milestoneMomentId = (milestone: Pick<ReferralMilestone, 'verified'>) => `milestone:${milestone.verified}`;

/** Every time the Hub says points became the person's: a reward that is available, and a milestone that was granted. Oldest first. */
export function momentsOf(view: Pick<Referrals, 'rewards' | 'milestones'>): Moment[] {
  const out: Moment[] = [];
  for (const reward of view.rewards) {
    if (reward.state === 'available') out.push({ id: rewardMomentId(reward), kind: 'reward', at: time(reward.settledAt ?? reward.availableAt), reward });
  }
  for (const milestone of view.milestones) {
    if (milestone.reached && milestone.grantedAt) out.push({ id: milestoneMomentId(milestone), kind: 'milestone', at: time(milestone.grantedAt), milestone });
  }
  return out.sort((a, b) => a.at - b.at);
}

export type MomentCopy = { icon: 'Sparkles' | 'Trophy'; title: string; body: string; points: number };

const SOMEONE = 'Someone you invited';

/** RF3 and RF3a: what the moment says. The level named in RF3a is the one the person has now. */
export function momentCopy(moment: Moment, view: Pick<Referrals, 'multiplier'>): MomentCopy {
  if (moment.kind === 'reward') {
    const { reward } = moment;
    const name = reward.name.trim() || SOMEONE;
    return {
      icon: 'Sparkles',
      title: `You earned ${formatPoints(reward.points)}`,
      body: `${name} paid and is verified. ${formatPoints(reward.basePoints)} ${formatMultiplier(reward.multiplier)}.`,
      points: reward.points,
    };
  }
  const { milestone } = moment;
  return {
    icon: 'Trophy',
    title: `You reached ${milestone.verified} verified`,
    body: `+${formatPointsCount(milestone.points)} bonus ${milestone.points === 1 ? 'point' : 'points'}. Your level is now ${formatMultiplier(view.multiplier)}.`,
    points: milestone.points,
  };
}

/** What a person sends along with the card: the link, written out. */
export const CARD_LINE = 'Join me on Who Made This? and get paid for what you know.';

/** The file the card is written to before it goes to the share sheet. */
export const CARD_FILE = 'invite-card.png';

/** The code in a `wawu/r/<code>` link, or what was typed after it; null when it is not one a code can be. */
export function codeFromLink(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let text = raw.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    return null;
  }
  const code = text.replace(/^.*\/r\//i, '').replace(/^\/+|\/+$/g, '');
  return /^[A-Za-z0-9_-]{1,80}$/.test(code) ? code : null;
}
