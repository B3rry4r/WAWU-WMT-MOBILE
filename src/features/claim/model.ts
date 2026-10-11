import { dateLine } from '@/features/events/format';

import type { ClaimResult } from './api';

/** An access code is 8 characters: the digits 0 to 9 and the letters A to F, shown as two groups of four ("5F6C 15E4"). */
export const CODE_LENGTH = 8;
const GROUP = 4;

/** What a person types or pastes, as the field shows it: letters and numbers only, upper case, "XXXX XXXX". */
export function formatCode(raw: string): string {
  const compact = raw.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, CODE_LENGTH);
  return compact.length > GROUP ? `${compact.slice(0, GROUP)} ${compact.slice(GROUP)}` : compact;
}

/** The code with the space taken out, as it is sent. */
export const compactCode = (shown: string) => shown.replace(/\s/g, '');

export type CodeProblem = 'empty' | 'short' | 'letters';

/** The field's own check before anything is sent. */
export function codeProblem(shown: string): CodeProblem | null {
  const compact = compactCode(shown);
  if (compact.length === 0) return 'empty';
  if (compact.length < CODE_LENGTH) return 'short';
  return /^[0-9A-F]{8}$/.test(compact) ? null : 'letters';
}

export const CODE_PROBLEM_WORDS: Record<CodeProblem, string> = {
  empty: 'Enter your access code.',
  short: 'Type all 8 letters and numbers of your access code.',
  letters: 'An access code only has the numbers 0 to 9 and the letters A to F.',
};

export type PlanLine = { label: string; value: string };

/**
 * Where the Hub's answer stands against the clock (JOIN-03 round 3, D4). The same answer is shown for the claim itself and
 * for a repeat of the code (the first answer is replayed with the plan as it is now), so the words cannot assume "today":
 *  - `fresh`: the code was claimed today and the plan is in force. "Your plan is ready", "starting today".
 *  - `running`: claimed on an earlier day, the plan still in force. It says when the plan started, never "starting today".
 *  - `ended`: the plan is over (or the account holds none now). It says the plan ended, never "ready" beside a past end.
 * The plan's state is the Hub's (`tier.state`, read fresh on a repeat); only "today" is the phone's, and it is read in the
 * same zone the dates on this screen are drawn in, so "starting today" never sits beside another day's date.
 */
export type ClaimStanding = 'fresh' | 'running' | 'ended';

const sameDay = (iso: string, now: number) => dateLine(iso, undefined, now) === dateLine(new Date(now).toISOString(), undefined, now);

export function claimStanding(result: ClaimResult, now: number = Date.now()): ClaimStanding {
  const { state } = result.tier;
  if (state === 'ended' || state === 'none') return 'ended';
  return sameDay(result.claimedAt, now) ? 'fresh' : 'running';
}

/** The big line of the answer. */
export function claimHeading(result: ClaimResult, now: number = Date.now()): string {
  const standing = claimStanding(result, now);
  return standing === 'fresh' ? 'Your plan is ready' : standing === 'running' ? 'Your plan is active' : 'Your plan has ended';
}

/**
 * What the code gave, from the Hub's own answer: the plan, the day it ends and the points added. Only what the Hub
 * granted AND the app puts to use today (JOIN-03 round 2, N2): the products the plan allows, the event pass and the first
 * Voice Intro are the Hub's grants too, but the screens that spend them are not built and the publishing limit the app
 * enforces is still the flat one, so none of them is listed (R-47: nothing is promised that the app does not do). When
 * those tasks land (TIER-02 to TIER-05, the points tools, Voice Intro) their lines come back with them. Nothing here is
 * worked out on the phone; a line is left out when the Hub sent nothing for it. The same lines for a repeat of the code;
 * a date that is already past is labelled as ended, never as "Runs until" or "last until" (round 3, D4).
 */
export function planLines(result: ClaimResult, now: number = Date.now()): PlanLine[] {
  const { tier } = result;
  const ended = claimStanding(result, now) === 'ended';
  const lines: PlanLine[] = [];
  if (tier.tier?.name) lines.push({ label: 'Plan', value: tier.tier.name });
  if (tier.activeUntil) {
    const label = ended ? 'Ended' : result.extended ? 'Now runs until' : 'Runs until';
    lines.push({ label, value: dateLine(tier.activeUntil, undefined, now) });
  }
  if (result.pointsGranted > 0) {
    lines.push({ label: 'Points added', value: String(result.pointsGranted) });
    if (result.pointsExpireAt) {
      const over = Date.parse(result.pointsExpireAt) <= now;
      lines.push({ label: over ? 'Points ended' : 'Points last until', value: dateLine(result.pointsExpireAt, undefined, now) });
    }
  }
  return lines;
}

/** The line under the heading. Only "starting today" when the code was claimed today (round 3, D4). */
export function readyLine(result: ClaimResult, now: number = Date.now()): string {
  const standing = claimStanding(result, now);
  const name = result.tier.tier?.name;
  const days = `${result.days} ${result.days === 1 ? 'day' : 'days'}`;
  const claimedOn = dateLine(result.claimedAt, undefined, now);
  if (standing === 'ended') {
    const until = result.tier.activeUntil;
    return until ? `${name ?? 'Your plan'} ended on ${dateLine(until, undefined, now)}.` : `You claimed this code on ${claimedOn}.`;
  }
  if (standing === 'running') return result.extended ? `${days} were added to your plan on ${claimedOn}.` : `${name ?? 'Your plan'} started on ${claimedOn}.`;
  return result.extended ? `${days} were added to the plan you already have.` : `${name ?? 'Your plan'} for ${days}, starting today.`;
}
