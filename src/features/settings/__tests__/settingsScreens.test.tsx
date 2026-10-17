/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ActivityIndicator, Animated, Appearance, Image, Pressable, ScrollView, Text as NativeText, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockAdopt = jest.fn<Promise<void>, [{ accessToken: string; refreshToken: string }]>();
const mockSignOut = jest.fn<Promise<void>, []>();
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
  adoptSession: (pair: { accessToken: string; refreshToken: string }) => mockAdopt(pair),
  replaceTokens: (pair: { accessToken: string; refreshToken: string }) => mockAdopt(pair),
  signOut: () => mockSignOut(),
}));

jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));

type Plain = { status: number; body: unknown; headers?: Record<string, string> };
type Answer = Plain | 'offline' | 'hang' | ((body: unknown) => Promise<Plain>);
type Sent = { method: string; path: string; body: unknown; query: string; url: string };

let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined, query: url.search, url: request.url });
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hang') return new Promise<Response>(() => undefined);
  const plain = typeof answer === 'function' ? await answer(text ? JSON.parse(text) : undefined) : answer;
  return new Response(JSON.stringify(plain.body), { status: plain.status, headers: { 'content-type': 'application/json', ...plain.headers } });
}) as typeof fetch;

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, message: string, code?: string, headers?: Record<string, string>): Answer => ({
  status,
  body: { statusCode: status, message, ...(code ? { code } : {}), data: null },
  headers,
});

const NOTIFY = 'GET /api/hub/settings/notifications';
const NOTIFY_SET = 'PATCH /api/hub/settings/notifications';
const PRIVACY = 'GET /api/hub/settings/privacy';
const PRIVACY_SET = 'PATCH /api/hub/settings/privacy';
const BLOCKED = 'GET /api/hub/settings/privacy/blocked';
const EXPORTS = 'GET /api/hub/settings/privacy/export';
const EXPORT_ASK = 'POST /api/hub/settings/privacy/export';
const TGIF = 'GET /api/hub/settings/tgif';
const TGIF_SET = 'PATCH /api/hub/settings/tgif';
const ME = 'GET /api/hub/users/me';

const notifications = { userWawuId: 'u1', newReplies: true, newFollowers: true, dmReminders: true, refunds: true, promotions: false, communityDigest: false, communityMessages: false };
const privacy = { userWawuId: 'u1', showPurchases: false, showSavedItems: false, showFollowing: true, showInMemberLists: true };
const me = {
  wawuUserId: 'u1',
  firstName: 'Lennox',
  lastName: 'Emmanuel',
  email: 'lennox@example.test',
  phone: '+2348031234412',
  avatarUrl: null,
  verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } },
};
const person = (n: number, name: string | null) => ({
  id: `row-${n}`,
  userWawuId: 'u1',
  blockedWawuId: `person-${n}`,
  blockedAt: '2026-10-01T10:00:00.000Z',
  blockedUser: name ? { wawuId: `person-${n}`, name, handle: null, avatarUrl: null, verification: me.verification } : null,
});
const page = (rows: unknown[], total = rows.length): Answer => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data: rows, pagination: { currentPage: 1, nextPage: null, perPage: 100, total } },
});

const clients: QueryClient[] = [];
function frame(child: ReactElement) {
  // A mutation's own gcTime defaults to 5 minutes and sets a timer when its screen unmounts; `clear()` does not cancel it, so
  // without `gcTime: Infinity` here Jest stays up about 5 minutes after the last test passes (FIX-14).
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity, retry: false } } });
  clients.push(client);
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{child}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

const mod = <T,>(path: string) => require(path) as T;

/*
 * The first test in this file used to pay for loading the screens' modules and React Native's components (loaded on
 * first use, by babel-preset-expo's lazy imports) and for the renderer's own start: 18 s of a test's 20 s on a cold
 * transform cache, which is what a fresh checkout has. They load here, with the fetch in place, where no timeout
 * applies, and the first render of anything is paid in a hook with a budget of its own.
 */
void [
  mod('../BlockedScreen'),
  mod('../ChangePasswordScreen'),
  mod('../NotificationsScreen'),
  mod('../PrivacyScreen'),
  mod('../SettingsScreen'),
  mod('../devicePrefs'),
];
void [ActivityIndicator, Animated, Image, Pressable, ScrollView, NativeText, TextInput, View];

beforeAll(async () => {
  const warm = await render(<View />);
  warm.unmount();
});
const checked = (testID: string) => Boolean(screen.getByTestId(testID).props.accessibilityState?.checked);
const bodiesOf = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === path).map((s) => s.body);
const tap = (testID: string) => act(async () => fireEvent.press(screen.getByTestId(testID)));
/** A switch flips at once and is busy, ignoring presses, until the Hub has answered: a second tap is for after that. */
const idle = (testID: string) => waitFor(() => expect(screen.getByTestId(testID).props.accessibilityState?.busy).toBe(false));

beforeEach(() => {
  answers = {};
  sent = [];
  mockStore.clear();
  mockAdopt.mockReset().mockResolvedValue(undefined);
  mockSignOut.mockReset().mockResolvedValue(undefined);
  (require('../devicePrefs') as typeof import('../devicePrefs')).resetPrefsForTests();
});

afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

describe('Z3 · Notifications', () => {
  const boot = async () => {
    const { NotificationsScreen } = mod<typeof import('../NotificationsScreen')>('../NotificationsScreen');
    const onBack = jest.fn();
    await render(frame(<NotificationsScreen onBack={onBack} />));
    return onBack;
  };

  it('shows each switch as the Hub holds it, and a key the Hub never held as on', async () => {
    answers[NOTIFY] = ok(notifications);
    await boot();
    await screen.findByTestId('notify-moneyIn');
    expect(checked('notify-moneyIn')).toBe(true);
    expect(checked('notify-refunds')).toBe(true);
    expect(checked('notify-dmReminders')).toBe(true);
    expect(checked('notify-communityMessages')).toBe(false);
    expect(checked('notify-contentReviews')).toBe(true);
    expect(checked('notify-newFollowers')).toBe(true);
    expect(checked('notify-promotions')).toBe(false);
    for (const word of ['Money', 'Messages', 'Content', 'Money in', 'Tips, sales, transfers', 'Refunds', 'Paid questions', 'Including reply deadlines', 'Community messages', 'Reviews', 'Approved or sent back', 'New followers', 'From Who Made This?', 'News and offers']) {
      expect(screen.getByText(word)).toBeTruthy();
    }
  });

  it('a user can switch each category: one request carrying that one key, and the switch shows the answer', async () => {
    answers[NOTIFY] = ok(notifications);
    await boot();
    await screen.findByTestId('notify-moneyIn');
    const cases: { testID: string; key: string; before: boolean }[] = [
      { testID: 'notify-moneyIn', key: 'moneyIn', before: true },
      { testID: 'notify-refunds', key: 'refunds', before: true },
      { testID: 'notify-dmReminders', key: 'dmReminders', before: true },
      { testID: 'notify-communityMessages', key: 'communityMessages', before: false },
      { testID: 'notify-contentReviews', key: 'contentReviews', before: true },
      { testID: 'notify-newFollowers', key: 'newFollowers', before: true },
      { testID: 'notify-promotions', key: 'promotions', before: false },
    ];
    for (const { testID, key, before } of cases) {
      answers[NOTIFY_SET] = ok({ ...notifications, [key]: !before });
      await tap(testID);
      await waitFor(() => expect(checked(testID)).toBe(!before));
    }
    expect(bodiesOf('PATCH', '/api/hub/settings/notifications')).toEqual(cases.map(({ key, before }) => ({ [key]: !before })));
  });

  it('flips the switch back and says why when the save fails', async () => {
    answers[NOTIFY] = ok(notifications);
    answers[NOTIFY_SET] = refusal(500, 'The server is having trouble.');
    await boot();
    await screen.findByTestId('notify-refunds');
    await tap('notify-refunds');
    expect(await screen.findByTestId('notify-problem')).toBeTruthy();
    expect(screen.getByText('That did not save. Try again.')).toBeTruthy();
    expect(screen.queryByText('The server is having trouble.')).toBeNull();
    expect(checked('notify-refunds')).toBe(true);
  });

  it('flips the switch back with no connection, in the app\'s own words', async () => {
    answers[NOTIFY] = ok(notifications);
    answers[NOTIFY_SET] = 'offline';
    await boot();
    await screen.findByTestId('notify-refunds');
    await tap('notify-refunds');
    expect(await screen.findByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(checked('notify-refunds')).toBe(true);
  });

  it('ignores a second tap on a switch while its save is in flight', async () => {
    answers[NOTIFY] = ok(notifications);
    answers[NOTIFY_SET] = 'hang';
    await boot();
    await screen.findByTestId('notify-refunds');
    await tap('notify-refunds');
    expect(checked('notify-refunds')).toBe(false);
    await tap('notify-refunds');
    expect(bodiesOf('PATCH', '/api/hub/settings/notifications')).toHaveLength(1);
  });

  it('one switch saving late never undoes another switch tapped meanwhile', async () => {
    answers[NOTIFY] = ok(notifications);
    let release: (answer: Plain) => void = () => undefined;
    const slow = new Promise<Plain>((resolve) => {
      release = resolve;
    });
    answers[NOTIFY_SET] = async (body) => ('refunds' in (body as object) ? slow : ok({ ...notifications, ...(body as object) }) as Plain);
    await boot();
    await screen.findByTestId('notify-refunds');
    await tap('notify-refunds');
    await tap('notify-promotions');
    await waitFor(() => expect(checked('notify-promotions')).toBe(true));
    await act(async () => {
      release(ok({ ...notifications, refunds: false }) as Plain);
    });
    await waitFor(() => expect(checked('notify-refunds')).toBe(false));
    expect(checked('notify-promotions')).toBe(true);
  });

  it('shows the loading view while the settings are on the way, then a retry when they never come', async () => {
    // The first read is held until the loading view has been seen. Answered at once, the refusal could land inside
    // `render`'s own act (how far it gets depends on the machine's timing), so the loading view was sometimes gone
    // before it was looked for.
    let answerNow: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      answerNow = resolve;
    });
    answers[NOTIFY] = [
      async () => {
        await held;
        return refusal(500, 'The server is having trouble.') as Plain;
      },
      ok(notifications),
    ];
    await boot();
    expect(screen.getByTestId('notify-loading')).toBeTruthy();
    expect(screen.queryByTestId('notify-error')).toBeNull();
    await act(async () => answerNow());
    expect(await screen.findByTestId('notify-error')).toBeTruthy();
    expect(screen.queryByTestId('notify-loading')).toBeNull();
    await act(async () => fireEvent.press(screen.getByLabelText('Try again')));
    expect(await screen.findByTestId('notify-moneyIn')).toBeTruthy();
  });

  it('tells a missing connection apart from a server fault', async () => {
    answers[NOTIFY] = 'offline';
    await boot();
    expect(await screen.findByText('No connection')).toBeTruthy();
  });
});

describe('a switch row', () => {
  it('ignores a press while its own save is in flight, and reports the value asked for otherwise', async () => {
    const { SwitchRow } = mod<typeof import('@/components/SwitchRow')>('@/components/SwitchRow');
    const onChange = jest.fn();
    await render(frame(<SwitchRow testID="row" title="Refunds" on={false} busy onChange={onChange} />));
    await tap('row');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('row').props.accessibilityState).toMatchObject({ checked: false, busy: true });
    await render(frame(<SwitchRow testID="row2" title="Refunds" on={false} onChange={onChange} />));
    await tap('row2');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Z4 · Privacy', () => {
  const boot = async () => {
    const { PrivacyScreen } = mod<typeof import('../PrivacyScreen')>('../PrivacyScreen');
    const props = { onBack: jest.fn(), onOpenBlocked: jest.fn(), onOpenPolicy: jest.fn() };
    await render(frame(<PrivacyScreen {...props} />));
    return props;
  };
  const serve = (over: Record<string, Answer | Answer[]> = {}) => {
    answers = { [PRIVACY]: ok(privacy), [BLOCKED]: page([person(1, 'Spam Account'), person(2, 'Tunde K.')]), [EXPORTS]: ok([]), ...over };
  };

  it('shows each switch as the Hub holds it, with the purchases line shown only while it is off', async () => {
    serve();
    await boot();
    await screen.findByTestId('privacy-showPurchases');
    expect(checked('privacy-showPurchases')).toBe(false);
    expect(checked('privacy-showSavedItems')).toBe(false);
    expect(checked('privacy-showFollowing')).toBe(true);
    expect(checked('privacy-showInMemberLists')).toBe(true);
    expect(screen.getByText('Off, nobody sees your purchases')).toBeTruthy();
    expect(screen.getByText('Your messages are visible either way')).toBeTruthy();
  });

  it('a user can switch each one, one key per request', async () => {
    serve();
    await boot();
    await screen.findByTestId('privacy-showPurchases');
    const cases = [
      { testID: 'privacy-showPurchases', key: 'showPurchases', before: false },
      { testID: 'privacy-showSavedItems', key: 'showSavedItems', before: false },
      { testID: 'privacy-showFollowing', key: 'showFollowing', before: true },
      { testID: 'privacy-showInMemberLists', key: 'showInMemberLists', before: true },
    ];
    for (const { testID, key, before } of cases) {
      answers[PRIVACY_SET] = ok({ ...privacy, [key]: !before });
      await tap(testID);
      await waitFor(() => expect(checked(testID)).toBe(!before));
    }
    expect(bodiesOf('PATCH', '/api/hub/settings/privacy')).toEqual(cases.map(({ key, before }) => ({ [key]: !before })));
    expect(screen.queryByText('Off, nobody sees your purchases')).toBeNull();
    expect(screen.queryByText(/people can see/)).toBeNull();
  });

  it('shows how many people are blocked, and a user can open the list and the privacy policy', async () => {
    serve();
    const props = await boot();
    await screen.findByTestId('privacy-blocked');
    expect(await screen.findByText('2')).toBeTruthy();
    await tap('privacy-blocked');
    expect(props.onOpenBlocked).toHaveBeenCalledTimes(1);
    await tap('privacy-policy');
    expect(props.onOpenPolicy).toHaveBeenCalledTimes(1);
  });

  it('says None when nobody is blocked', async () => {
    serve({ [BLOCKED]: page([]) });
    await boot();
    expect(await screen.findByText('None')).toBeTruthy();
  });

  it('a user can request their data: the row asks first, then sends one request, and the row says it is on its way', async () => {
    serve({ [EXPORTS]: [ok([]), ok([{ id: 'x1', userWawuId: 'u1', status: 'pending', requestedAt: '2026-10-07T10:00:00.000Z' }])], [EXPORT_ASK]: { status: 201, body: { statusCode: 201, message: 'Created', data: { id: 'x1', userWawuId: 'u1', status: 'pending', requestedAt: '2026-10-07T10:00:00.000Z' } } } });
    await boot();
    await screen.findByText('Sent to your email');
    await tap('privacy-export');
    expect(sent.filter((s) => s.method === 'POST')).toHaveLength(0);
    await tap('export-send');
    await waitFor(() => expect(screen.getByText('On its way to your email')).toBeTruthy());
    expect(sent.filter((s) => s.method === 'POST' && s.path === '/api/hub/settings/privacy/export')).toHaveLength(1);
    expect(screen.queryByTestId('export-send')).toBeNull();
  });

  it('does not offer a second request while one is on its way', async () => {
    serve({ [EXPORTS]: ok([{ id: 'x1', userWawuId: 'u1', status: 'pending', requestedAt: '2026-10-07T10:00:00.000Z' }]) });
    await boot();
    await screen.findByText('On its way to your email');
    await tap('privacy-export');
    expect(screen.queryByTestId('export-send')).toBeNull();
    expect(screen.getByText('Your data is already on its way to your email. Check your inbox soon.')).toBeTruthy();
  });

  it('says when a data request could not be sent, and lets the user ask again', async () => {
    serve({ [EXPORTS]: ok([{ id: 'x1', userWawuId: 'u1', status: 'failed', requestedAt: '2026-10-07T10:00:00.000Z' }]) });
    await boot();
    expect(await screen.findByText('Could not be sent, tap to try again')).toBeTruthy();
    await tap('privacy-export');
    expect(screen.getByTestId('export-send')).toBeTruthy();
  });

  it('keeps the sheet open and says why when the request is refused', async () => {
    serve({ [EXPORT_ASK]: refusal(500, 'The server is having trouble.') });
    await boot();
    await screen.findByText('Sent to your email');
    await tap('privacy-export');
    await tap('export-send');
    expect(await screen.findByTestId('export-problem')).toBeTruthy();
    expect(screen.getByTestId('export-send')).toBeTruthy();
  });
});

describe('Z5 · Blocked accounts and Z12 · Nobody blocked', () => {
  const boot = async () => {
    const { BlockedScreen } = mod<typeof import('../BlockedScreen')>('../BlockedScreen');
    await render(frame(<BlockedScreen onBack={jest.fn()} />));
  };

  it('lists the people the Hub says are blocked, each with Unblock, and the caption', async () => {
    answers[BLOCKED] = page([person(1, 'Spam Account'), person(2, 'Tunde K.')]);
    await boot();
    expect(await screen.findByText('Spam Account')).toBeTruthy();
    expect(screen.getByText('Tunde K.')).toBeTruthy();
    expect(screen.getAllByText('Unblock')).toHaveLength(2);
    expect(screen.getByText("They can't message you, see your profile or find you in search.")).toBeTruthy();
  });

  it('a user can unblock: the block\'s own id is deleted, the person leaves the list, and the last one gives Z12', async () => {
    answers[BLOCKED] = page([person(1, 'Spam Account'), person(2, 'Tunde K.')]);
    answers['DELETE /api/hub/settings/privacy/blocked/row-1'] = ok(null);
    answers['DELETE /api/hub/settings/privacy/blocked/row-2'] = ok(null);
    await boot();
    await screen.findByText('Spam Account');
    await tap('blocked-unblock-row-1');
    await waitFor(() => expect(screen.queryByText('Spam Account')).toBeNull());
    expect(screen.getByText('Tunde K.')).toBeTruthy();
    expect(sent.filter((s) => s.method === 'DELETE').map((s) => s.path)).toEqual(['/api/hub/settings/privacy/blocked/row-1']);
    await tap('blocked-unblock-row-2');
    expect(await screen.findByText('Nobody blocked')).toBeTruthy();
    expect(screen.getByText('Block someone from their profile menu.')).toBeTruthy();
    expect(screen.queryByTestId('blocked-caption')).toBeNull();
  });

  it('keeps the person and says why when unblocking fails', async () => {
    answers[BLOCKED] = page([person(1, 'Spam Account')]);
    answers['DELETE /api/hub/settings/privacy/blocked/row-1'] = refusal(500, 'The server is having trouble.');
    await boot();
    await screen.findByText('Spam Account');
    await tap('blocked-unblock-row-1');
    expect(await screen.findByTestId('blocked-problem')).toBeTruthy();
    expect(screen.getByText('Spam Account')).toBeTruthy();
  });

  it('treats a block that is already gone as unblocked', async () => {
    answers[BLOCKED] = page([person(1, 'Spam Account')]);
    answers['DELETE /api/hub/settings/privacy/blocked/row-1'] = refusal(404, 'Not found');
    await boot();
    await screen.findByText('Spam Account');
    await tap('blocked-unblock-row-1');
    expect(await screen.findByText('Nobody blocked')).toBeTruthy();
  });

  it('shows Z12 for a user with nobody blocked', async () => {
    answers[BLOCKED] = page([]);
    await boot();
    expect(await screen.findByTestId('blocked-empty')).toBeTruthy();
    expect(screen.getByText('Nobody blocked')).toBeTruthy();
  });

  it('names a person who is no longer there without a blank row', async () => {
    answers[BLOCKED] = page([person(1, null)]);
    await boot();
    expect(await screen.findByText('Account removed')).toBeTruthy();
  });

  it('reads every page the Hub has', async () => {
    const first = { status: 200, body: { statusCode: 200, message: 'OK', data: [person(1, 'Spam Account')], pagination: { currentPage: 1, nextPage: 2, perPage: 100, total: 2 } } };
    answers[BLOCKED] = [first, page([person(2, 'Tunde K.')], 2)];
    await boot();
    expect(await screen.findByText('Tunde K.')).toBeTruthy();
    expect(screen.getByText('Spam Account')).toBeTruthy();
    expect(sent.filter((s) => s.path.endsWith('/blocked')).map((s) => s.query)).toEqual(['?page=1&perPage=100', '?page=2&perPage=100']);
  });

  it('shows an error with a way to try again when the list cannot be read', async () => {
    answers[BLOCKED] = [refusal(500, 'The server is having trouble.'), page([person(1, 'Spam Account')])];
    await boot();
    expect(await screen.findByTestId('blocked-error')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByLabelText('Try again')));
    expect(await screen.findByText('Spam Account')).toBeTruthy();
  });
});

describe('Z2 · Settings', () => {
  const props = () => ({
    onBack: jest.fn(),
    onOpenProfile: jest.fn(),
    onOpenNotifications: jest.fn(),
    onOpenPrivacy: jest.fn(),
    onOpenPassword: jest.fn(),
    onOpenAbout: jest.fn(),
    onOpenTerms: jest.fn(),
    onOpenPolicy: jest.fn(),
    onSignedOut: jest.fn(),
  });
  const boot = async () => {
    const { SettingsScreen } = mod<typeof import('../SettingsScreen')>('../SettingsScreen');
    const p = props();
    await render(frame(<SettingsScreen {...p} />));
    return p;
  };
  const serve = (over: Record<string, Answer | Answer[]> = {}) => {
    answers = { [ME]: ok(me), [TGIF]: ok({ show: true }), ...over };
  };

  it('shows the name, the tick, the email and the phone with only its last four digits', async () => {
    serve();
    await boot();
    expect(await screen.findByText('Lennox Emmanuel')).toBeTruthy();
    expect(screen.getByText('lennox@example.test · 0803 ••• 4412')).toBeTruthy();
    expect(screen.getByTestId('tick-creator')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain('8031234412');
  });

  it('draws no tier on any row and no em-dash, and names the app, not WAWU', async () => {
    serve();
    await boot();
    await screen.findByText('Lennox Emmanuel');
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/Tier|WAWU|Fintava|—/);
    expect(screen.getByText('About Who Made This?')).toBeTruthy();
  });

  it('a user can open Notifications, Privacy, Password, About, Terms and Privacy policy, and their own details', async () => {
    serve();
    const p = await boot();
    await screen.findByText('Lennox Emmanuel');
    await tap('settings-notifications');
    await tap('settings-privacy');
    await tap('settings-password');
    await tap('settings-about-app');
    await tap('settings-terms');
    await tap('settings-policy');
    await tap('settings-header');
    expect(p.onOpenNotifications).toHaveBeenCalledTimes(1);
    expect(p.onOpenPrivacy).toHaveBeenCalledTimes(1);
    expect(p.onOpenPassword).toHaveBeenCalledTimes(1);
    expect(p.onOpenAbout).toHaveBeenCalledTimes(1);
    expect(p.onOpenTerms).toHaveBeenCalledTimes(1);
    expect(p.onOpenPolicy).toHaveBeenCalledTimes(1);
    expect(p.onOpenProfile).toHaveBeenCalledTimes(1);
  });

  it('DV2-06 · the switch reads "TGIF each morning" with the notification line, names no time, and keeps writing /settings/tgif', async () => {
    serve({ [TGIF_SET]: ok({ show: false }) });
    await boot();
    await screen.findByTestId('settings-tgif');
    expect(screen.getByText('TGIF each morning')).toBeTruthy();
    expect(screen.getByText('Daily verse and prayer, as a notification')).toBeTruthy();
    expect(screen.queryByText('TGIF on Home')).toBeNull();
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/\d{1,2}:\d{2}|\d\s?(am|pm)\b/i);
    await tap('settings-tgif');
    await waitFor(() => expect(checked('settings-tgif')).toBe(false));
    expect(bodiesOf('PATCH', '/api/hub/settings/tgif')).toEqual([{ show: false }]);
  });

  it('a user can switch TGIF off and on: the Hub holds it, and the switch follows the answer', async () => {
    serve({ [TGIF_SET]: [ok({ show: false }), ok({ show: true })] });
    await boot();
    await screen.findByTestId('settings-tgif');
    expect(checked('settings-tgif')).toBe(true);
    await tap('settings-tgif');
    await waitFor(() => expect(checked('settings-tgif')).toBe(false));
    await idle('settings-tgif');
    await tap('settings-tgif');
    await waitFor(() => expect(checked('settings-tgif')).toBe(true));
    await idle('settings-tgif');
    expect(bodiesOf('PATCH', '/api/hub/settings/tgif')).toEqual([{ show: false }, { show: true }]);
  });

  it('puts TGIF back and says why when the Hub refuses', async () => {
    serve({ [TGIF_SET]: refusal(500, 'The server is having trouble.') });
    await boot();
    await screen.findByTestId('settings-tgif');
    await tap('settings-tgif');
    expect(await screen.findByTestId('settings-problem-tgif')).toBeTruthy();
    expect(checked('settings-tgif')).toBe(true);
  });

  it('never guesses the TGIF switch: it is a placeholder while loading and a retry when it failed', async () => {
    serve({ [TGIF]: [refusal(500, 'The server is having trouble.'), ok({ show: false })] });
    await boot();
    expect(screen.getByTestId('settings-tgif-pending')).toBeTruthy();
    await waitFor(() => expect(screen.getByLabelText('TGIF each morning did not load. Try again')).toBeTruthy());
    expect(screen.queryByTestId('settings-tgif')).toBeNull();
    await act(async () => fireEvent.press(screen.getByLabelText('TGIF each morning did not load. Try again')));
    await screen.findByTestId('settings-tgif');
    expect(checked('settings-tgif')).toBe(false);
  });

  it('shows a quiet header while the account loads and a retry when it cannot', async () => {
    serve({ [ME]: [refusal(500, 'The server is having trouble.'), ok(me)] });
    await boot();
    expect(screen.getByTestId('settings-header-pending')).toBeTruthy();
    await screen.findByTestId('settings-header-retry');
    await act(async () => fireEvent.press(screen.getByTestId('settings-header-retry')));
    expect(await screen.findByText('Lennox Emmanuel')).toBeTruthy();
  });

  it('a user can switch Sound on, and it is kept on the phone, not sent anywhere', async () => {
    serve();
    await boot();
    await screen.findByTestId('settings-sound');
    expect(checked('settings-sound')).toBe(false);
    await tap('settings-sound');
    await waitFor(() => expect(checked('settings-sound')).toBe(true));
    expect(mockStore.get('wmt.pref.sound')).toBe('on');
    expect(sent.filter((s) => s.method !== 'GET')).toHaveLength(0);
  });

  it('a user can pick a theme: the sheet offers System, Light and Dark, the choice pins the app and shows on the row', async () => {
    serve();
    const setScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
    await boot();
    await screen.findByTestId('settings-theme');
    expect(screen.getByTestId('settings-theme-value').props.children).toBe('System');
    await tap('settings-theme');
    for (const label of ['System', 'Light', 'Dark']) expect(screen.getByLabelText(label)).toBeTruthy();
    expect(screen.getByTestId('theme-system').props.accessibilityState.checked).toBe(true);
    await tap('theme-dark');
    await waitFor(() => expect(screen.getByTestId('settings-theme-value').props.children).toBe('Dark'));
    expect(setScheme).toHaveBeenLastCalledWith('dark');
    expect(mockStore.get('wmt.pref.theme')).toBe('dark');
    setScheme.mockRestore();
  });

  it('a user can sign out: the refresh token is ended on the server, then the phone signs out and leaves Settings', async () => {
    serve({ 'POST /auth/logout': { status: 200, body: { data: { signedOut: true } } } });
    const p = await boot();
    await screen.findByTestId('settings-sign-out');
    await tap('settings-sign-out');
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(bodiesOf('POST', '/auth/logout')).toEqual([{ refreshToken: 'refresh-1' }]);
    expect(p.onSignedOut).toHaveBeenCalledTimes(1);
  });

  it('asks the server before it signs the phone out, never after', async () => {
    const order: string[] = [];
    mockSignOut.mockImplementation(async () => {
      order.push('signOut');
    });
    serve({
      'POST /auth/logout': async () => {
        order.push('logout');
        return { status: 200, body: { data: { signedOut: true } } };
      },
    });
    await boot();
    await screen.findByTestId('settings-sign-out');
    await tap('settings-sign-out');
    await waitFor(() => expect(order).toEqual(['logout', 'signOut']));
  });

  it('still signs the phone out when the server cannot be reached', async () => {
    serve({ 'POST /auth/logout': 'offline' });
    const p = await boot();
    await screen.findByTestId('settings-sign-out');
    await tap('settings-sign-out');
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(p.onSignedOut).toHaveBeenCalledTimes(1);
  });

  it('does not keep the person waiting for a slow server: after 3 seconds the phone signs out and the request carries on', async () => {
    jest.useFakeTimers();
    try {
      serve({ 'POST /auth/logout': 'hang' });
      const p = await boot();
      await screen.findByTestId('settings-sign-out');
      await tap('settings-sign-out');
      expect(mockSignOut).not.toHaveBeenCalled();
      await act(async () => {
        jest.advanceTimersByTime(2900);
      });
      expect(mockSignOut).not.toHaveBeenCalled();
      await act(async () => {
        jest.advanceTimersByTime(200);
      });
      await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
      expect(p.onSignedOut).toHaveBeenCalledTimes(1);
      expect(bodiesOf('POST', '/auth/logout')).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('signs out once however many times it is tapped', async () => {
    jest.useFakeTimers();
    try {
      serve({ 'POST /auth/logout': 'hang' });
      await boot();
      await screen.findByTestId('settings-sign-out');
      await tap('settings-sign-out');
      await tap('settings-sign-out');
      expect(bodiesOf('POST', '/auth/logout')).toHaveLength(1);
      await act(async () => {
        jest.advanceTimersByTime(3100);
      });
      await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    } finally {
      jest.useRealTimers();
    }
  });

  it('signs out once when Sign out is pressed twice in the same frame', async () => {
    jest.useFakeTimers();
    try {
      serve({ 'POST /auth/logout': { status: 200, body: { data: { signedOut: true } } } });
      await boot();
      await screen.findByTestId('settings-sign-out');
      await act(async () => {
        fireEvent.press(screen.getByTestId('settings-sign-out'));
        fireEvent.press(screen.getByTestId('settings-sign-out'));
      });
      await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
      expect(bodiesOf('POST', '/auth/logout')).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('says why when the phone cannot sign out, and stays where it is', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('storage failed'));
    serve({ 'POST /auth/logout': { status: 200, body: { data: { signedOut: true } } } });
    const p = await boot();
    await screen.findByTestId('settings-sign-out');
    await tap('settings-sign-out');
    expect(await screen.findByTestId('settings-problem')).toBeTruthy();
    expect(p.onSignedOut).not.toHaveBeenCalled();
  });
});

describe('Change password', () => {
  const CHANGE = 'POST /auth/change-password';
  const boot = async () => {
    const { ChangePasswordScreen } = mod<typeof import('../ChangePasswordScreen')>('../ChangePasswordScreen');
    const p = { onBack: jest.fn(), onDone: jest.fn() };
    await render(frame(<ChangePasswordScreen {...p} />));
    return p;
  };
  const fill = async (current: string, next: string) => {
    await fireEvent.changeText(screen.getByTestId('password-current'), current);
    await fireEvent.changeText(screen.getByTestId('password-new'), next);
  };
  const newTokens = { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } };

  it('a user can change their password: both passwords are sent, the new session is kept, and the screen says so before it closes', async () => {
    jest.useFakeTimers();
    try {
      answers[CHANGE] = { status: 200, body: newTokens };
      const p = await boot();
      await fill('old-password', 'new-password-1');
      await tap('password-save');
      await waitFor(() => expect(mockAdopt).toHaveBeenCalledWith({ accessToken: 'access-2', refreshToken: 'refresh-2' }));
      expect(bodiesOf('POST', '/auth/change-password')).toEqual([{ currentPassword: 'old-password', newPassword: 'new-password-1' }]);
      expect(await screen.findByText('Password changed')).toBeTruthy();
      expect(p.onDone).not.toHaveBeenCalled();
      await act(async () => {
        jest.advanceTimersByTime(1300);
      });
      expect(p.onDone).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('sends nothing for an empty form, or a new password under 8 characters', async () => {
    await boot();
    await tap('password-save');
    expect(await screen.findByText('Enter your current password.')).toBeTruthy();
    expect(screen.getByText('Enter a new password.')).toBeTruthy();
    await fill('old-password', 'short');
    await tap('password-save');
    expect(await screen.findByText('Use at least 8 characters.')).toBeTruthy();
    expect(sent).toHaveLength(0);
  });

  it('says the current password is wrong on that field, and keeps what was typed and the old session', async () => {
    answers[CHANGE] = refusal(400, 'The current password is wrong.', 'CURRENT_PASSWORD_WRONG');
    await boot();
    await fill('not-it', 'new-password-1');
    await tap('password-save');
    expect(await screen.findByText('That is not your current password.')).toBeTruthy();
    expect(screen.getByTestId('password-current').props.value).toBe('not-it');
    expect(screen.getByTestId('password-new').props.value).toBe('new-password-1');
    expect(mockAdopt).not.toHaveBeenCalled();
  });

  it('says the new password must differ when WAWU ID says it is unchanged', async () => {
    answers[CHANGE] = refusal(400, 'Same.', 'PASSWORD_UNCHANGED');
    await boot();
    await fill('same-password', 'same-password');
    await tap('password-save');
    expect(await screen.findByText('Choose a password that is different from your current one.')).toBeTruthy();
  });

  it('says how long to wait when too many guesses were made', async () => {
    answers[CHANGE] = { status: 429, body: { statusCode: 429, message: 'Slow down.', code: 'RATE_LIMITED', retryAfterSeconds: 900 } };
    await boot();
    await fill('guess-one', 'new-password-1');
    await tap('password-save');
    expect(await screen.findByText('Too many tries')).toBeTruthy();
    expect(screen.getByText('Wait 15 minutes and try again.')).toBeTruthy();
  });

  it('reads the wait from the Retry-After header when the body has none', async () => {
    answers[CHANGE] = refusal(429, 'Slow down.', 'RATE_LIMITED', { 'retry-after': '120' });
    await boot();
    await fill('guess-one', 'new-password-1');
    await tap('password-save');
    expect(await screen.findByText('Wait 2 minutes and try again.')).toBeTruthy();
  });

  it('says there is no connection, and lets the user try again', async () => {
    answers[CHANGE] = ['offline' as const, { status: 200, body: newTokens }];
    await boot();
    await fill('old-password', 'new-password-1');
    await tap('password-save');
    expect(await screen.findByText('No connection')).toBeTruthy();
    await tap('password-save');
    await waitFor(() => expect(mockAdopt).toHaveBeenCalledTimes(1));
  });

  it('sends one request however many times Save is tapped', async () => {
    answers[CHANGE] = 'hang';
    await boot();
    await fill('old-password', 'new-password-1');
    await tap('password-save');
    await tap('password-save');
    expect(bodiesOf('POST', '/auth/change-password')).toHaveLength(1);
  });

  it('refuses an answer that carries no session instead of keeping half of one', async () => {
    answers[CHANGE] = { status: 200, body: { data: { accessToken: 'only-access' } } };
    await boot();
    await fill('old-password', 'new-password-1');
    await tap('password-save');
    expect(await screen.findByText('Your password was changed')).toBeTruthy();
    expect(screen.getByText('Sign in again with your new password.')).toBeTruthy();
    expect(mockAdopt).not.toHaveBeenCalled();
  });

  it('still reports the change when only the session cleanup fails', async () => {
    jest.useFakeTimers();
    try {
      mockAdopt.mockRejectedValueOnce(new Error('listener failed'));
      answers[CHANGE] = { status: 200, body: newTokens };
      await boot();
      await fill('old-password', 'new-password-1');
      await tap('password-save');
      expect(await screen.findByText('Password changed')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });
});

const CHANGE = 'POST /auth/change-password';

describe('the passwords never travel in a URL (D4)', () => {
  const NEW = 'new-password-1&x=y';
  const OLD = 'old password/1?';
  const boot = async () => {
    const { ChangePasswordScreen } = mod<typeof import('../ChangePasswordScreen')>('../ChangePasswordScreen');
    const p = { onBack: jest.fn(), onDone: jest.fn() };
    await render(frame(<ChangePasswordScreen {...p} />));
    return p;
  };
  const fill = async () => {
    await fireEvent.changeText(screen.getByTestId('password-current'), OLD);
    await fireEvent.changeText(screen.getByTestId('password-new'), NEW);
  };
  const forms = (secret: string) => [secret, encodeURIComponent(secret), encodeURI(secret), secret.replace(/ /g, '+'), btoa(secret)];
  const noUrlHoldsAPassword = () => {
    expect(sent.length).toBeGreaterThan(0);
    for (const request of sent) {
      expect(request.query).toBe('');
      for (const secret of [OLD, NEW]) {
        for (const form of forms(secret)) expect(request.url).not.toContain(form);
      }
    }
  };

  it.each([
    ['saved', { status: 200, body: { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } } } as Answer],
    ['wrong current password', refusal(400, 'wrong', 'CURRENT_PASSWORD_WRONG')],
    ['too many tries', refusal(429, 'slow', 'RATE_LIMITED', { 'retry-after': '120' })],
    ['server fault', refusal(500, 'Internal server error')],
  ])('sends both only in the JSON body of one POST, and nowhere in the URL (%s)', async (_name, answer) => {
    jest.useFakeTimers();
    try {
      answers[CHANGE] = answer;
      await boot();
      await fill();
      await tap('password-save');
      await waitFor(() => expect(bodiesOf('POST', '/auth/change-password')).toHaveLength(1));
      expect(bodiesOf('POST', '/auth/change-password')).toEqual([{ currentPassword: OLD, newPassword: NEW }]);
      noUrlHoldsAPassword();
      expect(sent.every((request) => request.method === 'POST' && request.path === '/auth/change-password')).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('no screen shows the server\'s own words', () => {
  const RAW = ['Unauthorized', 'Internal server error', 'Validation failed (uuid v 4 is expected)', 'Bad Gateway', 'Forbidden resource'];
  const raws = [
    ['Unauthorized', 401],
    ['Internal server error', 500],
    ['Validation failed (uuid v 4 is expected)', 400],
    ['Bad Gateway', 502],
    ['Forbidden resource', 403],
  ] as const;
  const noRawWords = () => {
    const shown = JSON.stringify(screen.toJSON());
    for (const words of RAW) expect(shown).not.toContain(words);
  };

  it.each(raws)('Z3, a switch that fails (%s, %i)', async (words, status) => {
    answers[NOTIFY] = ok(notifications);
    answers[NOTIFY_SET] = refusal(status, words);
    const { NotificationsScreen } = mod<typeof import('../NotificationsScreen')>('../NotificationsScreen');
    await render(frame(<NotificationsScreen onBack={jest.fn()} />));
    await screen.findByTestId('notify-refunds');
    await tap('notify-refunds');
    expect(await screen.findByTestId('notify-problem')).toBeTruthy();
    noRawWords();
  });

  it.each(raws)('Z3, settings that cannot be loaded (%s, %i)', async (words, status) => {
    answers[NOTIFY] = refusal(status, words);
    const { NotificationsScreen } = mod<typeof import('../NotificationsScreen')>('../NotificationsScreen');
    await render(frame(<NotificationsScreen onBack={jest.fn()} />));
    expect(await screen.findByText('This could not be loaded')).toBeTruthy();
    noRawWords();
  });

  it.each(raws)('Z4, the data request is refused (%s, %i)', async (words, status) => {
    answers[PRIVACY] = ok(privacy);
    answers[BLOCKED] = page([]);
    answers[EXPORTS] = ok([]);
    answers[EXPORT_ASK] = refusal(status, words);
    const { PrivacyScreen } = mod<typeof import('../PrivacyScreen')>('../PrivacyScreen');
    await render(frame(<PrivacyScreen onBack={jest.fn()} onOpenBlocked={jest.fn()} onOpenPolicy={jest.fn()} />));
    await screen.findByText('Sent to your email');
    await tap('privacy-export');
    await tap('export-send');
    expect(await screen.findByTestId('export-problem')).toBeTruthy();
    noRawWords();
  });

  it.each(raws)('Z5, an unblock that fails (%s, %i)', async (words, status) => {
    answers[BLOCKED] = page([person(1, 'Spam Account')]);
    answers['DELETE /api/hub/settings/privacy/blocked/row-1'] = refusal(status, words);
    const { BlockedScreen } = mod<typeof import('../BlockedScreen')>('../BlockedScreen');
    await render(frame(<BlockedScreen onBack={jest.fn()} />));
    await screen.findByText('Spam Account');
    await tap('blocked-unblock-row-1');
    expect(await screen.findByTestId('blocked-problem')).toBeTruthy();
    noRawWords();
  });

  it.each(raws)('Z5, a list that cannot be loaded (%s, %i)', async (words, status) => {
    answers[BLOCKED] = refusal(status, words);
    const { BlockedScreen } = mod<typeof import('../BlockedScreen')>('../BlockedScreen');
    await render(frame(<BlockedScreen onBack={jest.fn()} />));
    expect(await screen.findByTestId('blocked-error')).toBeTruthy();
    noRawWords();
  });

  it.each(raws)('Z2, a TGIF switch that fails (%s, %i)', async (words, status) => {
    answers[ME] = ok(me);
    answers[TGIF] = ok({ show: true });
    answers[TGIF_SET] = refusal(status, words);
    const { SettingsScreen } = mod<typeof import('../SettingsScreen')>('../SettingsScreen');
    await render(
      frame(
        <SettingsScreen
          onBack={jest.fn()}
          onOpenProfile={jest.fn()}
          onOpenNotifications={jest.fn()}
          onOpenPrivacy={jest.fn()}
          onOpenPassword={jest.fn()}
          onOpenAbout={jest.fn()}
          onOpenTerms={jest.fn()}
          onOpenPolicy={jest.fn()}
          onSignedOut={jest.fn()}
        />,
      ),
    );
    await screen.findByTestId('settings-tgif');
    await tap('settings-tgif');
    expect(await screen.findByTestId('settings-problem-tgif')).toBeTruthy();
    noRawWords();
  });

  it.each(raws)('the change-password banner on a failure the form has no field for (%s, %i)', async (words, status) => {
    answers[CHANGE] = refusal(status, words);
    const { ChangePasswordScreen } = mod<typeof import('../ChangePasswordScreen')>('../ChangePasswordScreen');
    await render(frame(<ChangePasswordScreen onBack={jest.fn()} onDone={jest.fn()} />));
    await fireEvent.changeText(screen.getByTestId('password-current'), 'old-password');
    await fireEvent.changeText(screen.getByTestId('password-new'), 'new-password-1');
    await tap('password-save');
    await waitFor(() => expect(bodiesOf('POST', '/auth/change-password')).toHaveLength(1));
    await act(async () => undefined);
    noRawWords();
    expect(JSON.stringify(screen.toJSON())).not.toContain('Validation failed');
  });

  it('puts every kind of failure into one of the app\'s own short sentences, with no em-dash', () => {
    const { sentenceOf } = mod<typeof import('../failure')>('../failure');
    const { ApiError } = mod<typeof import('@/api/errors')>('@/api/errors');
    const kinds = ['unauthorized', 'forbidden', 'not_found', 'conflict', 'validation', 'rate_limited', 'server', 'network', 'unknown'] as const;
    for (const kind of kinds) {
      for (const words of RAW) {
        const said = sentenceOf(new ApiError(kind, 500, words), 'That did not save. Try again.');
        expect(said).not.toContain(words);
        expect(said).not.toContain('—');
        expect(said.length).toBeGreaterThan(0);
        expect(said.length).toBeLessThan(80);
      }
    }
    expect(sentenceOf(new ApiError('unauthorized', 401, 'Unauthorized'), 'x')).toBe('You were signed out. Sign in again.');
    expect(sentenceOf(new ApiError('server', 500, 'Internal server error'), 'That did not save. Try again.')).toBe('That did not save. Try again.');
    expect(sentenceOf(new ApiError('rate_limited', 429, 'Throttled', 'RATE_LIMITED', 600), 'x')).toBe('Too many tries. Wait 10 minutes and try again.');
    expect(sentenceOf(new ApiError('network', 0, 'whatever'), 'x')).toBe('No connection. Check your internet and try again.');
    // The app's own "could not be read" sentence (an answer with status 200) is kept.
    expect(sentenceOf(new ApiError('unknown', 200, 'Your privacy settings could not be read. Try again.'), 'x')).toBe(
      'Your privacy settings could not be read. Try again.',
    );
    expect(sentenceOf(new Error('Network request failed'), 'That did not save. Try again.')).toBe('That did not save. Try again.');
  });
});
