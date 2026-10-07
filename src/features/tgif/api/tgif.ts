import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * H29 to H35's calls, as the Hub's contract types them:
 * - `GET /tgif/{date}`: the five cards of the day, the series and the link to share (HOME-09);
 * - `GET /tgif/{date}/stats`: Amen per card, readers and shares, and what the caller has done (HOME-10);
 * - `POST /tgif/{date}/react`, `DELETE /tgif/{date}/react/{card}`: say Amen, take it back;
 * - `POST /tgif/{date}/read` and `POST /tgif/{date}/share`: one reader and one share per person per day;
 * - `GET /tgif/{date}/share-image`: the verse on the shared card, as a PNG (HOME-09).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type TgifDay = components['schemas']['TgifDayView'];
export type TgifStats = components['schemas']['TgifStats'];
export type TgifCardStats = components['schemas']['TgifCardStats'];
export type TgifCard = TgifCardStats['card'];
export type TgifReactionState = components['schemas']['TgifReactionState'];
export type TgifReadState = components['schemas']['TgifReadState'];
export type TgifShareState = components['schemas']['TgifShareState'];

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Today's ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

export const dayKey = (date: string) => ['tgif', 'day', date] as const;
export const statsKey = (date: string) => ['tgif', 'stats', date] as const;
export const shareCardKey = (date: string) => ['tgif', 'share-card', date] as const;

export async function fetchDay(date: string): Promise<TgifDay> {
  const day = dataOf<TgifDay>(await unwrap(api.GET('/api/hub/tgif/{date}', { params: { path: { date } } })), 'verse');
  if (typeof day.verse !== 'string' || typeof day.reality !== 'string' || typeof day.takeaway !== 'string') throw unreadable('verse');
  return day;
}

export async function fetchStats(date: string): Promise<TgifStats> {
  const stats = dataOf<TgifStats>(await unwrap(api.GET('/api/hub/tgif/{date}/stats', { params: { path: { date } } })), 'numbers');
  if (!Array.isArray(stats.cards)) throw unreadable('numbers');
  return stats;
}

export async function sayAmen(date: string, card: TgifCard): Promise<TgifReactionState> {
  const state = dataOf<TgifReactionState>(
    await unwrap(api.POST('/api/hub/tgif/{date}/react', { params: { path: { date } }, body: { card } })),
    'Amen',
  );
  if (typeof state.amen !== 'number') throw unreadable('Amen');
  return state;
}

export async function takeAmenBack(date: string, card: TgifCard): Promise<TgifReactionState> {
  const state = dataOf<TgifReactionState>(
    await unwrap(api.DELETE('/api/hub/tgif/{date}/react/{card}', { params: { path: { date, card } } })),
    'Amen',
  );
  if (typeof state.amen !== 'number') throw unreadable('Amen');
  return state;
}

export async function markRead(date: string): Promise<TgifReadState> {
  return dataOf<TgifReadState>(await unwrap(api.POST('/api/hub/tgif/{date}/read', { params: { path: { date } } })), 'readers');
}

export async function markShared(date: string): Promise<TgifShareState> {
  return dataOf<TgifShareState>(await unwrap(api.POST('/api/hub/tgif/{date}/share', { params: { path: { date } } })), 'shares');
}

/** The shared card: the picture to send, and the same picture as an address the preview can draw. */
export type ShareCard = { blob: Blob; uri: string };

function readAsDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(unreadable('card'));
    reader.readAsDataURL(blob);
  });
}

export async function fetchShareCard(date: string): Promise<ShareCard> {
  const blob = await unwrap(api.GET('/api/hub/tgif/{date}/share-image', { params: { path: { date } }, parseAs: 'blob' }));
  if (!(blob instanceof Blob) || blob.size === 0 || (blob.type !== '' && blob.type !== 'image/png')) throw unreadable('card');
  const uri = await readAsDataUri(blob);
  return { blob, uri: uri.startsWith('data:image/png') ? uri : uri.replace(/^data:[^;]*/, 'data:image/png') };
}
