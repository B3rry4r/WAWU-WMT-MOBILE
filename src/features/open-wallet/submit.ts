import { readAddress, readKeptCheck, readNumbers, readPerson, readWorld, useHeldReview, useKeptCheck } from './keptCheck';
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
export type OpeningFields = Pick<Draft, 'address' | 'postalCode' | 'idType' | 'idNumber' | 'proofType'> & {
  /** The country that issued a passport, as A26 holds it; the country of residence stands in when it was never changed. */
  passportCountry?: string | null;
};

/**
 * True while the earlier steps still hold what the open call needs from them: a passed check's name and date of
 * birth, or (the review opening, KYC-07) the BVN and NIN typed on A31 with the name, date of birth and gender typed
 * on the details step.
 */
export function keptDetailsHeld(owner: string | undefined): boolean {
  const check = readKeptCheck(owner);
  if (check && openingName(check.prefill)) return true;
  return Boolean(readNumbers(owner) && readPerson(owner));
}

/** The same, read again when what is kept changes (A26, A27, A29). */
export function useKeptDetailsHeld(owner: string | undefined): boolean {
  const check = useKeptCheck(owner);
  const review = useHeldReview(owner);
  return Boolean((check && openingName(check.prefill)) || (review && review.person));
}

/**
 * The details the earlier steps hold with what A26 and A27 collect, in the shape the open call takes; null when
 * nothing usable is held. With a passed check (the older opening) they are the check's name, date of birth and
 * gender and A5's town and state. Under the review opening they are the BVN and NIN A31 holds in memory and the
 * name, date of birth, gender, town and state the details step typed (`bvn` and `nin` go in the one request and
 * nowhere else; the Hub refuses a check handle there, BACKEND_GAPS G-460).
 */
export function detailsFromKept(owner: string | undefined, fields: OpeningFields): ReviewOpening | null {
  const postalCode = fields.postalCode.replace(/\s+/g, ' ').trim();
  const idNumber = fields.idNumber.trim();
  const collected = {
    address: fields.address,
    ...(postalCode ? { postalCode } : {}),
    ...(fields.idType ? { idType: fields.idType } : {}),
    ...(idNumber ? { idNumber } : {}),
    ...(fields.proofType ? { proofOfAddressType: fields.proofType } : {}),
  };
  const typed = readAddress(owner);
  const check = readKeptCheck(owner);
  const name = check ? openingName(check.prefill) : null;
  if (check && name) {
    const gender = check.prefill.gender === 'male' || check.prefill.gender === 'female' ? check.prefill.gender : undefined;
    return {
      ...name,
      ...collected,
      ...(check.prefill.middleName?.trim() ? { middleName: check.prefill.middleName.trim() } : {}),
      ...(gender ? { gender } : {}),
      ...(typed ? { city: typed.city, state: typed.state } : {}),
    };
  }
  const numbers = readNumbers(owner);
  const person = readPerson(owner);
  if (!numbers || !person) return null;
  // WALLET-41 (R-87): a person outside Nigeria sends their country and the currency of the first account, and no
  // BVN or NIN (the Hub refuses none of the three for them, and Nuvion checks their own country's ID).
  const world = readWorld(owner);
  return {
    firstName: person.firstName,
    lastName: person.lastName,
    dateOfBirth: person.dateOfBirth,
    gender: person.gender,
    ...collected,
    ...(typed ? { city: typed.city, state: typed.state } : {}),
    ...(world ? { countryCode: world.country, firstCurrency: world.currency } : { bvn: numbers.bvn, nin: numbers.nin }),
    // A passport names the country that issued it (the Hub refuses one without): the person's pick, or the country they
    // live in as A26 prefills it. A licence or a national ID sends none.
    ...(world && fields.idType === 'international_passport' ? { nationality: fields.passportCountry ?? world.country } : {}),
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
