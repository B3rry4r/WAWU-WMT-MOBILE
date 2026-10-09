/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// The gesture handler's own jest setup: the native module is not there under jest.
require('react-native-gesture-handler/jestSetup');

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
// The phone's photo library (SHARED-04): nothing here opens it, so it only keeps jest away from the native side.
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: { manipulate: jest.fn() }, SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' } }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Directory: jest.fn(), Paths: { cache: { uri: 'file:///cache/' } } }));

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
type Sent = { method: string; path: string; body: unknown };

let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    const text = request.method === 'GET' ? '' : await request.text();
    sent.push({ method: request.method, path, body: text ? JSON.parse(text) : undefined });
    const key = `${request.method} ${path}`;
    const queued = answers[key];
    const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hang') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

const ME = '/api/hub/users/me';
const FIELDS = '/api/hub/users/me/profile-fields';

const profile = {
  wawuUserId: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  handle: 'lennox',
  bio: 'Filmmaker and brand strategist.',
  avatarUrl: null,
  coverUrl: null,
  instagramHandle: '@lennox.films',
  tiktokHandle: 'lennox',
  xHandle: null,
  youtubeUrl: 'https://youtube.com/@LennoxFilms',
  facebookUrl: null,
  linkedinUrl: null,
};
const details = { wawuUserId: 'u1', location: 'Lagos, Nigeria', skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: '2026-10-04T00:00:00.000Z' };

installFetch();
const { EditProfileScreen, TOAST_MS } = require('../EditProfileScreen') as typeof import('../EditProfileScreen');
const { SocialLinksScreen } = require('../SocialLinksScreen') as typeof import('../SocialLinksScreen');
const draft = require('../draft') as typeof import('../draft');

function serve(overrides: Record<string, Answer | Answer[]> = {}) {
  answers = { [`GET ${ME}`]: ok(profile), [`GET ${FIELDS}`]: ok(details), [`PATCH ${ME}`]: ok(profile), [`PATCH ${FIELDS}`]: ok(details), ...overrides };
}

function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * The last screen's `onSaved`: a save has landed once it is called. Most cases open M8 as the Me tab does
 * (`ownNotice={false}`: it hands back at once, M10 shows "Profile saved"); `boot(true)` is M8 opened from
 * anywhere else, which shows its own notice first.
 */
let lastSaved: jest.Mock = jest.fn();
const saveLands = () => waitFor(() => expect(lastSaved).toHaveBeenCalledTimes(1));

async function boot(ownNotice = false) {
  const onBack = jest.fn();
  const onOpenSocial = jest.fn();
  const onSaved = jest.fn();
  lastSaved = onSaved;
  const view = await render(frame(<EditProfileScreen onBack={onBack} onOpenSocial={onOpenSocial} onSaved={onSaved} ownNotice={ownNotice} />));
  return { onBack, onOpenSocial, onSaved, view };
}

beforeEach(() => {
  answers = {};
  sent = [];
  draft.clearDraft();
});

const patches = () => sent.filter((s) => s.method === 'PATCH');

describe('M8 · Edit profile', () => {
  it('opened from anywhere but the Me tab, a user who saves sees M8\'s own "Profile saved", once, then is handed back', async () => {
    jest.useFakeTimers();
    serve();
    const { onSaved } = await boot(true);
    await fireEvent.changeText(await screen.findByTestId('edit-bio'), 'Teaching African creators to get paid.');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByTestId('profile-saved')).toBeTruthy();
    expect(screen.getAllByText('Profile saved')).toHaveLength(1);
    expect(onSaved).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(TOAST_MS + 100);
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('M8 keeps its own notice by default, so a new caller never loses "Profile saved"', async () => {
    serve();
    const onSaved = jest.fn();
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={onSaved} />));
    await fireEvent.changeText(await screen.findByTestId('edit-bio'), 'Changed');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByTestId('profile-saved')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('opened from the Me tab, a user who saves is handed back at once and M8 draws no notice (M10 shows it, once, on the Me tab)', async () => {
    serve();
    const { onSaved } = await boot();
    await screen.findByDisplayValue('Lennox Emmanuel');
    expect(screen.getByTestId('edit-save')).toBeDisabled();

    await fireEvent.changeText(screen.getByTestId('edit-name'), 'Lennox Chuka Emmanuel');
    await fireEvent.changeText(screen.getByTestId('edit-bio'), 'Teaching African creators to get paid.');
    await fireEvent.changeText(screen.getByTestId('edit-location'), 'Abuja, Nigeria');
    expect(screen.getByTestId('edit-save')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('edit-save'));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    // M8 draws no toast of its own: "Profile saved" is M10's (SHARED-CHANGES ME-01 F1).
    expect(screen.queryByTestId('profile-saved')).toBeNull();
    expect(screen.queryByText('Profile saved')).toBeNull();
    // Only what changed goes up, to the route that holds it.
    expect(patches()).toEqual([
      { method: 'PATCH', path: ME, body: { firstName: 'Lennox', middleName: 'Chuka', lastName: 'Emmanuel', bio: 'Teaching African creators to get paid.' } },
      { method: 'PATCH', path: FIELDS, body: { location: 'Abuja, Nigeria' } },
    ]);
  });

  it('a user can edit their handle, and sees the link it makes under it', async () => {
    serve();
    await boot();
    const field = await screen.findByTestId('edit-handle');
    expect(field.props.value).toBe('@lennox');
    expect(screen.getByText('wawu/lennox')).toBeTruthy();
    await fireEvent.changeText(field, '@lennox_films');
    expect(screen.getByText('wawu/lennox_films')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('edit-save'));
    await saveLands();
    expect(patches()[0].body).toEqual({ handle: 'lennox_films' });
  });

  it('a user who picks a handle another account has is told on the handle, and can pick another', async () => {
    serve({ [`PATCH ${ME}`]: refusal(400, 'handle is already taken') });
    await boot();
    await fireEvent.changeText(await screen.findByTestId('edit-handle'), '@adaeze');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText('That handle is taken. Try another.')).toBeTruthy();
    expect(lastSaved).not.toHaveBeenCalled();
    answers[`PATCH ${ME}`] = ok(profile);
    await fireEvent.changeText(screen.getByTestId('edit-handle'), '@adaeze_films');
    expect(screen.queryByText('That handle is taken. Try another.')).toBeNull();
    await fireEvent.press(screen.getByTestId('edit-save'));
    await saveLands();
  });

  it('a user cannot save a handle with a space, a name with one word, or a bio over the Hub’s limit', async () => {
    serve();
    await boot();
    await fireEvent.changeText(await screen.findByTestId('edit-handle'), '@len nox');
    expect(screen.getByText('Use letters, numbers, dots and underscores.')).toBeTruthy();
    expect(screen.getByTestId('edit-save')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('edit-handle'), '@lennox');

    await fireEvent.changeText(screen.getByTestId('edit-name'), 'Lennox');
    expect(screen.getByText('Enter your first and last name.')).toBeTruthy();
    expect(screen.getByTestId('edit-save')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('edit-name'), 'Lennox Emmanuel');

    await fireEvent.changeText(screen.getByTestId('edit-bio'), 'x'.repeat(501));
    expect(screen.getByText('501 / 500')).toBeTruthy();
    expect(screen.getByText('Your bio can be at most 500 characters.')).toBeTruthy();
    expect(screen.getByTestId('edit-save')).toBeDisabled();
    expect(patches()).toHaveLength(0);
  });

  it('the bio counter counts to the Hub’s limit, not the canvas’s 160', async () => {
    serve();
    await boot();
    expect(await screen.findByText('31 / 500')).toBeTruthy();
    expect(screen.queryByText(/\/ 160/)).toBeNull();
  });

  it('shows each added link with its handle and no doubled "@", and Add handle while more can be added', async () => {
    serve();
    const { onOpenSocial } = await boot();
    await screen.findByTestId('edit-social-instagram');
    expect(screen.getByText('@lennox.films')).toBeTruthy();
    expect(screen.queryByText('@@lennox.films')).toBeNull();
    expect(screen.getByTestId('edit-social-tiktok')).toBeTruthy();
    expect(screen.getByTestId('edit-social-youtube')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('edit-social-add'));
    expect(onOpenSocial).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('edit-social-instagram'));
    expect(onOpenSocial).toHaveBeenCalledTimes(2);
  });

  it('a user who leaves with unsaved changes is asked, and can keep editing or discard', async () => {
    serve();
    const { onBack } = await boot();
    await fireEvent.changeText(await screen.findByTestId('edit-location'), 'Kano');
    await fireEvent.press(screen.getByTestId('edit-back'));
    expect(await screen.findByText('Discard your changes?')).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('edit-keep'));
    expect(onBack).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('edit-back'));
    await fireEvent.press(await screen.findByTestId('edit-discard-confirm'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(patches()).toHaveLength(0);
  });

  it('a user with nothing changed leaves without being asked', async () => {
    serve();
    const { onBack } = await boot();
    await screen.findByTestId('edit-profile');
    await fireEvent.press(screen.getByTestId('edit-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('a user offline when they press Save keeps what they typed, is told, and can save when back online', async () => {
    serve({ [`PATCH ${ME}`]: 'offline' });
    await boot();
    await fireEvent.changeText(await screen.findByTestId('edit-bio'), 'Changed offline');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(screen.getByDisplayValue('Changed offline')).toBeTruthy();
    answers[`PATCH ${ME}`] = ok(profile);
    await fireEvent.press(screen.getByTestId('edit-save'));
    await saveLands();
    expect(screen.queryByTestId('edit-banner')).toBeNull();
  });

  it('when the details fail after the profile saved, a retry sends only the details', async () => {
    serve({ [`PATCH ${FIELDS}`]: refusal(500, 'boom') });
    await boot();
    await fireEvent.changeText(await screen.findByTestId('edit-bio'), 'New bio');
    await fireEvent.changeText(screen.getByTestId('edit-location'), 'Kano');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByTestId('edit-banner')).toBeTruthy();
    answers[`PATCH ${FIELDS}`] = ok(details);
    sent = [];
    await fireEvent.press(screen.getByTestId('edit-save'));
    await saveLands();
    expect(patches()).toEqual([{ method: 'PATCH', path: FIELDS, body: { location: 'Kano' } }]);
  });

  it('a user sees a loading state while the profile is on its way', async () => {
    serve({ [`GET ${ME}`]: 'hang' });
    await boot();
    expect(await screen.findByTestId('edit-loading')).toBeTruthy();
    expect(screen.getByLabelText('Loading your profile')).toBeTruthy();
    expect(screen.queryByTestId('edit-name')).toBeNull();
  });

  it('a user whose profile did not load sees the reason and can try again', async () => {
    serve({ [`GET ${ME}`]: ['offline', ok(profile)] as unknown as Answer[] });
    await boot();
    expect(await screen.findByText('Your profile did not load')).toBeTruthy();
    expect(screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    answers[`GET ${ME}`] = ok(profile);
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByDisplayValue('Lennox Emmanuel')).toBeTruthy();
  });

  it('a new account with nothing filled in sees an empty form and an Add handle row, and can save a bio', async () => {
    serve({
      [`GET ${ME}`]: ok({ ...profile, middleName: null, handle: null, bio: null, instagramHandle: null, tiktokHandle: null, youtubeUrl: null }),
      [`GET ${FIELDS}`]: ok({ ...details, location: null }),
    });
    await boot();
    expect((await screen.findByTestId('edit-handle')).props.value).toBe('@');
    expect(screen.getByTestId('edit-location').props.value).toBe('');
    expect(screen.getByText('0 / 500')).toBeTruthy();
    expect(screen.queryByTestId('edit-social-instagram')).toBeNull();
    expect(screen.getByTestId('edit-social-add')).toBeTruthy();
    expect(screen.getByTestId('edit-save')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('edit-bio'), 'Hello');
    await fireEvent.press(screen.getByTestId('edit-save'));
    await saveLands();
    expect(patches().map((p) => p.body)).toEqual([{ bio: 'Hello' }]);
  });

  it('a phone build, with the photo library (expo-image-picker, SHARED-04), draws the avatar and cover camera buttons', async () => {
    serve();
    await boot();
    await screen.findByTestId('edit-profile');
    expect(screen.getByTestId('edit-avatar-pick')).toBeTruthy();
    expect(screen.getByTestId('edit-cover-pick')).toBeTruthy();
  });
});

describe('M9 · Social links, opened over M8', () => {
  /** M9 above M8 in one tree, as the stack holds them: M8's Add handle opens M9, M9's Done closes it. */
  function Stack({ onClose }: { onClose: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <EditProfileScreen onBack={jest.fn()} onOpenSocial={() => setOpen(true)} onSaved={lastSaved} ownNotice={false} />
        {open ? (
          <SocialLinksScreen
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          />
        ) : null}
      </>
    );
  }

  async function overM8() {
    serve();
    lastSaved = jest.fn();
    const onClose = jest.fn();
    await render(frame(<Stack onClose={onClose} />));
    await screen.findByTestId('edit-profile');
    await fireEvent.press(screen.getByTestId('edit-social-add'));
    await screen.findByTestId('social-links');
    return { onClose };
  }

  it('a user sees their added links in the order the Hub keeps, and the rest to add', async () => {
    const { onClose } = await overM8();
    expect(screen.getByText('They show above your follower count, in this order. Drag to reorder.')).toBeTruthy();
    expect(screen.getByTestId('social-input-instagram').props.value).toBe('lennox.films');
    expect(screen.getByTestId('social-input-tiktok').props.value).toBe('lennox');
    expect(screen.getByTestId('social-input-youtube').props.value).toBe('LennoxFilms');
    for (const p of ['x', 'threads', 'linkedin', 'facebook']) expect(screen.getByTestId(`social-add-${p}`)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('social-done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('a user can add Threads, LinkedIn and Facebook, press Done, and Save sends them in order', async () => {
    await overM8();
    await fireEvent.press(screen.getByTestId('social-add-threads'));
    await fireEvent.changeText(screen.getByTestId('social-input-threads'), '@lennox.t');
    await fireEvent.press(screen.getByTestId('social-add-linkedin'));
    await fireEvent.changeText(screen.getByTestId('social-input-linkedin'), 'lennox-e');
    await fireEvent.press(screen.getByTestId('social-add-facebook'));
    await fireEvent.changeText(screen.getByTestId('social-input-facebook'), 'lennox.films');
    expect(screen.queryByTestId('social-add-threads')).toBeNull();
    await fireEvent.press(screen.getByTestId('social-done'));
    expect(screen.queryByTestId('social-links')).toBeNull();
    expect(draft.readDraft()?.form.order).toEqual(['instagram', 'tiktok', 'youtube', 'threads', 'linkedin', 'facebook']);

    await fireEvent.press(screen.getByTestId('edit-save'));
    await saveLands();
    expect(patches()).toEqual([
      { method: 'PATCH', path: ME, body: { linkedinUrl: 'lennox-e', facebookUrl: 'lennox.films' } },
      { method: 'PATCH', path: FIELDS, body: { threadsHandle: 'lennox.t', socialOrder: ['instagram', 'tiktok', 'youtube', 'threads', 'linkedin', 'facebook'] } },
    ]);
  });

  it('a user can edit a handle, and clearing one puts the link back under Add', async () => {
    await overM8();
    await fireEvent.changeText(screen.getByTestId('social-input-tiktok'), '@lennox_tt');
    expect(draft.readDraft()?.form.handles.tiktok).toBe('lennox_tt');
    await fireEvent.changeText(screen.getByTestId('social-input-youtube'), '');
    await fireEvent(screen.getByTestId('social-input-youtube'), 'blur');
    expect(screen.getByTestId('social-add-youtube')).toBeTruthy();
    expect(screen.queryByTestId('social-input-youtube')).toBeNull();
    expect(draft.readDraft()?.form.order).not.toContain('youtube');
  });

  it('a user who opens Add and types nothing does not end up with an empty link', async () => {
    const { onClose } = await overM8();
    await fireEvent.press(screen.getByTestId('social-add-x'));
    expect(screen.getByTestId('social-input-x')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('social-done'));
    expect(onClose).toHaveBeenCalled();
    expect(draft.readDraft()?.form.order).toEqual(['instagram', 'tiktok', 'youtube']);
  });

  it('a user can move a link up or down with the screen reader’s actions, and Save sends the new order', async () => {
    await overM8();
    const row = screen.getByTestId('social-row-youtube');
    await fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'moveUp' } });
    await fireEvent(screen.getByTestId('social-row-youtube'), 'accessibilityAction', { nativeEvent: { actionName: 'moveUp' } });
    expect(draft.readDraft()?.form.order).toEqual(['youtube', 'instagram', 'tiktok']);
    await fireEvent.press(screen.getByTestId('social-done'));
    await fireEvent.press(screen.getByTestId('edit-save'));
    await saveLands();
    expect(patches()).toEqual([{ method: 'PATCH', path: FIELDS, body: { socialOrder: ['youtube', 'instagram', 'tiktok'] } }]);
  });

  it('a user can drag a link by its grip to a new place, and Save sends the new order', async () => {
    await overM8();
    const grip = getByGestureTestId('social-pan-youtube');
    // Two rows up (each row is 60 high): the dragged row ends first.
    await act(async () => {
      fireGestureHandler(grip, [{ translationY: 0 }, { translationY: -62 }, { translationY: -125 }]);
    });
    expect(draft.readDraft()?.form.order).toEqual(['youtube', 'instagram', 'tiktok']);
    await fireEvent.press(screen.getByTestId('social-done'));
    await fireEvent.press(screen.getByTestId('edit-save'));
    await saveLands();
    expect(patches()).toEqual([{ method: 'PATCH', path: FIELDS, body: { socialOrder: ['youtube', 'instagram', 'tiktok'] } }]);
  });

  it('a short drag that does not reach the next row leaves the order as it was', async () => {
    await overM8();
    await act(async () => {
      fireGestureHandler(getByGestureTestId('social-pan-instagram'), [{ translationY: 0 }, { translationY: 20 }, { translationY: 25 }]);
    });
    expect(draft.readDraft()?.form.order).toEqual(['instagram', 'tiktok', 'youtube']);
  });

  it('a user cannot press Done on a handle with a space', async () => {
    await overM8();
    await fireEvent.changeText(screen.getByTestId('social-input-tiktok'), 'len nox');
    expect(screen.getByText('TikTok: no spaces.')).toBeTruthy();
    expect(screen.getByTestId('social-done')).toBeDisabled();
  });

  it('the first link on M9 is the first on M8 after Done', async () => {
    await overM8();
    await fireEvent.press(screen.getByTestId('social-add-x'));
    await fireEvent.changeText(screen.getByTestId('social-input-x'), 'lennoxe');
    await fireEvent.press(screen.getByTestId('social-done'));
    await waitFor(() => expect(screen.getAllByTestId('edit-social-x').length).toBeGreaterThan(0));
  });
});
