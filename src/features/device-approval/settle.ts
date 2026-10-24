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
