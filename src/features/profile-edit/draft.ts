import { useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';

import type { ProfileForm } from './form';

/**
 * What M8 holds while it is open, shared with M9 (a separate route above it):
 * the form being edited and the form as saved. One account's draft is never
 * handed to another: it is dropped when M8 closes and when the session ends.
 */
export type Draft = { account: string; base: ProfileForm; form: ProfileForm };

let current: Draft | null = null;
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
  if (!current) return;
  current = null;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDraft(): Draft | null {
  return useSyncExternalStore(subscribe, readDraft, readDraft);
}
