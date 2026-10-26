/**
 * Where a person put their profile picture or cover inside its frame (R-96).
 *
 * The Hub keeps the position inside the picture's link, as a fragment after `#`:
 *
 *   https://.../avatars/<id>/<uuid>.jpg?X-Amz-...#wmt-pos=0.52,0.41,1.8,1.3333
 *
 * The four numbers are the focal point (`x`, `y`: 0 to 1, the point of the photo that sits at the
 * middle of the frame), the zoom (1 is the photo filling the frame, 4 is four times that) and the
 * photo's own `ratio` (width over height). Every avatar and header is drawn from the same link, so
 * one function places them all, in any frame of any size: the position is relative, never pixels.
 * A link with no fragment is drawn centred, as every picture was before positions existed.
 *
 * The grammar and its limits are the Hub's (`src/storage/photo-position.ts` in wawu-backend).
 */

export type PhotoPosition = { x: number; y: number; zoom: number; ratio: number };
export type Frame = { width: number; height: number };
/** Where the whole photo sits inside the frame, in the frame's own pixels (the frame clips it). */
export type Placement = { left: number; top: number; width: number; height: number };

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
/** The shapes a photo can be placed in: from 1 wide to 5 tall to 5 wide to 1 tall. Past that it is drawn centred (the Hub refuses a position beyond this too). */
export const RATIO_MIN = 0.2;
export const RATIO_MAX = 5;

const NAME = 'wmt-pos';
const NUMBER = '(\\d+(?:\\.\\d+)?)';
const GRAMMAR = new RegExp(`^${NAME}=${NUMBER},${NUMBER},${NUMBER},${NUMBER}$`);

const within = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, places: number) => Number(value.toFixed(places));

/** The link without its position, and the position it carried (null when there was none or it is not readable). */
export function splitPhotoLink(link: string): { uri: string; position: PhotoPosition | null } {
  const at = link.indexOf('#');
  if (at === -1) return { uri: link, position: null };
  const match = GRAMMAR.exec(link.slice(at + 1));
  if (!match) return { uri: link.slice(0, at), position: null };
  const [x, y, zoom, ratio] = match.slice(1).map(Number);
  const readable = within(x, 0, 1) && within(y, 0, 1) && within(zoom, ZOOM_MIN, ZOOM_MAX) && within(ratio, RATIO_MIN, RATIO_MAX);
  return { uri: link.slice(0, at), position: readable ? { x, y, zoom, ratio } : null };
}

/** The same fragment the Hub writes: x and y to 4 places, zoom to 3, ratio to 4, no trailing zeros. */
export function formatPhotoPosition(position: PhotoPosition): string {
  const short = (value: number, places: number) => String(round(value, places));
  return `${NAME}=${short(position.x, 4)},${short(position.y, 4)},${short(position.zoom, 3)},${short(position.ratio, 4)}`;
}

/** `uri` (with no position of its own) carrying `position`; unchanged when there is none. */
export function withPhotoPosition(uri: string, position: PhotoPosition | null): string {
  return position ? `${splitPhotoLink(uri).uri}#${formatPhotoPosition(position)}` : splitPhotoLink(uri).uri;
}

/** Whether a photo of this shape can be given a position. */
export const canPlace = (ratio: number): boolean => within(ratio, RATIO_MIN, RATIO_MAX);

/** The photo as it first shows: filling the frame, its middle at the frame's middle. */
export const centred = (ratio: number): PhotoPosition => ({ x: 0.5, y: 0.5, zoom: ZOOM_MIN, ratio: Number.isFinite(ratio) && ratio > 0 ? ratio : 1 });

export const isCentred = (position: PhotoPosition): boolean => position.zoom === ZOOM_MIN && position.x === 0.5 && position.y === 0.5;

/** The photo's size at zoom 1: the smallest that covers the frame whatever its shape. */
function filled(frame: Frame, ratio: number): { width: number; height: number } {
  const frameRatio = frame.width / frame.height;
  return ratio > frameRatio ? { width: frame.height * ratio, height: frame.height } : { width: frame.width, height: frame.width / ratio };
}

/** The photo's size at `zoom`. */
function shown(frame: Frame, position: PhotoPosition): { width: number; height: number } {
  const base = filled(frame, position.ratio);
  const zoom = clamp(position.zoom, ZOOM_MIN, ZOOM_MAX);
  return { width: base.width * zoom, height: base.height * zoom };
}

/**
 * The position with its zoom in range and its focal point where the frame stays covered: a photo
 * can never be dragged off its edge, because the middle of the frame cannot go nearer an edge of the
 * photo than half the frame. A photo smaller than the frame is first scaled up to fill it (zoom 1),
 * so the same rule covers it.
 */
export function clampPosition(frame: Frame, position: PhotoPosition): PhotoPosition {
  const size = shown(frame, position);
  const halfX = frame.width / (2 * size.width);
  const halfY = frame.height / (2 * size.height);
  return {
    ratio: position.ratio,
    zoom: clamp(position.zoom, ZOOM_MIN, ZOOM_MAX),
    x: clamp(Number.isFinite(position.x) ? position.x : 0.5, halfX, 1 - halfX),
    y: clamp(Number.isFinite(position.y) ? position.y : 0.5, halfY, 1 - halfY),
  };
}

/** Where to draw the whole photo in `frame`, for a position. The frame is always covered. */
export function placement(frame: Frame, position: PhotoPosition): Placement {
  const at = clampPosition(frame, position);
  const size = shown(frame, at);
  return { left: frame.width / 2 - at.x * size.width, top: frame.height / 2 - at.y * size.height, width: size.width, height: size.height };
}

/** The position saved: clamped for the frame it was made in, and rounded the way the Hub stores it. */
export function settled(frame: Frame, position: PhotoPosition): PhotoPosition {
  const at = clampPosition(frame, position);
  return { x: round(at.x, 4), y: round(at.y, 4), zoom: round(at.zoom, 3), ratio: round(at.ratio, 4) };
}

/** The position after the photo is dragged by (`dx`, `dy`) pixels of the frame: it follows the finger. */
export function movedBy(frame: Frame, position: PhotoPosition, dx: number, dy: number): PhotoPosition {
  const size = shown(frame, position);
  return clampPosition(frame, { ...position, x: position.x - dx / size.width, y: position.y - dy / size.height });
}

/** The position at a new zoom, about the middle of the frame. */
export function zoomedTo(frame: Frame, position: PhotoPosition, zoom: number): PhotoPosition {
  return clampPosition(frame, { ...position, zoom });
}

/**
 * The position at a new zoom, about `point` (in the frame's own pixels, from its top left corner; it may lie outside the frame):
 * the part of the photo under that point stays under it, as when a thumb and finger pinch on a spot of a photo.
 */
export function zoomedAbout(frame: Frame, position: PhotoPosition, zoom: number, point: { x: number; y: number }): PhotoPosition {
  const before = shown(frame, position);
  const next = { ...position, zoom: clamp(zoom, ZOOM_MIN, ZOOM_MAX) };
  const after = shown(frame, next);
  return clampPosition(frame, {
    ...next,
    x: position.x + (point.x - frame.width / 2) * (1 / before.width - 1 / after.width),
    y: position.y + (point.y - frame.height / 2) * (1 / before.height - 1 / after.height),
  });
}

/**
 * How much one turn of a mouse wheel, or one frame of a trackpad pinch (the browser sends it as a wheel with the control key
 * down), multiplies the zoom by. Up or an opening pinch (negative `deltaY`) zooms in. `deltaMode` 1 counts lines, as Firefox sends.
 */
export function wheelZoomFactor(deltaY: number, deltaMode: number, pinch: boolean): number {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaY;
  return Math.exp(-pixels * (pinch ? 0.01 : 0.0025));
}

