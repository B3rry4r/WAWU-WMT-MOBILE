import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, paths } from '@/api/schema.generated';

/**
 * SETTINGS-01's Hub calls, as the Hub's contract types them:
 * - `GET` and `PATCH /settings/notifications` (Z3), keys `moneyIn`, `refunds`, `dmReminders`,
 *   `communityMessages`, `contentReviews`, `newFollowers`, `promotions` (SETTINGS-07);
 * - `GET` and `PATCH /settings/privacy` (Z4);
 * - `GET /settings/privacy/blocked` and `DELETE /settings/privacy/blocked/{id}` (Z5, Z12);
 * - `POST` and `GET /settings/privacy/export` (Z4's "Download my data", SETTINGS-04);
 * - `GET` and `PATCH /settings/tgif` (Z2's TGIF switch, HOME-11);
 * - `GET /users/me` (Z2's header card).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`
 * (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

type Json<P extends keyof paths, M extends 'get' | 'patch' | 'post'> = paths[P] extends Record<M, { responses: { 200: { content: { 'application/json': infer B } } } }>
  ? B
  : never;

export type NotificationSettings = components['schemas']['NotificationSettingsWire'];
export type NotificationUpdate = components['schemas']['UpdateNotificationSettingsDto'];
export type PrivacySettings = Json<'/api/hub/settings/privacy', 'get'>;
export type PrivacyUpdate = components['schemas']['UpdatePrivacySettingsDto'];
export type BlockedAccount = components['schemas']['BlockedAccount'];
export type ExportRequest = paths['/api/hub/settings/privacy/export']['get']['responses'][200]['content']['application/json'][number];
export type TgifPreference = components['schemas']['TgifPreferenceView'];
export type Me = components['schemas']['UserProfileWithClaims'];

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (data === null || data === undefined || typeof data !== 'object') throw unreadable(what);
  return data;
}

export const settingsKeys = {
  me: ['settings', 'me'] as const,
  notifications: ['settings', 'notifications'] as const,
  privacy: ['settings', 'privacy'] as const,
  blocked: ['settings', 'blocked'] as const,
  exports: ['settings', 'exports'] as const,
  tgif: ['settings', 'tgif'] as const,
};

export async function fetchMe(): Promise<Me> {
  const me = dataOf<Me>(await unwrap(api.GET('/api/hub/users/me')), 'account');
  if (typeof me.wawuUserId !== 'string') throw unreadable('account');
  return me;
}

export async function fetchNotifications(): Promise<NotificationSettings> {
  const settings = dataOf<NotificationSettings>(await unwrap(api.GET('/api/hub/settings/notifications')), 'notification settings');
  if (typeof settings.refunds !== 'boolean') throw unreadable('notification settings');
  return settings;
}

export async function patchNotifications(body: NotificationUpdate): Promise<NotificationSettings> {
  return dataOf<NotificationSettings>(await unwrap(api.PATCH('/api/hub/settings/notifications', { body })), 'notification settings');
}

export async function fetchPrivacy(): Promise<PrivacySettings> {
  const settings = dataOf<PrivacySettings>(await unwrap(api.GET('/api/hub/settings/privacy')), 'privacy settings');
  if (typeof settings.showPurchases !== 'boolean') throw unreadable('privacy settings');
  return settings;
}

export async function patchPrivacy(body: PrivacyUpdate): Promise<PrivacySettings> {
  return dataOf<PrivacySettings>(await unwrap(api.PATCH('/api/hub/settings/privacy', { body })), 'privacy settings');
}

/** Every person this account has blocked, newest first as the Hub sends them, and how many the Hub says there are. */
export type BlockedList = { rows: BlockedAccount[]; total: number };

/** The most a page holds (the Hub's own `perPage` limit) and the last page it will serve (its `page` limit). */
const BLOCKED_PER_PAGE = 100;
const BLOCKED_LAST_PAGE = 1000;

type Page<T> = Envelope<T[]> & { pagination?: { nextPage: number | null; total: number } };

/** Reads the list a page at a time until the Hub has no next page. */
export async function fetchBlocked(): Promise<BlockedList> {
  const rows: BlockedAccount[] = [];
  let total = 0;
  for (let page = 1; page <= BLOCKED_LAST_PAGE; page += 1) {
    const body = (await unwrap(
      api.GET('/api/hub/settings/privacy/blocked', { params: { query: { page, perPage: BLOCKED_PER_PAGE } } }),
    )) as unknown as Page<BlockedAccount>;
    if (!Array.isArray(body?.data)) throw unreadable('blocked accounts');
    rows.push(...body.data);
    total = typeof body.pagination?.total === 'number' ? body.pagination.total : rows.length;
    if (!body.pagination?.nextPage) break;
  }
  return { rows, total };
}

/** `id` is the block's own row id (`BlockedAccount.id`), not the person's id. */
export async function unblock(id: string): Promise<void> {
  await unwrap(api.DELETE('/api/hub/settings/privacy/blocked/{id}', { params: { path: { id } } }));
}

export async function fetchExports(): Promise<ExportRequest[]> {
  const list = (await unwrap(api.GET('/api/hub/settings/privacy/export'))) as unknown as Envelope<ExportRequest[]> | ExportRequest[];
  const rows = Array.isArray(list) ? list : list?.data;
  if (!Array.isArray(rows)) throw unreadable('data requests');
  return rows;
}

export async function requestExport(): Promise<ExportRequest> {
  return dataOf<ExportRequest>(await unwrap(api.POST('/api/hub/settings/privacy/export', { body: {} })), 'data request');
}

export async function fetchTgif(): Promise<TgifPreference> {
  const tgif = dataOf<TgifPreference>(await unwrap(api.GET('/api/hub/settings/tgif')), 'TGIF setting');
  if (typeof tgif.show !== 'boolean') throw unreadable('TGIF setting');
  return tgif;
}

export async function patchTgif(show: boolean): Promise<TgifPreference> {
  return dataOf<TgifPreference>(await unwrap(api.PATCH('/api/hub/settings/tgif', { body: { show } })), 'TGIF setting');
}
