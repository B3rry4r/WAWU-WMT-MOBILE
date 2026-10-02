import { api, unwrap } from './client';
import { ApiError, isApiError } from './errors';
import type { components } from './schema.generated';
import type { MoneyErrorCode } from './money';

/**
 * Open your wallet's identity step (backend task KYC-01), as the contract types
 * it. No screen here: A26 and A14 are KYC-05's, A5 is KYC-03's.
 *
 * - `WalletIdentity`: where the step stands. Only the last 4 digits of the BVN
 *   and NIN ever come back, plus the BVN checks left in the current 24 hours.
 * - `BvnCheck`: the answer to a check that passed, with A5's prefill (name,
 *   date of birth, gender). The backend does not keep the prefill, so the app
 *   holds it for A5 and never stores it on the phone.
 *
 * The BVN and NIN go in the request body only, never in a URL, and nothing
 * here keeps them after the call returns.
 */
export type WalletIdentity = components['schemas']['WalletIdentityView'];
export type BvnCheck = components['schemas']['BvnCheckView'];
export type BvnPrefill = components['schemas']['BvnPrefillView'];

/** The Hub's success body; the contract types only its `data` (SHARED-CHANGES.md row 11). */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your details could not be read. Try again.');
}

function readIdentity(value: unknown): WalletIdentity {
  const v = value as Partial<WalletIdentity> | null;
  if (!v || typeof v !== 'object' || !Number.isSafeInteger(v.checksLeft) || !('bvn' in v)) {
    throw unreadable();
  }
  return v as WalletIdentity;
}

/** GET /money/identity. */
export async function fetchWalletIdentity(): Promise<WalletIdentity> {
  const body = (await unwrap(api.GET('/api/hub/money/identity'))) as unknown as Envelope<WalletIdentity>;
  return readIdentity(body?.data);
}

/**
 * POST /money/identity/bvn with the BVN and NIN from A26 (11 digits each,
 * spaces removed). Resolves with A5's prefill on a pass; rejects with an
 * ApiError whose `code` is the reason (see `identityProblem`).
 */
export async function checkBvn(input: { bvn: string; nin: string }): Promise<BvnCheck> {
  const body = (await unwrap(
    api.POST('/api/hub/money/identity/bvn', {
      body: { bvn: input.bvn.replace(/\s+/g, ''), nin: input.nin.replace(/\s+/g, '') },
    }),
  )) as unknown as Envelope<BvnCheck>;
  const data = body?.data;
  if (!data || typeof data.prefill !== 'object' || data.prefill === null) throw unreadable();
  return { identity: readIdentity(data.identity), prefill: data.prefill };
}

/** PUT /money/identity/occupation, A5's typed occupation. Needs a passed BVN check first. */
export async function saveOccupation(occupation: string): Promise<WalletIdentity> {
  const body = (await unwrap(
    api.PUT('/api/hub/money/identity/occupation', { body: { occupation } }),
  )) as unknown as Envelope<WalletIdentity>;
  return readIdentity(body?.data);
}

export const walletIdentityQuery = {
  queryKey: ['money', 'identity'] as const,
  queryFn: fetchWalletIdentity,
  staleTime: 0,
};

/**
 * Why a BVN check did not pass, for the screen to pick its state:
 * - `phone_mismatch`: A14, "This isn't the number on your BVN. Use that one.";
 * - `not_confirmed`: the BVN was not found; check the number;
 * - `phone_not_nigerian`: the account's phone is not a Nigerian mobile;
 * - `limit`: today's checks are used up (`identity_checks_exhausted`);
 * - `wallet_open`: the wallet is already open;
 * - `not_checked`: occupation sent before a passed check;
 * - `unreachable`: the check could not run now (503);
 * - `other`: anything else (no connection, signed out, the per-address limit).
 */
export type IdentityProblem =
  | 'phone_mismatch'
  | 'not_confirmed'
  | 'phone_not_nigerian'
  | 'limit'
  | 'wallet_open'
  | 'not_checked'
  | 'unreachable'
  | 'other';

const problems: Partial<Record<MoneyErrorCode, IdentityProblem>> = {
  bvn_phone_mismatch: 'phone_mismatch',
  bvn_not_confirmed: 'not_confirmed',
  phone_not_nigerian: 'phone_not_nigerian',
  identity_checks_exhausted: 'limit',
  wallet_already_open: 'wallet_open',
  bvn_not_checked: 'not_checked',
  provider_unreachable: 'unreachable',
};

export function identityProblem(error: unknown): IdentityProblem {
  if (!isApiError(error) || !error.code) return 'other';
  return problems[error.code as MoneyErrorCode] ?? 'other';
}
