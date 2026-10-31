import type { DraftCover, UploadedFile } from './draft';
import { frameFile } from './frameFile';
import { uploadFile } from './upload';

/**
 * The `coverAsset` the create call takes (R-114), or null for a piece with no cover: the picture the person picked (already up), nothing when
 * they chose none, and by default the frame read out of a video preview, written as a JPEG and sent to `content/cover` now. That default is not
 * something the person asked for, so a frame that cannot be written or sent leaves the piece without a cover and says nothing; the piece itself
 * still goes.
 */
export async function coverAssetFor(preview: UploadedFile, cover: DraftCover): Promise<string | null> {
  if (cover.mode === 'none') return null;
  if (cover.mode === 'picture') return cover.file?.fileUrl ?? null;
  if (!preview.frame) return null;
  try {
    const file = await frameFile(preview.frame);
    if (!file) return null;
    const uploaded = await uploadFile(file, { folder: 'content/cover' }, () => undefined);
    return uploaded.fileUrl;
  } catch {
    return null;
  }
}
