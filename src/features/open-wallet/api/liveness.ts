import { api } from '@/api/client';
import { ApiError, isApiError, networkError, toApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { selfieReturnUrl } from '@/lib/appLinks';

import { OPEN_WALLET_KEY } from './account';

/**
 * The hosted selfie (DV2-05, NUV-03): Nuvion's own page takes the selfie and
 * the Hub reads the result. `GET /money/identity/liveness` says whether the
 * step is part of this opening at all (`enabled`: Nuvion can start one for our
 * people, R-39), where it stands, and the secure page while one is pending;
 * `POST` starts it (or answers the one already running) and returns the page
 * to open. Both answer 409 `wallet_not_open` until the opening's details have
 * been sent (there is no entity to run a selfie for).
 *
 * `state`: `not_in_use` (the step is not part of this opening), `not_started`,
 * `pending` (the page is open or waiting), `passed`, `not_passed`, `expired`
 * (the page ran out; a new one can be started while `canStart` is true).
 */
type View = components['schemas']['IdentityLivenessView'];
type Envelope<T> = { statusCode: number; message: string; data: T | null };
type Answer = { data?: unknown; error?: unknown; response: Response };

export type LivenessState = View['state'];
export type Liveness = { enabled: boolean; state: LivenessState; url: string | null; canStart: boolean };

const states: readonly LivenessState[] = ['pending', 'expired', 'not_in_use', 'not_started', 'passed', 'not_passed'];

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your selfie step could not be read. Try again.');
}

function readView(value: unknown): Liveness {
  // The Hub wraps its answers in `{ data }`; a bare view is read as it is.
  const body = value as Partial<View> & { data?: unknown } | null;
  const v = (body && typeof body === 'object' && 'data' in body && body.data && typeof body.data === 'object' ? body.data : body) as Partial<View> | null;
  if (!v || typeof v !== 'object' || typeof v.enabled !== 'boolean' || !states.includes(v.state as LivenessState)) throw unreadable();
  return { enabled: v.enabled, state: v.state as LivenessState, url: typeof v.url === 'string' && v.url.length > 0 ? v.url : null, canStart: v.canStart === true };
}

async function send(request: Promise<Answer>): Promise<unknown> {
  let answer: Answer;
  try {
    answer = await request;
  } catch (error) {
    throw isApiError(error) ? error : networkError();
  }
  if (!answer.response.ok) throw toApiError(answer.response.status, answer.error);
  const body = answer.data as Envelope<unknown> | undefined;
  return body && typeof body === 'object' && 'data' in body ? body.data : body;
}

/** GET /money/identity/liveness. */
export async function fetchLiveness(): Promise<Liveness> {
  return readView(await send(api.GET('/api/hub/money/identity/liveness')));
}

/**
 * POST /money/identity/liveness: starts the hosted selfie or answers the one already running. The return address is
 * the website's own `/selfie` (an app link, LINKS-01): the Hub takes an https address only when its
 * `NUVION_LIVENESS_REDIRECT_ORIGINS` lists it, so that list is set whenever `NUVION_HOSTED_LIVENESS` is on (the Hub
 * logs an error at boot when it is not, G-DV2-05-1). The selfie page then sends the person back to the app, or to the
 * website's "Open in the WAWU app" page, when they finish. A Hub that does not list it yet answers
 * `document_request_invalid` for the address; the selfie is then started once more with no address (the old
 * behaviour), so this step never breaks on a Hub without the setting.
 */
export async function startLiveness(): Promise<Liveness> {
  try {
    return readView(await send(api.POST('/api/hub/money/identity/liveness', { body: { redirectUrl: selfieReturnUrl() } })));
  } catch (error) {
    if (livenessProblem(error) !== 'invalid') throw error;
    return readView(await send(api.POST('/api/hub/money/identity/liveness', { body: {} })));
  }
}

export const LIVENESS_KEY = [OPEN_WALLET_KEY, 'liveness'] as const;

/** What a refusal of the selfie routes means to the screen (the Hub's `reason.code`). */
export type LivenessProblem = 'not_open' | 'not_available' | 'closed' | 'in_progress' | 'rate_limited' | 'unreachable' | 'invalid' | 'other';

const problemOf: Record<string, LivenessProblem> = {
  wallet_not_open: 'not_open',
  selfie_not_available: 'not_available',
  documents_closed: 'closed',
  document_in_progress: 'in_progress',
  document_rate_limited: 'rate_limited',
  provider_unreachable: 'unreachable',
  document_request_invalid: 'invalid',
};

export function livenessProblem(error: unknown): LivenessProblem {
  return isApiError(error) && error.code ? (problemOf[error.code] ?? 'other') : 'other';
}

/** True when the secure page's address is one this app may open: https only. */
export function isSecurePage(url: string | null): url is string {
  if (!url) return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/** True while the person still has the hosted selfie to take: the Hub runs it for this opening and it has not passed. */
export function selfieIsDue(view: Liveness): boolean {
  return view.enabled && view.state !== 'not_in_use' && view.state !== 'passed';
}
