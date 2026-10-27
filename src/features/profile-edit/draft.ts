import { useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';

import type { PhotoPosition } from '@/lib/photoPosition';

import type { ProfileForm } from './form';
import type { PickedImage } from './pickImage';

/**
 * What M8 holds while it is open, shared with M9 (a separate route above it):
 * the form being edited and the form as saved. One account's draft is never
 * handed to another: it is dropped when M8 closes and when the session ends.
 */
export type Draft = { account: string; base: ProfileForm; form: ProfileForm };

/**
 * A photo just chosen for the profile picture or the cover and not yet uploaded (R-96): the position screen shows it from the phone
 * and its Save hands the position back through `place`, which uploads it. Cancel drops it and the old picture stays.
 */
export type PendingPhoto = { kind: 'avatar' | 'cover'; picked: PickedImage; place: (position: PhotoPosition | null) => void };

let current: Draft | null = null;
let pending: PendingPhoto | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

onSessionEnd(() => clearDraft());

/** Starts a draft for this account unless one is already open for it (M9 opened over M8 finds M8's). */
export function ensureDraft(account: string, base: ProfileForm): Draft {
  if (!current || current.account !== account) current = { account, base, form: base };
  return current;
}

export function readDraft(): Draft | null {
  return current;
}

export function updateDraft(change: (form: ProfileForm) => ProfileForm): void {
  if (!current) return;
  current = { ...current, form: change(current.form) };
  emit();
}

/** The saved form moved on (part of a save reached the Hub). */
export function rebaseDraft(change: (base: ProfileForm, form: ProfileForm) => ProfileForm): void {
  if (!current) return;
  current = { ...current, base: change(current.base, current.form) };
  emit();
}

export function clearDraft(): void {
  dropPendingPhoto();
  if (!current) return;
  current = null;
  emit();
}

export function readPendingPhoto(): PendingPhoto | null {
  return pending;
}

/** Holds a chosen photo for the position screen; one already held is dropped first. */
export function holdPendingPhoto(photo: PendingPhoto): void {
  dropPendingPhoto();
  pending = photo;
  emit();
}

/** The photo has been handed on (Save): forgotten, and the phone's own copy is left for the upload to delete. */
export function releasePendingPhoto(): void {
  if (!pending) return;
  pending = null;
  emit();
}

/** The photo was not used (Cancel, a new choice, Edit profile closed): forgotten, and the phone's own copy of it is deleted. */
export function dropPendingPhoto(): void {
  if (!pending) return;
  const { picked } = pending;
  pending = null;
  picked.discard?.();
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDraft(): Draft | null {
  return useSyncExternalStore(subscribe, readDraft, readDraft);
}

export function usePendingPhoto(): PendingPhoto | null {
  return useSyncExternalStore(subscribe, readPendingPhoto, readPendingPhoto);
}
