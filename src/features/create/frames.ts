import { createVideoPlayer, type VideoPlayer } from 'expo-video';

import { FRAME_BUFFER, readAhead } from '@/features/feed/player/buffer';

import type { ChosenFile, Frame } from './chosen';

/** How far into the video the frame is read (the first half second skips a fade in), and the longest side of the picture. */
export const FRAME_AT_SECONDS = 0.5;
export const FRAME_MAX_SIDE = 480;
/** The most a frame may take. A phone reads one in well under a second; a file that takes longer keeps the icon instead of holding the upload back. */
export const FRAME_TIMEOUT_MS = 4000;

/** Resolves once the player has opened the file (the phone loads it asynchronously), rejects when it cannot. */
function opened(player: VideoPlayer): Promise<void> {
  return new Promise((resolve, reject) => {
    if (player.status === 'readyToPlay') return resolve();
    if (player.status === 'error') return reject(new Error('The video could not be opened.'));
    const subscription = player.addListener('statusChange', ({ status }) => {
      if (status !== 'readyToPlay' && status !== 'error') return;
      subscription.remove();
      if (status === 'readyToPlay') resolve();
      else reject(new Error('The video could not be opened.'));
    });
  });
}

/**
 * One frame out of the video the person chose, from the file on their phone (`expo-video`'s own thumbnail reader: Android's
 * MediaMetadataRetriever and iOS's AVAssetImageGenerator, a gallery `content://` link included), or null for anything else: a
 * file that is not a video, a link the phone cannot open, a video with no readable frame, or one that takes longer than
 * `FRAME_TIMEOUT_MS`. It never throws and never waits for ever, and it lets the player go whatever happens.
 */
export async function frameFor(file: Pick<ChosenFile, 'contentType' | 'previewUri'>): Promise<Frame | null> {
  const uri = file.previewUri;
  if (!file.contentType.startsWith('video/') || !uri) return null;
  let player: VideoPlayer | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const made = createVideoPlayer(uri);
    player = made;
    // The reader only needs to open the file: it never plays, so it reads two seconds ahead, not the player's stock 50 (`buffer.ts`).
    readAhead(made, FRAME_BUFFER);
    const read = (async () => {
      await opened(made);
      const at = made.duration > 0 ? Math.min(FRAME_AT_SECONDS, made.duration / 2) : FRAME_AT_SECONDS;
      const [thumbnail] = await made.generateThumbnailsAsync([at], { maxWidth: FRAME_MAX_SIDE, maxHeight: FRAME_MAX_SIDE });
      return thumbnail ?? null;
    })();
    const late = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), FRAME_TIMEOUT_MS);
    });
    // `read` may still fail after `late` has won: its failure is already answered.
    read.catch(() => undefined);
    return await Promise.race([read, late]);
  } catch {
    return null;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    try {
      player?.release();
    } catch {
      // A player that is already gone has nothing to release.
    }
  }
}
