import type { AudioSourceProps, VideoSurfaceProps } from './types';

export type { AudioSourceProps, SeekRequest, VideoSurfaceProps } from './types';

/** No player is installed in the phone build yet (SHARED-CHANGES HOME-02 #2). */
export const canPlay = false;

/** Nothing to draw without a player: the post shows its backdrop. */
export function VideoSurface(_props: VideoSurfaceProps) {
  return null;
}

export function AudioSource(_props: AudioSourceProps) {
  return null;
}

/** Waveform peaks need the decoded file, which only the web build can read today. */
export async function loadPeaks(_uri: string, _bars: number): Promise<number[] | null> {
  return null;
}
