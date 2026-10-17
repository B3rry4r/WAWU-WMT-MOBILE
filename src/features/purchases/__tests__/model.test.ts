import type { PurchaseEntry } from '../api';
import { actionOf, boughtOn, creatorName, rowLine, searchTerm, targetOf } from '../model';

type Piece = NonNullable<PurchaseEntry['content']>;
const entry = (over: Partial<Piece> = {}, lessons: PurchaseEntry['lessons'] = null, purchasedAt = '2026-09-26T09:00:00.000Z'): PurchaseEntry =>
  ({
    id: 'p',
    kind: 'content_unlock',
    title: 'T',
    amountKobo: 250000,
    totalKobo: null,
    status: 'paid',
    openId: 'c',
    credits: null,
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
    expect(creatorName(entry({ creator: { ...entry().content!.creator, displayName: ' ', handle: '@chidi' } }))).toBe('@chidi');
    expect(rowLine(entry({ creator: { ...entry().content!.creator, displayName: null, handle: null } }), now)).toBe('Video · 26 Sep');
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
  const other = (kind: PurchaseEntry['kind'], over: Partial<PurchaseEntry> = {}): PurchaseEntry =>
    ({ id: 'o', kind, title: 'Lagos Nights', amountKobo: 500000, totalKobo: 506500, purchasedAt: '2026-09-26T09:00:00.000Z', status: 'paid', openId: 'x1', content: null, lessons: null, credits: null, ...over }) as PurchaseEntry;

  it('says what every other kind is, the day and what left the wallet (else the charge), and ends a paid-back one on Refunded', () => {
    expect(rowLine(other('event_ticket'), now)).toBe('Ticket · 26 Sep · ₦5,065');
    expect(rowLine(other('credit_pack', { totalKobo: null, amountKobo: 120050, credits: 40 }), now)).toBe('Credit pack · 26 Sep · ₦1,200.50');
    expect(rowLine(other('school_fee'), now)).toBe('School fee · 26 Sep · ₦5,065');
    expect(rowLine(other('community_pass'), now)).toBe('Community pass · 26 Sep · ₦5,065');
    expect(rowLine(other('event_ticket', { status: 'refunded' }), now)).toBe('Ticket · 26 Sep · Refunded');
    expect(rowLine({ ...entry(), status: 'refunded' }, now)).toBe('Chidi Eze · Video · 26 Sep · Refunded');
  });

  it('opens each kind where its screen exists, and a refunded purchase and a credit pack open nothing', () => {
    expect(targetOf(entry())).toEqual({ kind: 'piece', id: 'c' });
    expect(targetOf(other('event_ticket'))).toEqual({ kind: 'ticket', orderId: 'x1' });
    expect(targetOf(other('school_fee'))).toEqual({ kind: 'courses' });
    expect(targetOf(other('community_pass'))).toEqual({ kind: 'room', id: 'x1' });
    expect(targetOf(other('credit_pack', { openId: null }))).toBeNull();
    expect(targetOf(other('event_ticket', { openId: null }))).toBeNull();
    // A ticket the web paid by card (no wallet total) is not a wallet order, so its page cannot read it: the row opens nothing.
    expect(targetOf(other('event_ticket', { totalKobo: null }))).toBeNull();
    for (const kind of ['event_ticket', 'school_fee', 'community_pass'] as const) expect(targetOf(other(kind, { status: 'refunded' }))).toBeNull();
    expect(targetOf({ ...entry(), status: 'refunded' })).toBeNull();
  });

  it('gives a piece the board\'s button by type and nothing else', () => {
    expect(actionOf(entry())).toBe('Watch');
    expect(actionOf(entry({ contentType: 'pdf' }))).toBe('Read');
    expect(actionOf(entry({ contentType: 'course' }))).toBe('Resume');
    for (const contentType of ['audio', 'image', 'template'] as const) expect(actionOf(entry({ contentType }))).toBeNull();
    expect(actionOf(other('event_ticket'))).toBeNull();
    expect(actionOf({ ...entry(), status: 'refunded' })).toBeNull();
  });
});
