import { isApiError } from '@/api/errors';
import { getAccessToken } from '@/api/session';
import { apiBaseUrl } from '@/api/env';
import type { BiometricKind } from '@/components/pin-sheet';
import { accountOfToken } from '@/features/open-wallet/sessionAccount';

import { fetchChallenge, fetchDevice, registerDevice, removeDevice, verifyApproval, type DeviceOutcome } from './api';
import { approvalText, bodyDigest, makeKeyPair, signText } from './crypto';
import { canKeepKey, clearDevice, readDevice, readKey, wasCancelled, writeDevice, writeKey } from './store';

/**
 * Approving one request with the phone's fingerprint or face (W11; R-26; wawu-backend CONVENTIONS section 5).
 *
 * The phone asks the Hub for a one-time challenge, opens its private key behind the biometric prompt, and signs the
 * challenge together with the exact request (method, path, SHA-256 of the body). The Hub checks that signature against
 * the public key registered at W35. The result is the value of the `X-Device-Approval` header, which goes in place of
 * `X-Transaction-Pin`. A refused approval never uses a PIN try; the sheet falls back to the keypad.
 */

/** The request being approved, as it will be sent: the path with its query (`/api/hub/...`), and the body object it carries. */
export type SignedRequest = { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; body?: unknown };

export type ApprovalAttempt =
  /** The header to send. */
  | { kind: 'ready'; header: string }
  /** The person closed the prompt. */
  | { kind: 'cancelled' }
  /** This phone cannot approve (no key for this account, a key the system dropped, a refusal): the PIN is the way. */
  | { kind: 'failed' }
  /** The Hub did not answer for the challenge: nothing was signed, nothing was sent. */
  | { kind: 'unanswered' };

/** The prefix of the Hub's address, if it has a path (the Hub signs `originalUrl`, the path as it was sent). Normally nothing. */
function basePath(): string {
  try {
    return new URL(apiBaseUrl).pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

/** The body as the shared API client sends it: `JSON.stringify`, which `openapi-fetch` uses for a JSON body. Nothing when there is none. */
export function bodyText(body: unknown): string {
  return body === undefined ? '' : JSON.stringify(body);
}

/** Forgets this phone's key. When `turnOff`, the Hub is told too (it needs no PIN to turn the phone off); a failure there changes nothing here. */
async function forget(turnOff: boolean): Promise<void> {
  await clearDevice();
  if (!turnOff) return;
  try {
    await removeDevice();
  } catch {
    // The Hub still lists the phone; the next read of W35 sees that this phone holds no key and shows the switch off.
  }
}

/**
 * The approval for `request`, with `prompt` as the text of the fingerprint or face prompt. Never rejects.
 * Nothing is sent to the Hub with the money request here: the caller sends it with the header.
 */
export async function approveRequest(request: SignedRequest, prompt: string): Promise<ApprovalAttempt> {
  const owner = accountOfToken(await getAccessToken());
  const device = await readDevice();
  if (!owner || !device || device.owner !== owner) return { kind: 'failed' };

  let challenge;
  try {
    challenge = await fetchChallenge();
  } catch (error) {
    if (isApiError(error) && (error.kind === 'network' || error.kind === 'server')) return { kind: 'unanswered' };
    // `device_approval_refused`: the Hub has no phone registered for this person any more (a PIN reset turns it off).
    if (isApiError(error) && error.code === 'device_approval_refused') await forget(false);
    return { kind: 'failed' };
  }
  if (challenge.deviceId !== device.deviceId) {
    // Another phone replaced this one at the Hub (one phone per person).
    await forget(false);
    return { kind: 'failed' };
  }

  let secretKeyHex: string | null;
  try {
    secretKeyHex = await readKey(prompt);
  } catch (error) {
    return wasCancelled(error) ? { kind: 'cancelled' } : { kind: 'failed' };
  }
  if (secretKeyHex === null) {
    // The system dropped the key (the phone's biometrics changed): it can never sign again. Turn the switch off.
    await forget(true);
    return { kind: 'failed' };
  }

  try {
    const bodyHash = await bodyDigest(bodyText(request.body));
    const text = approvalText({
      challengeId: challenge.challengeId,
      challenge: challenge.challenge,
      deviceId: challenge.deviceId,
      method: request.method,
      path: `${basePath()}${request.path}`,
      bodyHash,
    });
    return { kind: 'ready', header: `v1.${challenge.challengeId}.${signText(secretKeyHex, text)}` };
  } catch {
    return { kind: 'failed' };
  }
}

/** Whether this phone could take part at all: a biometric key can be kept (and the person has one enrolled). Read at W35 to decide whether to draw the switch. */
export function canApproveHere(): boolean {
  return canKeepKey();
}

/** What turning it on came to. `unconfirmed`: the key could not be kept or the check did not pass, and nothing is left on. */
export type EnableOutcome = DeviceOutcome | { kind: 'unconfirmed' };

const PROMPT_ON = 'Confirm to turn on payments with your biometric';

/**
 * Turns biometric approval on for this phone (W35's switch): makes the key, keeps it behind the biometric, registers its
 * public half under the PIN, keeps the Hub's `deviceId` beside it, then checks that the key works with one approval that
 * moves nothing (`POST /money/approval/verify`). If any step after the registration fails, the Hub is told to turn it off
 * and the key is dropped, so nothing is half on. The PIN is held only for the one request.
 */
export async function enableApproval(input: { pin: string; biometric: BiometricKind }): Promise<EnableOutcome> {
  const owner = accountOfToken(await getAccessToken());
  if (!owner) return { kind: 'unanswered' };
  const pair = makeKeyPair();
  try {
    await writeKey(pair.secretKeyHex);
  } catch {
    await clearDevice();
    return { kind: 'unconfirmed' };
  }
  const registered = await registerDevice({ publicKey: pair.publicKey, biometric: input.biometric, pin: input.pin });
  if (registered.kind !== 'done' || registered.device.deviceId === null) {
    await clearDevice();
    return registered.kind === 'done' ? { kind: 'unanswered' } : registered;
  }
  await writeDevice({ owner, deviceId: registered.device.deviceId, biometric: input.biometric });
  const attempt = await approveRequest({ method: 'POST', path: '/api/hub/money/approval/verify' }, PROMPT_ON);
  if (attempt.kind === 'ready') {
    const checked = await verifyApproval(attempt.header);
    if (checked.kind === 'approved') return registered;
  }
  await forget(true);
  return { kind: 'unconfirmed' };
}

/** Turns it off (W35): the Hub first, then the key. A Hub that cannot be reached leaves it on (rejects), so the switch never lies. */
export async function disableApproval(): Promise<void> {
  await removeDevice();
  await clearDevice();
}

/**
 * Which biometric this phone's stored key is for, when it is this account's and the Hub still lists this phone. Null: no key to
 * offer. The Hub is asked once; a Hub that cannot be asked leaves the local answer standing. A key the Hub no longer lists
 * (a PIN reset, another phone) is dropped here.
 */
export async function usableKind(): Promise<BiometricKind | null> {
  const owner = accountOfToken(await getAccessToken());
  const device = await readDevice();
  if (!owner || !device || device.owner !== owner) return null;
  try {
    const hub = await fetchDevice();
    if (!hub.registered || hub.deviceId !== device.deviceId) {
      await clearDevice();
      return null;
    }
  } catch {
    // Not known: the local key stands, and the approval itself finds out.
  }
  return device.biometric;
}
