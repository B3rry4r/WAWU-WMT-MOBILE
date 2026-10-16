import { ApiError } from '@/api/errors';

import { presign } from './api';
import type { ChosenFile } from './chosen';
import type { UploadedFile } from './draft';
import type { FormatId } from './model';

/** The `code` of the error the upload itself raises, so a screen knows its sentence is ready to show. */
export const UPLOAD_FAILED = 'upload_failed';
export const UPLOAD_CANCELLED = 'upload_cancelled';

/** Sends the bytes to the link and answers the HTTP status. `onProgress` hears the share sent, 0 to 1. */
export type Put = (url: string, body: Blob, contentType: string, onProgress: (share: number) => void, signal?: AbortSignal) => Promise<number>;

/** The phone's and the browser's own request object, because `fetch` cannot report how much of a body has gone. */
export const xhrPut: Put = (url, body, contentType, onProgress, signal) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('content-type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(Math.min(1, event.loaded / event.total));
    };
    xhr.onload = () => resolve(xhr.status);
    xhr.onerror = () => reject(new ApiError('network', 0, 'No connection. Check your internet and try again.'));
    xhr.onabort = () => reject(new ApiError('unknown', 0, 'The upload was stopped.', UPLOAD_CANCELLED));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(body);
  });

export type UploadTarget = { folder: 'content/full' | 'content/preview'; format: FormatId };

/**
 * Uploads one file to the Hub's storage under the format's rule and answers what the create call takes. The link comes
 * from `POST /uploads/presign` (the Hub refuses a type or a size the format does not take, and a piece over the account's
 * upload or storage limit, in its own sentence); the bytes go straight to storage with progress.
 */
export async function uploadFile(
  file: ChosenFile,
  target: UploadTarget,
  onProgress: (share: number) => void,
  signal?: AbortSignal,
  put: Put = xhrPut,
): Promise<UploadedFile> {
  try {
    const { uploadUrl, key, fileUrl } = await presign(target.folder, target.format, file.contentType, file.extension, file.blob.size);
    const status = await put(uploadUrl, file.blob, file.contentType, onProgress, signal);
    if (status < 200 || status >= 300) throw new ApiError('server', status, 'That file did not upload. Try again.', UPLOAD_FAILED);
    onProgress(1);
    return { name: file.name, bytes: file.blob.size, contentType: file.contentType, key, fileUrl, previewUri: file.previewUri };
  } finally {
    // The phone's own copy has done its job once the upload settles, either way; a retry picks the file again.
    file.discard?.();
  }
}
