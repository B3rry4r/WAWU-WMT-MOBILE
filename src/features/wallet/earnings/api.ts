import { infiniteQueryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';

import { unreadable, type Envelope } from '../api/home';

/**
 * The reads behind W39 (WALLET-13), both served by WALLET-16 from the Hub's own records of the sales:
 *
 * - `GET /money/earnings`: what was earned all time and in a month, by kind of sale, and what is still waiting to reach the
 *   wallet. The month is the Hub's (Lagos time); the app sends none, so it is the current one. `walletOpen` says whether
 *   the person has a wallet to land in;
 * - `GET /money/earnings/content?month=`: that month piece by piece, largest first, a page at a time (the cursor is the
 *   Hub's, opaque).
 *
 * Neither is behind the wallet gate: a creator with no wallet keeps earning (R-11) and has to see the money waiting. Every
 * figure is the Hub's, in whole kobo; nothing is added up here, so a total is never one the Hub did not send. Every key
 * starts with `money`, so the end of Open your wallet (which asks every `['money']` read again) reaches these too.
 */
export type Earnings = components['schemas']['EarningsView'];
export type EarningStream = components['schemas']['EarningStreamView'];
export type EarningPiece = components['schemas']['EarningContentView'];
type ContentPage = components['schemas']['EarningContentPage'];

/** Pieces asked for at a time. */
export const CONTENT_PAGE_SIZE = 20;

const whole = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
const text = (s: unknown): s is string => typeof s === 'string' && s !== '';
const monthShaped = (s: unknown): s is string => typeof s === 'string' && /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(s);

function readStreams(value: unknown): EarningStream[] {
  if (!Array.isArray(value)) throw unreadable('earnings');
  return value.map((entry) => {
    const s = entry as Partial<EarningStream> | null;
    if (!s || !text(s.kind) || !whole(s.earnedKobo) || !whole(s.sales)) throw unreadable('earnings');
    return { kind: s.kind, earnedKobo: s.earnedKobo, sales: s.sales };
  });
}

function readPeriod(value: unknown): Earnings['allTime'] {
  const p = value as Partial<Earnings['allTime']> | null;
  if (!p || !whole(p.earnedKobo) || !whole(p.sales)) throw unreadable('earnings');
  return { earnedKobo: p.earnedKobo, sales: p.sales, streams: readStreams(p.streams) };
}

function readWaiting(value: unknown): Earnings['waiting'] {
  const w = value as Partial<Earnings['waiting']> | null;
  if (!w || !whole(w.count) || !whole(w.amountKobo)) throw unreadable('earnings');
  return { count: w.count, amountKobo: w.amountKobo };
}

/** GET /money/earnings. A body that is not an earnings view is refused, never drawn as zeros. */
export async function fetchEarnings(): Promise<Earnings> {
  const body = (await unwrap(api.GET('/api/hub/money/earnings', { params: { query: {} } }))) as unknown as Envelope<Earnings>;
  const v = body?.data as Partial<Earnings> | null | undefined;
  if (!v || !monthShaped(v.month) || typeof v.walletOpen !== 'boolean') throw unreadable('earnings');
  return {
    month: v.month,
    walletOpen: v.walletOpen,
    allTime: readPeriod(v.allTime),
    thisMonth: readPeriod(v.thisMonth),
    waiting: readWaiting(v.waiting),
    held: readWaiting(v.held),
  };
}

export type PiecesPage = { items: EarningPiece[]; nextCursor: string | null };

/** GET /money/earnings/content: one page of a month's pieces. */
export async function fetchPieces(month: string, cursor: string | undefined): Promise<PiecesPage> {
  const body = (await unwrap(
    api.GET('/api/hub/money/earnings/content', { params: { query: { month, limit: CONTENT_PAGE_SIZE, cursor } } }),
  )) as unknown as Envelope<ContentPage>;
  const page = body?.data;
  if (!page || !Array.isArray(page.items) || (page.nextCursor !== null && typeof page.nextCursor !== 'string')) throw unreadable('earnings');
  const items = page.items.map((entry) => {
    const p = entry as Partial<EarningPiece> | null;
    if (!p || !text(p.kind) || !text(p.targetId) || typeof p.title !== 'string' || !whole(p.earnedKobo) || !whole(p.sales)) throw unreadable('earnings');
    return { kind: p.kind, targetId: p.targetId, title: p.title, earnedKobo: p.earnedKobo, sales: p.sales, lastAt: String(p.lastAt ?? '') } as EarningPiece;
  });
  return { items, nextCursor: page.nextCursor };
}

export const earningsKeys = {
  summary: (owner: string | null) => ['money', 'earnings', 'summary', owner ?? ''] as const,
  pieces: (owner: string | null, month: string) => ['money', 'earnings', 'pieces', owner ?? '', month] as const,
};

/** Never fresh from the cache: an earning lands within a day and a sale can come in at any moment, so each visit asks again. */
export function earningsQuery(owner: string | null) {
  return {
    queryKey: earningsKeys.summary(owner),
    queryFn: fetchEarnings,
    staleTime: 0,
    enabled: Boolean(owner),
  };
}

/** The month's pieces, asked for the month the Hub named in the summary, so the two never describe different months. */
export function piecesQuery(owner: string | null, month: string | undefined) {
  return infiniteQueryOptions({
    queryKey: earningsKeys.pieces(owner, month ?? ''),
    queryFn: ({ pageParam }) => fetchPieces(month as string, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: PiecesPage) => last.nextCursor ?? undefined,
    staleTime: 0,
    enabled: Boolean(owner) && Boolean(month),
  });
}
