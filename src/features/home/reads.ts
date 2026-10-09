import { useState } from 'react';

/** Where one read stands, as the page needs to know it. */
export type Outcome = 'pending' | 'ok' | 'failed';

/** The outcome of a query: answered, failed, or still on its way. */
export function outcomeOf(query: { isSuccess: boolean; isError: boolean }): Outcome {
  if (query.isSuccess) return 'ok';
  return query.isError ? 'failed' : 'pending';
}

/** A read as Today needs it: still on its way for the first time, or failed (held steady while it is asked again). */
export type Read = { pending: boolean; failed: boolean };

/**
 * Holds a failed read steady across a retry. React Query puts a read that failed with nothing held back to pending while
 * it asks again, so a page reading `isPending` falls back to its loading shapes, and a section that said "didn't load" blinks
 * out. Here a read that has failed keeps reading as failed until it answers: Try again leaves every section drawn, with its
 * button on its spinner, and the page is `pending` only before its first answer.
 */
export function useRead(outcome: Outcome): Read {
  const [settled, setSettled] = useState<'ok' | 'failed' | null>(outcome === 'pending' ? null : outcome);
  if (outcome !== 'pending' && outcome !== settled) setSettled(outcome);
  return {
    pending: outcome === 'pending' && settled !== 'failed',
    failed: outcome === 'failed' || (outcome === 'pending' && settled === 'failed'),
  };
}
