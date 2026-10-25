import { existsSync } from 'fs';
import { join } from 'path';

import { routeForPush } from '../routes';

const room = { kind: 'community', id: 'c0000000-0000-4000-8000-000000000001' };

describe('where a tap on a notification goes (INBOX-21)', () => {
  it('opens the room for an approved join', () => {
    expect(routeForPush({ notificationId: 'n1', kind: 'community_join_approved', target: room })).toEqual({
      pathname: '/community/[id]',
      params: { id: room.id },
    });
  });

  it('opens the room\'s pass for the reminder 3 days before it ends (INBOX-14, R-63)', () => {
    expect(routeForPush({ notificationId: 'n2', kind: 'community_pass_ending', target: room })).toEqual({
      pathname: '/community/pass/[id]',
      params: { id: room.id },
    });
    // FIX-102: a reminder with no room (or an unsafe id) opens the Inbox, where the rooms are, not the path.
    expect(routeForPush({ notificationId: 'n2', kind: 'community_pass_ending' })).toBe('/inbox');
    expect(routeForPush({ kind: 'community_pass_ending', target: { kind: 'community', id: '../wallet' } })).toBe('/inbox');
  });

  it('opens the earnings for a sale and a tip, and the wallet for a refund (FIX-102: a sale and a tip opened the wallet)', () => {
    for (const kind of ['sale', 'tip_received']) expect(routeForPush({ kind })).toBe('/earnings');
    expect(routeForPush({ kind: 'dm_refunded' })).toBe('/wallet');
  });

  it('opens the Inbox for a paid question and its deadline', () => {
    for (const kind of ['dm_received', 'dm_deadline']) expect(routeForPush({ kind, target: { kind: 'paid_question', id: 'q1' } })).toBe('/inbox');
  });

  it('opens a screen for the kinds that opened nothing (FIX-102)', () => {
    expect(routeForPush({ kind: 'new_follower', target: { kind: 'profile', id: 'p1' } })).toEqual({ pathname: '/profile/[wawuId]', params: { wawuId: 'p1' } });
    expect(routeForPush({ kind: 'content_published', target: { kind: 'content', id: 'c1' } })).toEqual({ pathname: '/content/[id]', params: { id: 'c1' } });
    expect(routeForPush({ kind: 'review_received', target: { kind: 'content', id: 'c1' } })).toEqual({ pathname: '/content/[id]', params: { id: 'c1' } });
    expect(routeForPush({ kind: 'content_rejected', target: { kind: 'content', id: 'c1' } })).toEqual({ pathname: '/library/[id]', params: { id: 'c1' } });
    expect(routeForPush({ kind: 'campaign', actionHref: '/events' })).toBe('/events');
    expect(routeForPush({ kind: 'campaign' })).toBe('/notifications');
    expect(routeForPush({ kind: 'something_new', target: { kind: 'profile', id: 'p1' } })).toEqual({ pathname: '/profile/[wawuId]', params: { wawuId: 'p1' } });
    expect(routeForPush({ kind: 'something_new' })).toBe('/notifications');
  });

  it('opens the rooms\' place for a declined join (the Hub names no room in that push, backend community.service.ts)', () => {
    expect(routeForPush({ notificationId: 'n1', kind: 'community_join_declined' })).toBe('/inbox');
  });

  it('opens the Inbox, not a room, when the room is missing, is not a room, or has an id that is not safe in a path', () => {
    const join = 'community_join_approved';
    expect(routeForPush({ kind: join })).toBe('/inbox');
    expect(routeForPush({ kind: join, target: { kind: 'profile', id: 'p1' } })).toBe('/inbox');
    expect(routeForPush({ kind: join, target: { kind: 'community', id: '../wallet' } })).toBe('/inbox');
    expect(routeForPush({ kind: join, target: { kind: 'community', id: 'a'.repeat(65) } })).toBe('/inbox');
    expect(routeForPush({ kind: join, target: { kind: 'community', id: 12 } })).toBe('/inbox');
    expect(routeForPush({ kind: join, target: 'community' })).toBe('/inbox');
  });

  it('never follows the web path the push carries: only the fixed table of paths the Hub can send is read, and the route built is the app\'s own', () => {
    expect(routeForPush({ kind: 'new_follower', actionHref: '/profile/verification' })).toBe('/me');
    expect(routeForPush({ kind: 'campaign', actionHref: 'https://evil.example/login' })).toBe('/notifications');
    expect(routeForPush({ kind: 'campaign', actionHref: '/wallet' })).toBe('/notifications');
    expect(routeForPush({ kind: 'campaign', actionHref: '/profile/verification' })).toBe('/tiers');
    expect(routeForPush({ kind: 'legal_delivered', actionHref: '/legal/requests/r-1' })).toEqual({ pathname: '/legal-matter', params: { id: 'r-1' } });
    expect(routeForPush({ kind: 'legal_delivered', actionHref: '/legal/requests/../wallet' })).toBe('/legal');
    // R2-LEGAL2: the quote notification opens the matter, where the letter is signed.
    expect(routeForPush({ kind: 'legal_quote_ready', actionHref: '/legal/requests/r-1' })).toEqual({ pathname: '/legal-matter', params: { id: 'r-1' } });
    expect(routeForPush({ kind: 'legal_quote_ready', actionHref: '/legal/requests/../wallet' })).toBe('/legal');
    for (const kind of ['legal_consultant_joined', 'legal_consultation_booked']) {
      expect(routeForPush({ kind, actionHref: '/legal/requests/r-1' })).toEqual({ pathname: '/legal-matter', params: { id: 'r-1' } });
      expect(routeForPush({ kind, actionHref: '/legal/requests/../wallet' })).toBe('/legal');
    }
    expect(routeForPush({ actionHref: '/wallet' })).toBeNull();
  });

  it('FIX-105: a grouped "new messages" notice opens that room; with no room named it opens the Inbox, and an odd id is not followed', () => {
    expect(routeForPush({ kind: 'community_messages', target: { kind: 'community', id: 'r-1' } })).toEqual({ pathname: '/community/[id]', params: { id: 'r-1' } });
    expect(routeForPush({ kind: 'community_messages', actionHref: '/communities/r-2' })).toEqual({ pathname: '/community/[id]', params: { id: 'r-2' } });
    expect(routeForPush({ kind: 'community_messages' })).toBe('/inbox');
    expect(routeForPush({ kind: 'community_messages', target: { kind: 'community', id: '../wallet' } })).toBe('/inbox');
    expect(routeForPush({ kind: 'community_messages', target: { kind: 'profile', id: 'u1' } })).toBe('/inbox');
  });

  it('reads anything else as no tap target', () => {
    for (const data of [undefined, null, 'sale', 7, [], {}]) expect(routeForPush(data)).toBeNull();
  });

  it('only lists screens that exist in the route graph', () => {
    const exists = (file: string) => existsSync(join(__dirname, '..', '..', '..', 'app', file));
    expect(exists('community/[id].tsx')).toBe(true);
    expect(exists('(tabs)/wallet.tsx')).toBe(true);
    expect(exists('(tabs)/inbox.tsx')).toBe(true);
  });
});
