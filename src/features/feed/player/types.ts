/**
 * The feed's players. The web build plays through the browser's own media elements
 * (`*.web.tsx`). A phone build needs `expo-video` and `expo-audio`, which are not installed
 * yet (SHARED-CHANGES HOME-02 #2): until they are, `canPlay` is false there, and a post draws
 * no play, pause or scrub control (a control that does nothing is a dead button).
 */
export type PlayerEvents = {
  /** The position and length, in seconds, whenever either moves. */
  onTime: (position: number, length: number) => void;
  /** The file played to its end (for a locked piece: the preview ended, H5). */
  onEnded: () => void;
};

export type SeekRequest = { to: number; at: number } | null;

export type VideoSurfaceProps = PlayerEvents & {
  uri: string;
  playing: boolean;
  /** Move to `to` seconds; `at` makes a repeat of the same position a new request. */
  seek: SeekRequest;
  /** Blur the frame (the preview ended, H5). */
  frosted: boolean;
  testID?: string;
};

export type AudioSourceProps = PlayerEvents & {
  uri: string;
  playing: boolean;
  seek: SeekRequest;
  testID?: string;
};
