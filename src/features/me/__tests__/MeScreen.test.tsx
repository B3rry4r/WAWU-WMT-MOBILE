/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking, Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
let answers: Record<string, Answer | Answer[]> = {};
let asked: string[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    asked.push(`${request.method} ${url.pathname}${url.search}`);
    const queued = answers[`${request.method} ${url.pathname}${url.search}`] ?? answers[`${request.method} ${url.pathname}`];
    const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hang') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown, extra: Record<string, unknown> = {}) => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

installFetch();
const { MeScreen } = require('../MeScreen') as typeof import('../MeScreen');
const { postProfileSaved, clearProfileSaved, PROFILE_SAVED_MS } = require('../savedNotice') as typeof import('../savedNotice');

const ME = '/api/hub/users/me';
const FIELDS = '/api/hub/users/me/profile-fields';
const STATS = '/api/hub/users/me/profile-stats';
const GRID = '/api/hub/users/u1/content';
const STATE = '/api/hub/creator/state';
const LISTINGS = '/api/hub/professionals/applications/mine';
const WORKS = '/api/hub/users/me/featured-works';

const profile = (over: Record<string, unknown> = {}) => ({
  wawuUserId: 'u1',
  sub: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  accountType: 'creator',
  handle: 'lennox',
  bio: 'Filmmaker and brand strategist.',
  avatarUrl: null,
  coverUrl: null,
  instagramHandle: 'lennox.films',
  tiktokHandle: 'lennox',
  xHandle: null,
  youtubeUrl: null,
  facebookUrl: null,
  linkedinUrl: null,
  websiteUrl: 'https://lennoxfilms.com',
  createdAt: '2025-03-10T09:00:00.000Z',
  experience: [{ id: 'r1', title: 'Founder, director', company: 'Lennox Films', location: null, startedOn: '2021-01', endedOn: null, current: true, description: null }],
  verification: { creator: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' }, professional: { verified: false, expiresAt: null } },
  ...over,
});
const details = { wawuUserId: 'u1', location: 'Lagos, Nigeria', skills: ['Brand film', 'Pricing'], openTo: [], threadsHandle: null, socialOrder: ['tiktok', 'instagram'], memberSince: '2025-03-10T09:00:00.000Z' };
const stats = { wawuUserId: 'u1', followerCount: 12500, followingCount: 486, postCount: 48 };
const piece = (id: string, accessType: 'free' | 'paid', price: number, views: number) => ({
  id,
  title: `Piece ${id}`,
  contentType: 'image',
  accessType,
  price,
  views,
  previewAssetUrl: `https://files.test/${id}.jpg`,
});
const state = { wawuUserId: 'u1', kycStatus: 'approved', slotsUsed: 2, slotsTotal: 5, dmEnabled: true, dmPrice: 300, dmResponseHours: 24 };
const listing = { id: 'l1', status: 'approved', listed: true, headline: 'Brand strategy sessions', category: 'marketing' };
const works = {
  owner: { wawuId: 'u1', displayName: 'Lennox Emmanuel', handle: 'lennox', avatarUrl: null },
  count: 1,
  categories: [],
  works: [{ id: 'w1', title: 'Brand film', role: 'Director', client: null, year: 2025, link: null, category: null, description: null, media: [{ url: 'https://files.test/w1.jpg', kind: 'image' }], position: 0, createdAt: '2026-10-01T00:00:00.000Z' }],
};

function header() {
  return {
    [`GET ${ME}`]: ok(profile()),
    [`GET ${FIELDS}`]: ok(details),
    [`GET ${STATS}`]: ok(stats),
    [`GET ${GRID}?page=1&perPage=18`]: ok([piece('p1', 'free', 0, 12000), piece('p2', 'paid', 8000, 3)], { pagination: { currentPage: 1, nextPage: null } }),
  } as Record<string, Answer | Answer[]>;
}

function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

async function boot() {
  const onEditProfile = jest.fn();
  const onAddWork = jest.fn();
  const onOpenWork = jest.fn();
  const onOpenSettings = jest.fn();
  await render(frame(<MeScreen onEditProfile={onEditProfile} onAddWork={onAddWork} onOpenWork={onOpenWork} onOpenSettings={onOpenSettings} />));
  return { onEditProfile, onAddWork, onOpenWork, onOpenSettings };
}

beforeEach(() => {
  answers = {};
  asked = [];
  clearProfileSaved();
});

describe('M1 · Me', () => {
  it('a user sees their own profile from the Hub: name, tick, bio, handles in their order, the three counts and their pieces', async () => {
    answers = header();
    await boot();
    expect(await screen.findByTestId('me-name')).toHaveTextContent('Lennox Emmanuel');
    expect(screen.getByLabelText('Creator tick')).toBeTruthy();
    expect(screen.queryByLabelText('Professional tick')).toBeNull();
    expect(screen.getByTestId('me-bio')).toHaveTextContent('Filmmaker and brand strategist.');
    expect(screen.getByLabelText('TikTok, lennox')).toBeTruthy();
    expect(screen.getByLabelText('Instagram, lennox.films')).toBeTruthy();
    expect(screen.getByTestId('me-count-followers')).toHaveTextContent('12.5K followers');
    expect(screen.getByTestId('me-count-following')).toHaveTextContent('486 following');
    expect(screen.getByTestId('me-count-pieces')).toHaveTextContent('48 pieces');
    expect(await screen.findByTestId('me-tile-p1-caption')).toHaveTextContent('12K');
    expect(screen.getByTestId('me-tile-p2-caption')).toHaveTextContent('₦8,000');
    expect(screen.getByTestId('me-tile-p2-veil')).toBeTruthy();
    expect(screen.queryByTestId('me-tile-p1-veil')).toBeNull();
  });

  it('shows the three tabs Content, Services and About, and no Shop tab (R-9)', async () => {
    answers = header();
    await boot();
    await screen.findByTestId('me-name');
    expect(screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel)).toEqual(['Content', 'Services', 'About']);
    expect(screen.queryByText('Shop')).toBeNull();
  });

  it('does not yet draw QR, the tick prompt or Create (COMPLETE-04 draws them, inert); the Menu button is drawn (BRAND-01)', async () => {
    answers = header();
    await boot();
    await screen.findByTestId('me-name');
    expect(screen.queryByText('Get your professional tick')).toBeNull();
    expect(screen.queryByLabelText(/qr/i)).toBeNull();
    expect(screen.getByLabelText('Menu')).toBeTruthy();
    expect(screen.queryByLabelText(/create/i)).toBeNull();
    // The tick is shown, but it is not a button until ME-12 adds Verification.
    expect(screen.getByLabelText('Creator tick').props.accessibilityRole).toBe('image');
  });

  it('a user can tap Edit profile', async () => {
    answers = header();
    const { onEditProfile } = await boot();
    await fireEvent.press(await screen.findByTestId('me-edit'));
    expect(onEditProfile).toHaveBeenCalledTimes(1);
  });

  it('a user can tap Share: the share sheet gets their name and wawu/ link; when it cannot open they are told', async () => {
    answers = header();
    const share = jest.spyOn(Share, 'share').mockResolvedValueOnce({ action: 'sharedAction' });
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-share'));
    expect(share).toHaveBeenCalledWith({ message: 'Lennox Emmanuel on Who Made This\nwawu/lennox' });

    share.mockRejectedValueOnce(new Error('no share sheet'));
    await fireEvent.press(screen.getByTestId('me-share'));
    expect(await screen.findByTestId('me-notice')).toHaveTextContent(/Sharing is not available on this device\./);
    share.mockRestore();
  });

  it('a user can tap a social handle and the platform opens', async () => {
    answers = header();
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await boot();
    await fireEvent.press(await screen.findByTestId('me-social-tiktok'));
    expect(open).toHaveBeenCalledWith('https://www.tiktok.com/@lennox');
    open.mockRestore();
  });

  it('a user can switch to Services: paid messages with the price and reply window they set, and each live listing', async () => {
    answers = { ...header(), [`GET ${STATE}`]: ok(state), [`GET ${LISTINGS}`]: ok([listing, { ...listing, id: 'l2', status: 'pending' }]) };
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-tab-services'));
    expect(await screen.findByTestId('me-service-paid-sub')).toHaveTextContent('₦300 a message · replies within 24 hours');
    expect(screen.getByTestId('me-service-listing-l1')).toBeTruthy();
    expect(screen.getByText('Brand strategy sessions')).toBeTruthy();
    expect(screen.queryByTestId('me-service-listing-l2')).toBeNull();
  });

  it('a plain account sees Services empty, and the Hub is not asked for creator settings it does not have', async () => {
    answers = { ...header(), [`GET ${ME}`]: ok(profile({ accountType: 'user' })), [`GET ${LISTINGS}`]: ok([]) };
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-tab-services'));
    expect(await screen.findByTestId('me-services-empty')).toBeTruthy();
    expect(asked).not.toContain(`GET ${STATE}`);
  });

  it('a user can switch to About: works with Add, bio, location, member since, website, experience and skills', async () => {
    answers = { ...header(), [`GET ${WORKS}?limit=3`]: ok(works) };
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { onAddWork, onOpenWork } = await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-tab-about'));
    expect(await screen.findByTestId('me-work-w1')).toBeTruthy();
    // One work keeps the drawn third of the row: the other two places hold their room.
    expect(screen.getByTestId('me-works-room-0')).toBeTruthy();
    expect(screen.getByTestId('me-works-room-1')).toBeTruthy();
    expect(screen.getByTestId('me-about-location')).toHaveTextContent('Lagos, Nigeria');
    expect(screen.getByTestId('me-about-since')).toHaveTextContent('On Who Made This since March 2025');
    expect(screen.getByTestId('me-about-website')).toHaveTextContent('lennoxfilms.com');
    expect(screen.getByText('Lennox Films · 2021 to now')).toBeTruthy();
    expect(screen.getByText('Pricing')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('me-works-add'));
    expect(onAddWork).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('me-work-w1'));
    expect(onOpenWork).toHaveBeenCalledWith('u1', 'w1');
    await fireEvent.press(screen.getByTestId('me-about-website'));
    expect(open).toHaveBeenCalledWith('https://lennoxfilms.com');
    open.mockRestore();
  });

  it('About with nothing filled in shows only the works card, which offers Add', async () => {
    answers = {
      ...header(),
      [`GET ${ME}`]: ok(profile({ bio: null, websiteUrl: null, experience: [], createdAt: null })),
      [`GET ${FIELDS}`]: ok({ ...details, location: null, skills: [], memberSince: null }),
      [`GET ${WORKS}?limit=3`]: ok({ ...works, count: 0, works: [] }),
    };
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-tab-about'));
    expect(await screen.findByTestId('me-works-empty')).toBeTruthy();
    expect(screen.getByTestId('me-works-add')).toBeTruthy();
    expect(screen.queryByTestId('me-facts')).toBeNull();
    expect(screen.queryByTestId('me-experience')).toBeNull();
    expect(screen.queryByTestId('me-skills')).toBeNull();
  });
});

const MENU_TITLES = ['Creator dashboard', 'My content', 'My purchases', 'My courses', 'Saved', 'Notifications', 'Verification', 'Settings'];

describe('Z1 · the Me menu (BRAND-01)', () => {
  it('a signed-in user can tap Menu, see the eight rows Z1 draws in its order, and tap Settings to open Z2', async () => {
    answers = header();
    const { onOpenSettings } = await boot();
    await screen.findByTestId('me-name');
    expect(screen.queryByTestId('me-menu')).toBeNull();
    await fireEvent.press(screen.getByTestId('me-menu-button'));
    expect(await screen.findByTestId('me-menu')).toBeTruthy();
    const ids = ['dashboard', 'content', 'purchases', 'courses', 'saved', 'notifications', 'verification', 'settings'];
    MENU_TITLES.forEach((title, i) => expect(screen.getByTestId(`me-menu-${ids[i]}`)).toHaveTextContent(title));
    await fireEvent.press(screen.getByTestId('me-menu-settings'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByTestId('me-menu')).toBeNull());
  });

  it('every other row is drawn with its chevron, is not a button, and opens nothing when tapped (R-46)', async () => {
    answers = header();
    const { onOpenSettings, onEditProfile } = await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-menu-button'));
    await screen.findByTestId('me-menu');
    for (const id of ['dashboard', 'content', 'purchases', 'courses', 'saved', 'notifications', 'verification']) {
      const row = screen.getByTestId(`me-menu-${id}`);
      expect(row.props.accessibilityRole).not.toBe('button');
      await fireEvent.press(row);
    }
    expect(onOpenSettings).not.toHaveBeenCalled();
    expect(onEditProfile).not.toHaveBeenCalled();
    // The sheet is still up: nothing was opened, nothing was closed.
    expect(screen.getByTestId('me-menu')).toBeTruthy();
    expect(screen.getByTestId('me-menu-settings').props.accessibilityRole).toBe('button');
  });

  it('draws no figure the Hub has not served: no naira amount, count or tick state under the rows', async () => {
    answers = header();
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-menu-button'));
    const list = await screen.findByTestId('me-menu-list');
    expect(list).toHaveTextContent(new RegExp(`^${MENU_TITLES.join('')}$`));
  });

  it('a person can reach Settings while the profile is still loading', async () => {
    answers = { [`GET ${ME}`]: 'hang', [`GET ${FIELDS}`]: 'hang', [`GET ${STATS}`]: 'hang' };
    const { onOpenSettings } = await boot();
    expect(await screen.findByTestId('me-loading')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('me-menu-button'));
    await fireEvent.press(await screen.findByTestId('me-menu-settings'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('a person can reach Settings when the profile did not load (the page error is showing)', async () => {
    answers = { ...header(), [`GET ${STATS}`]: refusal(500, 'Internal server error') };
    const { onOpenSettings } = await boot();
    expect(await screen.findByTestId('me-error')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('me-menu-button'));
    await fireEvent.press(await screen.findByTestId('me-menu-settings'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('the sheet closes from its grabber and Menu opens it again', async () => {
    answers = header();
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-menu-button'));
    await screen.findByTestId('me-menu');
    await fireEvent.press(screen.getByTestId('me-menu-close'));
    await waitFor(() => expect(screen.queryByTestId('me-menu')).toBeNull());
    await fireEvent.press(screen.getByTestId('me-menu-button'));
    expect(await screen.findByTestId('me-menu')).toBeTruthy();
  });
});

describe('M1 · states', () => {
  it('shows a loading view while the profile is on its way', async () => {
    answers = { ...header(), [`GET ${ME}`]: 'hang' };
    await boot();
    expect(screen.getByTestId('me-loading')).toBeTruthy();
    expect(screen.queryByTestId('me-name')).toBeNull();
    // Nothing to share until the profile is in: Share is off, never a button that does nothing.
    expect(screen.getByTestId('me-share').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('shows an error with Try again when the profile cannot be read, and the profile once it can', async () => {
    answers = { ...header(), [`GET ${ME}`]: ['offline', ok(profile())] };
    await boot();
    expect(await screen.findByTestId('me-error')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('me-name')).toHaveTextContent('Lennox Emmanuel');
  });

  it('shows nothing published yet when there are no live pieces', async () => {
    answers = { ...header(), [`GET ${GRID}?page=1&perPage=18`]: ok([], { pagination: { currentPage: 1, nextPage: null } }) };
    await boot();
    expect(await screen.findByTestId('me-grid-empty')).toHaveTextContent(/Nothing published yet/);
  });

  it('a grid that fails to load can be tried again on its own', async () => {
    answers = { ...header(), [`GET ${GRID}?page=1&perPage=18`]: [refusal(500, 'Internal server error'), ok([piece('p1', 'free', 0, 5)], { pagination: { nextPage: null } })] };
    await boot();
    expect(await screen.findByTestId('me-grid-error')).toBeTruthy();
    expect(screen.getByTestId('me-name')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('me-tile-p1')).toBeTruthy();
  });

  it('a Services tab that fails to load says so and can be tried again', async () => {
    answers = { ...header(), [`GET ${STATE}`]: ['offline', ok(state)], [`GET ${LISTINGS}`]: ok([]) };
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-tab-services'));
    expect(await screen.findByTestId('me-services-error')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('me-service-paid')).toBeTruthy();
  });

  it('an account with no profile saved yet counts nobody and nothing, rather than failing', async () => {
    answers = { ...header(), [`GET ${STATS}`]: refusal(404, 'User not found') };
    await boot();
    expect(await screen.findByTestId('me-count-followers')).toHaveTextContent('0 followers');
    expect(screen.getByTestId('me-count-pieces')).toHaveTextContent('0 pieces');
  });
});

describe('M1 · round 2', () => {
  it('a free piece with no picture gets the veil, so its white view count can be read in light mode (D1)', async () => {
    answers = {
      ...header(),
      [`GET ${GRID}?page=1&perPage=18`]: ok([{ ...piece('v1', 'free', 0, 999), contentType: 'video', previewAssetUrl: 'https://files.test/v1.mp4' }], { pagination: { nextPage: null } }),
    };
    await boot();
    expect(await screen.findByTestId('me-tile-v1-veil')).toBeTruthy();
    expect(screen.getByTestId('me-tile-v1-caption')).toHaveTextContent('999');
  });

  it('a refresh that fails keeps the profile on screen; the page error is only for a profile never shown (D2)', async () => {
    answers = { ...header(), [`GET ${STATS}`]: [ok(stats), refusal(500, 'Internal server error')] };
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    await render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <QueryClientProvider client={client}>
          <MeScreen onEditProfile={jest.fn()} onAddWork={jest.fn()} onOpenWork={jest.fn()} onOpenSettings={jest.fn()} />
        </QueryClientProvider>
      </SafeAreaProvider>,
    );
    expect(await screen.findByTestId('me-count-followers')).toHaveTextContent('12.5K followers');
    // What a save on M8 does: every profile query reads again; this time the counts fail.
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['profile'] });
    });
    await waitFor(() => expect(asked.filter((line) => line === `GET ${STATS}`)).toHaveLength(2));
    expect(screen.queryByTestId('me-error')).toBeNull();
    expect(screen.getByTestId('me-name')).toHaveTextContent('Lennox Emmanuel');
    expect(screen.getByTestId('me-count-followers')).toHaveTextContent('12.5K followers');
  });

  it('a profile-stats failure on first load is the page error, not empty counts', async () => {
    answers = { ...header(), [`GET ${STATS}`]: refusal(500, 'Internal server error') };
    await boot();
    expect(await screen.findByTestId('me-error')).toBeTruthy();
    expect(screen.queryByTestId('me-counts')).toBeNull();
  });

  it('a brand-new account with no profile row sees "Nothing published yet", not an error (D3)', async () => {
    answers = { ...header(), [`GET ${GRID}?page=1&perPage=18`]: refusal(404, 'User not found') };
    await boot();
    expect(await screen.findByTestId('me-grid-empty')).toHaveTextContent(/Nothing published yet/);
    expect(screen.queryByTestId('me-grid-error')).toBeNull();
  });

  it('a 403 from creator/state means no paid messages, not a failure', async () => {
    answers = {
      ...header(),
      [`GET ${STATE}`]: refusal(403, 'This account has no creator state - a creator account type is required.'),
      [`GET ${LISTINGS}`]: ok([]),
    };
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-tab-services'));
    expect(await screen.findByTestId('me-services-empty')).toBeTruthy();
    expect(asked).toContain(`GET ${STATE}`);
    expect(screen.queryByTestId('me-services-error')).toBeNull();
  });

  it('a listing says "via paid messages" only while paid messages are on (U2)', async () => {
    answers = { ...header(), [`GET ${STATE}`]: ok({ ...state, dmEnabled: false }), [`GET ${LISTINGS}`]: ok([listing]) };
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-tab-services'));
    expect(await screen.findByTestId('me-service-listing-l1-sub')).toHaveTextContent(/^Listed as a professional$/);
    expect(screen.queryByTestId('me-service-paid')).toBeNull();
  });

  it('About shows at most three works, and fewer keep the drawn size (U1)', async () => {
    const four = ['w1', 'w2', 'w3', 'w4'].map((id) => ({ ...works.works[0], id }));
    answers = { ...header(), [`GET ${WORKS}?limit=3`]: ok({ ...works, count: 4, works: four }) };
    await boot();
    await screen.findByTestId('me-name');
    await fireEvent.press(screen.getByTestId('me-tab-about'));
    expect(await screen.findByTestId('me-work-w3')).toBeTruthy();
    expect(screen.queryByTestId('me-work-w4')).toBeNull();
  });
});

describe('M10 · Profile saved', () => {
  it('after Save on M8 the person is back on M1 and sees "Profile saved", which goes by itself', async () => {
    jest.useFakeTimers();
    try {
      answers = header();
      await boot();
      await screen.findByTestId('me-name');
      expect(screen.queryByText('Profile saved')).toBeNull();
      await act(async () => postProfileSaved());
      expect(screen.getByText('Profile saved')).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(PROFILE_SAVED_MS + 10);
      });
      await waitFor(() => expect(screen.queryByText('Profile saved')).toBeNull());
    } finally {
      jest.useRealTimers();
    }
  });
});
