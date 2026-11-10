import { File, Paths } from 'expo-file-system';

import { ApiError } from '@/api/errors';
import { smallCopyOf } from '@/features/create/previewCopy';
import type { UploadedFile } from '@/features/create/draft';
import { uploadFile } from '@/features/create/upload';
import { forgetFile } from '@/features/media/manipulatorCache';

/** The sentence when the phone cannot make the smaller copy of the piece's own picture (no connection, a picture it cannot read, the web build). */
export const COPY_FAILED = 'Your preview could not be made. Try again.';

/**
 * R-118 on an edit: a free picture sent to paid needs its preview, and the phone makes it (the Hub has no image library). The piece's own
 * picture comes down from its link into the app's cache, the phone writes the smaller copy (long edge 640 px, a JPEG), and that goes up as the
 * piece's preview. Both of the phone's own copies are deleted whatever happens. Resolves with the file that went up, so a Save that fails and
 * is tried again sends the same preview rather than a second one.
 */
export async function uploadPictureCopy(pictureUrl: string): Promise<UploadedFile> {
  const down = new File(Paths.cache, `edit-picture-${Date.now()}`);
  let copy: Awaited<ReturnType<typeof smallCopyOf>> = null;
  try {
    const got = await File.downloadFileAsync(pictureUrl, down);
    if (!got.exists || !((got.size ?? 0) > 0)) throw new Error('empty');
    copy = await smallCopyOf({ previewUri: got.uri });
  } catch {
    copy = null;
  } finally {
    forgetFile(down.uri);
  }
  if (!copy) throw new ApiError('unknown', 0, COPY_FAILED);
  // `uploadFile` deletes the phone's own copy once the upload has settled, whatever it came to.
  return uploadFile(copy, { folder: 'content/preview', format: 'image' }, () => undefined);
}
