import { ApiError } from '@/api/errors';

import { presignWorkMedia } from './api';
import type { PickedFile } from './form';

/** The `code` of the error the upload itself raises, so the screen knows its sentence is ready to show. */
export const UPLOAD_FAILED = 'upload_failed';

/** Uploads one photo or video to the Hub's storage and answers the key `POST /users/me/featured-works` takes in `media`. */
export async function uploadWorkFile(file: PickedFile): Promise<string> {
  const { uploadUrl, key } = await presignWorkMedia(file.contentType, file.extension, file.blob.size);
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': file.contentType }, body: file.blob });
  } catch {
    throw new ApiError('network', 0, 'No connection. Check your internet and try again.');
  }
  if (!response.ok) throw new ApiError('server', response.status, 'That file did not upload. Try again.', UPLOAD_FAILED);
  return key;
}
