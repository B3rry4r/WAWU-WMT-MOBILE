import type { ChosenFile, Frame } from './chosen';

/** The frame of a video in a browser is a link to a picture already (`frames.web.ts`): its bytes are the cover. Null when they cannot be read. */
export async function frameFile(frame: Frame): Promise<ChosenFile | null> {
  if (typeof frame !== 'string') return null;
  try {
    const blob = await (await fetch(frame)).blob();
    if (blob.size === 0) return null;
    return { blob, name: 'cover.jpg', contentType: blob.type || 'image/jpeg', extension: blob.type === 'image/png' ? 'png' : 'jpg', previewUri: frame };
  } catch {
    return null;
  }
}
