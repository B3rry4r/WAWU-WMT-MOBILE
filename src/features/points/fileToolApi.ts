import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { ChosenFile } from '@/features/create/chosen';
import { UPLOAD_FAILED, xhrPut, type Put } from '@/features/create/upload';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

import { readJobQuote, type JobQuote } from './studioApi';

/**
 * The calls behind a tool that takes the person's own recording (Captions, Clean audio: AITOOLS-04, POINTS-10; Dubbing: AITOOLS-05, POINTS-11).
 *
 * - `POST /uploads/presign` with one of the Hub's two private folders for an AI tool (`GET /ai-tools`, `input.file.folders`): the link the
 *   bytes go up to. The Hub refuses a type or a size it does not take, in its own sentence, and the file is never served to anyone else.
 * - `POST /uploads/confirm` with the key, once the bytes are up: the Hub asks the storage host and only a `confirmed` file can be quoted or run.
 * - `POST /ai-tools/{tool}/quote` with the `key` the upload gave: the Hub opens the file, reads its length itself and prices the minutes.
 *   Nothing is held. The phone sends no length and works none out: the minutes and the cost on screen are this answer's.
 *
 * The bytes go straight to storage with progress, as every other upload in the app does (`xhrPut`).
 */
export type FileQuote = JobQuote & { file: { seconds: number; minutes: number } };

/** The two private folders the Hub keeps a person's recording in, as `GET /ai-tools` names them. */
export type InputFolder = string;

const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** A quote the screen can draw: a whole job quote and the length the Hub read (at least one minute). */
export function readFileQuote(value: unknown): FileQuote {
  const quote = readJobQuote(value);
  const file = (value as { file?: Partial<FileQuote['file']> } | null)?.file;
  if (!file || !whole(file.seconds) || !whole(file.minutes) || file.minutes < 1) throw unreadable('the length of this recording');
  return { ...quote, file: { seconds: file.seconds, minutes: file.minutes } };
}

/** POST /ai-tools/{captions|clean-audio|dubbing}/quote. Rejects with the Hub's own sentence (`ai_file_too_large`, `ai_file_unreadable`, not found). */
export async function fetchFileQuote(toolId: string, fileKey: string): Promise<FileQuote> {
  const body = { fileKey };
  const sent =
    toolId === 'captions'
      ? api.POST('/api/hub/ai-tools/captions/quote', { body })
      : toolId === 'clean-audio'
        ? api.POST('/api/hub/ai-tools/clean-audio/quote', { body })
        : toolId === 'dubbing'
          ? api.POST('/api/hub/ai-tools/dubbing/quote', { body })
          : toolId === 'voice-changer'
            ? api.POST('/api/hub/ai-tools/voice-changer/quote', { body })
            : toolId === 'my-voice'
              ? api.POST('/api/hub/ai-tools/my-voice/quote', { body })
              : toolId === 'video-music'
                ? api.POST('/api/hub/ai-tools/video-music/quote', { body })
                : toolId === 'stems'
                  ? api.POST('/api/hub/ai-tools/stems/quote', { body })
                  : null;
  if (sent === null) throw new ApiError('unknown', 0, 'That did not work. Try again.');
  const out = (await unwrap(sent)) as unknown as Envelope<FileQuote>;
  return readFileQuote(out?.data);
}

export type Uploaded = { key: string };

/**
 * Uploads the recording to the folder the Hub named for its kind and answers the `key` the quote and the job carry. The phone's own copy
 * is let go once the upload settles, either way; a retry picks the file again.
 */
export async function uploadRecording(file: ChosenFile, folder: InputFolder, onProgress: (share: number) => void, signal?: AbortSignal, put: Put = xhrPut): Promise<Uploaded> {
  try {
    const raw = (await unwrap(
      api.POST('/api/hub/uploads/presign', {
        body: { folder: folder as 'ai/input-audio', contentType: file.contentType, extension: file.extension, contentLength: file.blob.size },
      }),
    )) as unknown as { data?: { uploadUrl?: unknown; key?: unknown } } | { uploadUrl?: unknown; key?: unknown };
    const out = ('data' in raw && raw.data ? raw.data : raw) as { uploadUrl?: unknown; key?: unknown };
    if (typeof out.uploadUrl !== 'string' || typeof out.key !== 'string') throw unreadable('upload');
    const status = await put(out.uploadUrl, file.blob, file.contentType, onProgress, signal);
    if (status < 200 || status >= 300) throw new ApiError('server', status, 'That file did not upload. Try again.', UPLOAD_FAILED);
    onProgress(1);
    // The Hub opens a file for a tool only once the storage host has said it landed: it asks the bucket and answers confirmed, pending (not there yet) or abandoned.
    const settled = (await unwrap(api.POST('/api/hub/uploads/confirm', { body: { key: out.key } }))) as unknown as Envelope<{ status?: unknown }>;
    if (settled?.data?.status !== 'confirmed') throw new ApiError('server', 0, 'That file did not upload. Try again.', UPLOAD_FAILED);
    return { key: out.key };
  } finally {
    file.discard?.();
  }
}
