import type { Href } from 'expo-router';

import type { IconTileTone } from '@/components/IconTile';
import type { IconName } from '@/components/icon';
import { paidThreadHref } from '@/features/paid-answers/routes';
import { routeForPush } from '@/features/push/routes';
import { rowTime } from '@/features/wallet/history/lagosTime';

import type { FeedCategory, FeedItem } from './api';

/** The chips, in the board's order. */
export const CHIPS: { value: FeedCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'money', label: 'Money' },
  { value: 'messages', label: 'Messages' },
  { value: 'content', label: 'Content' },
];

/** The glyph in each row's circle, by the Hub's kind. A kind this table does not know (the Hub may add one) wears a bell. */
const ICONS: Record<string, IconName> = {
  sale: 'ShoppingBag',
  tip_received: 'ArrowDownLeft',
  pass_sold: 'Users',
  question_answered: 'MessageCircle',
  question_credit: 'RotateCcw',
  money_in: 'ArrowDownLeft',
  money_in_reversed: 'RotateCcw',
  dm_refunded: 'RotateCcw',
  dm_received: 'MessageCircle',
  dm_deadline: 'Clock',
  paid_dm_warning: 'TriangleAlert',
  paid_dm_paused: 'Pause',
  credits_low: 'Coins',
  content_published: 'CircleCheck',
  content_rejected: 'CircleX',
  review_received: 'Star',
  new_follower: 'UserPlus',
  kyc_verified: 'BadgeCheck',
  verify_reminder: 'BadgeCheck',
  identity_review: 'ShieldCheck',
  legal_delivered: 'FileText',
  legal_quote_ready: 'FileText',
  legal_consultant_joined: 'FileText',
  legal_consultation_booked: 'FileText',
  tgif_daily: 'BookOpen',
  wallet_ready: 'Wallet',
  community_join_approved: 'Users',
  community_join_declined: 'Users',
  community_messages: 'MessageCircle',
};

export const iconOf = (kind: string): IconName => ICONS[kind] ?? 'Bell';

/** The Hub's tone for a row, in the circle's colours. */
const TONES: Record<string, IconTileTone> = { success: 'in', accent: 'accent', danger: 'danger', warning: 'warn', info: 'accent', neutral: 'neutral' };

/** M31 draws a new follower in the accent colour, where the Hub's own tone for it is neutral. */
export const toneOf = (item: Pick<FeedItem, 'kind' | 'tone'>): IconTileTone => (item.kind === 'new_follower' ? 'accent' : (TONES[item.tone] ?? 'neutral'));

/** When it happened, as M31 writes it: "10:48" today, "Yest.", "Mon" within the week, then "22 Sep" (Lagos time). */
export function whenOf(createdAt: string, now: Date): string {
  const when = rowTime(createdAt, now);
  return when === 'Yesterday' ? 'Yest.' : when;
}

const NOTIFICATION_LIST = '/notifications';

/** For a kind the Hub adds after this build: the built screen that shows what its category is about. */
const CATEGORY_SCREEN: Record<string, Href> = { money: '/transactions', messages: '/inbox', content: '/library' };

/**
 * What opening a row opens (FIX-102): the screen the notification is about, from the same map a pushed one uses
 * (`routeForPush`). A paid question opens the asker's conversation (I10) when the Hub names who asked; a push carries no
 * asker, so it opens the Inbox. A row that has nothing to open (an announcement with no button, or a kind this build has
 * not met whose category and target name no screen) is `null`: it is already on the list that holds it.
 */
export function routeOf(item: Pick<FeedItem, 'kind' | 'target'> & { actionHref?: string | null; category?: string; actor?: Pick<NonNullable<FeedItem['actor']>, 'wawuId'> | null }): Href | null {
  const target = item.target;
  if ((item.kind === 'dm_received' || item.kind === 'dm_deadline') && item.actor?.wawuId) {
    return paidThreadHref(item.actor.wawuId, target?.kind === 'paid_question' ? target.id : undefined);
  }
  const href = routeForPush({ kind: item.kind, actionHref: item.actionHref ?? undefined, target: target ? { kind: target.kind, id: target.id } : undefined });
  if (href !== NOTIFICATION_LIST) return href;
  // The push map's last resort is this very list. A row that reaches it by kind opens the closest screen for its category.
  return item.category ? (CATEGORY_SCREEN[item.category] ?? null) : null;
}

/** The button M31 draws under a row, for the rows whose screen is built: "See why" on a piece sent back, "Top up" on low credits, "Reply" on a paid question. */
export type RowAction = { label: string; kind: 'route'; href: Href } | { label: string; kind: 'top-up' };

export function actionOf(item: Pick<FeedItem, 'kind' | 'target'> & { actor?: Pick<NonNullable<FeedItem['actor']>, 'wawuId'> | null }): RowAction | null {
  if (item.kind === 'content_rejected' && item.target?.kind === 'content') {
    const href = routeOf(item);
    return href ? { label: 'See why', kind: 'route', href } : null;
  }
  if (item.kind === 'credits_low') return { label: 'Top up', kind: 'top-up' };
  // A paid question waiting on the creator (INBOX-18): Reply opens the asker's conversation (I10), when the Hub names who asked.
  if ((item.kind === 'dm_received' || item.kind === 'dm_deadline') && item.actor?.wawuId) {
    return { label: 'Reply', kind: 'route', href: paidThreadHref(item.actor.wawuId, item.target?.kind === 'paid_question' ? item.target.id : undefined) };
  }
  return null;
}

/** M32: nothing in the list at all. */
export const CAUGHT_UP = { title: "You're all caught up", message: 'Sales, tips, paid questions and reviews show up here.' } as const;
