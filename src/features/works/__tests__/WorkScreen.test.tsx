/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Linking, Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// A build that can play video (the web build), with a surface that says what it was asked to do.
const mockSurface = jest.fn();
jest.mock('@/features/feed/player', () => {
  const { View } = require('react-native');
  return {
    canPlay: true,
    VideoSurface: (props: { uri: string; playing: boolean }) => {
      mockSurface(props);
      return <View testID="video-surface" accessibilityLabel={`${props.uri}|${props.playing ? 'playing' : 'paused'}`} />;
    },
  };
});

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
let answers: Record<string, Answer | Answer[]> = {};
let sent: { method: string; path: string }[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    sent.push({ method: request.method, path: url.pathname });
    const queued = answers[`${request.method} ${url.pathname}`];
    const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hang') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

installFetch();
const { WorkScreen } = require('../WorkScreen') as typeof import('../WorkScreen');

const WORK = '/api/hub/users/u1/featured-works/w1';
const owner = { wawuId: 'u1', displayName: 'Lennox Emmanuel', handle: 'lennox', avatarUrl: null };
const image = (n: number) => ({ url: `https://files.test/${n}.jpg`, kind: 'image' as const });
const detail = {
  id: 'w1',
  title: 'Brand film · Kora Foods',
  role: 'Director',
  client: 'Kora Foods',
  year: 2025,
  link: null,
  category: null,
  description: 'A 90-second launch film for a Lagos snack brand.',
  media: [image(1), image(2), image(3)],
  position: 0,
  createdAt: '2026-10-01T00:00:00.000Z',
  owner,
};

function frame(children: React.ReactNode) {
  client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

let client: QueryClient;

async function boot(extra: { onOpenCreator?: (id: string) => void } = {}) {
  const onBack = jest.fn();
  const onRemoved = jest.fn();
  await render(frame(<WorkScreen wawuId="u1" workId="w1" onBack={onBack} onRemoved={onRemoved} {...extra} />));
  return { onBack, onRemoved };
}

beforeEach(() => {
  answers = {};
  sent = [];
  mockSurface.mockClear();
  jest.restoreAllMocks();
});

describe('M35 · A work', () => {
  it('a user sees the title, Role, Client and Year, the description and who made it', async () => {
    answers = { [`GET ${WORK}`]: ok(detail) };
    await boot();
    expect(await screen.findByTestId('work-title')).toHaveTextContent('Brand film · Kora Foods');
    expect(screen.getByTestId('work-fact-role')).toHaveTextContent('Director', { exact: false });
    expect(screen.getByTestId('work-fact-client')).toHaveTextContent('Kora Foods', { exact: false });
    expect(screen.getByTestId('work-fact-year')).toHaveTextContent('2025', { exact: false });
    expect(screen.queryByTestId('work-fact-link')).toBeNull();
    expect(screen.queryByTestId('work-fact-category')).toBeNull();
    expect(screen.getByTestId('work-description')).toHaveTextContent('A 90-second launch film for a Lagos snack brand.');
    expect(screen.getByTestId('work-creator-name')).toHaveTextContent('Lennox Emmanuel');
  });

  it('leaves out the client, description and strip a work does not have, and keeps the rest', async () => {
    answers = { [`GET ${WORK}`]: ok({ ...detail, client: null, description: null, media: [image(1)] }) };
    await boot();
    await screen.findByTestId('work-title');
    expect(screen.queryByTestId('work-fact-client')).toBeNull();
    expect(screen.queryByTestId('work-description')).toBeNull();
    expect(screen.queryByTestId('work-strip')).toBeNull();
    expect(screen.getByTestId('work-fact-role')).toBeTruthy();
  });

  it('shows the link and category the person gave, and a web link opens', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    answers = { [`GET ${WORK}`]: ok({ ...detail, link: 'https://kora.example/film', category: 'Brand films' }) };
    await boot();
    expect(await screen.findByTestId('work-fact-category')).toHaveTextContent('Brand films', { exact: false });
    await fireEvent.press(screen.getByTestId('work-link'));
    expect(open).toHaveBeenCalledWith('https://kora.example/film');
  });

  it('shows a wawu/... link as words, because nothing can open it', async () => {
    answers = { [`GET ${WORK}`]: ok({ ...detail, link: 'wawu/lennox/kora' }) };
    await boot();
    expect(await screen.findByTestId('work-fact-link')).toHaveTextContent('wawu/lennox/kora', { exact: false });
    expect(screen.queryByTestId('work-link')).toBeNull();
  });

  it('a user can bring another photo up to the top: it leaves the strip and the one that was on top joins it', async () => {
    answers = { [`GET ${WORK}`]: ok(detail) };
    await boot();
    await screen.findByTestId('work-strip');
    // The cover is the first; the strip holds the other two.
    expect(screen.queryByTestId('work-thumb-0')).toBeNull();
    expect(screen.getByTestId('work-thumb-1')).toBeTruthy();
    expect(screen.getByTestId('work-thumb-2')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('work-thumb-2'));
    expect(screen.getByTestId('work-thumb-0')).toBeTruthy();
    expect(screen.getByTestId('work-thumb-1')).toBeTruthy();
    expect(screen.queryByTestId('work-thumb-2')).toBeNull();
  });

  it('the creator row is a label until a profile screen is wired, and a button that opens the creator once it is', async () => {
    answers = { [`GET ${WORK}`]: ok(detail) };
    await boot();
    await screen.findByTestId('work-creator');
    expect(screen.queryByRole('button', { name: /open profile/i })).toBeNull();
  });

  it('a user can open the creator from M35 when the profile screen is given', async () => {
    answers = { [`GET ${WORK}`]: ok(detail) };
    const onOpenCreator = jest.fn();
    await boot({ onOpenCreator });
    await fireEvent.press(await screen.findByRole('button', { name: 'Lennox Emmanuel, open profile' }));
    expect(onOpenCreator).toHaveBeenCalledWith('u1');
  });

  it('Share opens the phone\'s share sheet with the title and who made it', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    answers = { [`GET ${WORK}`]: ok(detail) };
    await boot();
    await fireEvent.press(await screen.findByTestId('work-share'));
    expect(share).toHaveBeenCalledWith({ message: 'Brand film · Kora Foods, by Lennox Emmanuel' });
    expect(screen.queryByTestId('work-share-notice')).toBeNull();
  });

  it('says so, in one line, when this device has no way to share', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('Share is not supported in this browser'));
    answers = { [`GET ${WORK}`]: ok(detail) };
    await boot();
    await fireEvent.press(await screen.findByTestId('work-share'));
    expect(await screen.findByTestId('work-share-notice')).toBeTruthy();
    expect(screen.getByText('Sharing is not available on this device.')).toBeTruthy();
  });

  it('a video work plays and pauses from the picture where this build can play it', async () => {
    answers = { [`GET ${WORK}`]: ok({ ...detail, media: [{ url: 'https://files.test/reel.mp4', kind: 'video' }, image(2)] }) };
    await boot();
    expect(await screen.findByTestId('video-surface')).toHaveProp('accessibilityLabel', 'https://files.test/reel.mp4|paused');
    await fireEvent.press(screen.getByRole('button', { name: 'Play video' }));
    expect(screen.getByTestId('video-surface')).toHaveProp('accessibilityLabel', 'https://files.test/reel.mp4|playing');
    await fireEvent.press(screen.getByRole('button', { name: 'Pause video' }));
    expect(screen.getByTestId('video-surface')).toHaveProp('accessibilityLabel', 'https://files.test/reel.mp4|paused');
  });

  it('a photo work has no play control', async () => {
    answers = { [`GET ${WORK}`]: ok(detail) };
    await boot();
    await screen.findByTestId('work-title');
    expect(screen.queryByTestId('work-play')).toBeNull();
  });

  it('shows the loading view while the Hub has not answered', async () => {
    answers = { [`GET ${WORK}`]: 'hang' };
    await boot();
    expect(await screen.findByTestId('work-loading')).toBeTruthy();
  });

  it('when there is no connection, says so and Try again reads the work', async () => {
    answers = { [`GET ${WORK}`]: ['offline', ok(detail)] };
    await boot();
    expect(await screen.findByTestId('work-error')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('work-title')).toBeTruthy();
  });

  it('a work that is gone, or a page nobody may see, is "not available" with no Try again', async () => {
    answers = { [`GET ${WORK}`]: refusal(404, 'Work not found') };
    await boot();
    expect(await screen.findByTestId('work-unavailable')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('Back goes back', async () => {
    answers = { [`GET ${WORK}`]: ok(detail) };
    const { onBack } = await boot();
    await fireEvent.press(await screen.findByTestId('work-back'));
    expect(onBack).toHaveBeenCalled();
    await act(async () => undefined);
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
  });
});

const ME = '/api/hub/users/me';
const DELETE = '/api/hub/users/me/featured-works/w1';
const mineIs = (wawuUserId: string) => ok({ wawuUserId });
const deletes = () => sent.filter((s) => s.method === 'DELETE');

describe('M35 · Remove, for the person who made the work', () => {
  it('shows Remove to the owner and to nobody else', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: mineIs('u1') };
    await boot();
    expect(await screen.findByTestId('work-remove')).toBeTruthy();
  });

  it('a visitor (somebody else is signed in) has no Remove', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: mineIs('u2') };
    await boot();
    await screen.findByTestId('work-title');
    await waitFor(() => expect(sent.some((s) => s.path === ME)).toBe(true));
    await act(async () => undefined);
    expect(screen.queryByTestId('work-remove')).toBeNull();
    expect(screen.queryByText('Remove this work')).toBeNull();
  });

  it('has no Remove while it is not known whose page this is, or when that cannot be read', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: 'hang' };
    await boot();
    await screen.findByTestId('work-title');
    expect(screen.queryByTestId('work-remove')).toBeNull();
  });

  it('asks first: Keep this work closes the sheet and removes nothing', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: mineIs('u1'), [`DELETE ${DELETE}`]: ok({ deleted: true }) };
    const { onRemoved } = await boot();
    await fireEvent.press(await screen.findByTestId('work-remove'));
    expect(await screen.findByText('Remove this work?')).toBeTruthy();
    expect(screen.getByText('It stops showing on your profile. This cannot be undone.')).toBeTruthy();
    expect(deletes()).toHaveLength(0);
    await fireEvent.press(screen.getByTestId('work-remove-keep'));
    expect(deletes()).toHaveLength(0);
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('a user can remove their own work: one DELETE for that work, the lists are told to read again, and the screen goes back to M34', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: mineIs('u1'), [`DELETE ${DELETE}`]: ok({ deleted: true }) };
    const { onRemoved } = await boot();
    client.setQueryData(['works', 'u1', 'list', null], { stale: true });
    client.setQueryData(['works', 'mine'], { stale: true });
    client.setQueryData(['profile', 'me'], { stale: true });
    await fireEvent.press(await screen.findByTestId('work-remove'));
    await fireEvent.press(await screen.findByTestId('work-remove-confirm'));
    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
    expect(deletes()).toEqual([{ method: 'DELETE', path: DELETE }]);
    expect(client.getQueryState(['works', 'u1', 'list', null])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['works', 'mine'])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['profile', 'me'])?.isInvalidated).toBe(true);
    // The removed work's own query is not asked again: it would answer 404 to a screen on its way out.
    expect(client.getQueryState(['works', 'u1', 'one', 'w1'])?.isInvalidated).toBe(false);
    expect(sent.filter((s) => s.method === 'GET' && s.path === WORK)).toHaveLength(1);
  });

  it('a double tap on Remove sends one DELETE', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: mineIs('u1'), [`DELETE ${DELETE}`]: 'hang' };
    await boot();
    await fireEvent.press(await screen.findByTestId('work-remove'));
    const confirm = await screen.findByTestId('work-remove-confirm');
    await fireEvent.press(confirm);
    await fireEvent.press(confirm);
    await fireEvent.press(confirm);
    expect(deletes()).toHaveLength(1);
  });

  it('with no connection it says so in the sheet, stays on the work, and a second try removes it', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: mineIs('u1'), [`DELETE ${DELETE}`]: ['offline', ok({ deleted: true })] };
    const { onRemoved } = await boot();
    await fireEvent.press(await screen.findByTestId('work-remove'));
    await fireEvent.press(await screen.findByTestId('work-remove-confirm'));
    expect(await screen.findByTestId('work-remove-error')).toHaveTextContent('No connection. Check your internet and try again.', { exact: false });
    expect(onRemoved).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('work-remove-confirm'));
    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
    expect(deletes()).toHaveLength(2);
  });

  it('a refusal says one plain sentence and keeps the work', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: mineIs('u1'), [`DELETE ${DELETE}`]: refusal(500, 'boom') };
    const { onRemoved } = await boot();
    await fireEvent.press(await screen.findByTestId('work-remove'));
    await fireEvent.press(await screen.findByTestId('work-remove-confirm'));
    expect(await screen.findByTestId('work-remove-error')).toHaveTextContent('The work was not removed. Try again.', { exact: false });
    expect(screen.queryByText('boom')).toBeNull();
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('a work already removed on another device is the same as removed here: back to the list', async () => {
    answers = { [`GET ${WORK}`]: ok(detail), [`GET ${ME}`]: mineIs('u1'), [`DELETE ${DELETE}`]: refusal(404, 'Work not found') };
    const { onRemoved } = await boot();
    await fireEvent.press(await screen.findByTestId('work-remove'));
    await fireEvent.press(await screen.findByTestId('work-remove-confirm'));
    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('work-remove-error')).toBeNull();
  });
});

describe('M35 · a picture that fails to load', () => {
  const imageNode = (id: string) => screen.findByTestId(id, { includeHiddenElements: true });

  it('the top picture shows the quiet block with the picture icon, never a blank box', async () => {
    answers = { [`GET ${WORK}`]: ok(detail) };
    await boot();
    const hero = await imageNode('work-hero-cover');
    expect(screen.queryByTestId('work-hero-cover-placeholder')).toBeNull();
    await fireEvent(hero, 'error', { nativeEvent: { error: 'not an image' } });
    expect(await screen.findByTestId('work-hero-cover-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('work-hero-cover', { includeHiddenElements: true })).toBeNull();
    expect(within(screen.getByTestId('work-hero-cover-placeholder')).getByTestId('icon-Image', { includeHiddenElements: true })).toBeTruthy();
  });

  it('a photo that does load is not touched when another one fails', async () => {
    answers = { [`GET ${WORK}`]: ok({ ...detail, media: [image(1)] }) };
    await boot();
    expect(await imageNode('work-hero-cover')).toBeTruthy();
    expect(screen.queryByTestId('work-hero-cover-placeholder')).toBeNull();
  });
});
