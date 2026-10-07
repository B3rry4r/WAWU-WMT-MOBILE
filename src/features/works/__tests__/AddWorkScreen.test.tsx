/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// The phone's photo library is not here under jest: each test says what the person chose.
let mockCanPick = true;
const mockPick = jest.fn();
jest.mock('../pickMedia', () => ({
  get canPickMedia() {
    return mockCanPick;
  },
  pickMedia: (...args: unknown[]) => mockPick(...args),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
type Sent = { method: string; path: string; body: unknown; type: string | null };
let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const text = request.method === 'GET' ? '' : await request.text();
    const isJson = request.headers.get('content-type')?.includes('json');
    sent.push({ method: request.method, path: url.pathname, body: isJson && text ? JSON.parse(text) : text || undefined, type: request.headers.get('content-type') });
    const queued = answers[`${request.method} ${url.pathname}`];
    const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hang') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown, status = 200) => ({ status, body: { statusCode: status, message: 'OK', data } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

installFetch();
const { AddWorkScreen } = require('../AddWorkScreen') as typeof import('../AddWorkScreen');

const CREATE = '/api/hub/users/me/featured-works';
const PRESIGN = '/api/hub/uploads/presign';
const created = { id: 'w9', title: 'x', role: 'x', client: null, year: 2025, link: null, category: null, description: null, media: [], position: 0, createdAt: '2026-10-01T00:00:00.000Z' };
const presigned = (n: number) => ok({ uploadUrl: `https://storage.test/put/${n}?sig=1`, key: `profile/work/u1/${n}.jpg`, fileUrl: `https://storage.test/profile/work/u1/${n}.jpg?sig=2` });
const file = (n: number, over: Partial<{ contentType: string; extension: string; size: number }> = {}) => ({
  blob: new Blob([new Uint8Array(over.size ?? 5)]),
  contentType: over.contentType ?? 'image/jpeg',
  extension: over.extension ?? 'jpg',
  previewUri: `blob:preview-${n}`,
});

const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });

function frame(children: React.ReactNode) {
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

async function boot() {
  const onBack = jest.fn();
  const onSaved = jest.fn();
  await render(frame(<AddWorkScreen onBack={onBack} onSaved={onSaved} />));
  return { onBack, onSaved };
}

async function type(testID: string, value: string) {
  await fireEvent.changeText(screen.getByTestId(testID), value);
}

async function fillRequired() {
  await type('work-title', 'Brand film · Kora Foods');
  await type('work-role', 'Director');
  await type('work-year', '2025');
}

const posts = () => sent.filter((s) => s.method === 'POST' && s.path === CREATE);

beforeEach(() => {
  answers = {};
  sent = [];
  mockCanPick = true;
  mockPick.mockReset();
  client.clear();
});

describe('M36 · Add a work', () => {
  it('a user can fill title, role and year, press Save, and the work goes up with only what was typed', async () => {
    answers = { [`POST ${CREATE}`]: ok(created, 201) };
    const { onSaved } = await boot();
    expect(screen.getByTestId('work-save')).toBeDisabled();
    await fillRequired();
    expect(screen.getByTestId('work-save')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(posts()).toHaveLength(1);
    expect(posts()[0].body).toEqual({ title: 'Brand film · Kora Foods', role: 'Director', year: 2025 });
  });

  it('a user can fill client, link and category too, and they are sent trimmed', async () => {
    answers = { [`POST ${CREATE}`]: ok(created, 201) };
    const { onSaved } = await boot();
    await fillRequired();
    await type('work-client', ' Kora Foods ');
    await type('work-link', 'wawu/lennox/kora');
    await type('work-category', 'Brand films');
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(posts()[0].body).toEqual({ title: 'Brand film · Kora Foods', role: 'Director', year: 2025, client: 'Kora Foods', link: 'wawu/lennox/kora', category: 'Brand films' });
  });

  it('Save stays off until the title, the role and a four digit year are there', async () => {
    await boot();
    await type('work-title', 'A title');
    expect(screen.getByTestId('work-save')).toBeDisabled();
    await type('work-role', 'Editor');
    expect(screen.getByTestId('work-save')).toBeDisabled();
    await type('work-year', '20');
    expect(screen.getByTestId('work-save')).toBeDisabled();
    expect(screen.getByText('Enter the year as four digits.')).toBeTruthy();
    await type('work-year', '2024');
    expect(screen.getByTestId('work-save')).toBeEnabled();
    expect(screen.queryByText('Enter the year as four digits.')).toBeNull();
  });

  it('keeps only digits in the year, four at most', async () => {
    await boot();
    await type('work-year', '20 a25');
    expect(screen.getByTestId('work-year').props.value).toBe('2025');
    await type('work-year', '2025678');
    expect(screen.getByTestId('work-year').props.value).toBe('2025');
  });

  it('a user can add photos and a video: each uploads as it is chosen, and Save sends the keys in the order chosen', async () => {
    answers = {
      [`POST ${PRESIGN}`]: [presigned(1), presigned(2)],
      'PUT /put/1': { status: 200, body: {} },
      'PUT /put/2': { status: 200, body: {} },
      [`POST ${CREATE}`]: ok(created, 201),
    };
    mockPick.mockResolvedValueOnce([file(1, { size: 7 }), file(2, { contentType: 'video/mp4', extension: 'mp4', size: 11 })]);
    const { onSaved } = await boot();
    await fireEvent.press(screen.getByRole('button', { name: 'Add photos or a video' }));
    await waitFor(() => expect(screen.queryByTestId('work-media-0-uploading')).toBeNull());
    await waitFor(() => expect(screen.queryByTestId('work-media-1-uploading')).toBeNull());

    const presigns = sent.filter((s) => s.path === PRESIGN);
    expect(presigns.map((s) => s.body)).toEqual([
      { folder: 'profile/work', contentType: 'image/jpeg', extension: 'jpg', contentLength: 7 },
      { folder: 'profile/work', contentType: 'video/mp4', extension: 'mp4', contentLength: 11 },
    ]);
    const puts = sent.filter((s) => s.method === 'PUT');
    expect(puts.map((s) => [s.path, s.type])).toEqual([['/put/1', 'image/jpeg'], ['/put/2', 'video/mp4']]);

    await fillRequired();
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(posts()[0].body).toMatchObject({ media: ['profile/work/u1/1.jpg', 'profile/work/u1/2.jpg'] });
  });

  it('Save stays off while a file is still going up', async () => {
    answers = { [`POST ${PRESIGN}`]: presigned(1), 'PUT /put/1': 'hang' };
    mockPick.mockResolvedValueOnce([file(1)]);
    await boot();
    await fillRequired();
    await fireEvent.press(screen.getByRole('button', { name: 'Add photos or a video' }));
    expect(await screen.findByTestId('work-media-0-uploading')).toBeTruthy();
    expect(screen.getByTestId('work-save')).toBeDisabled();
  });

  it('a file whose upload fails shows a way to try it again, holds Save off, and trying again clears it', async () => {
    answers = { [`POST ${PRESIGN}`]: presigned(1), 'PUT /put/1': [{ status: 403, body: {} }, { status: 200, body: {} }], [`POST ${CREATE}`]: ok(created, 201) };
    mockPick.mockResolvedValueOnce([file(1)]);
    const { onSaved } = await boot();
    await fillRequired();
    await fireEvent.press(screen.getByRole('button', { name: 'Add photos or a video' }));
    const retry = await screen.findByTestId('work-media-0-retry');
    expect(screen.getByTestId('work-banner')).toHaveTextContent('That file did not upload. Try again.', { exact: false });
    expect(screen.getByTestId('work-save')).toBeDisabled();

    await fireEvent.press(retry);
    await waitFor(() => expect(screen.queryByTestId('work-media-0-retry')).toBeNull());
    expect(screen.queryByTestId('work-banner')).toBeNull();
    expect(screen.getByTestId('work-save')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(posts()[0].body).toMatchObject({ media: ['profile/work/u1/1.jpg'] });
  });

  it('a file the Hub says is too big fails with that said, and removing it frees Save', async () => {
    answers = { [`POST ${PRESIGN}`]: refusal(413, 'A file in profile/work can be at most 100MB.') };
    mockPick.mockResolvedValueOnce([file(1)]);
    await boot();
    await fillRequired();
    await fireEvent.press(screen.getByRole('button', { name: 'Add photos or a video' }));
    await screen.findByTestId('work-media-0-retry');
    expect(screen.getByTestId('work-banner')).toHaveTextContent('That file is too big to add.', { exact: false });
    expect(screen.getByTestId('work-save')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('work-media-0-remove'));
    expect(screen.queryByTestId('work-media-0')).toBeNull();
    expect(screen.queryByTestId('work-banner')).toBeNull();
    expect(screen.getByTestId('work-save')).toBeEnabled();
  });

  it('a user can take a chosen file out again, and it is not sent', async () => {
    answers = { [`POST ${PRESIGN}`]: [presigned(1), presigned(2)], 'PUT /put/1': { status: 200, body: {} }, 'PUT /put/2': { status: 200, body: {} }, [`POST ${CREATE}`]: ok(created, 201) };
    mockPick.mockResolvedValueOnce([file(1), file(2)]);
    const { onSaved } = await boot();
    await fireEvent.press(screen.getByRole('button', { name: 'Add photos or a video' }));
    await waitFor(() => expect(sent.filter((s) => s.method === 'PUT')).toHaveLength(2));
    await waitFor(() => expect(screen.queryByTestId('work-media-1-uploading')).toBeNull());
    await fireEvent.press(screen.getByTestId('work-media-0-remove'));
    await fillRequired();
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(posts()[0].body).toMatchObject({ media: ['profile/work/u1/2.jpg'] });
  });

  it('draws no "Add photos or a video" box on a build that cannot open the photo library', async () => {
    mockCanPick = false;
    await boot();
    expect(screen.queryByRole('button', { name: 'Add photos or a video' })).toBeNull();
    expect(screen.getByTestId('work-title')).toBeTruthy();
  });

  it('puts the Hub\'s sentence about the year under Year, and clears it when the year changes', async () => {
    answers = { [`POST ${CREATE}`]: refusal(400, 'Year must be a year from 1950 to 2027') };
    const { onSaved } = await boot();
    await type('work-title', 'Old');
    await type('work-role', 'Editor');
    await type('work-year', '1949');
    await fireEvent.press(screen.getByTestId('work-save'));
    expect(await screen.findByText('Year must be a year from 1950 to 2027')).toBeTruthy();
    expect(screen.queryByTestId('work-banner')).toBeNull();
    expect(onSaved).not.toHaveBeenCalled();
    await type('work-year', '1999');
    expect(screen.queryByText('Year must be a year from 1950 to 2027')).toBeNull();
  });

  it('puts a link the Hub refuses under Link', async () => {
    answers = { [`POST ${CREATE}`]: refusal(400, 'Link is not a web address') };
    await boot();
    await fillRequired();
    await type('work-link', 'javascript:alert(1)');
    await fireEvent.press(screen.getByTestId('work-save'));
    expect(await screen.findByText('Link is not a web address')).toBeTruthy();
  });

  it('shows a refusal that is about no field (the cap) in the banner, in the Hub\'s words, and keeps what was typed', async () => {
    const cap = 'A profile can feature at most 50 works. Remove one to add another.';
    answers = { [`POST ${CREATE}`]: refusal(400, cap) };
    await boot();
    await fillRequired();
    await fireEvent.press(screen.getByTestId('work-save'));
    expect(await screen.findByTestId('work-banner')).toHaveTextContent(cap, { exact: false });
    expect(screen.getByTestId('work-title').props.value).toBe('Brand film · Kora Foods');
  });

  it('when there is no connection, says so, keeps the text, and a second Save sends it', async () => {
    answers = { [`POST ${CREATE}`]: ['offline', ok(created, 201)] };
    const { onSaved } = await boot();
    await fillRequired();
    await fireEvent.press(screen.getByTestId('work-save'));
    expect(await screen.findByTestId('work-banner')).toHaveTextContent('No connection. Check your internet and try again.', { exact: false });
    expect(screen.getByTestId('work-year').props.value).toBe('2025');
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it('a double tap on Save sends the work once', async () => {
    answers = { [`POST ${CREATE}`]: 'hang' };
    await boot();
    await fillRequired();
    const save = screen.getByTestId('work-save');
    await fireEvent.press(save);
    await fireEvent.press(save);
    await fireEvent.press(save);
    expect(posts()).toHaveLength(1);
  });

  it('refreshes the works lists and the profile after a save, so the new work shows where the person came from', async () => {
    answers = { [`POST ${CREATE}`]: ok(created, 201) };
    client.setQueryData(['works', 'u1', 'list', null], { stale: true });
    client.setQueryData(['profile', 'me'], { stale: true });
    const { onSaved } = await boot();
    await fillRequired();
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(client.getQueryState(['works', 'u1', 'list', null])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['profile', 'me'])?.isInvalidated).toBe(true);
  });

  it('Back with nothing typed goes straight back', async () => {
    const { onBack } = await boot();
    await fireEvent.press(screen.getByTestId('edit-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('Back with something typed asks first: Keep editing stays, Discard goes back', async () => {
    const { onBack } = await boot();
    await type('work-title', 'Half done');
    await fireEvent.press(screen.getByTestId('edit-back'));
    expect(onBack).not.toHaveBeenCalled();
    expect(await screen.findByText('Discard this work?')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('work-keep'));
    expect(onBack).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('edit-back'));
    await fireEvent.press(screen.getByTestId('work-discard-confirm'));
    expect(onBack).toHaveBeenCalledTimes(1);
    await act(async () => undefined);
  });
});
