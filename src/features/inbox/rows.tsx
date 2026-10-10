import type { ReactElement } from 'react';

import { CommunityInboxRow } from '@/features/communities/CommunityInboxRow';

import type { InboxItem, InboxKind, InboxUnread } from './api';

/**
 * How each kind of inbox row is drawn. A kind is drawn by the task that builds the screen its row opens
 * (docs/WORKFLOW.md section 7), which adds its renderer here, as drawn:
 *   chat: INBOX-19 (opens the chat), paid_dm: INBOX-10 and INBOX-18, community: INBOX-05.
 * Until a kind has a renderer its rows are not drawn (R-47): a row with nowhere to go would be a dead button.
 * What is drawn decides what is counted: the tab's badge adds up only the rows that are drawn (`drawnUnread`),
 * and an inbox whose rows are all undrawn shows the same empty state as an inbox with none. The list's order
 * and its paging do not depend on it.
 */
export type InboxRowRenderer = (item: InboxItem) => ReactElement;
export type InboxRowRenderers = Partial<Record<InboxKind, InboxRowRenderer>>;

export const inboxRowRenderers: InboxRowRenderers = {
  community: (item) => <CommunityInboxRow item={item} />,
};

/** The rows of `items` that have a renderer, in the server's order. */
export function drawableRows(items: readonly InboxItem[], renderers: InboxRowRenderers): InboxItem[] {
  return items.filter((item) => renderers[item.kind] !== undefined);
}

/** Which of the Hub's unread counts belongs to which kind of row. */
const unreadField = { chat: 'chats', paid_dm: 'paidDms', community: 'communities' } as const satisfies Record<InboxKind, keyof InboxUnread>;

/**
 * The Inbox tab's badge: the unread count of the kinds of row that are drawn, never the Hub's `total`
 * (which also counts rows nobody can see yet). It grows by itself when a task adds a renderer.
 */
export function drawnUnread(unread: InboxUnread, renderers: InboxRowRenderers = inboxRowRenderers): number {
  return (Object.keys(unreadField) as InboxKind[]).reduce(
    (sum, kind) => (renderers[kind] === undefined ? sum : sum + (Number(unread[unreadField[kind]]) || 0)),
    0,
  );
}
