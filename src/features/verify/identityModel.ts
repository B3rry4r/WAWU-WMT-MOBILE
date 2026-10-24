import type { OpeningProgress } from '@/features/open-wallet/api/review';

/**
 * Where the identity check stands for publishing (VERIFY-04, VF15 to VF15b), as the Hub says it (R-6: the BVN and NIN check is the
 * one that opens the wallet, so this is the wallet's own state, never a flag kept here).
 *
 * - `passed`: the wallet is open, so the BVN and NIN checked out (VF15a, when the person watched it run; else publishing goes on).
 * - `checking`: the details are with the bank (VF15). The Hub serves no progress figure, so the board's "70%" is not drawn.
 * - `paused`: the check did not pass, or never began (VF15b): the Hub's own reason and what to do. `canOpen` when Open your wallet
 *   is the way forward (it resumes where the Hub says the opening stands).
 */
export type IdentityState =
  | { kind: 'passed' }
  | { kind: 'checking' }
  | { kind: 'paused'; reason: string; fixes: string[]; canOpen: boolean };

export function identityStateOf(progress: OpeningProgress): IdentityState {
  if (progress.state === 'open') return { kind: 'passed' };
  if (progress.state === 'frozen') return { kind: 'paused', reason: 'Your wallet is frozen.', fixes: [], canOpen: false };
  if (progress.state === 'opening') return { kind: 'checking' };
  const review = progress.review;
  if (!review) return { kind: 'paused', reason: 'Your identity has not been checked yet.', fixes: ['Open your wallet to check your BVN and NIN'], canOpen: true };
  switch (review.stage) {
    case 'checking':
    case 'approved':
      return { kind: 'checking' };
    case 'needs_documents':
      return { kind: 'paused', reason: 'Your wallet is not finished opening.', fixes: ['Send the documents the bank asked for'], canOpen: true };
    case 'rejected':
    case 'stopped':
    case 'expired': {
      const reasons = review.reasons;
      const reason = reasons[0]?.message ?? 'Your identity could not be checked.';
      const fixes = reasons.map((r) => r.fix).filter((fix) => fix.length > 0);
      return { kind: 'paused', reason, fixes: fixes.length > 0 ? fixes : ['Send your details again'], canOpen: review.stage !== 'stopped' && review.canResubmit };
    }
  }
}
