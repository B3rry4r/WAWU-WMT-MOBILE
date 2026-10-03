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
/** Counts session changes (sign in, sign out). A refresh that started in an older one is ignored. */
let generation = 0;
const listeners = new Set<() => void>();

function setStatus(next: SessionStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
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

/** Memory and status change at once; only the store write waits its turn. */
function adopt(next: StoredTokens): Promise<void> {
  tokens = next;
  setStatus('signedIn');
  return inStoreOrder(() => saveTokens(next));
}

function drop(): Promise<void> {
  tokens = null;
  setStatus('signedOut');
  return inStoreOrder(() => clearTokens());
}

/** Reads the stored tokens once. Safe to call from anywhere, any number of times. */
export function restoreSession(): Promise<void> {
  restoring ??= inStoreOrder(loadTokens).then((stored) => {
    // A sign-in that finished while the read was pending wins over what was stored.
    if (status !== 'restoring') return;
    tokens = stored;
    setStatus(stored ? 'signedIn' : 'signedOut');
  });
  return restoring;
}

/** Signs in with email or phone and password. Rejects with an ApiError and stores nothing on failure. */
export async function signIn(identifier: string, password: string): Promise<void> {
  const next = await loginRequest(identifier.trim(), password);
  generation += 1;
  refreshing = null;
  await adopt(next);
}

/**
 * Takes a session the server already issued (the sign-up's phone code confirm
 * answers with the first one) the way a sign-in does. Added by AUTH-04
 * (SHARED-CHANGES AUTH-04 #1).
 */
export async function adoptSession(next: StoredTokens): Promise<void> {
  generation += 1;
  refreshing = null;
  await adopt(next);
}

/** Removes the tokens from memory and from secure storage. */
export async function signOut(): Promise<void> {
  generation += 1;
  refreshing = null;
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
 * Called when a request using `rejected` came back 401. Returns the token to
 * retry with, or null when the session is over.
 *
 * Refreshes at most once however many requests fail together: they share one
 * call, and a request that failed with a token another request has since
 * replaced just takes the new one. A refresh the server refuses signs the user
 * out; any other failure (offline, server error, rate limit) keeps the tokens and throws.
 * A result that arrives after the user signed out or in again is ignored.
 */
export function refreshAccessToken(rejected: string): Promise<string | null> {
  if (!tokens) return Promise.resolve(null);
  if (tokens.accessToken !== rejected) return Promise.resolve(tokens.accessToken);
  if (refreshing) return refreshing;
  const started = generation;
  const attempt: Promise<string | null> = refreshRequest(tokens.refreshToken)
    .then(async (next) => {
      // The user signed out, or in as someone else, while this was in flight: the result is stale.
      if (generation !== started) return null;
      await adopt(next);
      return next.accessToken;
    })
    .catch(async (error: unknown) => {
      if (isRefusal(error)) {
        if (generation === started) await drop();
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
  generation = 0;
  storeChain = Promise.resolve();
}
