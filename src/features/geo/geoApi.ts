import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The Hub's country and region lists and the signed-in person's own place (GEO-02, R-85). The app carries no list of
 * its own: every country, its calling code, flag and example number, and every country's regions, are read from here.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`, so each call reads `data`.
 */
export type GeoCountry = components['schemas']['GeoCountryView'];
export type GeoRegion = components['schemas']['GeoRegionView'];
export type MyLocation = components['schemas']['MeLocationView'];

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function rootOf(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const wrapped = (body as { data?: unknown }).data;
  const root = wrapped !== undefined ? wrapped : body;
  return root && typeof root === 'object' ? (root as Record<string, unknown>) : null;
}

/** `GET /geo/countries`: every country A to Z. Public (a sign-up screen needs it before anyone has a token). */
export async function fetchCountries(): Promise<GeoCountry[]> {
  const root = rootOf(await unwrap(api.GET('/api/hub/geo/countries')));
  const items = root?.items;
  if (!Array.isArray(items)) throw unreadable('list of countries');
  return (items as GeoCountry[]).filter((c) => typeof c?.code === 'string' && typeof c?.name === 'string');
}

/** `GET /geo/countries/{code}/regions`: the country's own states, provinces or counties A to Z; empty when the country has none. */
export async function fetchRegions(code: string): Promise<GeoRegion[]> {
  const root = rootOf(await unwrap(api.GET('/api/hub/geo/countries/{code}/regions', { params: { path: { code } } })));
  const items = root?.items;
  if (!Array.isArray(items)) throw unreadable('list of regions');
  return (items as GeoRegion[]).filter((r) => typeof r?.code === 'string' && typeof r?.name === 'string');
}

/**
 * `GET /me/location`: where the signed-in person is. Where they have not chosen a country the Hub records the one WAWU ID
 * gives (else their phone's) when this is asked, so the dashboard counts them; the app calls it once after sign-in.
 */
export async function fetchMyLocation(): Promise<MyLocation> {
  const root = rootOf(await unwrap(api.GET('/api/hub/me/location')));
  if (!root || !('countryCode' in root)) throw unreadable('place');
  return root as unknown as MyLocation;
}
