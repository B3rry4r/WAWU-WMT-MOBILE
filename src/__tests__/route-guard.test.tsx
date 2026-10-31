import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import type { ComponentType } from 'react';

import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import RootLayout from '@/app/_layout';
import AccountTypeRoute from '@/app/account-type';
import ForgotPasswordRoute from '@/app/forgot-password';
import SignInRoute from '@/app/sign-in';
import WelcomeRoute from '@/app/welcome';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { ACTIVATE_PATH, INVITE_PATH_PREFIX, PROFILE_PATH_PREFIX, RECEIPT_PATH_PREFIX, ROOM_PATH_PREFIX, SELFIE_PATH } from '@/lib/appLinks';

const mockVault = new Map<string, string>();

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('@/api/env', () => ({ apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

/**
 * FIX-63: every route file that needs a session is guarded by the route graph, and the ones that do not are on one short,
 * written list. A route file that is neither fails here, so a new screen cannot be added open to a signed-out visitor by
 * accident (SWEEP-APP SHARED-05 L4: 31 route files, then about 80, were open by link). The layout is read as text, so the
 * check sees the file the app runs; the second half renders the real layout with a stand-in for every guarded route.
 */

const APP_DIR = join(__dirname, '..', 'app');
const LAYOUT = readFileSync(join(APP_DIR, '_layout.tsx'), 'utf8');

/** Every route file under src/app as the router names it ("chat/[id]", "bills/index"), the layouts excluded. */
function routeFiles(dir: string = APP_DIR): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...routeFiles(full));
    else if (/\.tsx?$/.test(entry)) found.push(relative(APP_DIR, full).replace(/\.tsx?$/, ''));
  }
  return found.filter((name) => name !== '_layout' && !name.endsWith('/_layout')).sort();
}

type Block = { guard: string; screens: string[] };

/** The layout's `<Stack.Protected guard={...}>` groups with the screens each lists, and the screens listed outside every group. */
function readLayout(source: string): { blocks: Block[]; loose: string[] } {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const names = (text: string) => [...text.matchAll(/<Stack\.Screen name="([^"]+)"/g)].map((m) => m[1]);
  const blocks: Block[] = [];
  const re = /<Stack\.Protected guard=\{([\s\S]*?)\}>([\s\S]*?)<\/Stack\.Protected>/g;
  for (const m of code.matchAll(re)) blocks.push({ guard: m[1].replace(/\s+/g, ' ').trim(), screens: names(m[2]) });
  return { blocks, loose: names(code.replace(re, '')) };
}

const layout = readLayout(LAYOUT);
const signedInBlocks = layout.blocks.filter((b) => b.guard.startsWith('signedIn'));
const signedOutBlocks = layout.blocks.filter((b) => b.guard === "status === 'signedOut'");
/** The group every plain signed-in screen sits in: a session, the email step done, the name and username step done, no access-code offer on screen. */
const GENERAL_GUARD = 'signedIn && !gate.needsEmail && !gate.needsIdentity && !offer.visible';
const general = layout.blocks.filter((b) => b.guard === GENERAL_GUARD).flatMap((b) => b.screens);
const guarded = new Set(signedInBlocks.flatMap((b) => b.screens));
const signedOutSet = new Set(signedOutBlocks.flatMap((b) => b.screens));

/**
 * The PUBLIC list: route files that are open to a signed-out visitor on purpose, each with the reason. Everything else that
 * is not a tab or in the signed-out set must be listed in a signed-in group of `_layout.tsx`.
 */
const PUBLIC: Record<string, string> = {
  about: 'readable before sign-up (SETTINGS-02 R1)',
  terms: 'the Terms must be readable before sign-up (SETTINGS-02 R1)',
  'privacy-policy': 'readable before sign-up (SETTINGS-02 R1)',
  'legal-documents/index': "the owner's nine documents must be readable before sign-up: A3's \"Read them\" opens the list (LEGAL-DOCS)",
  'legal-documents/[slug]': 'one of the nine, readable before sign-up, from the Legal list (LEGAL-DOCS)',
  'r/[code]': 'app link (LINKS-01): the invite, kept until sign-up, signed out goes to the welcome screen',
  selfie: 'app link (LINKS-01): the hosted selfie page, signed out goes to the welcome screen',
  activate: 'app link (LINKS-01): the activation email, signed out goes to sign-in',
  'receipt/[code]': 'app link (LINKS-01): a receipt address, signed out goes to the welcome screen',
  'u/[handle]': 'app link (LINKS-01): a profile, signed out goes to the welcome screen',
  'c/[slug]': 'app link (LINKS-01): a room, signed out draws "Sign in to open this community"',
  'content/[id]': 'app link (FIX-60): a piece, signed out goes to the welcome screen',
  'claim-code': 'signed out goes to sign-in and the sign-in comes back here (JOIN-03 round 3, N14)',
  '+not-found': 'an address no screen answers: it leaves, signed out to the welcome screen and signed in to Home (SWEEP-APP-1, CHECK-1 F-1)',
  'dev/components': 'development only, a release build leaves (LeaveDevRoute)',
  'dev/abroad': 'development only, a release build leaves (LeaveDevRoute); the pictures of Send abroad (NUV-11)',
  'preview/auth': 'development only, a release build leaves (LeaveDevRoute)',
  'preview/pay-sheet': 'development only, a release build leaves (LeaveDevRoute)',
  'preview/pin-sheet': 'development only, a release build leaves (LeaveDevRoute)',
  'preview/points-figure': 'development only, a release build leaves (LeaveDevRoute)',
  'preview/products-meter': 'development only, a release build leaves (LeaveDevRoute)',
  'preview/studio-job': 'development only, a release build leaves (LeaveDevRoute)',
  'preview/tier-badge': 'development only, a release build leaves (LeaveDevRoute)',
  'preview/tier-cards': 'development only, a release build leaves (LeaveDevRoute)',
  'preview/voice-player': 'development only, a release build leaves (LeaveDevRoute)',
};

const files = routeFiles();
const isTab = (name: string) => name.startsWith('(tabs)/');

type Kind = 'tab' | 'guarded' | 'signed-out set' | 'public' | 'OPEN';
function classify(name: string): Kind {
  if (isTab(name)) return guarded.has('(tabs)') ? 'tab' : 'OPEN';
  if (guarded.has(name)) return 'guarded';
  if (signedOutSet.has(name)) return 'signed-out set';
  if (name in PUBLIC) return 'public';
  return 'OPEN';
}

describe('FIX-63: every route file is guarded or on the public list', () => {
  it('finds the route files and the layout (the check is not empty)', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(signedInBlocks.length).toBeGreaterThan(5);
    expect(general.length).toBeGreaterThan(80);
    expect(guarded.has('(tabs)')).toBe(true);
  });

  it('no route file is open to a signed-out visitor unless it is on the public list', () => {
    const open = files.filter((name) => classify(name) === 'OPEN');
    // A failure names the files: list each in a signed-in group of src/app/_layout.tsx, or (if it is public on purpose) in PUBLIC above.
    expect(open).toEqual([]);
  });

  it('a screen listed in the layout outside every group is on the public list', () => {
    const strays = layout.loose.filter((name) => !(name in PUBLIC));
    expect(strays).toEqual([]);
  });

  it('every name in the layout is a route file (a typo would guard nothing)', () => {
    const all = new Set(files);
    const ghosts = [...guarded, ...signedOutSet, ...layout.loose].filter((name) => name !== '(tabs)' && !all.has(name));
    expect(ghosts).toEqual([]);
  });

  it('every name on the public list is a route file, and none of them is also guarded', () => {
    const all = new Set(files);
    expect(Object.keys(PUBLIC).filter((name) => !all.has(name))).toEqual([]);
    expect(Object.keys(PUBLIC).filter((name) => guarded.has(name) || signedOutSet.has(name))).toEqual([]);
  });

  it('each route file is in exactly one signed-in group', () => {
    const seen = new Map<string, number>();
    for (const block of signedInBlocks) for (const name of block.screens) seen.set(name, (seen.get(name) ?? 0) + 1);
    expect([...seen].filter(([, n]) => n > 1).map(([name]) => name)).toEqual([]);
  });

  it('the app links (src/lib/appLinks.ts) each have a route on the public list', () => {
    const prefixes = [INVITE_PATH_PREFIX, SELFIE_PATH, ACTIVATE_PATH, RECEIPT_PATH_PREFIX, PROFILE_PATH_PREFIX, ROOM_PATH_PREFIX];
    for (const path of prefixes) {
      const first = path.replace(/^\/|\/$/g, '');
      expect(Object.keys(PUBLIC).some((name) => name === first || name.startsWith(`${first}/`))).toBe(true);
    }
  });

  it('a development-only screen leaves in a release build', () => {
    for (const name of Object.keys(PUBLIC).filter((n) => n.startsWith('dev/') || n.startsWith('preview/'))) {
      expect(readFileSync(join(APP_DIR, `${name}.tsx`), 'utf8')).toContain('LeaveDevRoute');
    }
  });

  it('/claim-code keeps its own guard: signed out it remembers the visit and goes to sign-in', () => {
    const source = readFileSync(join(APP_DIR, 'claim-code.tsx'), 'utf8');
    expect(source).toContain('rememberClaimVisit');
    expect(source).toContain('href="/sign-in"');
  });
});

describe('FIX-63: the real layout sends a signed-out visitor away from every guarded route', () => {
  const stub = (name: string) =>
    function Stub() {
      return (
        <View>
          <Text accessibilityRole="header">{`route ${name}`}</Text>
        </View>
      );
    };
  /** `chat/[id]` is opened at `/chat/x1`, `bills/index` at `/bills`. */
  const urlOf = (name: string) => `/${name.replace(/(^|\/)index$/, '').replace(/\[[^\]]+\]/g, 'x1')}`;

  const routes: Record<string, ComponentType> = {
    _layout: RootLayout,
    welcome: WelcomeRoute,
    'account-type': AccountTypeRoute,
    'sign-in': SignInRoute,
    'forgot-password': ForgotPasswordRoute,
    '(tabs)/_layout': TabsLayout,
    '(tabs)/index': Home,
    '(tabs)/explore': Explore,
    '(tabs)/inbox': Inbox,
    '(tabs)/wallet': Wallet,
    '(tabs)/me': Me,
  };
  for (const name of general) routes[name] = stub(name);

  const signedIn = () => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
  };

  beforeAll(async () => {
    const { unmount } = await renderRouter(routes);
    await unmount();
  }, 60_000);

  beforeEach(() => {
    mockVault.clear();
    resetSessionForTests();
  });

  it.each(general)('a signed-out visitor to %s lands on the welcome screen and sees nothing of it', async (name) => {
    await renderRouter(routes, { initialUrl: urlOf(name) });
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
    expect(screen.queryByRole('header', { name: `route ${name}` })).toBeNull();
  });

  it.each(general)('a signed-in visitor to %s sees it', async (name) => {
    signedIn();
    await renderRouter(routes, { initialUrl: urlOf(name) });
    await waitFor(() => expect(screen.getByRole('header', { name: `route ${name}` })).toBeTruthy());
  });
});
