import { isApiError } from '@/api/errors';

import { documentProblem, type DocumentsView } from './api/documents';
import { UnreadableFile } from './documents/types';

/** What a screen says when it could not take, read or send a file: a title and the sentence under it. Never a code. */
export type Failure = { title: string; body: string };

const BYTES_PER_MB = 1024 * 1024;

/** "10 MB", from the largest size the server said it takes (never a number written here). */
export function sizeWords(bytes: number): string {
  const mb = bytes / BYTES_PER_MB;
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}

/** A file in memory, as a short line: "PDF · 128 KB". */
export function fileLine(contentType: string, bytes: number): string {
  const kind = contentType === 'application/pdf' ? 'PDF' : contentType === 'image/png' ? 'PNG' : 'Photo';
  const size = bytes >= BYTES_PER_MB ? `${(bytes / BYTES_PER_MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${kind} · ${size}`;
}

/** Why a picked file was not taken: the type or the size the server said, or that it could not be read. */
export function pickFailure(problem: 'type' | 'size' | 'unreadable', view: DocumentsView | undefined): Failure {
  if (problem === 'size') {
    return { title: 'That file is too big', body: view ? `Choose a file under ${sizeWords(view.maxBytes)}.` : 'Choose a smaller file.' };
  }
  if (problem === 'type') return { title: "We can't use that file", body: 'Choose a PDF, a JPG or a PNG.' };
  return { title: "We couldn't read that file", body: 'Try again, or choose a different one.' };
}

/** What a refused read, pick or send says, in the server's own sentence where it sent one. */
export function sendFailure(error: unknown, fallbackTitle: string): Failure {
  if (error instanceof UnreadableFile) return pickFailure('unreadable', undefined);
  if (isApiError(error) && error.kind === 'network') return { title: 'No connection', body: error.message };
  const message = isApiError(error) ? error.message : 'Something went wrong. Try again.';
  const problem = documentProblem(error);
  if (problem === 'invalid') return { title: "We can't use that file", body: message };
  if (problem === 'rate_limited') return { title: 'Too many tries', body: message };
  return { title: fallbackTitle, body: message };
}
