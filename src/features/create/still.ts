import type { Frame } from './chosen';
import type { UploadedFile } from './draft';

/** What `expo-image` takes as a source: a link, or the phone's own native image. */
export type StillSource = { uri: string } | Exclude<Frame, string>;

/**
 * The picture a person's own file can be drawn as, or null when it has none (the screen then draws the kind's icon): a photo is
 * its own picture, a video is the frame read out of it (`frames.ts`), and a PDF, an audio file or a template has no picture.
 */
export function stillOf(file: Pick<UploadedFile, 'contentType' | 'previewUri' | 'frame'>): StillSource | null {
  if (file.contentType.startsWith('image/')) return file.previewUri ? { uri: file.previewUri } : null;
  if (file.contentType.startsWith('video/') && file.frame) return typeof file.frame === 'string' ? { uri: file.frame } : file.frame;
  return null;
}

/**
 * The picture a listing will carry (R-114), for the tiles of "How it will look" and the price step's card: the picture the person picked
 * for a cover, else (when they chose nothing, or "Video frame") the preview's own still, and none when they chose no cover.
 */
export function listingStill(file: Pick<UploadedFile, 'contentType' | 'previewUri' | 'frame'>, cover: { mode: 'default' | 'picture' | 'none'; file: { previewUri?: string } | null }): StillSource | null {
  if (cover.mode === 'none') return null;
  if (cover.mode === 'picture' && cover.file?.previewUri) return { uri: cover.file.previewUri };
  return stillOf(file);
}
