import { useSyncExternalStore } from 'react';

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
 * The piece being made, from M20 to the details step (ME-08). The Hub has no draft: the create call takes the title,
 * the price and both files at once, so what the steps collect is held here until the last one sends it.
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

/** A different format starts the piece again: the files that went up for the old one are not this one's. */
export function setFormat(format: FormatId): void {
  if (draft.format === format) return;
  publish({ format, full: null, preview: null });
}

export function setFull(full: UploadedFile | null): void {
  publish({ ...draft, full, preview: full ? draft.preview : null });
}

export function setPreview(preview: UploadedFile | null): void {
  publish({ ...draft, preview });
}

export function resetDraft(): void {
  publish(empty);
}

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
