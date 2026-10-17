import { useQuery } from '@tanstack/react-query';

import { DOCUMENTS_KEY, fetchDocuments, selfieOnlyLeft } from './api/documents';

/**
 * Where a person who "needs documents" belongs (DV2-05). The Hub's wallet answer says the details are in and the
 * documents are still needed (`needs_documents`), and it says the same while only the hosted selfie is missing.
 * Asked while `active`, this reads the documents and answers `selfie` (both are in, the selfie is all that is left:
 * A6) or `documents` (A26), and null while the Hub is being asked or `active` is false. A read that fails answers
 * `documents`: the step that sends them again says what the Hub needs.
 */
export function useDocumentsNext(active: boolean, owner: string | undefined, selfieStep: boolean): 'selfie' | 'documents' | null {
  const asked = active && selfieStep && Boolean(owner);
  const documents = useQuery({
    queryKey: [...DOCUMENTS_KEY, owner ?? '', 'next'] as const,
    queryFn: fetchDocuments,
    enabled: asked,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  if (!active) return null;
  if (!selfieStep) return 'documents';
  if (documents.isPending) return null;
  return selfieOnlyLeft(documents.data) ? 'selfie' : 'documents';
}
