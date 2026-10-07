/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

installFetch();
const { AllWorksScreen } = require('../AllWorksScreen') as typeof import('../AllWorksScreen');

const WORKS = '/api/hub/users/u1/featured-works';
const ME = '/api/hub/users/me';
const owner = { wawuId: 'u1', displayName: 'Lennox Emmanuel', handle: 'lennox', avatarUrl: null };
const work = (id: string, title: string, role: string, year: number, category: string | null, url: string | null = 'https://files.test/a.jpg') => ({
  id,
  title,
  role,
  client: null,
  year,
  link: null,
  category,
  description: null,
  media: url ? [{ url, kind: 'image' }] : [],
  position: 0,
  createdAt: '2026-10-01T00:00:00.000Z',
});
const kora = work('w1', 'Brand film · Kora Foods', 'Director', 2025, 'Brand films');
const aba = work('w2', 'Aba Fashion Week recap', 'Director', 2024, 'Brand films');
const night = work('w3', 'Night shoot series', 'DP', 2024, 'Photography');
const all = { owner, count: 3, categories: [{ name: 'Brand films', count: 2 }, { name: 'Photography', count: 1 }], works: [kora, aba, night] };

function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

async function boot(wawuId = 'u1') {
  const onBack = jest.fn();
  const onOpenWork = jest.fn();
  const onAddWork = jest.fn();
  await render(frame(<AllWorksScreen wawuId={wawuId} onBack={onBack} onOpenWork={onOpenWork} onAddWork={onAddWork} />));
  return { onBack, onOpenWork, onAddWork };
}

beforeEach(() => {
  answers = {};
  asked = [];
});

describe('M34 · All works', () => {
  it('a user sees the person\'s works with "role · year" under each title, and the name and count in the bar', async () => {
    answers = { [`GET ${WORKS}`]: ok(all) };
    await boot();
    expect(await screen.findByText('Brand film · Kora Foods')).toBeTruthy();
    expect(screen.getByText('Director · 2025')).toBeTruthy();
    expect(screen.getByText('DP · 2024')).toBeTruthy();
    expect(screen.getByTestId('works-subtitle')).toHaveTextContent('Lennox Emmanuel · 3');
    expect(asked).toContain(`GET ${WORKS}`);
  });

  it('a user can filter by category: the chip asks the Hub for that category, and All asks for everything again', async () => {
    answers = {
      [`GET ${WORKS}`]: ok(all),
      [`GET ${WORKS}?category=Photography`]: ok({ ...all, works: [night] }),
    };
    await boot();
    await screen.findByText('Aba Fashion Week recap');
    expect(screen.getByRole('radio', { name: 'All' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Photography' }));
    await waitFor(() => expect(screen.queryByText('Aba Fashion Week recap')).toBeNull());
    expect(screen.getByText('Night shoot series')).toBeTruthy();
    expect(asked).toContain(`GET ${WORKS}?category=Photography`);
    // The count in the bar stays the person's whole count, and the chips are still there.
    expect(screen.getByTestId('works-subtitle')).toHaveTextContent('Lennox Emmanuel · 3');
    expect(screen.getByRole('radio', { name: 'Brand films' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'All' }));
    expect(await screen.findByText('Aba Fashion Week recap')).toBeTruthy();
  });

  it('a user can open a work: the work\'s id goes to the screen that opens M35', async () => {
    answers = { [`GET ${WORKS}`]: ok(all) };
    const { onOpenWork } = await boot();
    await fireEvent.press(await screen.findByTestId('work-w2'));
    expect(onOpenWork).toHaveBeenCalledWith('w2');
  });

  it('draws no chips when no work has a category', async () => {
    answers = { [`GET ${WORKS}`]: ok({ ...all, categories: [], works: [work('w9', 'Plain', 'Editor', 2023, null)], count: 1 }) };
    await boot();
    await screen.findByText('Plain');
    expect(screen.queryByTestId('works-chips')).toBeNull();
  });

  it('a work with no picture holds its place with a quiet block, and a work with only a video does too', async () => {
    answers = { [`GET ${WORKS}`]: ok({ ...all, categories: [], count: 2, works: [work('w8', 'No picture', 'Editor', 2023, null, null), { ...work('w7', 'Reel', 'Director', 2024, null), media: [{ url: 'https://files.test/r.mp4', kind: 'video' }] }] }) };
    await boot();
    expect(await screen.findByText('No picture')).toBeTruthy();
    expect(screen.getByText('Reel')).toBeTruthy();
  });

  it('shows the loading view while the Hub has not answered', async () => {
    answers = { [`GET ${WORKS}`]: 'hang' };
    await boot();
    expect(await screen.findByTestId('works-loading')).toBeTruthy();
    expect(screen.queryByTestId('works-grid')).toBeNull();
  });

  it('when there is no connection, says so and Try again reads the works', async () => {
    answers = { [`GET ${WORKS}`]: ['offline', ok(all)] };
    await boot();
    expect(await screen.findByTestId('works-error')).toBeTruthy();
    expect(screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Night shoot series')).toBeTruthy();
  });

  it('a page the Hub answers 404 for (no such person, not a creator, blocked) is "not available", with no way to tell which', async () => {
    answers = { [`GET ${WORKS}`]: refusal(404, 'User not found') };
    await boot();
    expect(await screen.findByTestId('works-unavailable')).toBeTruthy();
    expect(screen.getByText('This page is not available')).toBeTruthy();
    expect(screen.queryByText(/not found|blocked/i)).toBeNull();
  });

  it('a person with no works sees "No works yet" and no way to add one on somebody else\'s page', async () => {
    answers = {
      [`GET ${WORKS}`]: ok({ owner, count: 0, categories: [], works: [] }),
      [`GET ${ME}`]: ok({ wawuUserId: 'someone-else' }),
    };
    await boot();
    expect(await screen.findByTestId('works-empty')).toBeTruthy();
    await waitFor(() => expect(asked).toContain(`GET ${ME}`));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.getByTestId('works-empty')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add a work' })).toBeNull();
  });

  it('a person with no works, on their own page, can press Add a work (M36)', async () => {
    answers = {
      [`GET ${WORKS}`]: ok({ owner, count: 0, categories: [], works: [] }),
      [`GET ${ME}`]: ok({ wawuUserId: 'u1' }),
    };
    const { onAddWork } = await boot();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add a work' }));
    expect(onAddWork).toHaveBeenCalledTimes(1);
  });

  it('a category with nothing left says so and Show all works goes back to everything', async () => {
    answers = {
      [`GET ${WORKS}`]: ok(all),
      [`GET ${WORKS}?category=Photography`]: ok({ ...all, categories: [], works: [] }),
    };
    await boot();
    await screen.findByText('Aba Fashion Week recap');
    await fireEvent.press(screen.getByRole('radio', { name: 'Photography' }));
    expect(await screen.findByTestId('works-empty-category')).toBeTruthy();
    expect(screen.getByText('Nothing under Photography')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Show all works' }));
    expect(await screen.findByText('Aba Fashion Week recap')).toBeTruthy();
  });

  it('Back goes back', async () => {
    answers = { [`GET ${WORKS}`]: ok(all) };
    const { onBack } = await boot();
    await fireEvent.press(await screen.findByTestId('works-back'));
    expect(onBack).toHaveBeenCalled();
  });
});
