import { useCallback, useState } from 'react';

import { queryClient as client } from '@/api/query';
import { attemptFor, dropAttempt, keepAttempt } from '@/features/money-attempt/attempts';
import { isApprovalStop, notApproved, stopCode, type Credential, type Settled } from '@/features/device-approval';
import { newRequestKey } from '@/features/wallet/api/settings';

import { swapAtQuote, swapQuery, type FxQuote, type FxSwap } from '../api';
import { SWAP_NOT_TAKEN } from './model';

export type SwapPayProblem = { title: string; message: string };

export type UseSwapPayArgs = {
  owner: string | null;
  /** The swap went in (completed, or still with the provider): the receipt. */
  onSwapped: (swap: FxSwap) => void;
  /** No wallet: Open your wallet. */
  onNoWallet: () => void;
  /** No PIN is set yet: A9. */
  onSetPin: () => void;
  /** The quote ran out or changed: close the review and ask for a new rate. */
  onQuoteGone: () => void;
  /** Close the PIN sheet. */
  onClosePin: () => void;
};

const subjectOf = (quote: FxQuote) => `swap:${quote.id}`;

/**
 * Paying for one swap: the PIN (or the phone's fingerprint or face) and the one request, `POST /money/fx/swaps` with the quote's id.
 * One `Idempotency-Key` for the quote, kept in memory beside it (`money-attempt/attempts`): a wrong PIN, a locked PIN and a request
 * that got no answer all send the SAME key again, so the swap happens one time (the Hub answers a key it knows with the first result, before
 * it looks at the PIN). A refusal that decided the quote's fate (expired, declined, not enough) lets the attempt go. Exactly as Send in
 * naira does it.
 */
export function useSwapPay(args: UseSwapPayArgs) {
  const [problem, setProblem] = useState<SwapPayProblem | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const run = useCallback(
    async (quote: FxQuote, credential: Credential): Promise<Settled> => {
      const subject = subjectOf(quote);
      const held = attemptFor<FxQuote>(subject);
      const attempt = held ?? { subject, key: newRequestKey(), quote, phase: 'sent' as const, paymentId: null };
      // Kept before the request leaves the phone, so a lost answer is followed by the same key.
      keepAttempt(attempt);
      const outcome = await swapAtQuote({ quoteId: quote.id, key: attempt.key, ...credential });
      // The phone's own stops (a closed prompt, a failed approval) prove nothing about an earlier try under this key.
      if (isApprovalStop(outcome)) return notApproved(stopCode(outcome), held !== null, () => dropAttempt(subject, attempt.key));
      const nothingMoved = () => dropAttempt(subject, attempt.key);
      switch (outcome.kind) {
        case 'done': {
          // Every money read is asked again, except the quotes: a decided swap is no reason to ask for another rate.
          void client.invalidateQueries({ queryKey: ['money'], predicate: (q) => q.queryKey[2] !== 'quote' });
          client.setQueryData(swapQuery(args.owner, outcome.value.id).queryKey, outcome.value);
          if (outcome.value.status === 'pending') keepAttempt({ ...attempt, phase: 'pending', paymentId: outcome.value.id });
          else dropAttempt(subject, attempt.key);
          args.onClosePin();
          args.onSwapped(outcome.value);
          return { code: 'approved' };
        }
        // A wrong or locked PIN proves nothing moved, and the attempt stays: the PIN typed again goes under the SAME key, as Send in naira does.
        case 'pin_incorrect':
          return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
        case 'pin_locked':
          setLockedUntil(outcome.lockedUntil);
          return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
        case 'unanswered':
          return { code: 'unanswered' };
        case 'pin_not_set':
          nothingMoved();
          args.onClosePin();
          args.onSetPin();
          return { code: 'approved' };
        case 'no_wallet':
          nothingMoved();
          args.onClosePin();
          args.onNoWallet();
          return { code: 'approved' };
        case 'quote_expired':
          nothingMoved();
          args.onClosePin();
          args.onQuoteGone();
          return { code: 'approved' };
        case 'insufficient_funds':
          nothingMoved();
          args.onClosePin();
          setProblem({ title: 'Not enough to swap', message: 'Your balance does not cover this swap and its fees. Nothing moved.' });
          return { code: 'approved' };
        case 'frozen':
          nothingMoved();
          args.onClosePin();
          setProblem({ title: 'This account is frozen', message: 'Money can arrive, but it cannot be swapped until it is opened again. Nothing moved.' });
          return { code: 'approved' };
        case 'switched_off':
          nothingMoved();
          args.onClosePin();
          setProblem({ title: 'Swaps are switched off', message: 'Try again later. Nothing moved.' });
          return { code: 'approved' };
        case 'declined':
          nothingMoved();
          args.onClosePin();
          setProblem({ title: 'This swap was not taken', message: SWAP_NOT_TAKEN });
          return { code: 'approved' };
        default:
          nothingMoved();
          args.onClosePin();
          setProblem({ title: 'This swap was not taken', message: outcome.kind === 'refused' ? outcome.message : 'Nothing moved. Try again.' });
          return { code: 'approved' };
      }
    },
    [args],
  );

  return { run, problem, clearProblem: () => setProblem(null), lockedUntil };
}
