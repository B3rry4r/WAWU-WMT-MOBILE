import { ApiError } from '@/api/errors';

import { presign } from './api';
import type { PickedImage } from './pickImage';

/** The `code` of the error the upload itself raises, so the screen knows its sentence is ready to show. */
export const UPLOAD_FAILED = 'upload_failed';

/** The two folders M8 uploads to (`PresignUploadDto.folder`). */
export type PictureFolder = 'avatars' | 'profile/cover';

/** Uploads the picture to the Hub's storage and answers the address it can be read at: what `avatarUrl` and `coverUrl` take. */
export async function uploadPicture(folder: PictureFolder, picked: PickedImage): Promise<string> {
  try {
    const { uploadUrl, fileUrl } = await presign({
      folder,
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
    if (!response.ok) throw new ApiError('server', response.status, 'Your picture did not upload. Try again.', UPLOAD_FAILED);
    return fileUrl;
  } finally {
    // The phone's own copy has done its job once the upload settles, either way (SHARED-04, F3).
    picked.discard?.();
  }
}
