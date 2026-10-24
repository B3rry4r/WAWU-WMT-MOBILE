import { api, unwrap } from '@/api/client';
import { ApiError, isApiError, networkError, toApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import { OPEN_WALLET_KEY, type WalletState } from './account';
import { readWorld, type FiatCode, type WorldProgress } from './world';

/**
 * Where the bank's review of the person stands (KYC-06, NUV-02): the part of
 * `GET /money/wallet` that Open your wallet's last steps read. The Hub never
 * calls the bank for it and sends no balance.
 *
 * - `flow` is `review` when the Hub runs the opening that sends the person's
 *   details and documents to the bank to be checked (Nuvion), `check` when it
 *   runs the older BVN check and selfie match, and null when the Hub does not
 *   say (the older answer, which is the same as `check`).
 * - `review.stage`: `needs_documents` (the details are in, the documents are
 *   still needed), `checking`, `approved` (the account number is on its way),
 *   `rejected` (`reasons` say why and what to fix), `stopped` (for good),
 *   `expired` (left unfinished too long). `review` is null until details were sent.
 * - `accountNumberStatus` is `active` once there is an account number.
 */
type WalletView = components['schemas']['WalletView'];
type Review = components['schemas']['WalletReviewView'];
type Envelope<T> = { statusCode: number; message: string; data: T | null };
type Answer = { data?: unknown; error?: unknown; response: Response };

export type ReviewStage = 'needs_documents' | 'checking' | 'approved' | 'rejected' | 'stopped' | 'expired';
export type ReviewReason = { code: string; message: string; fix: string };
export type OpeningReview = {
  stage: ReviewStage;
  reasons: ReviewReason[];
  canResubmit: boolean;
  /** When the tries open again, while `canResubmit` is false only because the day's tries are used up. */
  canResubmitAt: string | null;
  decidedAt: string | null;
};
export type OpeningProgress = {
  state: WalletState;
  flow: 'check' | 'review' | null;
  accountNumberStatus: 'none' | 'on_its_way' | 'active';
  review: OpeningReview | null;
  /** WALLET-41: the world part of the wallet, for a person who opened from outside Nigeria; null otherwise. */
  world?: WorldProgress | null;
};

const walletStates: readonly WalletState[] = ['not_open', 'opening', 'open', 'frozen'];
const stages: readonly ReviewStage[] = ['needs_documents', 'checking', 'approved', 'rejected', 'stopped', 'expired'];
const numberStates = ['none', 'on_its_way', 'active'] as const;

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your account details could not be read. Try again.');
}

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function readReview(value: unknown): OpeningReview | null {
  if (value === null || value === undefined) return null;
  const v = value as Partial<Review>;
  if (typeof v !== 'object' || !stages.includes(v.stage as ReviewStage) || !Array.isArray(v.reasons) || typeof v.canResubmit !== 'boolean') throw unreadable();
  const reasons = v.reasons
    .map((r) => r as Partial<ReviewReason>)
    // A reason with no sentence is not one the person could act on: it is left out, and the stage still says where things stand.
    .filter((r) => text(r?.message))
    .map((r) => ({ code: typeof r.code === 'string' ? r.code : '', message: (r.message as string).trim(), fix: text(r.fix) ? r.fix.trim() : '' }));
  return {
    stage: v.stage as ReviewStage,
    reasons,
    canResubmit: v.canResubmit,
    canResubmitAt: typeof v.canResubmitAt === 'string' ? v.canResubmitAt : null,
    decidedAt: typeof v.decidedAt === 'string' ? v.decidedAt : null,
  };
}

/** GET /money/wallet, as the last steps of Open your wallet read it. */
export async function fetchOpeningProgress(): Promise<OpeningProgress> {
  const body = (await unwrap(api.GET('/api/hub/money/wallet'))) as unknown as Envelope<WalletView>;
  const view = body?.data;
  if (!view || typeof view !== 'object' || !walletStates.includes(view.state)) throw unreadable();
  const number = numberStates.includes(view.accountNumberStatus as never) ? view.accountNumberStatus : 'none';
  const flow = view.openingFlow === 'review' || view.openingFlow === 'check' ? view.openingFlow : null;
  return { state: view.state, flow, accountNumberStatus: number, review: readReview(view.review), world: readWorld(view.world) };
}

/** How often A28 asks the Hub where the check stands, while it waits. */
export const PROGRESS_POLL_MS = 3000;

/** The read, keyed by the account so one person's answer is never given to another from the shared cache. */
export function openingProgressQuery(owner: string | undefined, poll = false) {
  return {
    queryKey: [OPEN_WALLET_KEY, 'progress', owner ?? ''] as const,
    queryFn: fetchOpeningProgress,
    staleTime: 0,
    enabled: Boolean(owner),
    refetchInterval: poll ? PROGRESS_POLL_MS : (false as const),
  };
}

/**
 * What POST /money/wallet/open takes under the review opening (NUV-02): the
 * details the earlier steps hold and the two types and numbers the documents
 * go with. Only what a step holds is sent; a field the Hub needs and no step
 * has is the Hub's refusal to say (a 400 naming it), never a guess here.
 */
export type ReviewOpening = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  /** The home address, one line (A27's field). */
  address: string;
  middleName?: string;
  gender?: 'male' | 'female';
  city?: string;
  state?: string;
  postalCode?: string;
  idType?: 'international_passport' | 'drivers_license' | 'national_id';
  idNumber?: string;
  proofOfAddressType?: 'utility_bill' | 'bank_statement';
  bvn?: string;
  nin?: string;
  /** WALLET-41 (R-87): a person who lives outside Nigeria sends their country and no BVN or NIN. */
  countryCode?: string;
  /** The currency of the first account, the person's pick or the country's own. */
  firstCurrency?: FiatCode;
  /** WALLET-41 round 3: the country that issued the passport, which the Hub requires with one (a licence or national ID sends none). */
  nationality?: string;
};

async function send(request: Promise<Answer>): Promise<unknown> {
  let answer: Answer;
  try {
    answer = await request;
  } catch (error) {
    throw isApiError(error) ? error : networkError();
  }
  if (!answer.response.ok) throw toApiError(answer.response.status, answer.error);
  return (answer.data as Envelope<unknown> | undefined)?.data;
}

/**
 * POST /money/wallet/open under the review opening: sends the details once
 * (a repeat corrects the same opening; one opening per person however many
 * taps). Resolves with where the review stands.
 */
export async function openForReview(details: ReviewOpening): Promise<OpeningProgress> {
  const view = (await send(api.POST('/api/hub/money/wallet/open', { body: { ...details } }))) as WalletView | undefined;
  if (!view || typeof view !== 'object' || !walletStates.includes(view.state)) throw unreadable();
  return {
    state: view.state,
    flow: view.openingFlow === 'review' || view.openingFlow === 'check' ? view.openingFlow : null,
    accountNumberStatus: numberStates.includes(view.accountNumberStatus as never) ? view.accountNumberStatus : 'none',
    review: readReview(view.review),
    world: readWorld(view.world),
  };
}
