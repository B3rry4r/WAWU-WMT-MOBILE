import type { ApprovalAttempt, SignedRequest } from './approve';
import type { Settled } from './settle';

/**
 * How a payment is approved, once, for every payment that asks for the PIN (FIX-108 wired the sends, FIX-112 the rest).
 *
 * A payment call takes a `Credential`: the PIN as typed, or the phone's fingerprint or face approval of exactly the request about to
 * be sent (`X-Device-Approval`, in place of `X-Transaction-Pin`; same `Idempotency-Key`). The call turns the credential into its
 * header with `credentialHeader` BEFORE anything leaves the phone, and answers one of the two stops below instead of sending when
 * the approval cannot be made.
 *
 * THE RULE (FIX-108 verifier, high finding): a stop that is the phone's own (the person closed the prompt, the phone could not
 * approve) or the Hub's refusal of an approval proves nothing about an EARLIER try of the same payment. So a screen that gets
 * `approval_cancelled` or `approval_failed` changes NOTHING it holds for the payment: it keeps the `Idempotency-Key`, the quote,
 * and any stored intent that says an earlier try may have moved money, and only tells the sheet. `isApprovalStop` and `stopResult`
 * are the whole of it: every screen takes them FIRST, before it reads any other answer.
 */
export type Approver = (request: SignedRequest) => Promise<ApprovalAttempt>;
export type Credential = { pin: string; approve?: never } | { approve: Approver; pin?: never };

/** The header that approves a request: the PIN as typed, or the phone's approval. */
export type ApprovalHeader = { 'X-Transaction-Pin': string } | { 'X-Device-Approval': string };

/** The approval ended with no request sent: the person closed the prompt, or this phone could not approve (or the Hub refused it). */
export type ApprovalStopped = { kind: 'approval_cancelled' } | { kind: 'approval_failed' };

/** The header to send, or the answer to give instead of sending. `unanswered`: the Hub gave no challenge; nothing was signed or sent. */
export type Headed = { header: ApprovalHeader } | { outcome: ApprovalStopped | { kind: 'unanswered' } };

/** The header for `request` from `credential`. Never rejects. For an approval this is the fingerprint or face prompt. */
export async function credentialHeader(credential: Credential, request: SignedRequest): Promise<Headed> {
  if (credential.approve === undefined) return { header: { 'X-Transaction-Pin': credential.pin } };
  const attempt = await credential.approve(request);
  switch (attempt.kind) {
    case 'ready':
      return { header: { 'X-Device-Approval': attempt.header } };
    case 'cancelled':
      return { outcome: { kind: 'approval_cancelled' } };
    case 'unanswered':
      return { outcome: { kind: 'unanswered' } };
    case 'failed':
      return { outcome: { kind: 'approval_failed' } };
  }
}

/** The path of a request as the Hub sees it: each path part encoded the way the API client encodes it. */
export const part = (value: string): string => encodeURIComponent(value);

/** True when the Hub refused an approval (`403 device_approval_refused`): nothing moved and no PIN try was used. Read the answer's `reason`. */
export function approvalRefused(error: unknown): boolean {
  const reason = typeof error === 'object' && error !== null ? (error as { reason?: unknown }).reason : null;
  return typeof reason === 'object' && reason !== null && (reason as { code?: unknown }).code === 'device_approval_refused';
}

/** True for the two stops. Take it first, before any other kind of a payment's outcome. */
export function isApprovalStop<T extends { kind: string }>(outcome: T): outcome is Extract<T, ApprovalStopped> {
  return outcome.kind === 'approval_cancelled' || outcome.kind === 'approval_failed';
}

/** What the sheet is told for a stop: a closed prompt says nothing, a failed approval says "Use your PIN". Uses no PIN try. */
export function stopResult(stop: ApprovalStopped): Settled {
  return stop.kind === 'approval_cancelled' ? { code: 'cancelled' } : { code: 'failed' };
}
