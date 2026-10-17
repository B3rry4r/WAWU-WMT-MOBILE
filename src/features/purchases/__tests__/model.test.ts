import type { PurchaseEntry } from '../api';
import { boughtOn, creatorName, rowLine, searchTerm } from '../model';

const entry = (over: Partial<PurchaseEntry['content']> = {}, lessons: PurchaseEntry['lessons'] = null, purchasedAt = '2026-09-26T09:00:00.000Z'): PurchaseEntry =>
  ({
    id: 'p',
    purchasedAt,
    lessons,
    content: { id: 'c', title: 'T', contentType: 'video', thumbnailUrl: null, creator: { wawuId: 'w', displayName: 'Chidi Eze', handle: 'chidi', avatarUrl: null, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } } }, ...over },
  }) as PurchaseEntry;
const now = new Date('2026-10-17T12:00:00.000Z');

describe('My purchases words', () => {
  it('dates a purchase on the Lagos clock, with the year only when it is not this one', () => {
    expect(boughtOn('2026-09-26T09:00:00.000Z', now)).toBe('26 Sep');
    expect(boughtOn('2025-12-31T23:30:00.000Z', now)).toBe('1 Jan');
    expect(boughtOn('2025-03-02T10:00:00.000Z', now)).toBe('2 Mar 2025');
    expect(boughtOn('not a time', now)).toBe('');
  });

  it('names the creator by display name, else handle, else leaves the line without one', () => {
    expect(creatorName(entry())).toBe('Chidi Eze');
    expect(creatorName(entry({ creator: { ...entry().content.creator, displayName: ' ', handle: '@chidi' } }))).toBe('@chidi');
    expect(rowLine(entry({ creator: { ...entry().content.creator, displayName: null, handle: null } }), now)).toBe('Video · 26 Sep');
  });

  it('shows course progress in the date\'s place only when the Hub lists lessons', () => {
    expect(rowLine(entry({ contentType: 'course' }, { total: 12, done: 3 }), now)).toBe('Chidi Eze · Course · 3 of 12 done');
    expect(rowLine(entry({ contentType: 'course' }, { total: 0, done: 0 }), now)).toBe('Chidi Eze · Course · 26 Sep');
    expect(rowLine(entry({ contentType: 'pdf' }, { total: 12, done: 3 }), now)).toBe('Chidi Eze · PDF · 26 Sep');
  });

  it('sends a search only from two characters, trimmed and cut at the Hub\'s sixty', () => {
    expect(searchTerm(' a ')).toBe('');
    expect(searchTerm(' ab ')).toBe('ab');
    expect(searchTerm('x'.repeat(80))).toHaveLength(60);
  });
});
