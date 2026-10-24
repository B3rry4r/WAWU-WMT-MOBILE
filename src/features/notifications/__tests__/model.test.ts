import { actionOf, iconOf, routeOf, toneOf, whenOf } from '../model';

const NOW = new Date('2026-10-17T14:00:00.000Z');

describe('Notification words', () => {
  it('writes the time as M31 does: the clock today, Yest., the weekday this week, then the date', () => {
    expect(whenOf('2026-10-17T09:48:00.000Z', NOW)).toBe('10:48');
    expect(whenOf('2026-10-16T09:48:00.000Z', NOW)).toBe('Yest.');
    expect(whenOf('2026-10-12T09:48:00.000Z', NOW)).toBe('Mon');
    expect(whenOf('2026-09-22T09:48:00.000Z', NOW)).toBe('22 Sep');
    expect(whenOf('garbage', NOW)).toBe('');
  });

  it('gives each kind its glyph and a bell to a kind it has not met', () => {
    expect(iconOf('sale')).toBe('ShoppingBag');
    expect(iconOf('content_rejected')).toBe('CircleX');
    expect(iconOf('something_new')).toBe('Bell');
    expect(iconOf('community_messages')).toBe('MessageCircle');
  });

  it('uses the Hub\'s tone, and the accent M31 draws on a new follower', () => {
    expect(toneOf({ kind: 'sale', tone: 'success' })).toBe('in');
    expect(toneOf({ kind: 'credits_low', tone: 'warning' })).toBe('warn');
    expect(toneOf({ kind: 'new_follower', tone: 'neutral' })).toBe('accent');
    expect(toneOf({ kind: 'x', tone: 'unheard-of' })).toBe('neutral');
  });

  it('opens a screen only where one is built', () => {
    expect(routeOf({ kind: 'content_rejected', target: { kind: 'content', id: 'p1', title: null, deadlineAt: null } })).toEqual({ pathname: '/library/[id]', params: { id: 'p1' } });
    expect(routeOf({ kind: 'money_in', target: { kind: 'transaction', id: 't1', title: null, deadlineAt: null } })).toEqual({ pathname: '/transactions/[id]', params: { id: 't1' } });
    // FIX-102: a sale opens the earnings (it opened the wallet), a piece and a follower open their own pages (they opened nothing).
    expect(routeOf({ kind: 'sale', target: null })).toBe('/earnings');
    expect(routeOf({ kind: 'community_messages', actionHref: '/communities/r1', target: { kind: 'community', id: 'r1', title: null, deadlineAt: null } })).toEqual({ pathname: '/community/[id]', params: { id: 'r1' } });
    expect(routeOf({ kind: 'community_messages', target: null, category: 'messages' })).toBe('/inbox');
    expect(routeOf({ kind: 'dm_received', target: null })).toBe('/inbox');
    expect(routeOf({ kind: 'content_published', target: { kind: 'content', id: 'p1', title: null, deadlineAt: null } })).toEqual({ pathname: '/content/[id]', params: { id: 'p1' } });
    expect(routeOf({ kind: 'new_follower', target: { kind: 'profile', id: 'u1', title: null, deadlineAt: null } })).toEqual({ pathname: '/profile/[wawuId]', params: { wawuId: 'u1' } });
    expect(routeOf({ kind: 'content_rejected', target: null })).toBe('/library');
  });

  it('opens the asker\'s conversation for a paid question when the Hub names who asked, and the Inbox when it does not', () => {
    const asked = { kind: 'dm_received', target: { kind: 'paid_question' as const, id: 'q1', title: null, deadlineAt: null }, actor: { wawuId: 'WAWU-77' } };
    expect(routeOf(asked)).toEqual({ pathname: '/paid-questions/[wawuId]', params: { wawuId: 'WAWU-77', question: 'q1' } });
    expect(routeOf({ ...asked, kind: 'dm_deadline' })).toEqual({ pathname: '/paid-questions/[wawuId]', params: { wawuId: 'WAWU-77', question: 'q1' } });
    expect(routeOf({ ...asked, actor: null })).toBe('/inbox');
  });

  it('opens the closest screen for a kind it has not met: its target, then its category, and nothing when it is only news', () => {
    const news = { kind: 'something_new', category: 'other', target: null };
    expect(routeOf({ ...news, target: { kind: 'content', id: 'p1', title: null, deadlineAt: null } })).toEqual({ pathname: '/content/[id]', params: { id: 'p1' } });
    expect(routeOf({ ...news, category: 'money' })).toBe('/transactions');
    expect(routeOf({ ...news, category: 'messages' })).toBe('/inbox');
    expect(routeOf({ ...news, category: 'content' })).toBe('/library');
    expect(routeOf(news)).toBeNull();
    // An announcement whose button says "Stay here" has nowhere to go; the others go where the fixed table sends them.
    expect(routeOf({ kind: 'campaign', category: 'other', target: null, actionHref: '/notifications' })).toBeNull();
    expect(routeOf({ kind: 'campaign', category: 'other', target: null, actionHref: '/events' })).toBe('/events');
  });

  it('draws See why and Top up, and nothing for a kind whose screen is not built', () => {
    expect(actionOf({ kind: 'content_rejected', target: { kind: 'content', id: 'p1', title: null, deadlineAt: null } })).toEqual({ label: 'See why', kind: 'route', href: { pathname: '/library/[id]', params: { id: 'p1' } } });
    expect(actionOf({ kind: 'content_rejected', target: null })).toBeNull();
    expect(actionOf({ kind: 'credits_low', target: null })).toEqual({ label: 'Top up', kind: 'top-up' });
    expect(actionOf({ kind: 'dm_deadline', target: null })).toBeNull();
  });
});
