import type { ReactElement } from 'react';

import type { InboxItem, InboxKind } from './api';

/**
 * How each kind of inbox row is drawn. A kind is drawn by the task that builds the screen its row opens
 * (docs/WORKFLOW.md section 7), which adds its renderer here, as drawn:
 *   chat: INBOX-19 (opens the chat), paid_dm: INBOX-10 and INBOX-18, community: INBOX-05.
 * Until a kind has a renderer its rows are not drawn: a row with nowhere to go would be a dead button.
 * The list, its order, its paging and the unread count do not depend on it.
 */
export type InboxRowRenderer = (item: InboxItem) => ReactElement;
export type InboxRowRenderers = Partial<Record<InboxKind, InboxRowRenderer>>;

export const inboxRowRenderers: InboxRowRenderers = {};

/** The rows of `items` that have a renderer, in the server's order. */
export function drawableRows(items: readonly InboxItem[], renderers: InboxRowRenderers): InboxItem[] {
  return items.filter((item) => renderers[item.kind] !== undefined);
}
