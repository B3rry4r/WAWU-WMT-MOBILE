import type { BiometricResult, PinCheckResult } from '@/components/pin-sheet';

/**
 * One payment screen settles both a PIN and a fingerprint or face approval with the same code (the same request, the same
 * Idempotency-Key, the same outcomes). The sheet wants a `PinCheckResult` from the first and a `BiometricResult` from the second;
 * these two turn the shared answer into the one asked for. A PIN is never "cancelled" or "failed" (those are the prompt's), and an
 * approval is never "wrong PIN" (it uses no try); each is mapped to the nearest honest answer.
 */
export type Settled = PinCheckResult | BiometricResult;

export function asPinResult(result: Settled): PinCheckResult {
  return result.code === 'failed' || result.code === 'cancelled' ? { code: 'unanswered' } : result;
}

export function asBiometricResult(result: Settled): BiometricResult {
  return result.code === 'pin_incorrect' ? { code: 'failed' } : result;
}

/**
 * A fingerprint or face step that did not approve (the prompt closed, no usable key, the challenge not read, or the Hub refusing
 * only the approval) is no answer about any payment. If this try is not the first under its Idempotency-Key, an earlier try may
 * have reached the Hub and been paid, and nothing here says otherwise: the key stays and the stored intent stays, so the PIN
 * that follows asks for the SAME payment and the Hub answers with the first one. Only a first try may let go of the record it
 * wrote itself a moment ago (`forget`), because nothing exists for its key. The key is never rotated here: this helper has no
 * hold on it. Every payment sheet settles a closed or refused approval through this one function.
 */
export function notApproved(code: 'cancelled' | 'failed', earlierTry: boolean, forget: () => void): BiometricResult {
  if (!earlierTry) forget();
  return { code };
}
