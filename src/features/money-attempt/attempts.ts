import { onSessionEnd } from '@/api/session';

/**
 * A payment attempt, kept for as long as the app runs, so a lost answer is followed by the SAME request and one debit.
 *
 * One attempt is one `Idempotency-Key`, the quote it carries and the subject it pays for (a pack, a request). The key is made when
 * the first PIN goes out. If the answer never arrives, the money may have moved, and the only safe next try is the same key with
 * the same quote, whichever screen or tap makes it: so the attempt is looked up by subject, not held by a component. A refusal that
 * proves nothing moved (wrong PIN, short balance, a changed price) lets the attempt go, and the next try takes a fresh key and a
 * fresh quote. A payment the Hub took and has not finished is kept with its id: it is read by that id, never paid again.
 *
 * Nothing here is a secret (the PIN is never kept). The attempts of one run are forgotten when the session ends.
 */
export type Attempt<Q> = {
  /** What is being paid for: "pack:popular", "request:<id>". */
  subject: string;
  /** The `Idempotency-Key`, one per attempt. */
  key: string;
  quote: Q;
  /** `sent`: the request left and nothing is known. `pending`: the Hub took it and said it is not finished. */
  phase: 'sent' | 'pending';
  /** The Hub's id for the payment, once it has said `pending`. */
  paymentId: string | null;
};

const held = new Map<string, Attempt<unknown>>();

export function attemptFor<Q>(subject: string): Attempt<Q> | null {
  return (held.get(subject) as Attempt<Q> | undefined) ?? null;
}

export function keepAttempt<Q>(attempt: Attempt<Q>): void {
  held.set(attempt.subject, attempt);
}

export function dropAttempt(subject: string, key?: string): void {
  const current = held.get(subject);
  if (current && (key === undefined || current.key === key)) held.delete(subject);
}

/** For tests: the phone forgets everything held. */
export function forgetAttempts(): void {
  held.clear();
}

onSessionEnd(forgetAttempts);
