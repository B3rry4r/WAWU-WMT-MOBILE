import {
  countsOf,
  liveListings,
  listingTitle,
  memberSinceLine,
  nameOf,
  openableLink,
  paidMessagesOf,
  profileShareText,
  readableLink,
  replyWindow,
  roleLinesOf,
  socialLinksOf,
  ticksOf,
  tileOf,
  yearsOf,
} from '../model';
import type { ContentPiece, Listing, MyProfile, ProfileFields } from '../api';

const me = (over: Partial<MyProfile> = {}): MyProfile =>
  ({
    wawuUserId: 'u1',
    firstName: 'Lennox',
    middleName: null,
    lastName: 'Emmanuel',
    handle: 'lennox',
    instagramHandle: null,
    tiktokHandle: null,
    xHandle: null,
    youtubeUrl: null,
    facebookUrl: null,
    linkedinUrl: null,
    verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } },
    ...over,
  }) as MyProfile;

const fields = (over: Partial<ProfileFields> = {}): ProfileFields =>
  ({ wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null, ...over }) as ProfileFields;

const piece = (over: Partial<ContentPiece> = {}): ContentPiece =>
  ({ id: 'p1', title: 'Night shoot', contentType: 'image', accessType: 'free', price: 0, views: 12000, previewAssetUrl: 'https://files.test/p1.jpg', ...over }) as ContentPiece;

describe('the Me tab: what it reads from the Hub', () => {
  it('writes the name from its parts, and falls back to the handle', () => {
    expect(nameOf(me())).toBe('Lennox Emmanuel');
    expect(nameOf(me({ middleName: 'Ade' }))).toBe('Lennox Ade Emmanuel');
    expect(nameOf(me({ firstName: '', lastName: '' }))).toBe('lennox');
  });

  it('shows a tick only while it is live, creator first', () => {
    expect(ticksOf(me())).toEqual([]);
    expect(
      ticksOf(me({ verification: { creator: { verified: true, expiresAt: '2027-01-01' }, professional: { verified: true, expiresAt: '2027-01-01' } } })),
    ).toEqual(['creator', 'pro']);
    expect(ticksOf(me({ verification: { creator: { verified: false, expiresAt: null }, professional: { verified: true, expiresAt: '2027-01-01' } } }))).toEqual(['pro']);
  });

  it('lists the social handles in the order set on M9, then the rest in the default order, each opening its platform', () => {
    const links = socialLinksOf(
      me({ instagramHandle: '@lennox.films', tiktokHandle: 'lennox', youtubeUrl: 'https://youtube.com/@LennoxFilms', xHandle: 'lennoxe' }),
      fields({ socialOrder: ['x', 'instagram'], threadsHandle: 'lennox.t' }),
    );
    expect(links.map((l) => l.platform)).toEqual(['x', 'instagram', 'tiktok', 'youtube', 'threads']);
    expect(links.map((l) => l.label)).toEqual(['lennoxe', 'lennox.films', 'lennox', 'LennoxFilms', 'lennox.t']);
    expect(links.map((l) => l.url)).toEqual([
      'https://x.com/lennoxe',
      'https://instagram.com/lennox.films',
      'https://www.tiktok.com/@lennox',
      'https://youtube.com/@LennoxFilms',
      'https://www.threads.net/@lennox.t',
    ]);
  });

  it('opens a pasted link as it is and writes it without the scheme', () => {
    const links = socialLinksOf(me({ linkedinUrl: 'https://www.linkedin.com/company/lennox-films/' }), fields());
    expect(links).toEqual([{ platform: 'linkedin', label: 'linkedin.com/company/lennox-films', url: 'https://www.linkedin.com/company/lennox-films/' }]);
  });

  it('shows no chips when no handle is added', () => {
    expect(socialLinksOf(me(), fields())).toEqual([]);
  });

  it('writes the counts as the canvas does, with one follower or piece in the singular', () => {
    expect(countsOf({ followerCount: 12500, followingCount: 486, postCount: 48 }).map((c) => `${c.value} ${c.label}`)).toEqual(['12.5K followers', '486 following', '48 pieces']);
    expect(countsOf({ followerCount: 1, followingCount: 0, postCount: 1 }).map((c) => `${c.value} ${c.label}`)).toEqual(['1 follower', '0 following', '1 piece']);
  });

  it('shares the name and the https profile link, or the name alone without a handle', () => {
    expect(profileShareText('Lennox Emmanuel', 'lennox')).toBe('Lennox Emmanuel on Who Made This\nhttps://wawuafrica.com/u/lennox');
    expect(profileShareText('Lennox Emmanuel', ' @lennox.films ')).toBe('Lennox Emmanuel on Who Made This\nhttps://wawuafrica.com/u/lennox.films');
    expect(profileShareText('Lennox Emmanuel', null)).toBe('Lennox Emmanuel on Who Made This');
  });

  it('gives a free piece its views and a paid one its price in naira, locked', () => {
    expect(tileOf(piece())).toMatchObject({ caption: '12K', locked: false, still: 'https://files.test/p1.jpg' });
    expect(tileOf(piece({ accessType: 'paid', price: 8000 }))).toMatchObject({ caption: '₦8,000', locked: true });
    expect(tileOf(piece({ accessType: 'paid', price: 8000 })).spoken).toBe('Night shoot, paid, ₦8,000');
  });

  it('uses the preview as a still only for a picture: a video or a document has none', () => {
    expect(tileOf(piece({ contentType: 'video', previewAssetUrl: 'https://files.test/p1.mp4' })).still).toBeNull();
    expect(tileOf(piece({ contentType: 'pdf', previewAssetUrl: 'https://files.test/p1.pdf' })).still).toBeNull();
  });

  it('shows paid messages only when they are on and priced, with the reply window as set', () => {
    expect(paidMessagesOf({ dmEnabled: true, dmPrice: 300, dmResponseHours: 24 })).toEqual({ priceLine: '₦300 a message', replyLine: 'replies within 24 hours' });
    expect(paidMessagesOf({ dmEnabled: true, dmPrice: 1500, dmResponseHours: 48 })).toEqual({ priceLine: '₦1,500 a message', replyLine: 'replies within 2 days' });
    expect(paidMessagesOf({ dmEnabled: false, dmPrice: 300, dmResponseHours: 24 })).toBeNull();
    expect(paidMessagesOf({ dmEnabled: true, dmPrice: null, dmResponseHours: 24 })).toBeNull();
    expect(paidMessagesOf(null)).toBeNull();
    expect(replyWindow(1)).toBe('replies within 1 hour');
    expect(replyWindow(0)).toBeNull();
  });

  it('lists only approved listings the person has not hidden, by their headline', () => {
    const listing = (id: string, status: Listing['status'], listed: boolean, headline = 'Brand strategy sessions') => ({ id, status, listed, headline, category: 'marketing' }) as Listing;
    expect(liveListings([listing('a', 'approved', true), listing('b', 'pending', true), listing('c', 'approved', false), listing('d', 'rejected', true)]).map((l) => l.id)).toEqual(['a']);
    expect(listingTitle(listing('a', 'approved', true, '  '))).toBe('marketing');
  });

  it('writes "On Who Made This since" with the month in Lagos time', () => {
    expect(memberSinceLine('2025-03-14T10:00:00.000Z')).toBe('On Who Made This since March 2025');
    // 23:30 UTC on 28 February is 00:30 on 1 March in Lagos.
    expect(memberSinceLine('2025-02-28T23:30:00.000Z')).toBe('On Who Made This since March 2025');
    expect(memberSinceLine(null)).toBeNull();
    expect(memberSinceLine('not a date')).toBeNull();
  });

  it('writes a role as "where · years", the Hub sending months', () => {
    expect(yearsOf({ startedOn: '2021-01', endedOn: null, current: true })).toBe('2021 to now');
    expect(yearsOf({ startedOn: '2018-03', endedOn: '2021-01', current: false })).toBe('2018 to 2021');
    expect(yearsOf({ startedOn: '2020-01', endedOn: '2020-06', current: false })).toBe('2020');
    expect(
      roleLinesOf([
        { id: 'r1', title: 'Founder, director', company: 'Lennox Films', location: null, startedOn: '2021-01', endedOn: null, current: true, description: null },
        { id: 'r2', title: 'Brand strategist', company: 'Noah Agency', location: 'Lagos', startedOn: '2018-03', endedOn: '2021-01', current: false, description: null },
      ]),
    ).toEqual([
      { id: 'r1', title: 'Founder, director', detail: 'Lennox Films · 2021 to now' },
      { id: 'r2', title: 'Brand strategist', detail: 'Noah Agency, Lagos · 2018 to 2021' },
    ]);
  });

  it('writes a website without its scheme, and opens a bare site over https', () => {
    expect(readableLink('https://www.lennoxfilms.com/')).toBe('lennoxfilms.com');
    expect(openableLink('lennoxfilms.com')).toBe('https://lennoxfilms.com');
    expect(openableLink('http://lennoxfilms.com')).toBe('http://lennoxfilms.com');
  });
});
