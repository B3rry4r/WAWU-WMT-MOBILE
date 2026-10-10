import type { InboxUnread } from '../api';
import { drawableRows, drawnUnread, type InboxRowRenderers } from '../rows';

const unread = (over: Partial<InboxUnread> = {}): InboxUnread => ({ total: 9, chats: 2, paidDms: 3, communities: 4, ...over });
const draw = (...kinds: ('chat' | 'paid_dm' | 'community')[]): InboxRowRenderers =>
  Object.fromEntries(kinds.map((kind) => [kind, () => null as never]));

describe('what the Inbox badge counts (R-47)', () => {
  it('counts nothing while no kind of row is drawn, whatever the Hub reports', () => {
    expect(drawnUnread(unread(), {})).toBe(0);
    expect(drawnUnread(unread({ total: 1_000, chats: 1_000 }), {})).toBe(0);
  });

  it('counts only the kinds that are drawn', () => {
    expect(drawnUnread(unread(), draw('chat'))).toBe(2);
    expect(drawnUnread(unread(), draw('paid_dm'))).toBe(3);
    expect(drawnUnread(unread(), draw('community'))).toBe(4);
    expect(drawnUnread(unread(), draw('chat', 'community'))).toBe(6);
  });

  it('counts every kind once all are drawn, which is the Hub total', () => {
    expect(drawnUnread(unread(), draw('chat', 'paid_dm', 'community'))).toBe(9);
  });

  it('takes a count the Hub did not send as none', () => {
    expect(drawnUnread({ total: 5 } as InboxUnread, draw('chat'))).toBe(0);
  });
});

describe('which rows are drawn', () => {
  it('keeps the Hub order and drops the kinds without a renderer', () => {
    const item = (id: string, kind: 'chat' | 'paid_dm' | 'community') => ({ id, kind }) as Parameters<typeof drawableRows>[0][number];
    const rows = [item('a', 'community'), item('b', 'chat'), item('c', 'paid_dm'), item('d', 'chat')];
    expect(drawableRows(rows, draw('chat')).map((r) => r.id)).toEqual(['b', 'd']);
    expect(drawableRows(rows, {})).toEqual([]);
  });
});
