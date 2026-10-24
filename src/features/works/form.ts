import type { NewWork, WorkDetail, WorkUpdate } from './api';
import { WORK_LIMITS, type TextLimit } from './limits';

/** A photo or video the person chose, ready to upload. */
export type PickedFile = {
  /** The bytes. */
  blob: Blob;
  /** `image/jpeg`, `video/mp4`: what `POST /uploads/presign` takes as `contentType`. */
  contentType: string;
  /** Without the dot, as `POST /uploads/presign` takes it. */
  extension: string;
  /** Where the screen can show it before it is saved. */
  previewUri: string;
  /** Phone builds: deletes the app's own copy once its upload has settled (`PickedImage.discard`). Not set on the web build. */
  discard?: () => void;
};

/** What M36 says about the files, before Save: how many a work can carry. */
export const mediaHint = `Up to ${WORK_LIMITS.media} photos or videos.`;

/** Room left for files on a work that already has `have`. */
export function mediaRoom(have: number): number {
  return Math.max(0, WORK_LIMITS.media - have);
}

/**
 * The app's own sentence when chosen files could not be read (a 0-byte or corrupt photo):
 * how many, named by kind (lead ruling after the verifier, D1).
 */
export function mediaUnreadable(kinds: readonly MediaKind[]): string {
  const count = kinds.length;
  const noun = kinds.every((kind) => kind === 'image') ? 'photo' : kinds.every((kind) => kind === 'video') ? 'video' : 'file';
  return count === 1 ? `1 ${noun} couldn't be added. Try it again or choose another.` : `${count} ${noun}s couldn't be added. Try them again or choose others.`;
}

/** The app's own sentence when the photo library itself could not be opened. */
export const MEDIA_LIBRARY_FAILED = "We couldn't open your photo library. Try again.";

/** The app's own sentence when a pick is more than a work can carry: how many were left out. */
export function mediaRefused(refused: number): string {
  const left = refused === 1 ? '1 was' : `${refused} were`;
  return `A work can carry up to ${WORK_LIMITS.media} photos or videos. ${left} not added.`;
}

export type MediaKind = 'image' | 'video';

export const mediaKindOf = (contentType: string): MediaKind => (contentType.startsWith('video/') ? 'video' : 'image');

/** One chosen file on its way to storage. `key` is what `POST /users/me/featured-works` takes once it has landed. */
export type MediaItem = {
  id: string;
  file: PickedFile;
  state: 'uploading' | 'ready' | 'failed';
  key?: string;
  /** The sentence to show when `state` is `failed`. */
  error?: string;
};

/** M36's fields, as typed. Category and description are optional ones the Hub keeps and M35 and M34 read. */
export type WorkForm = {
  title: string;
  role: string;
  year: string;
  client: string;
  category: string;
  link: string;
  description: string;
};

export const emptyForm: WorkForm = { title: '', role: '', year: '', client: '', category: '', link: '', description: '' };

export type FormField = keyof WorkForm;

export type Problems = Partial<Record<FormField, string>>;

/** A year is four digits; the range it may sit in is the Hub's to say (its own sentence comes back on the field). */
const YEAR = /^\d{4}$/;

const LIMITED_FIELDS: readonly TextLimit[] = ['title', 'role', 'client', 'category', 'link', 'description'];

/** The fields the Hub keeps as typed after the trim: a link, and the description (a paragraph keeps its runs of spaces and its line breaks). */
const KEPT_AS_TYPED: readonly TextLimit[] = ['link', 'description'];

/** The length the Hub counts: trimmed, and for a single line of words (title, role, client, category) a run of spaces counted as one. */
export function lengthOf(field: TextLimit, value: string): number {
  const text = value.trim();
  return (KEPT_AS_TYPED.includes(field) ? text : text.replace(/ {2,}/g, ' ')).length;
}

/** The app's own sentence for a field that is too long, said before anything is sent. */
export function tooLong(field: TextLimit, length: number): string {
  return `Too long. Use ${WORK_LIMITS[field]} characters or fewer (this has ${length}).`;
}

/** What is wrong before anything is sent. A field left empty is not "wrong": Save simply stays off until it is filled. */
export function problemsOf(form: WorkForm): Problems {
  const problems: Problems = {};
  if (form.year.trim() !== '' && !YEAR.test(form.year.trim())) problems.year = 'Enter the year as four digits.';
  for (const field of LIMITED_FIELDS) {
    const length = lengthOf(field, form[field]);
    if (length > WORK_LIMITS[field]) problems[field] = tooLong(field, length);
  }
  return problems;
}

export function hasProblems(problems: Problems): boolean {
  return Object.values(problems).some(Boolean);
}

/** Title, role and year are what a work cannot be saved without. */
export function isComplete(form: WorkForm): boolean {
  return form.title.trim() !== '' && form.role.trim() !== '' && YEAR.test(form.year.trim());
}

export function isDirty(form: WorkForm, media: readonly MediaItem[]): boolean {
  return media.length > 0 || (Object.keys(emptyForm) as FormField[]).some((field) => form[field].trim() !== '');
}

/** The request body: trimmed, with an empty optional field left out (the Hub keeps it as nothing) and the uploaded keys in the order chosen, the first the cover. */
export function bodyOf(form: WorkForm, keys: readonly string[]): NewWork {
  const body: NewWork = { title: form.title.trim(), role: form.role.trim(), year: Number(form.year.trim()) };
  const client = form.client.trim();
  const category = form.category.trim();
  const link = form.link.trim();
  const description = form.description.trim();
  if (client) body.client = client;
  if (category) body.category = category;
  if (link) body.link = link;
  if (description) body.description = description;
  if (keys.length > 0) body.media = [...keys];
  return body;
}

const FIELD_WORDS: Record<string, FormField> = {
  title: 'title',
  role: 'role',
  year: 'year',
  client: 'client',
  category: 'category',
  link: 'link',
  description: 'description',
};

/**
 * The Hub's validation sentences start with the field they are about ("Title can be at most 120
 * characters", "Year must be a year from 1950 to 2027", "Link is not a web address"). That word
 * decides which field the sentence goes under; anything else is not about one field.
 */
export function fieldOfMessage(message: string): FormField | null {
  const first = message.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return FIELD_WORDS[first] ?? null;
}

/** M36 in its edit form (FIX-113): the fields as the work holds them now. A missing optional one is an empty box. */
export function formOf(work: Pick<WorkDetail, 'title' | 'role' | 'year' | 'client' | 'category' | 'link' | 'description'>): WorkForm {
  return {
    title: work.title,
    role: work.role,
    year: String(work.year),
    client: work.client ?? '',
    category: work.category ?? '',
    link: work.link ?? '',
    description: work.description ?? '',
  };
}

const EDITABLE: readonly FormField[] = ['title', 'role', 'year', 'client', 'category', 'link', 'description'];

/**
 * What differs from the saved work, as `PATCH /users/me/featured-works/{id}` takes it. Only what changed is sent, and an optional
 * field emptied is sent as `null` (the Hub clears it). `null` when nothing changed.
 */
export function changesOf(form: WorkForm, base: WorkForm): WorkUpdate | null {
  const out: WorkUpdate = {};
  for (const field of EDITABLE) {
    const now = form[field].trim();
    if (now === base[field].trim()) continue;
    if (field === 'year') out.year = Number(now);
    else if (field === 'title' || field === 'role') out[field] = now;
    else out[field] = now === '' ? null : now;
  }
  return Object.keys(out).length > 0 ? out : null;
}
