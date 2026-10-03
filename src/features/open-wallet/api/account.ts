import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { fetchWalletIdentity } from '@/api/walletIdentity';

/**
 * The two reads A26 needs besides the identity step (`@/api/walletIdentity`):
 * whose account this is and its phone (the number the BVN must carry, A14),
 * and whether a wallet is already open or opening (MONEY-12, MONEY-13).
 * Both answer in the Hub's `{ statusCode, message, data }` body, of which the
 * contract types only `data` (SHARED-CHANGES.md row 11).
 */
type Profile = components['schemas']['UserProfileWithClaims'];
export type WalletState = components['schemas']['WalletView']['state'];

type Envelope<T> = { statusCode: number; message: string; data: T | null };

/** The signed-in account, as far as A26 reads it. */
export type OwnAccount = { wawuUserId: string; phone: string };

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your details could not be read. Try again.');
}

/** GET /users/me: the account's id and its phone (the token's own claim, as the BVN check compares it). */
export async function fetchOwnAccount(): Promise<OwnAccount> {
  const body = (await unwrap(api.GET('/api/hub/users/me'))) as unknown as Envelope<Profile>;
  const me = body?.data;
  if (!me || typeof me.wawuUserId !== 'string' || typeof me.phone !== 'string') throw unreadable();
  return { wawuUserId: me.wawuUserId, phone: me.phone };
}

const walletStates: readonly WalletState[] = ['not_open', 'opening', 'open', 'frozen'];

/** GET /money/wallet: `not_open`, `opening`, `open` or `frozen`. It never calls the bank. */
export async function fetchWalletState(): Promise<WalletState> {
  const body = (await unwrap(api.GET('/api/hub/money/wallet'))) as unknown as Envelope<{ state?: unknown }>;
  const state = body?.data?.state;
  if (typeof state !== 'string' || !walletStates.includes(state as WalletState)) throw unreadable();
  return state as WalletState;
}

/**
 * A26's reads, all under one key prefix so the step can drop them in one go
 * (on leaving, and when the session ends). The app has one query cache for
 * every account that signs in on the phone, so no key here is shared across
 * accounts:
 * - whose account it is: keyed by this visit of the step (`visit`), so it is
 *   never answered from a cache another session filled;
 * - the wallet and the identity step: keyed by that account's id, and only
 *   read once it is known.
 */
export const OPEN_WALLET_KEY = 'open-wallet' as const;

/** `signedIn`: false once the session has ended, so a step still drawn reads nothing as nobody. */
export function ownAccountQuery(visit: number, signedIn = true) {
  return { queryKey: [OPEN_WALLET_KEY, 'me', visit] as const, queryFn: fetchOwnAccount, staleTime: 0, enabled: signedIn };
}

export function walletStateQuery(owner: string | undefined) {
  return { queryKey: [OPEN_WALLET_KEY, 'wallet', owner ?? ''] as const, queryFn: fetchWalletState, staleTime: 0, enabled: Boolean(owner) };
}

export function identityQuery(owner: string | undefined) {
  return { queryKey: [OPEN_WALLET_KEY, 'identity', owner ?? ''] as const, queryFn: fetchWalletIdentity, staleTime: 0, enabled: Boolean(owner) };
}
