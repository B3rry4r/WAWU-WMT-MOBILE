import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';
import { fetchMyCommunities } from '@/features/communities/api';
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
export type SetupState = {
  priced?: boolean;
  profile?: boolean;
  /** What the Hub says the profile still lacks (`profileCompletenessMissing`: cover, handle, bio, avatar, links). Empty when it is complete; undefined when it could not be read. */
  profileMissing?: string[];
  published?: boolean;
  community?: boolean;
  wallet?: boolean;
  failed: boolean;
};

/** The most pages of the person's rooms looked through for one they host (twenty a page); a host past them is shown as not started, so the row can still be tapped. */
const HOSTED_PAGES = 5;

/** True when one of the rooms the person is in is theirs (`role` host). The Hub lists the most active first, so a host is found on the first page nearly always. */
async function hostsACommunity(): Promise<boolean> {
  for (let page = 1; page <= HOSTED_PAGES; page += 1) {
    const rooms = await fetchMyCommunities(page);
    if (rooms.items.some((room) => room.role === 'host')) return true;
    if (rooms.nextPage === null) return false;
  }
  return false;
}

/** The five reads, each on its own: one that fails leaves its row unmarked and the other four drawn. */
export async function fetchSetupState(): Promise<SetupState> {
  const [price, stats, wallet, community] = await Promise.allSettled([
    fetchSettings(),
    unwrap(api.GET('/api/hub/users/me/profile-stats')),
    fetchOpenedWallet(),
    hostsACommunity(),
  ]);
  const s = stats.status === 'fulfilled' ? (stats.value as { data?: { postCount?: unknown; profileCompletenessMissing?: unknown } | null })?.data : undefined;
  const readStats = Boolean(s) && typeof s?.postCount === 'number' && Array.isArray(s?.profileCompletenessMissing);
  return {
    priced: price.status === 'fulfilled' ? price.value.priceKobo !== null : undefined,
    profile: readStats ? (s!.profileCompletenessMissing as unknown[]).length === 0 : undefined,
    profileMissing: readStats ? (s!.profileCompletenessMissing as unknown[]).filter((m): m is string => typeof m === 'string') : undefined,
    published: readStats ? (s!.postCount as number) >= 1 : undefined,
    community: community.status === 'fulfilled' ? community.value : undefined,
    wallet: wallet.status === 'fulfilled' ? wallet.value.state === 'open' : undefined,
    failed: price.status === 'rejected' || stats.status === 'rejected' || wallet.status === 'rejected' || community.status === 'rejected' || !readStats,
  };
}
