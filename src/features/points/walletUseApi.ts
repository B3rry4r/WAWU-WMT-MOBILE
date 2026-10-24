import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * "Use wallet for AI tools" (G-POINTS-07-1): `GET` and `PUT /me/points/settings`. Off until the person turns it on. It moves nothing: it only
 * decides whether the quote of a job the points do not cover offers the wallet money for the shortfall (PT3 and PT3b) or Buy points (PT3a).
 */
export type PointsSettings = components['schemas']['PointsSettingsView'];

export const pointsSettingsKey = ['settings', 'points'] as const;

const read = (value: unknown): PointsSettings => {
  const v = value as Partial<PointsSettings> | null;
  if (!v || typeof v !== 'object' || typeof v.useWallet !== 'boolean') throw unreadable('wallet setting');
  return { useWallet: v.useWallet };
};

export async function fetchPointsSettings(): Promise<PointsSettings> {
  const body = (await unwrap(api.GET('/api/hub/me/points/settings'))) as unknown as Envelope<PointsSettings>;
  return read(body?.data);
}

export async function putPointsSettings(useWallet: boolean): Promise<PointsSettings> {
  const body = (await unwrap(api.PUT('/api/hub/me/points/settings', { body: { useWallet } }))) as unknown as Envelope<PointsSettings>;
  return read(body?.data);
}
