import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/** A fake Hub on `fetch` for the library and dashboard tests: it keeps each request's path, query and body, and answers by `METHOD /path`. */
type Plain = { status: number; body: unknown } | 'offline' | 'hang';
export type Answer = Plain | Promise<Plain> | ((request: Sent) => Plain | Promise<Plain>);
export type Sent = { method: string; path: string; search: string; body: unknown };

export const hub: { answers: Record<string, Answer>; sent: Sent[] } = { answers: {}, sent: [] };

export function installFetch() {
  hub.answers = {};
  hub.sent = [];
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const text = request.method === 'GET' ? '' : await request.text();
    const sent: Sent = { method: request.method, path: url.pathname, search: url.search, body: text ? JSON.parse(text) : undefined };
    hub.sent.push(sent);
    const asked: Answer | undefined = hub.answers[`${request.method} ${url.pathname}`];
    const answer: Plain | undefined = await (typeof asked === 'function' ? asked(sent) : asked);
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hang') return new Promise<Response>(() => undefined);
    if (answer.status === 204) return new Response(null, { status: 204 });
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

export const ok = (data: unknown, pagination?: { currentPage: number; nextPage: number | null; perPage: number; total: number }) => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data, ...(pagination ? { pagination } : {}) },
});
export const refusal = (statusCode: number, message: string, extra: Record<string, unknown> = {}) => ({ status: statusCode, body: { statusCode, message, data: null, ...extra } });
export const noContent = { status: 204, body: null };

export const calls = (method: string, path: string) => hub.sent.filter((s) => s.method === method && s.path === path);

const MB = 1024 * 1024;
export const allowance = (used: number, allowed: number, tickHeld = false) => ({
  tickHeld,
  uploads: { used, allowed, remaining: Math.max(0, allowed - used) },
  storage: { usedBytes: 0, limitBytes: 1024 * MB, remainingBytes: 1024 * MB },
  free: { uploads: 5, storageBytes: 1024 * MB },
  withTick: { uploads: 25, storageBytes: 10 * 1024 * MB },
});

/** `GET /me/tier` for a person holding a running tier (RELEASE-02 second pass, M-3): the tier's own count and end date. */
export const runningTier = (used: number, allowed: number, id = 'verify', name = 'Verify') => ({
  state: 'active',
  tier: { id, name, badge: { id: 'verified', numbered: false } },
  activeFrom: '2026-10-01T00:00:00.000Z',
  activeUntil: '2099-11-26T00:00:00.000Z',
  productsAllowed: allowed,
  productsUsed: used,
  extraProducts: 0,
  pointsIncluded: 100,
  firstVoiceIntroIncluded: true,
  eventPass: null,
});

/** One piece as `GET /content/mine/library` serves it. */
export function piece(over: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    title: 'How I light a night shoot',
    createdAt: new Date().toISOString(),
    status: 'live',
    creatorWawuId: 'u1',
    slug: 'how-i-light-a-night-shoot',
    contentType: 'video',
    description: 'Three lights, one actor.',
    category: 'entertainment_creative',
    specializations: [],
    tags: [],
    accessType: 'paid',
    price: 2500,
    durationLabel: null,
    pageCount: null,
    previewAssetUrl: 'https://storage.test/preview.mp4',
    creatorFirstUploadFree: false,
    views: 0,
    ratingPct: null,
    commentCount: 0,
    likes: 0,
    fullAssetUrl: 'https://storage.test/full.mp4',
    fullAssetLocked: false,
    salesCount: 18,
    rejectionReason: null,
    rejectedAt: null,
    ...over,
  };
}

export async function renderFrame(children: ReactNode, client?: QueryClient) {
  const queryClient = client ?? new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  return {
    queryClient,
    ...(await render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>,
    )),
  };
}
