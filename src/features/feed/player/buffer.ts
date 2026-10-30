import type { BufferOptions, VideoPlayer } from 'expo-video';

/**
 * How far ahead a phone player reads. expo-video's Android player is ExoPlayer with its stock load control (50 s ahead, and a byte cap
 * of about 137 MiB for a clip with sound), and it fills that buffer for a PAUSED player too, so a player that only shows a first
 * picture (a course page, a feed card waiting its turn, a piece page before the tap, a profile work) used to pull up to 50 s of the
 * clip, tens of MB on a phone-shot file, on every view. The package's documented Android default (20 s) is never applied by it. On iOS
 * the same field is `AVPlayerItem.preferredForwardBufferDuration` (0, the default, leaves it to the system); it is a preference the
 * system follows, not a hard cap.
 *
 * A player that is not playing reads about two seconds (enough for the first picture, a few MB at most); the moment it plays it gets
 * the documented 20 s. It is never narrowed after it has played: a person who pauses and resumes keeps the buffer they had.
 */
export const FRAME_BUFFER: BufferOptions = { preferredForwardBufferDuration: 2, minBufferForPlayback: 1 };
export const PLAY_BUFFER: BufferOptions = { preferredForwardBufferDuration: 20, minBufferForPlayback: 2 };

/** The read-ahead a player starts with: the frame's while it is not playing, the full one when it plays from the start. */
export const bufferFor = (playing: boolean): BufferOptions => (playing ? PLAY_BUFFER : FRAME_BUFFER);

/** Sets a player's read-ahead, written outside the component (a hook's value is not changed in render code). */
export function readAhead(player: VideoPlayer, options: BufferOptions): void {
  player.bufferOptions = options;
}
