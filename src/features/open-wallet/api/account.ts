import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

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

export const ownAccountQuery = {
  queryKey: ['users', 'me', 'open-wallet'] as const,
  queryFn: fetchOwnAccount,
  staleTime: 0,
};

export const walletStateQuery = {
  queryKey: ['money', 'wallet', 'state'] as const,
  queryFn: fetchWalletState,
  staleTime: 0,
};
