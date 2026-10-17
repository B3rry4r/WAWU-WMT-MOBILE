import { useQuery } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { useSession } from '@/api/session';

import { openingProgressQuery, type OpeningProgress } from './api/review';
import { useSessionAccount } from './sessionAccount';

/** Where a person who comes back to Open your wallet belongs, from what the Hub says about the review. Pure, for the tests. */
export function resumeTarget(progress: OpeningProgress): 'documents' | 'checking' | 'rejected' | null {
  if (progress.flow !== 'review' || progress.review === null) return null;
  switch (progress.review.stage) {
    case 'needs_documents':
      return 'documents';
    case 'checking':
    case 'approved':
      return 'checking';
    case 'rejected':
    case 'stopped':
    case 'expired':
      return 'rejected';
  }
}

export type ReviewResumeProps = {
  onDocuments: () => void;
  onChecking: () => void;
  onRejected: () => void;
  /** The step under it, drawn when there is nothing to resume (nothing sent yet, or the Hub opens wallets the older way). */
  children: ReactNode;
  /** Drawn while the Hub is asked, so a person who belongs further on never sees the first step flash by. */
  fallback: ReactNode;
};

/**
 * The first step's way in for a person who already sent their details (KYC-06):
 * a cold start or a reopened app lands where the Hub says the review stands,
 * never back on the first question. A read that fails leaves the first step
 * as it was, which asks again for what it needs.
 */
export function ReviewResume({ onDocuments, onChecking, onRejected, children, fallback }: ReviewResumeProps) {
  const { status } = useSession();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const progress = useQuery(openingProgressQuery(owner));
  const target = progress.data ? resumeTarget(progress.data) : null;
  useEffect(() => {
    if (target === 'documents') onDocuments();
    else if (target === 'checking') onChecking();
    else if (target === 'rejected') onRejected();
  }, [target, onDocuments, onChecking, onRejected]);
  const asking = status === 'signedIn' && (!owner || progress.isPending);
  if (asking || target !== null) return <>{fallback}</>;
  return <>{children}</>;
}
