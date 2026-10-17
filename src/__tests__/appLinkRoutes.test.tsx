import { Slot, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import ActivateRoute from '@/app/activate';
import RootLayout from '@/app/_layout';
import RoomLinkRoute from '@/app/c/[slug]';
import ContentLinkRoute from '@/app/content/[id]';
import ReceiptLinkRoute from '@/app/receipt/[code]';
import ProfileLinkRoute from '@/app/u/[handle]';
import WelcomeRoute from '@/app/welcome';
import { extractExpoPathFromURL } from 'expo-router/build/fork/extractPathFromURL';
import { resetSessionForTests } from '@/api/session';
import { queryClient } from '@/api/query';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

/**
 * LINKS-01 round 2: the four website paths that open the installed app on top of /r/<code> and /selfie, and what each does
 * once it has. They draw nothing of their own; each lands on a screen that already exists (stand-ins here, built and tested
 * elsewhere), signed in or signed out. `https://wawuafrica.com/<path>` and `wawu://<path>` name the same routes.
 */
const mockVault = new Map<string, string>();
const mockFetch = jest.fn();
jest.mock('@/api/env', () => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => mockFetch(input, init)) as typeof fetch;
  return { apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' };
});
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

function SignInStandIn() {
  return <View testID="sign-in" />;
}
function TransactionsStandIn() {
  return <View testID="transactions" />;
}
function HomeStandIn() {
  return <View testID="home" />;
}
function MeTabStandIn() {
  return <View testID="me-tab" />;
}
function TabsStandIn() {
  return <Slot />;
}
function WorksStandIn() {
  const { wawuId } = useLocalSearchParams<{ wawuId: string }>();
  return <View testID="works" accessibilityLabel={String(wawuId)} />;
}
function CommunityStandIn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <View testID="community" accessibilityLabel={String(id)} />;
}

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'sign-in': SignInStandIn,
  activate: ActivateRoute,
  'receipt/[code]': ReceiptLinkRoute,
  'u/[handle]': ProfileLinkRoute,
  'c/[slug]': RoomLinkRoute,
  'content/[id]': ContentLinkRoute,
  'community/[id]': CommunityStandIn,
  'transactions/index': TransactionsStandIn,
  'works/[wawuId]/index': WorksStandIn,
  '(tabs)/_layout': TabsStandIn,
  '(tabs)/index': HomeStandIn,
  '(tabs)/me': MeTabStandIn,
};

/** What the Hub says about the signed-in person, or nothing when `offline`. */
let me: { handle: string | null } | 'offline' = { handle: 'lennox' };
const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
const room = { id: 'r1', name: 'Aba tailors circle', kind: 'open', imageUrl: null, description: 'About', hostWawuId: 'h', memberCount: 3, messagesToday: 0, slug: 'aba-tailors', link: 'wawu/c/aba-tailors' };

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  queryClient.clear();
  me = { handle: 'lennox' };
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/api/hub/users/me' && me !== 'offline') {
      return ok({ wawuUserId: 'u1', sub: 'u1', firstName: 'Lennox', lastName: 'Emmanuel', accountType: 'creator', handle: me.handle });
    }
    if (request.method === 'GET' && path === '/api/hub/communities/links/aba-tailors') return ok(room);
    throw new TypeError('Network request failed');
  });
});

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

function signIn() {
  mockVault.set(ACCESS_KEY, 'stored-access');
  mockVault.set(REFRESH_KEY, 'stored-refresh');
}

const open = (url: string) => renderRouter(routes, { initialUrl: url });

describe('LINKS-01 round 2: https://wawuafrica.com/activate (the activation email)', () => {
  it('signed out opens sign-in, whatever the address carries', async () => {
    await open('https://wawuafrica.com/activate?token=abc&email=a%40b.c');
    expect(await screen.findByTestId('sign-in')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/sign-in'));
  });

  it('signed in opens Home', async () => {
    signIn();
    await open('https://wawuafrica.com/activate?token=abc&email=a%40b.c');
    expect(await screen.findByTestId('home')).toBeTruthy();
    expect(pathname()).toBe('/');
  });
});

describe('LINKS-01 round 2: https://wawuafrica.com/receipt/<code> (a receipt, never the invite path)', () => {
  it("signed in opens the wallet's history; the code is not read and no invite is claimed", async () => {
    signIn();
    await open('https://wawuafrica.com/receipt/7K3M9QX2B4TV');
    expect(await screen.findByTestId('transactions')).toBeTruthy();
    expect(pathname()).toBe('/transactions');
    const asked = mockFetch.mock.calls.map(([input]) => String((input as Request).url ?? input));
    expect(asked.some((url) => url.includes('/referral'))).toBe(false);
  });

  it('signed out opens the welcome screen', async () => {
    await open('https://wawuafrica.com/receipt/7K3M9QX2B4TV');
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/welcome'));
  });
});

describe('LINKS-01 round 2: https://wawuafrica.com/u/<handle> (a profile)', () => {
  it("a person's own handle opens the Me tab, in any case", async () => {
    signIn();
    await open('https://wawuafrica.com/u/Lennox');
    expect(await screen.findByTestId('me-tab')).toBeTruthy();
    expect(pathname()).toBe('/me');
  });

  it("someone else's handle opens that person's works, which take the handle", async () => {
    signIn();
    await open('https://wawuafrica.com/u/ada.obi');
    const works = await screen.findByTestId('works');
    expect(works.props.accessibilityLabel).toBe('ada.obi');
    expect(pathname()).toBe('/works/ada.obi');
  });

  it("when the Hub cannot be asked who the person is, the handle opens that person's works too", async () => {
    signIn();
    me = 'offline';
    await open('https://wawuafrica.com/u/lennox');
    expect((await screen.findByTestId('works')).props.accessibilityLabel).toBe('lennox');
  });

  it('a handle that cannot be one opens Home and asks the Hub nothing about it', async () => {
    signIn();
    await open('https://wawuafrica.com/u/a-b');
    expect(await screen.findByTestId('home')).toBeTruthy();
    expect(mockFetch.mock.calls.some(([input]) => String((input as Request).url ?? input).includes('/users/a-b'))).toBe(false);
  });

  it('signed out opens the welcome screen', async () => {
    await open('https://wawuafrica.com/u/ada.obi');
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/welcome'));
  });
});

describe('LINKS-01 round 2: https://wawuafrica.com/c/<slug> (a community room)', () => {
  it('signed in opens the room the slug names', async () => {
    signIn();
    await open('https://wawuafrica.com/c/aba-tailors');
    const opened = await screen.findByTestId('community');
    expect(opened.props.accessibilityLabel).toBe('r1');
  });

  it('signed out asks the person to sign in first, and shows no room', async () => {
    await open('https://wawuafrica.com/c/aba-tailors');
    expect(await screen.findByTestId('room-link-signed-out')).toBeTruthy();
    expect(screen.queryByTestId('community')).toBeNull();
  });
});

describe('FIX-60: https://wawuafrica.com/content/<id> (a piece of content)', () => {
  it('signed out opens the welcome screen, like a profile or a receipt, and asks the Hub nothing', async () => {
    await open('https://wawuafrica.com/content/3f2b8c1e-9d4a-4e7b-8a61-5c0d2f7e9b14');
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/welcome'));
    expect(mockFetch.mock.calls.some(([input]) => String((input as Request).url ?? input).includes('/content/'))).toBe(false);
  });
});

describe('LINKS-01 round 2: the ways in name the same routes', () => {
  it('https and wawu:// both give the route the router matches', () => {
    // What expo-router makes of an incoming address before it matches a route (the real function, not a stand-in).
    const pathOf = (url: string) => extractExpoPathFromURL([], url);
    for (const path of ['activate', 'receipt/7K3M9QX2B4TV', 'u/ada.obi', 'c/aba-tailors', 'r/lennox', 'selfie', 'content/pdf-1']) {
      expect(pathOf(`https://wawuafrica.com/${path}`)).toBe(path);
      expect(pathOf(`wawu://${path}`)).toBe(path);
    }
    expect(pathOf('https://wawuafrica.com/activate?token=abc&email=a%40b.c')).toMatch(/^activate\?/);
  });
});
