import { existsSync } from 'fs';
import { join } from 'path';

import { routeForPush } from '@/features/push/routes';

import { HUB_NOTIFICATION_KINDS, type HubNotificationKind } from '../kinds';
import { routeOf } from '../model';

/*
 * FIX-102: tapping a notification opened nothing except TGIF. Every kind the Hub writes opens a screen, in the list and
 * from a push, and the screen is one the route graph has.
 */

type Target = { kind: 'content' | 'transaction' | 'paid_question' | 'community' | 'profile' | 'tgif_day' | 'ai_job'; id: string };
type Sample = { target: Target | null; actionHref?: string; actor?: { wawuId: string } };

/** What the Hub writes beside each kind (backend `targetFor` and the emit sites), with the in-app path it carries when it carries one. */
const AS_SENT: Record<HubNotificationKind, Sample> = {
  sale: { target: { kind: 'content', id: 'c1' }, actor: { wawuId: 'WAWU-1' } },
  tip_received: { target: { kind: 'profile', id: 'WAWU-1' }, actor: { wawuId: 'WAWU-1' } },
  dm_received: { target: { kind: 'paid_question', id: 'q1' }, actor: { wawuId: 'WAWU-1' } },
  dm_deadline: { target: { kind: 'paid_question', id: 'q1' }, actor: { wawuId: 'WAWU-1' } },
  dm_refunded: { target: { kind: 'paid_question', id: 'q1' } },
  paid_dm_warning: { target: null },
  paid_dm_paused: { target: null },
  credits_low: { target: null },
  new_follower: { target: { kind: 'profile', id: 'WAWU-1' }, actor: { wawuId: 'WAWU-1' } },
  content_published: { target: { kind: 'content', id: 'c1' } },
  content_rejected: { target: { kind: 'content', id: 'c1' } },
  review_received: { target: { kind: 'content', id: 'c1' }, actor: { wawuId: 'WAWU-1' } },
  kyc_verified: { target: null },
  verify_reminder: { target: null, actionHref: '/profile/verification' },
  identity_review: { target: null },
  campaign: { target: null, actionHref: '/explore' },
  community_join_approved: { target: { kind: 'community', id: 'r1' }, actionHref: '/communities/r1' },
  community_join_declined: { target: null },
  community_pass_ending: { target: { kind: 'community', id: 'r1' } },
  community_pass_refunded: { target: null },
  community_messages: { target: { kind: 'community', id: 'r1' }, actionHref: '/communities/r1' },
  legal_delivered: { target: null, actionHref: '/legal/requests/m1' },
  legal_quote_ready: { target: null, actionHref: '/legal/requests/m1' },
  legal_consultant_joined: { target: null, actionHref: '/legal/requests/m1' },
  legal_consultation_booked: { target: null, actionHref: '/legal/requests/m1' },
  tgif_daily: { target: { kind: 'tgif_day', id: '2026-10-23' } },
  money_in: { target: { kind: 'transaction', id: 't1' } },
  money_in_reversed: { target: { kind: 'transaction', id: 't1' } },
  wallet_ready: { target: null },
  pass_sold: { target: null },
  question_answered: { target: null },
  question_credit: { target: null },
  ai_job_ready: { target: { kind: 'ai_job', id: 'j1' } },
};

const feedItem = (kind: string, sample: Sample) => ({
  kind,
  category: 'other',
  actionHref: sample.actionHref ?? null,
  actor: sample.actor ?? null,
  // The Hub resolves a target for the five kinds the contract lists; a TGIF day is not one of them, so its row has none (the push carries the day).
  target: sample.target && sample.target.kind !== 'tgif_day' ? { ...sample.target, kind: sample.target.kind, title: null, deadlineAt: null } : null,
});

const pushData = (kind: string, sample: Sample) => ({
  notificationId: 'n1',
  kind,
  ...(sample.actionHref ? { actionHref: sample.actionHref } : {}),
  ...(sample.target ? { target: sample.target } : {}),
});

/** The route file a screen is served from, in `src/app` (a tab sits under `(tabs)`, the root is the Home tab). */
function screenExists(href: unknown): boolean {
  const pathname = typeof href === 'string' ? href : (href as { pathname: string }).pathname;
  const app = join(__dirname, '..', '..', '..', 'app');
  if (pathname === '/') return existsSync(join(app, '(tabs)', 'index.tsx'));
  return [`${pathname}.tsx`, `${pathname}/index.tsx`, `(tabs)${pathname}.tsx`, `(tabs)${pathname}/index.tsx`].some((file) => existsSync(join(app, file)));
}

describe('every kind the Hub writes opens a screen (FIX-102)', () => {
  it('names a sample for every kind in the list, and lists each kind once', () => {
    expect(Object.keys(AS_SENT).sort()).toEqual([...HUB_NOTIFICATION_KINDS].sort());
    expect(new Set(HUB_NOTIFICATION_KINDS).size).toBe(HUB_NOTIFICATION_KINDS.length);
  });

  it.each(HUB_NOTIFICATION_KINDS)('%s opens a screen from the list, as the Hub sends it', (kind) => {
    const href = routeOf(feedItem(kind, AS_SENT[kind]));
    expect(href).not.toBeNull();
    expect(screenExists(href)).toBe(true);
  });

  it.each(HUB_NOTIFICATION_KINDS)('%s opens a screen from a push, as the Hub sends it', (kind) => {
    const href = routeForPush(pushData(kind, AS_SENT[kind]));
    expect(href).not.toBeNull();
    expect(screenExists(href)).toBe(true);
  });

  it.each(HUB_NOTIFICATION_KINDS)('%s still opens a screen when the Hub names no target (the thing was deleted)', (kind) => {
    const bare = { target: null, ...(AS_SENT[kind].actionHref ? { actionHref: AS_SENT[kind].actionHref } : {}) };
    const fromPush = routeForPush(pushData(kind, bare));
    expect(fromPush).not.toBeNull();
    expect(screenExists(fromPush)).toBe(true);
    const fromList = routeOf(feedItem(kind, bare));
    expect(fromList).not.toBeNull();
    expect(screenExists(fromList)).toBe(true);
  });

  it('opens the same screen from a row and from its push, except where the row knows more (a paid question names its asker, a TGIF notice its day)', () => {
    for (const kind of HUB_NOTIFICATION_KINDS) {
      // A TGIF day is not resolved into the row's target, so the row opens today's reader and the push opens its own day.
      if (kind === 'dm_received' || kind === 'dm_deadline' || kind === 'tgif_daily') continue;
      expect(routeOf(feedItem(kind, AS_SENT[kind]))).toEqual(routeForPush(pushData(kind, AS_SENT[kind])));
    }
  });
});
