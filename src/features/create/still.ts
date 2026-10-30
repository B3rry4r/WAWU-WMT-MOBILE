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
