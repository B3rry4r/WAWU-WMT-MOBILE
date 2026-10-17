import type { Href } from 'expo-router';

import type { IconTileTone } from '@/components/IconTile';
import type { IconName } from '@/components/icon';
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
  tgif_daily: 'BookOpen',
  wallet_ready: 'Wallet',
  community_join_approved: 'Users',
  community_join_declined: 'Users',
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

/** What opening a row opens: a screen of the app, or nothing when none is built for what it is about. */
export function routeOf(item: Pick<FeedItem, 'kind' | 'target'>): Href | null {
  const target = item.target;
  if (item.kind === 'content_rejected' && target?.kind === 'content') return { pathname: '/library/[id]', params: { id: target.id } };
  if ((item.kind === 'money_in' || item.kind === 'money_in_reversed') && target?.kind === 'transaction') return { pathname: '/transactions/[id]', params: { id: target.id } };
  return routeForPush({ kind: item.kind, target: target ? { kind: target.kind, id: target.id } : undefined });
}

/** The button M31 draws under a row, for the rows whose screen is built: "See why" on a piece sent back, "Top up" on low credits. */
export type RowAction = { label: string; kind: 'route'; href: Href } | { label: string; kind: 'top-up' };

export function actionOf(item: Pick<FeedItem, 'kind' | 'target'>): RowAction | null {
  if (item.kind === 'content_rejected') {
    const href = routeOf(item);
    return href ? { label: 'See why', kind: 'route', href } : null;
  }
  if (item.kind === 'credits_low') return { label: 'Top up', kind: 'top-up' };
  return null;
}

/** M32: nothing in the list at all. */
export const CAUGHT_UP = { title: "You're all caught up", message: 'Sales, tips, paid questions and reviews show up here.' } as const;
