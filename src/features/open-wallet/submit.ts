import { readAddress, readKeptCheck } from './keptCheck';
import { uploadDocument, type DocumentsView } from './api/documents';
import { openForReview, type OpeningProgress, type ReviewOpening } from './api/review';
import { openingName } from './details';
import type { Draft } from './draft';

/**
 * A27's Submit (KYC-06): the details go to the Hub when the opening has not
 * started or a refusal asks for them again (`POST /money/wallet/open`), then
 * the documents go up, the ID's two sides in one request and the proof of
 * address in another; the Hub sends the opening to the bank's review by
 * itself once both are in. Each step is safe to repeat (one opening per
 * person, the same file sent twice is forwarded once), but the details count
 * against the day's tries, so they are sent only while the Hub says they are
 * needed and the answer is handed back at once (`onOpened`), so a retry after
 * a failed upload does not send them again.
 */

/** The details the earlier steps hold, which the opening needs and A27 does not collect; null when there is no passed check to read them from. */
export function detailsFromKept(owner: string | undefined, address: string): ReviewOpening | null {
  const check = readKeptCheck(owner);
  const name = check ? openingName(check.prefill) : null;
  if (!check || !name) return null;
  const typed = readAddress(owner);
  const gender = check.prefill.gender === 'male' || check.prefill.gender === 'female' ? check.prefill.gender : undefined;
  return {
    ...name,
    address,
    ...(check.prefill.middleName?.trim() ? { middleName: check.prefill.middleName.trim() } : {}),
    ...(gender ? { gender } : {}),
    ...(typed ? { city: typed.city, state: typed.state } : {}),
  };
}

/** Thrown when the details must be sent and nothing holds them: the person starts Open your wallet again. */
export class NeedsDetails extends Error {
  constructor() {
    super('The details of this opening are no longer held.');
    this.name = 'NeedsDetails';
  }
}

/** True while the Hub has no opening to attach documents to, or asks for the details again after a refusal. */
export function needsOpening(progress: OpeningProgress): boolean {
  const stage = progress.review?.stage ?? null;
  return progress.review === null || stage === 'rejected' || stage === 'expired';
}

export type SubmitInput = {
  progress: OpeningProgress;
  draft: Draft;
  details: ReviewOpening | null;
  onOpened: (progress: OpeningProgress) => void;
};

/** Sends what is needed, in order. Resolves with the documents as they stand after the last upload (null when nothing was uploaded). */
export async function sendOpening({ progress, draft, details, onOpened }: SubmitInput): Promise<DocumentsView | null> {
  if (needsOpening(progress)) {
    if (!details) throw new NeedsDetails();
    onOpened(await openForReview(details));
  }
  let view: DocumentsView | null = null;
  if (draft.idFront) view = await uploadDocument('identity', draft.idFront, draft.idBack ?? undefined);
  if (draft.proof) view = await uploadDocument('proof_of_address', draft.proof);
  return view;
}
