import { ApiError } from '@/api/errors';

import { presign } from './api';
import type { PickedDocument } from './pickDocument';

/** The `code` of the error the upload itself raises. */
export const UPLOAD_FAILED = 'upload_failed';

/** Uploads the file to the Hub's storage and answers the address it can be read at: what an application's `documents` take. */
export async function uploadDocument(picked: PickedDocument): Promise<string> {
  const { uploadUrl, fileUrl } = await presign({
    folder: 'professional/document',
    contentType: picked.contentType,
    extension: picked.extension,
    contentLength: picked.blob.size,
  });
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': picked.contentType }, body: picked.blob });
  } catch {
    throw new ApiError('network', 0, 'No connection. Check your internet and try again.');
  }
  if (!response.ok) throw new ApiError('server', response.status, 'Your file did not upload. Try again.', UPLOAD_FAILED);
  return fileUrl;
}
