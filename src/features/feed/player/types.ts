/**
 * The feed's players. The web build plays through the browser's own media elements (`index.web.tsx`);
 * a phone plays through `expo-video` and `expo-audio` (`index.tsx`). Both take these props.
 */
export type PlayerEvents = {
  /** The position and length, in seconds, whenever either moves. */
  onTime: (position: number, length: number) => void;
  /** The file played to its end (for a locked piece: the preview ended, H5). */
  onEnded: () => void;
  /**
   * R-117 · the players' loading state. Called whenever it changes, and only while the player is asked to play: `waiting` while the file is
   * still coming in or the player has run dry (the button shows the spinner in place of pause); `ready` the moment sound or picture runs
   * (and whenever nothing is asked of it); `failed` when the file cannot be loaded, or no sound has come within `LOAD_PATIENCE_MS` (the
   * words are the screen's; the spinner never stays on).
   */
  onLoad?: (state: LoadState) => void;
};

/** What a player that is asked to play is doing about the file (R-117). */
export type LoadState = 'waiting' | 'ready' | 'failed';

export type SeekRequest = { to: number; at: number } | null;

export type VideoSurfaceProps = PlayerEvents & {
  uri: string;
  playing: boolean;
  /** Move to `to` seconds; `at` makes a repeat of the same position a new request. */
  seek: SeekRequest;
  /** Blur the frame (the preview ended, H5). */
  frosted: boolean;
  /**
   * R-117 · a number that goes up each time the full-screen button is pressed: the phone's own full-screen video opens on this player
   * (same position, same play state), with landscape allowed. Left out, there is no full screen for this surface.
   */
  fullscreenAt?: number;
  /** The first picture of the file is on screen (a post draws the kind's mark until then, never an empty box). */
  onFirstFrame?: () => void;
  testID?: string;
};

export type AudioSourceProps = PlayerEvents & {
  uri: string;
  playing: boolean;
  seek: SeekRequest;
  /**
   * The piece's name, shown on the phone's lock screen and notification while it plays (the web build ignores it). A piece with a
   * title keeps playing in the background; a short voice clip (no title) does neither.
   */
  title?: string;
  testID?: string;
};
