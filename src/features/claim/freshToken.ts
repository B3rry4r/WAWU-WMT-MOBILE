import { isApiError } from '@/api/errors';
import { getAccessToken, refreshAccessToken } from '@/api/session';

import { proofKey, readLocal, writeLocal } from './localStore';
import { readClaims } from './tokenClaims';

/**
 * A claim must reach the Hub with a token that says what the person has proven (JOIN-03 round 2, N1). WAWU ID writes
 * `emailVerified` and `phoneVerified` into the access token when it issues it, and a token lives 15 minutes, so a person
 * who proves their email after the token was issued holds a token that still says it is not proven.
 *
 * Two rules, nothing more:
 *   1. The app notes which token was current when it saw a contact proven (`noteContactProved`). Before a claim, a token
 *      issued at or before that moment is exchanged for a new one (`refreshIfBehindProof`), once.
 *   2. If the Hub still answers `contact_not_verified`, the token is exchanged once and the claim is sent once more
 *      (`retryAfterRefresh`). A second `contact_not_verified` is final.
 *
 * "Issued before" is read from the token's own `iat` (WAWU ID's clock), against the `iat` of the token that was current
 * at the proof: no comparison of this phone's clock with the server's. A refresh the server refuses signs the person out,
 * as it does for every request (session.ts); any other failure leaves the tokens alone.
 */

/** Which token was current when a contact was proven: its `iat`. Memory, written through to the phone's store. */
const proofs = new Map<string, number>();

/** A contact was just proven (the email step): remember the token that was in force, so the next claim renews it. */
export async function noteContactProved(): Promise<void> {
  try {
    const claims = readClaims(await getAccessToken());
    if (!claims?.sub || claims.iat === null) return;
    proofs.set(claims.sub, claims.iat);
    await writeLocal(proofKey(claims.sub), String(claims.iat));
  } catch {
    // Remembering is a convenience: the Hub's own answer is still asked for (rule 2).
  }
}

/** The `iat` noted for this account, from memory or from the phone's store; null when none. */
async function notedProof(sub: string): Promise<number | null> {
  const held = proofs.get(sub);
  if (held !== undefined) return held;
  const stored = Number(await readLocal(proofKey(sub)));
  return Number.isFinite(stored) && stored > 0 ? stored : null;
}

/** Exchanges the current token for a new one. True when a new token is now held. */
async function renewToken(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  const next = await refreshAccessToken(token);
  return next !== null && next !== token;
}

/** Rule 1. Never throws: a refresh that fails leaves the claim to go ahead with the token it has (and rule 2). */
export async function refreshIfBehindProof(): Promise<void> {
  try {
    const claims = readClaims(await getAccessToken());
    if (!claims?.sub || claims.iat === null) return;
    const proofIat = await notedProof(claims.sub);
    if (proofIat === null || claims.iat > proofIat) return;
    if (await renewToken()) {
      // The new token is newer than the proof it was waiting for: nothing is owed any more.
      proofs.set(claims.sub, 0);
      await writeLocal(proofKey(claims.sub), '0');
    }
  } catch {
    // Offline or refused: the claim is sent anyway, and the Hub says what it sees.
  }
}

/**
 * Rule 2. Runs `send` again after one renewal, but only when the first answer was `contact_not_verified`. The first
 * answer stands when the renewal could not be made.
 */
export async function retryAfterRefresh<T>(failure: unknown, send: () => Promise<T>): Promise<T> {
  if (!isApiError(failure) || failure.code !== 'contact_not_verified') throw failure;
  let renewed = false;
  try {
    renewed = await renewToken();
  } catch {
    renewed = false;
  }
  if (!renewed) throw failure;
  return send();
}
