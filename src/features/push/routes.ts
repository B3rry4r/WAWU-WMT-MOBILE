import type { Href } from 'expo-router';

/**
 * Where a tap on a notification goes, in the list (M31) and on a pushed one (INBOX-21, FIX-102). One map serves both:
 * `routeOf` in `features/notifications/model.ts` calls this, so a row and its push open the same screen.
 *
 * The Hub's push carries `data: { notificationId, kind, actionHref?, target?: { kind, id } }` (backend
 * `src/push/push-message.ts`) and a list row carries the same `kind`, `target` and `actionHref`. The route comes from
 * `kind` and `target` first. `actionHref` is a web path and is never followed as a path: it is read only against a
 * fixed table of the paths the Hub can send (`CAMPAIGN_ROUTES`, the room and legal-matter shapes), and the app's own
 * route is built from that, so a notification cannot send the app anywhere this file does not list.
 *
 * Every kind the Hub writes opens a screen (`HUB_NOTIFICATION_KINDS`, a test walks them all). Where a kind's own screen
 * is not built, or the Hub named no target (the thing was deleted, or the kind names none), it opens the closest built
 * screen that shows what happened, never nothing. The table is `tasks/FIX-102.md`.
 *
 * A kind this map does not know (the Hub may add one) opens the screen its target names; a pushed one with no target opens
 * the notification list, where it is.
 */
export type PushTap = { kind?: unknown; target?: unknown; actionHref?: unknown };

/** An id the Hub made: letters, digits and dashes only, so it can sit in a path. */
const SAFE_ID = /^[A-Za-z0-9-]{1,64}$/;

/** A day the Hub names, YYYY-MM-DD. The reader checks it is a real day near today. */
const TGIF_DAY = /^\d{4}-\d{2}-\d{2}$/;

function targetOf(data: PushTap, kind: string): string | null {
  const target = data.target;
  if (typeof target !== 'object' || target === null) return null;
  const { kind: targetKind, id } = target as { kind?: unknown; id?: unknown };
  return targetKind === kind && typeof id === 'string' && SAFE_ID.test(id) ? id : null;
}

/** The web paths a campaign can name (backend `campaign-destination.ts`), each with the app's screen for it. `null`: the notification list itself. */
const CAMPAIGN_ROUTES: Record<string, Href | null> = {
  '/home': '/',
  '/explore': '/explore',
  '/events': '/events',
  '/learn': '/schools',
  '/services': '/professionals',
  '/communities': '/explore',
  '/professionals': '/professionals',
  '/profile/verification': '/tiers',
  '/create': '/create',
  '/notifications': null,
};

/** The two path shapes the Hub builds from an id it made: a room (`/communities/<id>`) and a legal matter (`/legal/requests/<id>`). */
const ROOM_PATH = /^\/communities\/([A-Za-z0-9-]{1,64})$/;
const MATTER_PATH = /^\/legal\/requests\/([A-Za-z0-9-]{1,64})$/;

/** The app screen for a web path the Hub sent, from the fixed table above; anything else is no route. */
function routeForAction(actionHref: unknown): Href | null {
  if (typeof actionHref !== 'string') return null;
  if (Object.prototype.hasOwnProperty.call(CAMPAIGN_ROUTES, actionHref)) return CAMPAIGN_ROUTES[actionHref];
  const room = ROOM_PATH.exec(actionHref);
  if (room) return { pathname: '/community/[id]', params: { id: room[1] } };
  const matter = MATTER_PATH.exec(actionHref);
  if (matter) return { pathname: '/legal-matter', params: { id: matter[1] } };
  return null;
}

/** The screen a target names, for the kinds that are about one thing and for a kind this map has not met. */
function routeForTarget(data: PushTap): Href | null {
  const content = targetOf(data, 'content');
  if (content) return { pathname: '/content/[id]', params: { id: content } };
  const profile = targetOf(data, 'profile');
  if (profile) return { pathname: '/profile/[wawuId]', params: { wawuId: profile } };
  const room = targetOf(data, 'community');
  if (room) return { pathname: '/community/[id]', params: { id: room } };
  const transaction = targetOf(data, 'transaction');
  if (transaction) return { pathname: '/transactions/[id]', params: { id: transaction } };
  if (targetOf(data, 'paid_question')) return '/inbox';
  const day = targetOf(data, 'tgif_day');
  if (day) return TGIF_DAY.test(day) ? { pathname: '/tgif', params: { date: day } } : '/tgif';
  return null;
}

/** The screen a tapped notification opens, or null when the data is not a notification at all. */
export function routeForPush(raw: unknown): Href | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as PushTap;
  switch (data.kind) {
    // A sale or a tip: the earnings screen (W39), which the Hub's own button "View earnings" names, and which a creator with no wallet yet can read too (R-11).
    case 'sale':
    case 'tip_received':
      return '/earnings';
    // A paid question: the Inbox lists it. The list row opens the asker's conversation itself when the Hub names who asked (`routeOf`).
    case 'dm_received':
    case 'dm_deadline':
      return '/inbox';
    // Paid messages warned or switched off: I22 and I23 are the warned and switched-off moments of the paid message settings (I21).
    case 'paid_dm_warning':
    case 'paid_dm_paused':
      return '/paid-message-settings';
    // The refund of a paid question lands in the wallet.
    case 'dm_refunded':
    case 'wallet_ready':
      return '/wallet';
    // Credits are bought inside a room (the Top up button on the list row opens the sheet itself); the rooms are the Inbox's Communities chip.
    case 'credits_low':
      return '/inbox';
    // Money in and its correction: the receipt of that movement (W27), or the history when the Hub names none.
    case 'money_in':
    case 'money_in_reversed': {
      const id = targetOf(data, 'transaction');
      return id ? { pathname: '/transactions/[id]', params: { id } } : '/transactions';
    }
    // A pass refund pays money in with no ledger row named: the history is where it shows.
    case 'community_pass_refunded':
      return '/transactions';
    // The follower's profile (ME-02); the Me tab (which counts followers) when the Hub names none.
    case 'new_follower': {
      const id = targetOf(data, 'profile');
      return id ? { pathname: '/profile/[wawuId]', params: { wawuId: id } } : '/me';
    }
    case 'content_published':
    case 'review_received': {
      const id = targetOf(data, 'content');
      return id ? { pathname: '/content/[id]', params: { id } } : '/library';
    }
    case 'content_rejected': {
      const id = targetOf(data, 'content');
      return id ? { pathname: '/library/[id]', params: { id } } : '/library';
    }
    // The manual identity check (M15 to M17).
    case 'kyc_verified':
      return '/verification';
    // The reminder to get a tick: where ticks are bought (VF5).
    case 'verify_reminder':
      return '/tiers';
    // The wallet identity check ended: Open your wallet resumes where the review stands (approved, or refused with what to fix).
    case 'identity_review':
      return '/open-wallet';
    case 'community_join_approved': {
      const id = targetOf(data, 'community');
      return id ? { pathname: '/community/[id]', params: { id } } : (routeForAction(data.actionHref) ?? '/inbox');
    }
    // A declined request names no room: the rooms are the Inbox's Communities chip.
    case 'community_join_declined':
      return '/inbox';
    // FIX-105 (R-81): new messages in a room the person joined, one grouped notice per room. It opens that room; with no
    // room named (the room was deleted) it opens the Inbox, where the rooms are the Communities chip.
    case 'community_messages': {
      const id = targetOf(data, 'community');
      return id ? { pathname: '/community/[id]', params: { id } } : (routeForAction(data.actionHref) ?? '/inbox');
    }
    case 'community_pass_ending': {
      // INBOX-14 (R-63): the reminder 3 days before a pass ends opens that room's pass, where one tap renews it.
      const id = targetOf(data, 'community');
      return id ? { pathname: '/community/pass/[id]', params: { id } } : '/inbox';
    }
    // The documents are in the matter: its id rides in the Hub's path (`/legal/requests/<id>`); without it, Legal.
    case 'legal_delivered':
      return routeForAction(data.actionHref) ?? '/legal';
    case 'tgif_daily': {
      // HOME-16: the morning TGIF notice opens the reader on the day it was made for. A
      // notice with no day (or a day that is not a safe date) opens today's reader.
      const day = targetOf(data, 'tgif_day');
      return day && TGIF_DAY.test(day) ? { pathname: '/tgif', params: { date: day } } : '/tgif';
    }
    // An announcement goes where its button says, from the fixed table; one with no place opens the list it is in.
    case 'campaign':
      return routeForAction(data.actionHref) ?? '/notifications';
    default:
      // A kind the Hub added after this build: the screen its target names, else the list that holds it.
      return typeof data.kind === 'string' ? (routeForTarget(data) ?? '/notifications') : null;
  }
}
