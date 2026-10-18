import { useSyncExternalStore } from 'react';

import { ApiError } from '@/api/errors';
import { onSessionEnd } from '@/api/session';

import { releaseUpload } from './api';
import { resetDetails, setSent } from './details';
import type { FormatId } from './model';

/** A file that has gone up to the Hub's storage: what the create call (`POST /content`) takes as `fullAsset` or `previewAsset`. */
export type UploadedFile = {
  name: string;
  bytes: number;
  contentType: string;
  /** The storage key the Hub wrote for this file. */
  key: string;
  /** The link the create call takes. */
  fileUrl: string;
  /** Where the screen can draw the file (a picture), when it is one. */
  previewUri?: string;
  /** Pages in a PDF, when the file says so. */
  pages?: number;
};

/**
 * The piece being made, from M20 to the price step (ME-08). The Hub has no draft: the create call takes the title,
 * the price and both files at once, so what the steps collect is held until the last one sends it: the format and the
 * files here, the title, description, category and price in `details.ts`, which every reset below empties too.
 */
export type Draft = { format: FormatId | null; full: UploadedFile | null; preview: UploadedFile | null };

const empty: Draft = { format: null, full: null, preview: null };
let draft: Draft = empty;
const listeners = new Set<() => void>();

const publish = (next: Draft) => {
  draft = next;
  listeners.forEach((l) => l());
};

export const getDraft = (): Draft => draft;

/**
 * A file the draft lets go of is given back to the Hub, which frees the space it reserved (ME-04). Sent and forgotten: the screen
 * never waits on it. A release the Hub is too busy to take (429 `storage_busy`, 503) is asked again after the `Retry-After` it
 * named, up to three tries in all, so the file is not left counted until some later release (SWEEP-APP-4 row 80); any other
 * refusal, or a third try that fails, leaves the file counted, which the next release of the same key can still settle.
 */
export const RELEASE_TRIES = 3;
/** The wait when the Hub names none, and the most it is trusted to ask for. */
export const RELEASE_FALLBACK_WAIT_S = 2;
export const RELEASE_MAX_WAIT_S = 30;

const busy = (error: unknown): error is ApiError => error instanceof ApiError && (error.status === 429 || error.status === 503);

async function release(key: string): Promise<void> {
  for (let attempt = 1; attempt <= RELEASE_TRIES; attempt += 1) {
    try {
      await releaseUpload(key);
      return;
    } catch (error) {
      if (attempt === RELEASE_TRIES || !busy(error)) return;
      const named = error.retryAfterSeconds;
      const seconds = named && named > 0 ? Math.min(named, RELEASE_MAX_WAIT_S) : RELEASE_FALLBACK_WAIT_S;
      await new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
    }
  }
}

function giveBack(file: UploadedFile | null): void {
  if (file) void release(file.key);
}

/** A different format starts the piece again: the files that went up for the old one are not this one's, so they are given back. */
export function setFormat(format: FormatId): void {
  if (draft.format === format) return;
  giveBack(draft.full);
  giveBack(draft.preview);
  resetDetails();
  publish({ format, full: null, preview: null });
}

/** Replacing or clearing the full file gives the old one back; clearing it also drops the preview that went with it. */
export function setFull(full: UploadedFile | null): void {
  if (draft.full?.key !== full?.key) giveBack(draft.full);
  if (!full) giveBack(draft.preview);
  publish({ ...draft, full, preview: full ? draft.preview : null });
}

/** Replacing or removing the preview gives the old one back. */
export function setPreview(preview: UploadedFile | null): void {
  if (draft.preview?.key !== preview?.key) giveBack(draft.preview);
  publish({ ...draft, preview });
}

/** Starts a fresh piece (the Content tile): whatever the old draft had uploaded is given back. */
export function abandonDraft(): void {
  giveBack(draft.full);
  giveBack(draft.preview);
  resetDetails();
  setSent(null);
  publish(empty);
}

/**
 * Empties the draft without giving anything back: for when the files now belong to something else (the create call, ME-08) or
 * the session has ended and there is no one to ask on behalf of.
 */
export function resetDraft(): void {
  resetDetails();
  publish(empty);
}

onSessionEnd(resetDraft);

export function useDraft(): Draft {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getDraft,
    getDraft,
  );
}
