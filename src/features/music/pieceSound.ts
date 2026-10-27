/**
 * The one place a piece's sound and the WAWU theme (R-99) hear of each other. The feed's players call
 * `pieceStartedSound` whenever a video or an audio piece starts playing (every piece in the app plays through them),
 * and the theme player, when it is loaded, listens and stops. It imports nothing, so a player never pulls the theme
 * player's modules in with it.
 */
let listener: (() => void) | null = null;

/** The theme player's side: called when a piece starts. Returns how to stop listening. */
export function onPieceSound(fn: () => void): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** The players' side: a piece with sound has started playing. */
export function pieceStartedSound(): void {
  listener?.();
}
