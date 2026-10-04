import { api, unwrap } from './client';
import { ApiError, isApiError } from './errors';
import type { components } from './schema.generated';
import type { MoneyErrorCode } from './money';

/**
 * Open your wallet's identity step (backend tasks KYC-01 and KYC-02), as the
 * contract types it. No screen here: A26 and A14 are KYC-05's; A5, A6, A7 and
 * A16 are KYC-03's.
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
/**
 * The selfie step (KYC-02): when the selfie matched the BVN photo (null until
 * it has, and again after a new BVN check) and the matches left in the current
 * 24 hours. It is a face match, not a liveness check.
 */
export type SelfieMatch = components['schemas']['SelfieMatchView'];
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
  if (!data || typeof data.prefill !== 'object' || data.prefill === null || typeof data.checkHandle !== 'string') throw unreadable();
  // KYC-03: the sealed check, held in memory only and sent back in place of the BVN and NIN.
  return { identity: readIdentity(data.identity), prefill: data.prefill, checkHandle: data.checkHandle };
}

/** PUT /money/identity/occupation, A5's typed occupation. Needs a passed BVN check first. */
export async function saveOccupation(occupation: string): Promise<WalletIdentity> {
  const body = (await unwrap(
    api.PUT('/api/hub/money/identity/occupation', { body: { occupation } }),
  )) as unknown as Envelope<WalletIdentity>;
  return readIdentity(body?.data);
}

function readSelfie(value: unknown): SelfieMatch {
  const v = value as Partial<SelfieMatch> | null;
  if (
    !v ||
    typeof v !== 'object' ||
    !Number.isSafeInteger(v.checksLeft) ||
    !(v.matchedAt === null || typeof v.matchedAt === 'string')
  ) {
    throw unreadable();
  }
  return { matchedAt: v.matchedAt, checksLeft: v.checksLeft as number };
}

/**
 * The longest selfie the backend takes, in base64 characters (its contract's
 * `SelfieMatchDto.image` maxLength): about 75 KB of JPEG. The screen sends a
 * downscaled, compressed capture.
 */
export const SELFIE_MAX_BASE64_CHARS = 100_000;

/** GET /money/identity/selfie. */
export async function fetchSelfieMatch(): Promise<SelfieMatch> {
  const body = (await unwrap(api.GET('/api/hub/money/identity/selfie'))) as unknown as Envelope<SelfieMatch>;
  return readSelfie(body?.data);
}

/**
 * POST /money/identity/selfie (A6) with the BVN that passed the check and the
 * selfie as base64 JPEG or PNG (a `data:` prefix and line breaks are removed
 * here). Each match is charged to WAWU, a failed one too, so a selfie over the
 * backend's size limit is refused here without sending it. Resolves with
 * `matchedAt` set (A7); rejects with an ApiError whose `code` is the reason
 * (see `selfieProblem`). Neither the BVN nor the selfie is kept after the call.
 */
export async function matchSelfie(input: { bvn: string; image: string }): Promise<SelfieMatch> {
  const image = input.image.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
  if (image.length === 0 || image.length > SELFIE_MAX_BASE64_CHARS) {
    throw new ApiError('validation', 0, 'That photo could not be used. Take it again.');
  }
  const body = (await unwrap(
    api.POST('/api/hub/money/identity/selfie', {
      body: { bvn: input.bvn.replace(/\s+/g, ''), image },
    }),
  )) as unknown as Envelope<SelfieMatch>;
  return readSelfie(body?.data);
}

export const selfieMatchQuery = {
  queryKey: ['money', 'identity', 'selfie'] as const,
  queryFn: fetchSelfieMatch,
  staleTime: 0,
};

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

/**
 * Why a selfie match did not pass, for the screen to pick its state:
 * - `not_matched`: A16, "We couldn't match your face. It must match your BVN
 *   photo. Good light, no glasses or cap.", with Try again while
 *   `fetchSelfieMatch().checksLeft` is above 0;
 * - `limit`: today's matches are used up (`selfie_checks_exhausted`): A16 and
 *   the retry rule, no Try again;
 * - `already_matched`: the selfie already matched (A7);
 * - `not_checked`: no passed BVN check, or a different BVN: back to A26;
 * - `wallet_open`: the wallet is already open;
 * - `unreachable`: the match could not run now (503);
 * - `other`: anything else (no connection, signed out, a refused photo, the
 *   per-address limit).
 */
export type SelfieProblem =
  | 'not_matched'
  | 'limit'
  | 'already_matched'
  | 'not_checked'
  | 'wallet_open'
  | 'unreachable'
  | 'other';

const selfieProblems: Partial<Record<MoneyErrorCode, SelfieProblem>> = {
  selfie_not_matched: 'not_matched',
  selfie_checks_exhausted: 'limit',
  selfie_already_matched: 'already_matched',
  bvn_not_checked: 'not_checked',
  wallet_already_open: 'wallet_open',
  provider_unreachable: 'unreachable',
};

export function selfieProblem(error: unknown): SelfieProblem {
  if (!isApiError(error) || !error.code) return 'other';
  return selfieProblems[error.code as MoneyErrorCode] ?? 'other';
}
