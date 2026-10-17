import { readAddress, readKeptCheck, useKeptCheck } from './keptCheck';
import { uploadDocument, type DocumentsView } from './api/documents';
import { openForReview, type OpeningProgress, type ReviewOpening } from './api/review';
import { openingName } from './details';
import { isOneSided } from './documentFields';
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

/** What A26 and A27 collect for the open call (G-820): the home address line, the postal code, the ID's type and number, and the bill's type. */
export type OpeningFields = Pick<Draft, 'address' | 'postalCode' | 'idType' | 'idNumber' | 'proofType'>;

/** True while the earlier steps still hold what the open call needs from them: the passed check's name and date of birth. */
export function keptDetailsHeld(owner: string | undefined): boolean {
  const check = readKeptCheck(owner);
  return Boolean(check && openingName(check.prefill));
}

/** The same, read again when what is kept changes (A26, A27, A29). */
export function useKeptDetailsHeld(owner: string | undefined): boolean {
  const check = useKeptCheck(owner);
  return Boolean(check && openingName(check.prefill));
}

/**
 * The details the earlier steps hold (the BVN check's name, date of birth and
 * gender, A5's town and state) with what A26 and A27 collect, in the shape the
 * open call takes; null when there is no passed check to read the first from.
 * The BVN and NIN are not here: they belong to the step before (KYC-07).
 */
export function detailsFromKept(owner: string | undefined, fields: OpeningFields): ReviewOpening | null {
  const check = readKeptCheck(owner);
  const name = check ? openingName(check.prefill) : null;
  if (!check || !name) return null;
  const typed = readAddress(owner);
  const gender = check.prefill.gender === 'male' || check.prefill.gender === 'female' ? check.prefill.gender : undefined;
  const postalCode = fields.postalCode.replace(/\s+/g, ' ').trim();
  const idNumber = fields.idNumber.trim();
  return {
    ...name,
    address: fields.address,
    ...(check.prefill.middleName?.trim() ? { middleName: check.prefill.middleName.trim() } : {}),
    ...(gender ? { gender } : {}),
    ...(typed ? { city: typed.city, state: typed.state } : {}),
    ...(postalCode ? { postalCode } : {}),
    ...(fields.idType ? { idType: fields.idType } : {}),
    ...(idNumber ? { idNumber } : {}),
    ...(fields.proofType ? { proofOfAddressType: fields.proofType } : {}),
  };
}

/** Thrown when the details must be sent and nothing holds them: the person is sent to the step that collects them. */
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
  // A passport has one side: a back that is somehow still held is not sent with it.
  const back = isOneSided(draft.idType) ? undefined : (draft.idBack ?? undefined);
  if (draft.idFront) view = await uploadDocument('identity', draft.idFront, back);
  if (draft.proof) view = await uploadDocument('proof_of_address', draft.proof);
  return view;
}
