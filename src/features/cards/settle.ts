import { isApprovalStop, noRecordToForget, notApproved, stopCode, type Settled } from '@/features/device-approval';

import type { CardOutcome } from './api';

/** What the screen does with the answers that are neither a success nor the sheet's own to show. */
export type SettleHooks = {
  onSetPin: () => void;
  onOpenWallet: () => void;
  /** A sentence to show the person (a toast), in the Hub's own words. */
  say: (message: string) => void;
  /** The PIN is locked: the sheet is told, and so is the screen for the next time it opens. */
  locked?: (until: string) => void;
  closeSheet: () => void;
};

/**
 * Turns one answer that is not a success into what the PIN sheet is told, and does what the screen owes it. A closed or refused
 * fingerprint proves nothing about an earlier try (`notApproved`), a wrong or locked PIN uses the sheet's own lines, and an answer
 * that never came lets the sheet ask again (the same Idempotency-Key goes out, where the call has one). Every other refusal is the
 * Hub's sentence, said once, and the sheet closes: nothing was taken.
 */
export function settleStop<T>(outcome: Exclude<CardOutcome<T>, { kind: 'done' }>, earlierTry: boolean, hooks: SettleHooks): Settled {
  if (isApprovalStop(outcome)) return notApproved(stopCode(outcome), earlierTry, noRecordToForget);
  switch (outcome.kind) {
    case 'pin_incorrect':
      return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
    case 'pin_locked':
      hooks.locked?.(outcome.lockedUntil);
      return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
    case 'unanswered':
      return { code: 'unanswered' };
    case 'pin_not_set':
      hooks.closeSheet();
      hooks.onSetPin();
      return { code: 'approved' };
    case 'no_wallet':
      hooks.closeSheet();
      hooks.onOpenWallet();
      return { code: 'approved' };
    case 'refused':
      hooks.closeSheet();
      hooks.say(outcome.message);
      return { code: 'approved' };
    case 'insufficient_funds':
    case 'quote_changed':
    case 'in_progress':
      hooks.closeSheet();
      hooks.say('That was not done. Nothing was taken from your wallet.');
      return { code: 'approved' };
  }
}
