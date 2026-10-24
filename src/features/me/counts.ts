import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * `GET /me/counts` (ME-10, ME-03): the figures M7's menu shows under My purchases, My courses, Saved and Notifications, and the unread
 * count the bell on X1 draws its dot from, in one read. The success body is `{ statusCode, message, data }` and the contract types only `data`.
 */
export type MeCounts = components['schemas']['MeCountsView'];

/** Under `me`, so the lists that change these figures (a save taken back, a notification read) refresh it with one invalidation. */
export const countsKey = ['me', 'counts'] as const;

const whole = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

export async function fetchCounts(): Promise<MeCounts> {
  const body = (await unwrap(api.GET('/api/hub/me/counts'))) as unknown as { data?: Partial<MeCounts> | null };
  const c = body?.data;
  if (!c || !whole(c.purchases) || !whole(c.saved) || !whole(c.unreadNotifications)) throw new ApiError('unknown', 200, 'Your counts could not be read. Try again.');
  // `enrolledCourses` (ME-03) is read apart: a Hub that has not served it yet leaves My courses with its title alone, and the other
  // three, and the bell, still read.
  return { purchases: c.purchases, saved: c.saved, unreadNotifications: c.unreadNotifications, enrolledCourses: whole(c.enrolledCourses) ? c.enrolledCourses : 0 };
}
