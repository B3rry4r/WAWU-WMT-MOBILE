import { useState } from 'react';
import { PixelRatio } from 'react-native';

/**
 * APP-THUMBS: the Hub's small copies of a public picture (`{ w96, w640 }`, WebP, long side 96 and 640 px), served as
 * `avatarThumbs`, `coverThumbs`, `thumbnailThumbs` and `previewThumbs` to a request that sends `X-Wawu-Client: app`.
 * Any of them may be missing or null (a picture from before the backfill, one that could not be read), and then the
 * full picture is drawn exactly as it always was.
 */
export type Copies = { w96: string; w640: string } | null | undefined;

export const SMALL_PX = 96;
export const MEDIUM_PX = 640;

/** The address of the copy for a picture drawn `drawnPx` device pixels wide at most: w96, w640, or null for the full picture. */
export function copyFor(copies: Copies, drawnPx: number): string | null {
  if (!copies) return null;
  const small = typeof copies.w96 === 'string' && copies.w96 !== '' ? copies.w96 : null;
  const medium = typeof copies.w640 === 'string' && copies.w640 !== '' ? copies.w640 : null;
  if (drawnPx <= SMALL_PX) return small ?? medium;
  if (drawnPx <= MEDIUM_PX) return medium;
  return null;
}

/** A size drawn in layout points (what a style says) as device pixels on this screen: 44 on a 3x phone is 132. */
export const devicePx = (points: number): number => points * PixelRatio.get();

/** The `#...` the Hub puts on a person's picture link (where they placed the photo, R-96); a copy of that picture carries the same one. */
const fragmentOf = (link: string): string => {
  const at = link.indexOf('#');
  return at < 0 ? '' : link.slice(at);
};

/**
 * What to try for a picture, best first: its small copy for the size drawn (when there is one), then the full picture.
 * `drawn` is the longest side the picture is drawn at, in layout points; left out (a size nobody knows yet), the 640 copy
 * is taken, which no screen shows blurry below 640 device pixels.
 */
export function copyCandidates(full: string, copies: Copies, drawn?: number): string[] {
  const small = copyFor(copies, drawn === undefined ? MEDIUM_PX : devicePx(drawn));
  return small ? [`${small.split('#')[0]}${fragmentOf(full)}`, full] : [full];
}

/**
 * The address to draw, and what to call when it fails to load. A small copy that fails switches to the full picture, once;
 * the full picture failing is the caller's to handle (`final`), so there is no loop and never a blank.
 */
export function useCopy(full: string, copies: Copies, drawn?: number): { uri: string; onError: () => 'retry' | 'final' } {
  const [failed, setFailed] = useState<string | null>(null);
  const [first, second] = copyCandidates(full, copies, drawn);
  const uri = second !== undefined && first !== failed ? first : (second ?? first);
  return {
    uri,
    onError: () => {
      if (second !== undefined && uri === first) {
        setFailed(first);
        return 'retry';
      }
      return 'final';
    },
  };
}
