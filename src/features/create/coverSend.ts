import { setCover, type DraftCover, type UploadedFile } from './draft';
import { frameFile } from './frameFile';
import { uploadFile } from './upload';

/**
 * The `coverAsset` the create call takes (R-114), or null for a piece with no cover: the picture the person picked (already up), nothing when
 * they chose none, and by default the frame read out of the video they uploaded (R-118: the full file, or a course's first lesson), written as a JPEG and sent to `content/cover` now. That default is not
 * something the person asked for, so a frame that cannot be written or sent leaves the piece without a cover and says nothing; the piece itself
 * still goes. The frame that went up is kept in the draft: a Send that fails and is tried again uses it rather than sending a second one, and
 * it is given back to the Hub if the person leaves (`draft.ts` gives back whatever the cover holds).
 */
export async function coverAssetFor(source: UploadedFile | null, cover: DraftCover): Promise<string | null> {
  if (cover.mode === 'none') return null;
  if (cover.mode === 'picture') return cover.file?.fileUrl ?? null;
  if (cover.file) return cover.file.fileUrl;
  if (!source?.frame) return null;
  try {
    const file = await frameFile(source.frame);
    if (!file) return null;
    const uploaded = await uploadFile(file, { folder: 'content/cover' }, () => undefined);
    setCover({ mode: 'default', file: uploaded });
    return uploaded.fileUrl;
  } catch {
    return null;
  }
}
