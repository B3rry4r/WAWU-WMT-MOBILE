import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';
import type { ExploreCreator } from '@/features/explore/api';
import { fetchOpenedWallet } from '@/features/open-wallet/api/wallet';
import { fetchSettings } from '@/features/paid-messages/api';

/**
 * The Hub calls behind A11, A12, A13 and "Become a creator" (AUTH-06):
 * - `GET` and `PUT /users/me/interests`: the twelve chips, the minimum, and the ones saved;
 * - `GET /explore/suggested-creators`: people to follow, the best match for the picks first;
 * - A11's four reads: the paid message price, the profile's completeness and published pieces, and the wallet.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`, so each call reads `data` itself.
 */
type InterestsAnswer = operations['UserProfileController_getMyInterests']['responses'][200]['content']['application/json'];
/** The chip ids the contract accepts, the twelve of `GET /explore/categories`. */
type ChipIds = components['schemas']['SaveInterestsDto']['interests'];
export type Interests = { minimum: number; options: { id: string; label: string }[]; selected: string[] };

export const interestsKey = ['after-signup', 'interests'] as const;
export const suggestedKey = (picks: readonly string[]) => ['explore', 'suggested', ...picks] as const;
export const setupKey = ['after-signup', 'setup'] as const;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as { data?: T | null } | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

function readInterests(body: unknown): Interests {
  const data = dataOf<Partial<InterestsAnswer>>(body, 'interests');
  const options = Array.isArray(data.options) ? data.options.filter((o) => typeof o?.id === 'string' && o.id !== '' && typeof o.label === 'string' && o.label !== '') : [];
  if (typeof data.minimum !== 'number' || !Number.isInteger(data.minimum) || data.minimum < 1 || options.length === 0 || !Array.isArray(data.selected)) {
    throw unreadable('interests');
  }
  return { minimum: data.minimum, options, selected: data.selected.filter((s): s is string => typeof s === 'string') };
}

export async function fetchInterests(): Promise<Interests> {
  return readInterests(await unwrap(api.GET('/api/hub/users/me/interests')));
}

export async function saveInterests(ids: string[]): Promise<Interests> {
  return readInterests(await unwrap(api.PUT('/api/hub/users/me/interests', { body: { interests: ids as ChipIds } })));
}

/** Who to suggest for these picks. Empty when nobody matches yet. */
export async function fetchSuggested(picks: readonly string[]): Promise<ExploreCreator[]> {
  const data = dataOf<{ items?: unknown }>(
    await unwrap(api.GET('/api/hub/explore/suggested-creators', { params: { query: { interests: [...picks] as ChipIds } } })),
    'people to follow',
  );
  if (!Array.isArray(data.items)) throw unreadable('people to follow');
  return data.items as ExploreCreator[];
}

/** What A11's rows show as done. `undefined` is "could not be read", never "not done". */
export type SetupState = { priced?: boolean; profile?: boolean; published?: boolean; wallet?: boolean; failed: boolean };

/** The four reads, each on its own: one that fails leaves its row unmarked and the other three drawn. */
export async function fetchSetupState(): Promise<SetupState> {
  const [price, stats, wallet] = await Promise.allSettled([
    fetchSettings(),
    unwrap(api.GET('/api/hub/users/me/profile-stats')),
    fetchOpenedWallet(),
  ]);
  const s = stats.status === 'fulfilled' ? (stats.value as { data?: { postCount?: unknown; profileCompletenessMissing?: unknown } | null })?.data : undefined;
  const readStats = Boolean(s) && typeof s?.postCount === 'number' && Array.isArray(s?.profileCompletenessMissing);
  return {
    priced: price.status === 'fulfilled' ? price.value.priceKobo !== null : undefined,
    profile: readStats ? (s!.profileCompletenessMissing as unknown[]).length === 0 : undefined,
    published: readStats ? (s!.postCount as number) >= 1 : undefined,
    wallet: wallet.status === 'fulfilled' ? wallet.value.state === 'open' : undefined,
    failed: price.status === 'rejected' || stats.status === 'rejected' || wallet.status === 'rejected' || !readStats,
  };
}
