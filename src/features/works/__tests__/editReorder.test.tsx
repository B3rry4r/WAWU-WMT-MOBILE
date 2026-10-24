/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('../pickMedia', () => ({ canPickMedia: true, pickMedia: jest.fn() }));

type Answer = { status: number; body: unknown } | 'offline';
type Sent = { method: string; path: string; body: unknown };
let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const text = request.method === 'GET' ? '' : await request.text();
    sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
    const queued = answers[`${request.method} ${url.pathname}`];
    const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

installFetch();
const { AddWorkScreen } = require('../AddWorkScreen') as typeof import('../AddWorkScreen');
const { EditWorkScreen } = require('../EditWorkScreen') as typeof import('../EditWorkScreen');
const { AllWorksScreen } = require('../AllWorksScreen') as typeof import('../AllWorksScreen');
const { WorkScreen } = require('../WorkScreen') as typeof import('../WorkScreen');
const { changesOf, formOf, problemsOf, emptyForm } = require('../form') as typeof import('../form');
const { moved } = require('../ReorderList') as typeof import('../ReorderList');

const owner = { wawuId: 'u1', displayName: 'Lennox Emmanuel', handle: 'lennox', avatarUrl: null };
const work = (id: string, title: string, position: number, over: Record<string, unknown> = {}) => ({
  id,
  title,
  role: 'Director',
  client: 'Kora Foods',
  year: 2025,
  link: null,
  category: null,
  description: 'A 90-second launch film.',
  media: [],
  position,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});
const LIST = '/api/hub/users/u1/featured-works';
const ORDER = '/api/hub/users/me/featured-works/order';
const list = (...works: ReturnType<typeof work>[]) => ok({ owner, count: works.length, categories: [], works });

function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  answers = {};
  sent = [];
});

describe('the description (G-251)', () => {
  it('a user can write a description on M36 and it is sent with the work', async () => {
    answers = {
      'GET /api/hub/users/me/featured-works': ok({ owner, count: 1, categories: [], works: [] }),
      'POST /api/hub/users/me/featured-works': { status: 201, body: { statusCode: 201, message: 'Created', data: work('w9', 'x', 0) } },
    };
    const onSaved = jest.fn();
    await render(frame(<AddWorkScreen onBack={jest.fn()} onSaved={onSaved} onOpenWorks={jest.fn()} />));
    await fireEvent.changeText(screen.getByTestId('work-title'), 'Brand film');
    await fireEvent.changeText(screen.getByTestId('work-role'), 'Director');
    await fireEvent.changeText(screen.getByTestId('work-year'), '2025');
    await fireEvent.changeText(screen.getByTestId('work-description-field'), '  Shot over two days in Yaba.\nCrew of six.  ');
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const post = sent.find((s) => s.method === 'POST' && s.path === '/api/hub/users/me/featured-works');
    expect(post?.body).toMatchObject({ title: 'Brand film', description: 'Shot over two days in Yaba.\nCrew of six.' });
  });

  it('a description past the Hub\'s 1000 characters is refused before anything is sent', () => {
    expect(problemsOf({ ...emptyForm, description: 'a'.repeat(1001) }).description).toMatch(/1000 characters/);
    expect(problemsOf({ ...emptyForm, description: 'a'.repeat(1000) }).description).toBeUndefined();
  });
});

describe('changing a work (G-252)', () => {
  it('sends only what changed, and an emptied optional field as null', () => {
    const base = formOf(work('w1', 'Brand film', 0));
    expect(changesOf(base, base)).toBeNull();
    expect(changesOf({ ...base, title: ' New title ', year: '2024', client: '', description: 'Changed' }, base)).toEqual({
      title: 'New title',
      year: 2024,
      client: null,
      description: 'Changed',
    });
  });

  it('a user can edit a work: the form holds it, Save stays off until something differs, then one PATCH for that work', async () => {
    answers = {
      [`GET ${LIST}/w1`]: ok({ ...work('w1', 'Brand film', 0), owner }),
      'GET /api/hub/users/me': ok({ wawuUserId: 'u1' }),
      'PATCH /api/hub/users/me/featured-works/w1': ok(work('w1', 'Brand film', 0, { description: 'Better words.' })),
    };
    const onSaved = jest.fn();
    await render(frame(<EditWorkScreen wawuId="u1" workId="w1" onBack={jest.fn()} onSaved={onSaved} />));
    expect(await screen.findByTestId('edit-work')).toBeTruthy();
    expect(screen.getByTestId('work-title').props.value).toBe('Brand film');
    expect(screen.getByTestId('work-description-field').props.value).toBe('A 90-second launch film.');
    expect(screen.queryByText('Add photos or a video')).toBeNull();
    expect(screen.getByTestId('work-save').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('work-description-field'), 'Better words.');
    await fireEvent.press(screen.getByTestId('work-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const patch = sent.filter((s) => s.method === 'PATCH');
    expect(patch).toHaveLength(1);
    expect(patch[0].body).toEqual({ description: 'Better words.' });
  });

  it('a change the Hub refuses stays on the form with the Hub\'s sentence under the field', async () => {
    answers = {
      [`GET ${LIST}/w1`]: ok({ ...work('w1', 'Brand film', 0), owner }),
      'GET /api/hub/users/me': ok({ wawuUserId: 'u1' }),
      'PATCH /api/hub/users/me/featured-works/w1': refusal(400, 'Year must be a year from 1950 to 2027'),
    };
    const onSaved = jest.fn();
    await render(frame(<EditWorkScreen wawuId="u1" workId="w1" onBack={jest.fn()} onSaved={onSaved} />));
    await screen.findByTestId('edit-work');
    await fireEvent.changeText(screen.getByTestId('work-year'), '1900');
    await fireEvent.press(screen.getByTestId('work-save'));
    expect(await screen.findByText('Year must be a year from 1950 to 2027')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('SWEEP-APP-8 L5 (FIX-113): /add-work for somebody else\'s work does not open the edit: the form is never drawn and the route is told', async () => {
    answers = { [`GET ${LIST}/w1`]: ok({ ...work('w1', 'Brand film', 0), owner }), 'GET /api/hub/users/me': ok({ wawuUserId: 'u2' }) };
    const onNotOwner = jest.fn();
    await render(frame(<EditWorkScreen wawuId="u1" workId="w1" onBack={jest.fn()} onSaved={jest.fn()} onNotOwner={onNotOwner} />));
    await waitFor(() => expect(onNotOwner).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('edit-work')).toBeNull();
    expect(screen.queryByTestId('work-title')).toBeNull();
    expect(sent.filter((s) => s.method === 'PATCH')).toHaveLength(0);
  });

  it('SWEEP-APP-8 L5 (FIX-113): with nobody to tell, somebody else\'s work says it is not theirs to change', async () => {
    answers = { [`GET ${LIST}/w1`]: ok({ ...work('w1', 'Brand film', 0), owner }), 'GET /api/hub/users/me': ok({ wawuUserId: 'u2' }) };
    await render(frame(<EditWorkScreen wawuId="u1" workId="w1" onBack={jest.fn()} onSaved={jest.fn()} />));
    expect(await screen.findByTestId('edit-work-not-yours')).toBeTruthy();
    expect(screen.queryByTestId('edit-work')).toBeNull();
  });

  it('SWEEP-APP-8 L5 (FIX-113): the form waits for the signed-in person to be known, and a failed read of them is an error with Try again, not a form', async () => {
    answers = { [`GET ${LIST}/w1`]: ok({ ...work('w1', 'Brand film', 0), owner }), 'GET /api/hub/users/me': refusal(500, 'Server error') };
    await render(frame(<EditWorkScreen wawuId="u1" workId="w1" onBack={jest.fn()} onSaved={jest.fn()} />));
    expect(await screen.findByTestId('edit-work-error')).toBeTruthy();
    expect(screen.queryByTestId('edit-work')).toBeNull();
  });

  it('M35 offers Edit to the owner only, and it opens the edit', async () => {
    answers = { [`GET ${LIST}/w1`]: ok({ ...work('w1', 'Brand film', 0), owner }), 'GET /api/hub/users/me': ok({ wawuUserId: 'u1' }) };
    const onEdit = jest.fn();
    await render(frame(<WorkScreen wawuId="u1" workId="w1" onBack={jest.fn()} onEdit={onEdit} onRemoved={jest.fn()} />));
    await fireEvent.press(await screen.findByTestId('work-edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('M35 draws no Edit on somebody else\'s work', async () => {
    answers = { [`GET ${LIST}/w1`]: ok({ ...work('w1', 'Brand film', 0), owner }), 'GET /api/hub/users/me': ok({ wawuUserId: 'u2' }) };
    await render(frame(<WorkScreen wawuId="u1" workId="w1" onBack={jest.fn()} onEdit={jest.fn()} onRemoved={jest.fn()} />));
    await screen.findByTestId('work-title');
    await waitFor(() => expect(sent.some((s) => s.path === '/api/hub/users/me')).toBe(true));
    expect(screen.queryByTestId('work-edit')).toBeNull();
  });
});

describe('re-ordering works (G-252)', () => {
  it('moves one place and leaves the rest as they were', () => {
    expect(moved(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moved(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moved(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
  });

  const three = () => list(work('w1', 'First', 0), work('w2', 'Second', 1), work('w3', 'Third', 2));
  const boot = async () => {
    answers = { [`GET ${LIST}`]: three(), 'GET /api/hub/users/me': ok({ wawuUserId: 'u1' }) };
    await render(frame(<AllWorksScreen wawuId="u1" onBack={jest.fn()} onOpenWork={jest.fn()} onAddWork={jest.fn()} />));
  };

  it('a user can reorder their works: one PUT with every id in the new order, and the screen leaves reorder', async () => {
    await boot();
    await fireEvent.press(await screen.findByTestId('works-reorder-start'));
    expect(screen.getByTestId('works-reorder-save').props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByTestId('reorder-up-w1').props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByTestId('reorder-down-w3').props.accessibilityState?.disabled).toBe(true);
    answers[`PUT ${ORDER}`] = ok({ owner, count: 3, categories: [], works: [] });
    await fireEvent.press(screen.getByTestId('reorder-down-w1'));
    await fireEvent.press(screen.getByTestId('reorder-up-w3'));
    await fireEvent.press(screen.getByTestId('works-reorder-save'));
    await waitFor(() => expect(screen.queryByTestId('works-reorder')).toBeNull());
    const put = sent.find((s) => s.method === 'PUT');
    expect(put?.body).toEqual({ ids: ['w2', 'w3', 'w1'] });
  });

  it('Cancel leaves reorder and sends nothing', async () => {
    await boot();
    await fireEvent.press(await screen.findByTestId('works-reorder-start'));
    await fireEvent.press(screen.getByTestId('reorder-down-w1'));
    await fireEvent.press(screen.getByTestId('works-reorder-cancel'));
    expect(screen.queryByTestId('works-reorder')).toBeNull();
    expect(sent.some((s) => s.method === 'PUT')).toBe(false);
  });

  it('a refused order says why and stays on the list', async () => {
    await boot();
    await fireEvent.press(await screen.findByTestId('works-reorder-start'));
    answers[`PUT ${ORDER}`] = refusal(500, 'boom');
    await fireEvent.press(screen.getByTestId('reorder-down-w1'));
    await fireEvent.press(screen.getByTestId('works-reorder-save'));
    expect(await screen.findByTestId('works-reorder-error')).toBeTruthy();
    expect(screen.getByTestId('works-reorder')).toBeTruthy();
  });

  it('is not offered on somebody else\'s page, or for a single work', async () => {
    answers = { [`GET ${LIST}`]: three(), 'GET /api/hub/users/me': ok({ wawuUserId: 'u2' }) };
    await render(frame(<AllWorksScreen wawuId="u1" onBack={jest.fn()} onOpenWork={jest.fn()} onAddWork={jest.fn()} />));
    await screen.findByTestId('works-grid');
    await waitFor(() => expect(sent.some((s) => s.path === '/api/hub/users/me')).toBe(true));
    expect(screen.queryByTestId('works-reorder-start')).toBeNull();
  });
});
