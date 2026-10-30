/**
 * The feed's players. The web build plays through the browser's own media elements (`index.web.tsx`);
 * a phone plays through `expo-video` and `expo-audio` (`index.tsx`). Both take these props.
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
  /** The piece's name, shown on the phone's lock screen and notification while it plays (the web build ignores it). */
  title?: string;
  testID?: string;
};
