import type { Href } from 'expo-router';

/**
 * Where a tap on a pushed notification goes (INBOX-21). The Hub's push carries
 * `data: { notificationId, kind, actionHref?, target?: { kind, id } }` (backend
 * `src/push/push-message.ts`). The route comes from `kind` and `target` only:
 * `actionHref` is a web path and is never followed, so a push cannot send the
 * app anywhere this map does not list.
 *
 * The map holds the screens that exist today. A task that builds a screen a
 * notification is about adds its row here (docs/WORKFLOW.md section 7, "Links
 * between screens"). A kind with no row opens the app where it is:
 *   - new_follower: the other person's profile (ME-02)
 *   - content_published, content_rejected, review_received: a piece of content (ME-07 and the content screens)
 *   - dm_received, dm_deadline: the paid question itself (INBOX-18); today the Inbox, where the question is listed
 */
export type PushTap = { kind?: unknown; target?: unknown };

/** An id the Hub made: letters, digits and dashes only, so it can sit in a path. */
const SAFE_ID = /^[A-Za-z0-9-]{1,64}$/;

function targetOf(data: PushTap, kind: string): string | null {
  const target = data.target;
  if (typeof target !== 'object' || target === null) return null;
  const { kind: targetKind, id } = target as { kind?: unknown; id?: unknown };
  return targetKind === kind && typeof id === 'string' && SAFE_ID.test(id) ? id : null;
}

/** The screen a pushed notification opens, or null when it has no screen of its own. */
export function routeForPush(raw: unknown): Href | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as PushTap;
  switch (data.kind) {
    case 'community_join_approved':
    case 'community_join_declined': {
      const id = targetOf(data, 'community');
      return id ? { pathname: '/community/[id]', params: { id } } : null;
    }
    case 'sale':
    case 'tip_received':
    case 'dm_refunded':
      return '/wallet';
    case 'dm_received':
    case 'dm_deadline':
      return '/inbox';
    default:
      return null;
  }
}
