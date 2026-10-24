import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { inviteLink } from '@/lib/appLinks';

/**
 * The Invite and earn calls (REF-03, RF1 to RF4), as the Hub's contract types them (REF-02, G-802):
 * - `GET /me/referrals`: the link and code, brought, verified and pending people, the points earned and held apart,
 *   the level and its ladder, the milestones, the hold days and the newest rewards. Every figure on RF1 to RF4 is read
 *   from this one answer; nothing on those screens is typed here.
 * - `POST /me/referrals/claim`: uses someone's code, once, in the first days. Nothing on screen draws it (G-812): a
 *   `https://wawuafrica.com/r/<code>` link opened in the app sends the code here after sign-in (`pendingCode.ts`).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11),
 * so each call reads `data` itself.
 */
type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export type MyReferrals = components['schemas']['MyReferralsView'];
export type ReferralReward = components['schemas']['ReferralRewardView'];
export type ReferralMilestone = components['schemas']['ReferralMilestoneView'];
export type LadderStep = components['schemas']['ReferralLadderStepView'];
export type NextMilestone = components['schemas']['ReferralNextMilestoneView'];

/** The Hub leaves the next milestone out (null) once every one is reached; the generated type does not say so. */
export type Referrals = Omit<MyReferrals, 'nextMilestone'> & { nextMilestone: NextMilestone | null };

export const referralsKey = ['referrals', 'mine'] as const;

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your referrals could not be read. Try again.');
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** The answer, or a refusal to draw a half-read one: every figure the screens print is checked to be a number first. */
export async function fetchReferrals(): Promise<Referrals> {
  const body = (await unwrap(api.GET('/api/hub/me/referrals'))) as unknown as Envelope<Referrals>;
  const view = body?.data;
  if (
    !view ||
    typeof view !== 'object' ||
    typeof view.link !== 'string' ||
    typeof view.code !== 'string' ||
    !isCount(view.brought) ||
    !isCount(view.verified) ||
    !isCount(view.pending) ||
    !isCount(view.pointsEarned) ||
    !isCount(view.pendingPoints) ||
    !isCount(view.multiplier) ||
    !isCount(view.holdDays) ||
    !Array.isArray(view.ladder) ||
    !Array.isArray(view.milestones) ||
    !Array.isArray(view.rewards)
  ) {
    throw unreadable();
  }
  // LINKS-01: the link a person shares is the website's app link, `https://wawuafrica.com/r/<code>`; the Hub's own
  // `link` (`wawu/r/<code>`, no scheme) is a string no chat app makes tappable.
  return { ...view, link: inviteLink(view.code) };
}

/** Uses a code (or the link it came in). The Hub answers the code in capitals and when it was claimed. */
export async function claimReferral(code: string): Promise<{ code: string; claimedAt: string }> {
  const body = (await unwrap(api.POST('/api/hub/me/referrals/claim', { body: { code } }))) as unknown as Envelope<{ code: string; claimedAt: string }>;
  const claimed = body?.data;
  if (!claimed || typeof claimed.code !== 'string') throw unreadable();
  return claimed;
}
