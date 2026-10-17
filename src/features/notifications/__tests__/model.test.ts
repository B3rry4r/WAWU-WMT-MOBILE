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
    expect(routeOf({ kind: 'sale', target: null })).toBe('/wallet');
    expect(routeOf({ kind: 'dm_received', target: null })).toBe('/inbox');
    // A piece's own page (HOME-03) and a profile (ME-02) are not built.
    expect(routeOf({ kind: 'content_published', target: { kind: 'content', id: 'p1', title: null, deadlineAt: null } })).toBeNull();
    expect(routeOf({ kind: 'new_follower', target: { kind: 'profile', id: 'u1', title: null, deadlineAt: null } })).toBeNull();
    expect(routeOf({ kind: 'content_rejected', target: null })).toBeNull();
  });

  it('draws See why and Top up, and nothing for a kind whose screen is not built', () => {
    expect(actionOf({ kind: 'content_rejected', target: { kind: 'content', id: 'p1', title: null, deadlineAt: null } })).toEqual({ label: 'See why', kind: 'route', href: { pathname: '/library/[id]', params: { id: 'p1' } } });
    expect(actionOf({ kind: 'content_rejected', target: null })).toBeNull();
    expect(actionOf({ kind: 'credits_low', target: null })).toEqual({ label: 'Top up', kind: 'top-up' });
    expect(actionOf({ kind: 'dm_deadline', target: null })).toBeNull();
  });
});
