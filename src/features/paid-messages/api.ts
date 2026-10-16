import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The creator's paid message settings (I21 to I23), as the Hub's contract types them (INBOX-12):
 * - `GET /paid-dm/settings`: the switch, the price in kobo, the reply window, the share and what the creator keeps, the
 *   price to raise to, the options to choose from, and the standing (warned, paused and until when);
 * - `PUT /paid-dm/settings`: saves them. While paid messages are off for 7 days the Hub refuses with the code
 *   `paid_messages_paused` (R-13); a plain account is refused with a 403.
 *
 * - `GET /paid-dm/settings/earn?priceKobo=`: what the creator keeps of one message at a typed price, worked out by the Hub
 *   with the same share and rounding as the saved settings, so the screen never multiplies or divides money (R-21).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11),
 * so each call reads `data` itself.
 */
export type PaidMessageSettings = components['schemas']['PaidDmSettings'];
export type PaidMessageStanding = PaidMessageSettings['standing'];
export type PaidMessageEarn = components['schemas']['PaidDmEarn'];
export type PaidMessageSave = components['schemas']['UpdatePaidDmSettingsDto'];

/** The error code a save is refused with while paid messages are off for 7 days. */
export const PAUSED_CODE = 'paid_messages_paused';

export const settingsKey = ['paid-messages', 'settings'] as const;
export const earnKey = (priceKobo: number) => ['paid-messages', 'earn', priceKobo] as const;

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your paid message settings could not be read. Try again.');
}

function settingsOf(body: unknown): PaidMessageSettings {
  const data = (body as { data?: PaidMessageSettings | null } | null)?.data;
  if (!data || typeof data !== 'object' || typeof data.standing !== 'object' || !data.standing || !data.options) throw unreadable();
  return data;
}

export async function fetchSettings(): Promise<PaidMessageSettings> {
  return settingsOf(await unwrap(api.GET('/api/hub/paid-dm/settings')));
}

export async function saveSettings(body: PaidMessageSave): Promise<PaidMessageSettings> {
  return settingsOf(await unwrap(api.PUT('/api/hub/paid-dm/settings', { body })));
}

/** What the creator keeps of one message at `priceKobo`, in kobo, as the Hub works it out. Throws when the answer is not for that price. */
export async function fetchEarn(priceKobo: number): Promise<number> {
  const body = await unwrap(api.GET('/api/hub/paid-dm/settings/earn', { params: { query: { priceKobo } } }));
  const earn = (body as { data?: PaidMessageEarn | null } | null)?.data;
  if (!earn || earn.priceKobo !== priceKobo || !Number.isInteger(earn.earnPerMessageKobo)) {
    throw new ApiError('unknown', 200, 'What you would earn could not be read. Try again.');
  }
  return earn.earnPerMessageKobo;
}
