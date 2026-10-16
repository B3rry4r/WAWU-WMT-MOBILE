import { existsSync } from 'fs';
import { join } from 'path';

import { routeForPush } from '../routes';

const room = { kind: 'community', id: 'c0000000-0000-4000-8000-000000000001' };

describe('where a tap on a notification goes (INBOX-21)', () => {
  it('opens the room for a join answer, approved or declined', () => {
    for (const kind of ['community_join_approved', 'community_join_declined']) {
      expect(routeForPush({ notificationId: 'n1', kind, target: room })).toEqual({
        pathname: '/community/[id]',
        params: { id: room.id },
      });
    }
  });

  it('opens the wallet for money in and a refund', () => {
    for (const kind of ['sale', 'tip_received', 'dm_refunded']) expect(routeForPush({ kind })).toBe('/wallet');
  });

  it('opens the Inbox for a paid question and its deadline', () => {
    for (const kind of ['dm_received', 'dm_deadline']) expect(routeForPush({ kind, target: { kind: 'paid_question', id: 'q1' } })).toBe('/inbox');
  });

  it('opens nothing for a kind whose screen is not built yet', () => {
    for (const kind of ['new_follower', 'content_published', 'content_rejected', 'review_received', 'campaign', 'something_new']) {
      expect(routeForPush({ kind, target: { kind: 'profile', id: 'p1' } })).toBeNull();
    }
  });

  it('opens nothing when the room is missing, is not a room, or has an id that is not safe in a path', () => {
    const join = 'community_join_approved';
    expect(routeForPush({ kind: join })).toBeNull();
    expect(routeForPush({ kind: join, target: { kind: 'profile', id: 'p1' } })).toBeNull();
    expect(routeForPush({ kind: join, target: { kind: 'community', id: '../wallet' } })).toBeNull();
    expect(routeForPush({ kind: join, target: { kind: 'community', id: 'a'.repeat(65) } })).toBeNull();
    expect(routeForPush({ kind: join, target: { kind: 'community', id: 12 } })).toBeNull();
    expect(routeForPush({ kind: join, target: 'community' })).toBeNull();
  });

  it('never follows the web path the push carries', () => {
    expect(routeForPush({ kind: 'new_follower', actionHref: '/profile/verification' })).toBeNull();
    expect(routeForPush({ kind: 'campaign', actionHref: 'https://evil.example/login' })).toBeNull();
    expect(routeForPush({ actionHref: '/wallet' })).toBeNull();
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
