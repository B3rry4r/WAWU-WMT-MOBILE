import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The read behind the Creator dashboard's earnings card (M18), `GET /me/earnings` (ME-10): what the person's completed sales earned in a
 * month (the Hub's own, Lagos time: it names the month and sends none unless asked), the month before it, the change between them in
 * percent, and the twelve months ending with this one for the bars. Never a balance: what the wallet holds is the provider's figure alone.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`, so the call reads it.
 */
export type MyEarnings = components['schemas']['MyEarningsView'];

/** Starts with `creator`, so the dashboard's reads share one prefix. */
export const earningsKey = ['creator', 'earnings'] as const;

const whole = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;

export async function fetchMyEarnings(): Promise<MyEarnings> {
  const body = (await unwrap(api.GET('/api/hub/me/earnings', { params: { query: {} } }))) as unknown as { data?: Partial<MyEarnings> | null };
  const v = body?.data;
  const unreadable = () => new ApiError('unknown', 200, 'Your earnings could not be read. Try again.');
  if (!v || typeof v.month !== 'string' || !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(v.month) || !whole(v.earnedKobo) || !whole(v.salesCount)) throw unreadable();
  if (!Array.isArray(v.months) || v.months.length === 0 || !v.months.every((m) => m && typeof m.month === 'string' && whole(m.earnedKobo))) throw unreadable();
  if (v.changePct !== null && typeof v.changePct !== 'number') throw unreadable();
  return v as MyEarnings;
}
