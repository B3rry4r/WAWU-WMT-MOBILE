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
 * What the code gave, from the Hub's own answer: the plan, the day it ends and the points added. Only what the Hub
 * granted AND the app puts to use today (JOIN-03 round 2, N2): the products the plan allows, the event pass and the first
 * Voice Intro are the Hub's grants too, but the screens that spend them are not built and the publishing limit the app
 * enforces is still the flat one, so none of them is listed (R-47: nothing is promised that the app does not do). When
 * those tasks land (TIER-02 to TIER-05, the points tools, Voice Intro) their lines come back with them. Nothing here is
 * worked out on the phone; a line is left out when the Hub sent nothing for it.
 */
export function planLines(result: ClaimResult, now: number = Date.now()): PlanLine[] {
  const { tier } = result;
  const lines: PlanLine[] = [];
  if (tier.tier?.name) lines.push({ label: 'Plan', value: tier.tier.name });
  if (tier.activeUntil) lines.push({ label: result.extended ? 'Now runs until' : 'Runs until', value: dateLine(tier.activeUntil, undefined, now) });
  if (result.pointsGranted > 0) {
    lines.push({ label: 'Points added', value: String(result.pointsGranted) });
    if (result.pointsExpireAt) lines.push({ label: 'Points last until', value: dateLine(result.pointsExpireAt, undefined, now) });
  }
  return lines;
}

/** The line under "Your plan is ready". */
export function readyLine(result: ClaimResult): string {
  const days = `${result.days} ${result.days === 1 ? 'day' : 'days'}`;
  return result.extended
    ? `${days} were added to the plan you already have.`
    : `${result.tier.tier?.name ?? 'Your plan'} for ${days}, starting today.`;
}
