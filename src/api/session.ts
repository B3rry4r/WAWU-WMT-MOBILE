import { useEffect, useSyncExternalStore } from 'react';

import { ApiError, type ApiErrorKind } from './errors';
import { loginRequest, refreshRequest } from './identity';
import { clearTokens, loadTokens, saveTokens, type StoredTokens } from './tokenStore';

/**
 * The signed-in session. One place owns the tokens: memory for the running app,
 * the secure store between launches.
 *
 *   restoring   the stored tokens have not been read yet (cold start)
 *   signedOut   no tokens
 *   signedIn    tokens present
 */
export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

let status: SessionStatus = 'restoring';
let tokens: StoredTokens | null = null;
let restoring: Promise<void> | null = null;
let refreshing: Promise<string | null> | null = null;
/**
 * Counts sessions. A new one starts at every sign-in, and when a session ends
 * (sign-out, a refused refresh, a refreshed token for another account); a
 * refresh within one session keeps it. A refresh that started in an older
 * session is ignored.
 */
let session = 0;
/**
 * Every access token issued in the current session (the stored one, the
 * sign-in's, each refresh's). A request whose token is not one of them was
 * sent in an older session: it is never sent again with this session's token.
 */
let issued = new Set<string>();
const listeners = new Set<() => void>();
const endListeners = new Set<() => void>();

function setStatus(next: SessionStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

/**
 * Tells every `onSessionEnd` listener that the signed-in account's session is
 * over. Runs before the status changes, so nothing renders the new state
 * while the old account's data is still held. A listener that throws stops
 * neither the others nor the change itself: the first error is handed back,
 * and the call that ended the session rejects with it once the change is made.
 */
function endSession(): { error: unknown } | null {
  let failure: { error: unknown } | null = null;
  endListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      failure ??= { error };
    }
  });
  return failure;
}

/** The store step, then the listener's failure, if one failed. */
function settle(stored: Promise<void>, failure: { error: unknown } | null): Promise<void> {
  return failure
    ? stored.then(() => {
        throw failure.error;
      })
    : stored;
}

/**
 * The account a token belongs to: the `sub` claim of a WAWU ID access token
 * (a JWT), or null when the token cannot be read that way.
 */
function accountOf(accessToken: string): string | null {
  const payload = accessToken.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    const sub = typeof claims === 'object' && claims !== null ? (claims as Record<string, unknown>).sub : undefined;
    return typeof sub === 'string' && sub ? sub : null;
  } catch {
    return null;
  }
}

/**
 * Every read, write and clear of the secure store runs through this one chain,
 * in the order it was asked for, so the last change in call order is what the
 * vault ends up holding however slowly each one finishes. A failed step does
 * not stop the ones after it.
 */
let storeChain: Promise<unknown> = Promise.resolve();

function inStoreOrder<T>(step: () => Promise<T>): Promise<T> {
  const run = storeChain.then(step, step);
  storeChain = run.catch(() => undefined);
  return run;
}

/** Starts a new session: nothing sent in the one before can use its tokens. */
function beginSession() {
  session += 1;
  issued = new Set();
  refreshing = null;
}

/**
 * Memory and status change at once; only the store write waits its turn.
 * `fresh` is a sign-in: it always ends the session it replaces, if any. A
 * refresh ends it only when the new token is another account's.
 */
function adopt(next: StoredTokens, fresh: boolean): Promise<void> {
  const previous = tokens;
  tokens = next;
  const ends = previous !== null && (fresh || accountOf(previous.accessToken) !== accountOf(next.accessToken));
  if (fresh || ends) beginSession();
  issued.add(next.accessToken);
  const failure = ends ? endSession() : null;
  setStatus('signedIn');
  return settle(inStoreOrder(() => saveTokens(next)), failure);
}

function drop(): Promise<void> {
  const ended = tokens !== null;
  tokens = null;
  if (ended) beginSession();
  const failure = ended ? endSession() : null;
  setStatus('signedOut');
  return settle(inStoreOrder(() => clearTokens()), failure);
}

/**
 * Calls `listener` each time the signed-in session ends: sign-out, a refresh
 * the server refused (an expired or revoked session), and a sign-in that
 * replaces another session (or any token for another account). Whatever is
 * held for the account that was signed in (cached answers, flow state) is
 * dropped here, so the next account never sees it. The listener runs
 * synchronously, before the new status is published. Returns the unsubscribe.
 */
export function onSessionEnd(listener: () => void): () => void {
  endListeners.add(listener);
  return () => {
    endListeners.delete(listener);
  };
}

/** Reads the stored tokens once. Safe to call from anywhere, any number of times. */
export function restoreSession(): Promise<void> {
  restoring ??= inStoreOrder(loadTokens).then((stored) => {
    // A sign-in that finished while the read was pending wins over what was stored.
    if (status !== 'restoring') return;
    tokens = stored;
    if (stored) issued.add(stored.accessToken);
    setStatus(stored ? 'signedIn' : 'signedOut');
  });
  return restoring;
}

/** Signs in with email or phone and password. Rejects with an ApiError and stores nothing on failure. */
export async function signIn(identifier: string, password: string): Promise<void> {
  const next = await loginRequest(identifier.trim(), password);
  await adopt(next, true);
}

/**
 * Takes a session the server already issued (the sign-up's phone code confirm
 * answers with the first one) the way a sign-in does. Added by AUTH-04
 * (SHARED-CHANGES AUTH-04 #1).
 */
export async function adoptSession(next: StoredTokens): Promise<void> {
  await adopt(next, true);
}

/** Removes the tokens from memory and from secure storage. */
export async function signOut(): Promise<void> {
  await drop();
}

/** The token to put on a request, or null when signed out. */
export async function getAccessToken(): Promise<string | null> {
  await restoreSession();
  return tokens?.accessToken ?? null;
}

/** Only the server refusing the refresh token ends the session; every other failure keeps the tokens. */
const REFUSAL_KINDS: readonly ApiErrorKind[] = ['unauthorized', 'forbidden', 'validation'];

function isRefusal(error: unknown): boolean {
  return error instanceof ApiError && REFUSAL_KINDS.includes(error.kind);
}

/**
 * Whether `token` was issued in the current session. The API client asks this
 * again at the moment it would send a request a second time, so a request from
 * an older session is never sent with this session's token.
 */
export function isCurrentSessionToken(token: string): boolean {
  return tokens !== null && issued.has(token);
}

/**
 * Called when a request using `rejected` came back 401. Returns the token to
 * retry with, or null when the request must end as signed out.
 *
 * A token from an older session (the user signed out, or in as someone else,
 * after the request was sent) gets null: the request belonged to that session
 * and is never sent again as the current one. Within the session it refreshes
 * at most once however many requests fail together: they share one call, and
 * a request that failed with a token another request has since replaced just
 * takes the new one. A refresh the server refuses signs the user out; any
 * other failure (offline, server error, rate limit) keeps the tokens and
 * throws. A result that arrives after the session changed is ignored, and a
 * refresh that answers for another account starts a new session, so the
 * request that asked gets null.
 */
export function refreshAccessToken(rejected: string): Promise<string | null> {
  if (!tokens || !issued.has(rejected)) return Promise.resolve(null);
  if (tokens.accessToken !== rejected) return Promise.resolve(tokens.accessToken);
  if (refreshing) return refreshing;
  const started = session;
  const attempt: Promise<string | null> = refreshRequest(tokens.refreshToken)
    .then(async (next) => {
      // The user signed out, or in as someone else, while this was in flight: the result is stale.
      if (session !== started) return null;
      await adopt(next, false);
      return session === started ? next.accessToken : null;
    })
    .catch(async (error: unknown) => {
      if (isRefusal(error)) {
        if (session === started) await drop();
        return null;
      }
      throw error;
    })
    .finally(() => {
      if (refreshing === attempt) refreshing = null;
    });
  refreshing = attempt;
  return attempt;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For screens: whether the user is signed in, and the actions. Starts the restore on first use. */
export function useSession() {
  const current = useSyncExternalStore(subscribe, () => status, () => status);
  useEffect(() => {
    void restoreSession();
  }, []);
  return { status: current, signIn, signOut };
}

/** Resets module state. Tests only: it simulates the app process starting again. */
export function resetSessionForTests() {
  status = 'restoring';
  tokens = null;
  restoring = null;
  refreshing = null;
  session = 0;
  issued = new Set();
  storeChain = Promise.resolve();
}
