import { useQuery } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { useSession } from '@/api/session';

import { openingProgressQuery, type OpeningProgress } from './api/review';
import { useSessionAccount } from './sessionAccount';
import { useDocumentsNext } from './useDocumentsNext';

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
  /** Both documents are in and only the hosted selfie is left (DV2-05): A6. Left out, A26 is where the documents go. */
  onSelfie?: () => void;
  /** The step under it, drawn when there is nothing to resume (nothing sent yet, or the Hub opens wallets the older way). */
  children: ReactNode;
  /** Drawn while the Hub is asked, so a person who belongs further on never sees the first step flash by. */
  fallback: ReactNode;
  /**
   * The person came here on purpose to add their details again (a refusal asks for them, A29's Upload again,
   * A27): the first step is the step that collects them, so nothing is resumed and nothing is sent back to A29.
   */
  skip?: boolean;
};

/**
 * The first step's way in for a person who already sent their details (KYC-06):
 * a cold start or a reopened app lands where the Hub says the review stands,
 * never back on the first question. A read that fails leaves the first step
 * as it was, which asks again for what it needs.
 */
export function ReviewResume({ onDocuments, onChecking, onRejected, onSelfie, children, fallback, skip = false }: ReviewResumeProps) {
  const { status } = useSession();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const progress = useQuery({ ...openingProgressQuery(owner), enabled: Boolean(owner) && !skip });
  const target = progress.data && !skip ? resumeTarget(progress.data) : null;
  const documentsNext = useDocumentsNext(target === 'documents', owner, onSelfie !== undefined);
  useEffect(() => {
    if (target === 'documents' && documentsNext === 'selfie') onSelfie?.();
    else if (target === 'documents' && documentsNext === 'documents') onDocuments();
    else if (target === 'checking') onChecking();
    else if (target === 'rejected') onRejected();
  }, [target, documentsNext, onDocuments, onChecking, onRejected, onSelfie]);
  const asking = !skip && status === 'signedIn' && (!owner || progress.isPending);
  if (asking || target !== null) return <>{fallback}</>;
  return <>{children}</>;
}
