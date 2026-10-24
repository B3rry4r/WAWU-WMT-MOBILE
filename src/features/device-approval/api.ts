import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';
import type { BiometricKind } from '@/components/pin-sheet';

/**
 * The Hub's routes for a biometric approval (MONEY-14; wawu-backend `docs/contract/CONVENTIONS.md` section 5):
 *
 * - `GET /money/device`: which phone, if any, may approve (W35 reads it; a PIN reset turns it off);
 * - `PUT /money/device`: turns it on for this phone, with the current PIN in `X-Transaction-Pin`; one phone per person;
 * - `DELETE /money/device`: turns it off, with no PIN;
 * - `POST /money/device/challenge`: one challenge for one approval;
 * - `POST /money/approval/verify`: checks an approval without moving money (W35 confirms the key works).
 *
 * The Hub's success body is `{ statusCode, message, data }`; the contract types only `data` (SHARED-CHANGES row 11).
 */
type DeviceView = components['schemas']['ApprovalDeviceView'];
type ChallengeView = components['schemas']['ApprovalChallengeView'];
type Envelope<T> = { statusCode: number; message: string; data: T | null };

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export type HubDevice = { registered: boolean; deviceId: string | null; biometric: BiometricKind | null };

function readDevice(value: unknown): HubDevice {
  const v = value as Partial<DeviceView> | null | undefined;
  if (!v || typeof v !== 'object' || typeof v.registered !== 'boolean') throw new Error('unreadable device');
  const biometric = v.biometric === 'fingerprint' || v.biometric === 'face' ? v.biometric : null;
  return { registered: v.registered, deviceId: filled(v.deviceId) ? v.deviceId : null, biometric };
}

/** GET /money/device. */
export async function fetchDevice(): Promise<HubDevice> {
  const body = (await unwrap(api.GET('/api/hub/money/device'))) as unknown as Envelope<DeviceView>;
  return readDevice(body?.data);
}

/** DELETE /money/device. */
export async function removeDevice(): Promise<void> {
  await unwrap(api.DELETE('/api/hub/money/device'));
}

export type Challenge = { challengeId: string; challenge: string; deviceId: string };

/** POST /money/device/challenge. Rejects with the ApiError (`device_approval_refused` when no phone is registered). */
export async function fetchChallenge(): Promise<Challenge> {
  const body = (await unwrap(api.POST('/api/hub/money/device/challenge'))) as unknown as Envelope<ChallengeView>;
  const v = body?.data;
  if (!v || !filled(v.challengeId) || !filled(v.challenge) || !filled(v.deviceId)) throw new Error('unreadable challenge');
  return { challengeId: v.challengeId, challenge: v.challenge, deviceId: v.deviceId };
}

/** What `PUT /money/device` and `POST /money/approval/verify` came to. Never rejects. */
export type DeviceOutcome =
  | { kind: 'done'; device: HubDevice }
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  | { kind: 'pin_not_set' }
  | { kind: 'no_wallet' }
  /** No answer that proves anything (no connection, a timeout, a server fault). */
  | { kind: 'unanswered' }
  | { kind: 'refused'; code: string | null };

type Reason = { code?: unknown; triesLeft?: unknown; lockedUntil?: unknown };

function reasonOf(error: unknown): Reason {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown }) : {};
  return typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
}

const HTTP_SERVER_MIN = 500;

/** Why a request the Hub did not accept came to nothing: the shape the PIN and the approval routes share. */
type Failure = Exclude<DeviceOutcome, { kind: 'done' }>;

function failureOf(result: { error?: unknown; response: Response }): Failure {
  const { error, response } = result;
  if (response.status >= HTTP_SERVER_MIN) return { kind: 'unanswered' };
  const reason = reasonOf(error);
  const code = typeof reason.code === 'string' ? reason.code : null;
  switch (code) {
    case 'pin_incorrect':
      return { kind: 'pin_incorrect', triesLeft: typeof reason.triesLeft === 'number' ? reason.triesLeft : 0 };
    case 'pin_locked':
      return filled(reason.lockedUntil) ? { kind: 'pin_locked', lockedUntil: reason.lockedUntil } : { kind: 'unanswered' };
    case 'pin_not_set':
    case 'pin_required':
      return { kind: 'pin_not_set' };
    case 'wallet_not_open':
      return { kind: 'no_wallet' };
    default:
      return { kind: 'refused', code };
  }
}

/** PUT /money/device: this phone's public key (SPKI DER, base64url) and what it approves with, under the current PIN. */
export async function registerDevice(input: { publicKey: string; biometric: BiometricKind; pin: string }): Promise<DeviceOutcome> {
  try {
    const result = await api.PUT('/api/hub/money/device', {
      params: { header: { 'X-Transaction-Pin': input.pin } },
      body: { publicKey: input.publicKey, biometric: input.biometric },
    });
    if (!result.response.ok) return failureOf(result);
    try {
      return { kind: 'done', device: readDevice((result.data as unknown as Envelope<DeviceView> | undefined)?.data) };
    } catch {
      // The Hub said yes and the answer cannot be read: the phone may be registered.
      return { kind: 'unanswered' };
    }
  } catch {
    return { kind: 'unanswered' };
  }
}

/** POST /money/approval/verify: the Hub checks the approval (the header) and moves nothing. `approved` only for a `200`. */
export async function verifyApproval(approval: string): Promise<{ kind: 'approved' } | Failure> {
  try {
    const result = await api.POST('/api/hub/money/approval/verify', { params: { header: { 'X-Device-Approval': approval } } });
    return result.response.ok ? { kind: 'approved' } : failureOf(result);
  } catch {
    return { kind: 'unanswered' };
  }
}
