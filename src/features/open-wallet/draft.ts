import { useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';

import type { PickedFile } from './documents/types';

/**
 * What the person has added on A26 and A27 and not yet sent (KYC-06): the two
 * sides of the ID, the proof of address, and the home address as typed. WAWU
 * keeps no copy of a document (the bank reviews it), so it is held here, in
 * memory only: never the secure store, never logged, gone when the app process
 * ends, when the session ends, and when Open your wallet is left or finished.
 * It belongs to one account: a different person signed in on the same phone
 * reads nothing.
 */
export type Draft = { owner: string; idFront: PickedFile | null; idBack: PickedFile | null; proof: PickedFile | null; address: string };

let draft: Draft | null = null;
const listeners = new Set<() => void>();

function changed() {
  listeners.forEach((listener) => listener());
}

function own(owner: string): Draft {
  if (!draft || draft.owner !== owner) {
    drop(draft);
    draft = { owner, idFront: null, idBack: null, proof: null, address: '' };
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

/** What is held for this account, or an empty draft (none held, or another person's). */
export function readDraft(owner: string | undefined): Draft {
  if (!draft || !owner || draft.owner !== owner) return { owner: owner ?? '', idFront: null, idBack: null, proof: null, address: '' };
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
  return !current || !owner || current.owner !== owner ? { owner: owner ?? '', idFront: null, idBack: null, proof: null, address: '' } : current;
}

/** The files are sent: drops them (and the app's copy of each photo) and keeps the address typed. */
export function clearFiles(owner: string): void {
  const now = own(owner);
  const sent = [now.idFront, now.idBack, now.proof];
  draft = { ...now, idFront: null, idBack: null, proof: null };
  sent.forEach((file) => file?.discard?.());
  changed();
}
