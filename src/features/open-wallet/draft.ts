import { useEffect, useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';

import type { PickedFile } from './documents/types';

/** The ID types the Hub's open call takes (`idType`), and the proofs of address (`proofOfAddressType`). */
export type IdType = 'international_passport' | 'drivers_license' | 'national_id';
export type ProofType = 'utility_bill' | 'bank_statement';

/**
 * What the person has added on A26 and A27 and not yet sent (KYC-06): the two
 * sides of the ID, the proof of address, and the home address as typed, with
 * the four fields the open call needs beside them (the ID's type and number,
 * the bill's type, the postal code; G-820). WAWU keeps no copy of a document
 * (the bank reviews it), so it is held here, in memory only: never the secure
 * store, never logged, gone when the app process ends, when the session ends,
 * and when the last screen that holds it closes, whichever way the person went
 * (`useDraftLifetime`). It belongs to one account: a different person signed
 * in on the same phone reads nothing.
 */
export type Draft = {
  owner: string;
  idFront: PickedFile | null;
  idBack: PickedFile | null;
  proof: PickedFile | null;
  address: string;
  idType: IdType | null;
  idNumber: string;
  proofType: ProofType | null;
  postalCode: string;
  /** WALLET-41 round 3: the country that issued a passport (ISO code), chosen on A26 for a person outside Nigeria; null until chosen. */
  passportCountry: string | null;
};

const blank = (owner: string): Draft => ({
  owner,
  idFront: null,
  idBack: null,
  proof: null,
  address: '',
  idType: null,
  idNumber: '',
  proofType: null,
  postalCode: '',
  passportCountry: null,
});

let draft: Draft | null = null;
const listeners = new Set<() => void>();

function changed() {
  listeners.forEach((listener) => listener());
}

function own(owner: string): Draft {
  if (!draft || draft.owner !== owner) {
    drop(draft);
    draft = blank(owner);
  }
  return draft;
}

function drop(old: Draft | null) {
  for (const file of old ? [old.idFront, old.idBack, old.proof] : []) file?.discard?.();
}

function replace(owner: string, change: Partial<Omit<Draft, 'owner'>>, dropped: (PickedFile | null)[] = []) {
  const now = own(owner);
  draft = { ...now, ...change };
  dropped.forEach((file) => file?.discard?.());
  changed();
}

/** Keeps one side of the ID (or drops it with null), and forgets the app's copy of the one it replaces. */
export function setIdSide(owner: string, side: 'front' | 'back', file: PickedFile | null): void {
  const now = own(owner);
  const old = side === 'front' ? now.idFront : now.idBack;
  replace(owner, side === 'front' ? { idFront: file } : { idBack: file }, [old]);
}

export function setProof(owner: string, file: PickedFile | null): void {
  replace(owner, { proof: file }, [own(owner).proof]);
}

export function setAddress(owner: string, address: string): void {
  replace(owner, { address });
}

/** The ID's type. A passport has one side, so choosing it drops a back that was already taken (it is never sent). */
export function setIdType(owner: string, idType: IdType | null): void {
  const now = own(owner);
  if (idType === 'international_passport' && now.idBack) replace(owner, { idType, idBack: null }, [now.idBack]);
  else replace(owner, { idType });
}

export function setIdNumber(owner: string, idNumber: string): void {
  replace(owner, { idNumber });
}

/** The country that issued the passport (WALLET-41 round 3); it goes to the Hub as `nationality`. */
export function setPassportCountry(owner: string, passportCountry: string | null): void {
  replace(owner, { passportCountry });
}

export function setProofType(owner: string, proofType: ProofType | null): void {
  replace(owner, { proofType });
}

export function setPostalCode(owner: string, postalCode: string): void {
  replace(owner, { postalCode });
}

/** What is held for this account, or an empty draft (none held, or another person's). */
export function readDraft(owner: string | undefined): Draft {
  if (!draft || !owner || draft.owner !== owner) return blank(owner ?? '');
  return draft;
}

export function forgetDraft(): void {
  const old = draft;
  draft = null;
  drop(old);
  if (old) changed();
}

onSessionEnd(forgetDraft);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For A26 and A27: this account's draft, read again when it changes. */
export function useDraft(owner: string | undefined): Draft {
  const current = useSyncExternalStore(subscribe, () => draft, () => draft);
  return !current || !owner || current.owner !== owner ? blank(owner ?? '') : current;
}

/** The files are sent: drops them (and the app's copy of each photo) and the ID number, and keeps the address typed. */
export function clearFiles(owner: string): void {
  const now = own(owner);
  const sent = [now.idFront, now.idBack, now.proof];
  draft = { ...now, idFront: null, idBack: null, proof: null, idNumber: '' };
  sent.forEach((file) => file?.discard?.());
  changed();
}

/** How many screens that hold the draft (A26, A27) are on the stack right now. */
let holders = 0;

/**
 * Called by every screen that holds the draft (A26, A27). The draft is dropped
 * when the last of them closes, whichever way the person left: Back, the
 * browser's back, another tab, a screen replacing them, the flow unmounting.
 * Going from A27 back to A26 keeps it (A26 still holds it). The check waits
 * one tick, so a screen replaced by another holder in the same commit (and a
 * development remount) is not mistaken for leaving.
 */
export function useDraftLifetime(): void {
  useEffect(() => {
    holders += 1;
    return () => {
      holders -= 1;
      if (holders > 0) return;
      void Promise.resolve().then(() => {
        if (holders === 0) forgetDraft();
      });
    };
  }, []);
}
