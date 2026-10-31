import { useSyncExternalStore } from 'react';

import { ApiError } from '@/api/errors';
import { onSessionEnd } from '@/api/session';

import { releaseUpload } from './api';
import type { ChosenFile, Frame } from './chosen';
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
  /** A frame read out of a video, when the file is one and a frame could be read (`frames.ts`). Held in memory only: it is never sent anywhere. */
  frame?: Frame;
};

/**
 * The piece being made, from M20 to the price step (ME-08). The Hub has no draft: the create call takes the title,
 * the price and both files at once, so what the steps collect is held until the last one sends it: the format and the
 * files here, the title, description, category and price in `details.ts`, which every reset below empties too.
 */
export type Draft = { format: FormatId | null; full: UploadedFile | null; preview: UploadedFile | null };

/**
 * One lesson of a course being made (FIX-111): the title, the length as typed (`4:12`), and the file that went up for it, which is a
 * `content/full` upload like a piece's own. `key` is the screen's own handle for the card (a lesson has no id until the Hub saves it).
 */
export type DraftLesson = { key: string; title: string; duration: string; file: UploadedFile | null };

/**
 * A course the Hub has taken whose lessons are not saved yet (FIX-111): the piece is made first and its lessons follow
 * (`PUT /content/{id}/lessons`), so a failure between the two leaves a course in review with no lessons. This keeps what the price
 * step needs to save them again without making a second piece. Emptied once the lessons are saved or the draft is reset.
 */
export type MadeCourse = { id: string; title: string };
let made: MadeCourse | null = null;
const madeListeners = new Set<() => void>();
export const getMade = (): MadeCourse | null => made;
export function setMade(next: MadeCourse | null): void {
  made = next;
  madeListeners.forEach((l) => l());
}
export function useMade(): MadeCourse | null {
  return useSyncExternalStore(
    (listener) => {
      madeListeners.add(listener);
      return () => madeListeners.delete(listener);
    },
    getMade,
    getMade,
  );
}

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

/**
 * A course's lessons, in the order they will be taken (FIX-111). They are kept apart from the draft's own three fields so a piece that
 * is not a course reads exactly as before; every reset above empties both.
 */
let lessons: DraftLesson[] = [];
const lessonListeners = new Set<() => void>();
function setLessons(next: DraftLesson[]): void {
  lessons = next;
  lessonListeners.forEach((l) => l());
}
export const getLessons = (): DraftLesson[] => lessons;

/** A different format starts the piece again: the files that went up for the old one are not this one's, so they are given back. */
export function setFormat(format: FormatId): void {
  if (draft.format === format) return;
  giveBack(draft.full);
  giveBack(draft.preview);
  setSmallCopy(null);
  if (!made) lessons.forEach((l) => giveBack(l.file));
  giveBack(cover.file);
  publishCover(noCover);
  setMade(null);
  setLessons([]);
  resetDetails();
  publish({ format, full: null, preview: null });
}

/**
 * Replacing or clearing the full file gives the old one back, and with it everything made from it: the smaller copy of a picture, the preview
 * that went up for it, and a frame that went up as the default cover (the new file's frame is sent at Send).
 */
export function setFull(full: UploadedFile | null): void {
  if (draft.full?.key !== full?.key) {
    giveBack(draft.full);
    setSmallCopy(null);
    giveBack(draft.preview);
    dropDefaultCover();
    publish({ ...draft, full, preview: null });
    return;
  }
  publish({ ...draft, full });
}

/**
 * The preview of a picture, once it has gone up (at Send, R-118): kept so a Send that fails and is tried again uses it rather than sending a
 * second one. Replacing or removing it gives the old one back. No other kind has one: the Hub makes theirs.
 */
export function setPreview(preview: UploadedFile | null): void {
  if (draft.preview?.key !== preview?.key) giveBack(draft.preview);
  publish({ ...draft, preview });
}

/**
 * R-118: the smaller copy the phone made of a picture piece's first picture (long edge 640 px, a JPEG), held in memory until Send uploads it as
 * the preview of a PAID piece. It is made when the picture is chosen, because the phone's own copy of the picture goes once the picture has
 * gone up. A copy that is replaced or no longer wanted is deleted from the phone.
 */
let smallCopy: ChosenFile | null = null;
export const getSmallCopy = (): ChosenFile | null => smallCopy;
export function setSmallCopy(next: ChosenFile | null): void {
  if (smallCopy && smallCopy !== next) smallCopy.discard?.();
  smallCopy = next;
}

/** Starts a fresh piece (the Content tile): whatever the old draft had uploaded is given back. */
export function abandonDraft(): void {
  giveBack(draft.full);
  giveBack(draft.preview);
  setSmallCopy(null);
  // The files of a course the Hub has already taken belong to it, whether or not its lessons were saved.
  if (!made) lessons.forEach((l) => giveBack(l.file));
  giveBack(cover.file);
  publishCover(noCover);
  setMade(null);
  setLessons([]);
  resetDetails();
  setSent(null);
  publish(empty);
}

/**
 * The cover the person chose for the piece (R-114): `default` (the frame of the video they uploaded, else none; `file` is that frame once Send has put it
 * up, kept for a second try), a `picture` they picked and that went up to `content/cover` (`file`), or `none`. Kept apart from the draft's own three fields so a piece that sets no cover reads exactly as before;
 * every reset empties it, and a picture that went up and is no longer wanted is given back to the Hub like any file.
 */
export type DraftCover = { mode: 'default' | 'picture' | 'none'; file: UploadedFile | null };
const noCover: DraftCover = { mode: 'default', file: null };
let cover: DraftCover = noCover;
/** A frame that went up as the default cover was read from a file that has changed: it is given back, and the new file's frame goes at Send. */
function dropDefaultCover(): void {
  if (cover.mode === 'default' && cover.file) {
    giveBack(cover.file);
    publishCover(noCover);
  }
}
const coverListeners = new Set<() => void>();
function publishCover(next: DraftCover): void {
  cover = next;
  coverListeners.forEach((l) => l());
}
export const getCover = (): DraftCover => cover;
/** Chooses the cover; a picture that is replaced or no longer chosen is given back to the Hub. */
export function setCover(next: DraftCover): void {
  if (cover.file && cover.file.key !== next.file?.key) giveBack(cover.file);
  publishCover(next);
}
export function useCover(): DraftCover {
  return useSyncExternalStore(
    (listener) => {
      coverListeners.add(listener);
      return () => coverListeners.delete(listener);
    },
    getCover,
    getCover,
  );
}

let lessonCounter = 0;
const newLesson = (): DraftLesson => ({ key: `lesson-${(lessonCounter += 1)}`, title: '', duration: '', file: null });

export function useLessons(): DraftLesson[] {
  return useSyncExternalStore(
    (listener) => {
      lessonListeners.add(listener);
      return () => lessonListeners.delete(listener);
    },
    getLessons,
    getLessons,
  );
}

/** A blank lesson is added at the end. */
export function addLesson(): void {
  setLessons([...lessons, newLesson()]);
}

/** Changes what the person typed for a lesson. */
export function setLessonText(key: string, patch: Partial<Pick<DraftLesson, 'title' | 'duration'>>): void {
  setLessons(lessons.map((l) => (l.key === key ? { ...l, ...patch } : l)));
}

/** Puts a file on a lesson (or takes it off): a file it had is given back to the Hub. */
export function setLessonFile(key: string, file: UploadedFile | null): void {
  const had = lessons.find((l) => l.key === key)?.file ?? null;
  if (had && had.key !== file?.key) giveBack(had);
  if (had?.key !== file?.key) dropDefaultCover();
  setLessons(lessons.map((l) => (l.key === key ? { ...l, file } : l)));
}

/** Takes a lesson out; its file is given back to the Hub. */
export function removeLesson(key: string): void {
  giveBack(lessons.find((l) => l.key === key)?.file ?? null);
  dropDefaultCover();
  setLessons(lessons.filter((l) => l.key !== key));
}

/** Moves a lesson one place earlier (-1) or later (1). */
export function moveLesson(key: string, by: -1 | 1): void {
  const from = lessons.findIndex((l) => l.key === key);
  const to = from + by;
  if (from < 0 || to < 0 || to >= lessons.length) return;
  const next = [...lessons];
  [next[from], next[to]] = [next[to], next[from]];
  if (from === 0 || to === 0) dropDefaultCover();
  setLessons(next);
}

/** The file that stands for a piece's full file: a course's first lesson (the Hub's create call wants one), else the full file. */
export const fullFileOf = (d: Pick<Draft, 'format' | 'full'>, lessonList: readonly DraftLesson[]): UploadedFile | null =>
  d.format === 'course' ? (lessonList[0]?.file ?? null) : d.full;

/**
 * Empties the draft without giving anything back: for when the files now belong to something else (the create call, ME-08) or
 * the session has ended and there is no one to ask on behalf of.
 */
export function resetDraft(): void {
  setSmallCopy(null);
  publishCover(noCover);
  setMade(null);
  setLessons([]);
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
