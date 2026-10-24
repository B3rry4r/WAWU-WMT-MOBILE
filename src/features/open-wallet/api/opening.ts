import { api, unwrap } from '@/api/client';
import { ApiError, isApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { SELFIE_MAX_BASE64_CHARS, type SelfieMatch } from '@/api/walletIdentity';

import type { WalletState } from './account';

/**
 * The two charged or bank-facing calls after A26 (KYC-03): A6 sends the
 * selfie to be matched with the BVN photo, A7 opens the account. A refusal's
 * `ApiError` carries what the server said about trying again (`detail.checksLeft`,
 * `retryAfterSeconds`). The reads (`fetchSelfieMatch`, `fetchWalletState`) and A5's occupation
 * (`saveOccupation`) need neither, so the screens call the shared ones.
 *
 * **The BVN and the NIN are not sent again** (BACKEND_GAPS G-72, served). A26
 * sends them once, to the BVN check, and nothing on the phone keeps them
 * after that request. The check answers `checkHandle` (the numbers sealed
 * under a server key, unreadable here, good for 30 minutes), which A26 keeps
 * in memory with the prefill (`keptCheck.ts`) and these two calls send in
 * their place. A handle that no longer serves is `409 bvn_not_checked`: the
 * person runs the BVN check again.
 *
 * The selfie and the handle go in the request body only, once; nothing here
 * keeps them, logs them, or puts them in a URL.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };
type WalletView = components['schemas']['WalletView'];

/** The matches (or checks) left today that a refusal carried, or null. */
export function checksLeftOf(error: unknown): number | null {
  if (!isApiError(error)) return null;
  return error.detail?.checksLeft ?? null;
}

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your details could not be read. Try again.');
}

/** Sends one request; a refusal rejects with the shared `ApiError`, an answer is the envelope's `data`. */
async function send(request: Promise<{ data?: unknown; error?: unknown; response: Response }>): Promise<unknown> {
  const body = (await unwrap(request)) as Envelope<unknown> | undefined;
  return body?.data;
}

function readSelfie(value: unknown): SelfieMatch {
  const v = value as Partial<SelfieMatch> | null;
  if (!v || typeof v !== 'object' || !Number.isSafeInteger(v.checksLeft) || !(v.matchedAt === null || typeof v.matchedAt === 'string')) {
    throw unreadable();
  }
  return { matchedAt: v.matchedAt, checksLeft: v.checksLeft as number };
}

/**
 * The smallest selfie the server takes: 1 KB of image (contract
 * `SelfieMatchDto.image`, "1 KB to about 75 KB"). In base64, 4 characters
 * carry 3 bytes.
 */
const SELFIE_MIN_BYTES = 1024;
const BASE64_CHARS_PER_3_BYTES = 4;
const BASE64_BYTES_PER_4_CHARS = 3;
export const SELFIE_MIN_BASE64_CHARS = Math.ceil(SELFIE_MIN_BYTES / BASE64_BYTES_PER_4_CHARS) * BASE64_CHARS_PER_3_BYTES;

/** True when a capture is plain base64 the server can take: neither too small nor over its limit. */
export function isSendableSelfie(image: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(image) && image.length >= SELFIE_MIN_BASE64_CHARS && image.length <= SELFIE_MAX_BASE64_CHARS;
}

/**
 * POST /money/identity/selfie (A6): the capture, matched with the BVN photo.
 * Every match is charged, a failed one too, so a capture the server would
 * refuse is never sent. Resolves with `matchedAt` set (A7); a 200 without it
 * is not a match.
 */
export async function matchSelfie(image: string, checkHandle: string): Promise<SelfieMatch> {
  if (!isSendableSelfie(image)) throw new ApiError('validation', 0, 'That photo could not be used. Take it again.');
  const match = readSelfie(await send(api.POST('/api/hub/money/identity/selfie', { body: { image, checkHandle } })));
  if (match.matchedAt === null) throw unreadable();
  return match;
}

export type OpeningInput = { firstName: string; lastName: string; dateOfBirth: string; address: string; checkHandle: string };

const walletStates: readonly WalletState[] = ['not_open', 'opening', 'open', 'frozen'];

function readWallet(value: unknown): WalletState {
  const state = (value as Partial<WalletView> | null)?.state;
  if (typeof state !== 'string' || !walletStates.includes(state as WalletState)) throw unreadable();
  return state as WalletState;
}

/**
 * POST /money/wallet/open (A7): A5's name and date of birth from the BVN
 * check, and the address typed, in one line. Safe to repeat: the server opens
 * one account per person however many times it is asked. Resolves with the
 * wallet's state: `open`, or `opening` while the bank's answer is confirmed.
 */
export async function openWallet(input: OpeningInput): Promise<WalletState> {
  return readWallet(await send(api.POST('/api/hub/money/wallet/open', { body: { ...input } })));
}
