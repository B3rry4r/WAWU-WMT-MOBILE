import { api } from '@/api/client';
import { ApiError, isApiError, networkError, toApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import type { BvnCheck } from '@/api/walletIdentity';

/**
 * POST /money/identity/bvn (KYC-01) for A26, keeping how long the server says
 * to wait when it refuses. `checkBvn` in `@/api/walletIdentity` sends the same
 * request but its error carries no wait (the shared `ApiError` has no field
 * for it: SHARED-CHANGES KYC-05 #3); until it does, A26 calls this.
 *
 * The wait comes from the answer only: the money refusal's
 * `reason.retryAfterSeconds` (contract `MoneyErrorReason`: the person's daily
 * checks, the provider being down), else the throttler's `Retry-After` or
 * `Retry-After-<window>` headers (the per-address limit, contract CONVENTIONS
 * section 8), the longest one. No answer, no figure: `retryAfterSeconds` is
 * null and the screen says "later".
 *
 * The BVN and NIN go in the body only, and nothing here keeps them.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };
type Reason = components['schemas']['MoneyErrorReason'];

/** An ApiError with the wait the server gave, in seconds, or null. */
export type CheckRefusal = ApiError & { retryAfterSeconds: number | null };

function positiveSeconds(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value.trim()) : value;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.ceil(n) : null;
}

/** The longest wait the answer names: the body's `reason.retryAfterSeconds`, else any `Retry-After*` header. */
export function retryAfterOf(body: unknown, headers: Headers): number | null {
  const reason = (body as { reason?: Partial<Reason> } | null)?.reason;
  const fromBody = positiveSeconds(reason?.retryAfterSeconds);
  if (fromBody !== null) return fromBody;
  let longest: number | null = null;
  headers.forEach((value, name) => {
    if (!name.toLowerCase().startsWith('retry-after')) return;
    const seconds = positiveSeconds(value);
    if (seconds !== null && (longest === null || seconds > longest)) longest = seconds;
  });
  return longest;
}

function refusal(error: ApiError, retryAfterSeconds: number | null): CheckRefusal {
  return Object.assign(error, { retryAfterSeconds });
}

/** The wait a refused check carried, or null. */
export function waitOf(error: unknown): number | null {
  if (!isApiError(error)) return null;
  const seconds = (error as Partial<CheckRefusal>).retryAfterSeconds;
  return typeof seconds === 'number' ? seconds : null;
}

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your details could not be read. Try again.');
}

/**
 * Sends the BVN and NIN (11 digits each). Resolves with A5's prefill and the
 * step's state; rejects with a `CheckRefusal` (an ApiError plus the wait).
 */
export async function runBvnCheck(input: { bvn: string; nin: string }): Promise<BvnCheck> {
  const sent = api.POST('/api/hub/money/identity/bvn', {
    body: { bvn: input.bvn.replace(/\D+/g, ''), nin: input.nin.replace(/\D+/g, '') },
  });
  let answer: Awaited<typeof sent>;
  try {
    answer = await sent;
  } catch (error) {
    throw refusal(isApiError(error) ? error : networkError(), null);
  }
  const { data, error, response } = answer;
  if (!response.ok) throw refusal(toApiError(response.status, error), retryAfterOf(error, response.headers));
  const check = (data as unknown as Envelope<BvnCheck> | undefined)?.data;
  const identity = check?.identity as Partial<BvnCheck['identity']> | undefined;
  if (
    !check ||
    typeof check.prefill !== 'object' ||
    check.prefill === null ||
    !identity ||
    !Number.isSafeInteger(identity.checksLeft) ||
    !('bvn' in identity) ||
    typeof check.checkHandle !== 'string' ||
    check.checkHandle.length === 0
  ) {
    throw refusal(unreadable(), null);
  }
  // The sealed check (KYC-03): kept in memory with the prefill, sent back in place of the numbers.
  return { identity: check.identity, prefill: check.prefill, checkHandle: check.checkHandle };
}
