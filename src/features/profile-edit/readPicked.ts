import { Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

import { forgetFile } from '@/features/media/manipulatorCache';

import type { PickedImage } from './pickImage';

/*
 * One photo or video the phone's photo library handed back (`expo-image-picker`),
 * read into what `POST /uploads/presign` and the upload take. M8's `pickImage.ts`
 * and M36's `pickMedia.ts` (`@/features/works`) both use it on the phone; the web
 * build reads the browser's `File` instead.
 *
 * - **A photo never carries where it was taken** (lead ruling, 8 Oct 2026). Every
 *   photo is written again with `expo-image-manipulator` before it goes up: the
 *   encoder writes the pixels and no metadata, so no Exif block, GPS, time or phone
 *   details. It keeps the size it was picked at unless the caller asks for a cap
 *   (`ReadOptions`, OPEN-UPLOAD: A26 and A27 bring a photo down to a size a phone can
 *   send over 4G); otherwise only the Hub's own upload limit applies. A video goes
 *   as it was chosen.
 * - **Transparency is kept** (lead ruling after the verifier, D2): a PNG stays a PNG
 *   and a WebP a WebP; a GIF becomes a PNG of its first frame; a JPEG, a HEIC, a HEIF
 *   or anything else becomes a JPEG at 0.9.
 * - **A photo the phone cannot read is not a cancel** (D1): it throws `PickFailed`,
 *   and the screen says so.
 * - **No copy is left behind** (F3): the library's own copy of a photo (with its
 *   Exif) is deleted once it has been written again, and `discard` deletes the
 *   app's copy (and a video's library copy) once its upload has settled.
 */

/** A chosen file the phone could not read: a 0-byte or corrupt photo, one the encoder cannot decode. */
export class PickFailed extends Error {
  constructor() {
    super('The chosen file could not be read.');
    this.name = 'PickFailed';
  }
}

/** The quality a photo is written again at, in JPEG and WebP. */
const PHOTO_QUALITY = 0.9;
/** PNG is lossless: the quality is not read. */
const LOSSLESS = 1;

/** How a photo is written again: the encoder's format and quality, and the type it then goes up as. */
type Rewrite = { format: SaveFormat; compress: number; contentType: string };

export function rewriteFor(mimeType: string | undefined): Rewrite {
  switch ((mimeType ?? '').toLowerCase()) {
    case 'image/png':
      return { format: SaveFormat.PNG, compress: LOSSLESS, contentType: 'image/png' };
    case 'image/webp':
      return { format: SaveFormat.WEBP, compress: PHOTO_QUALITY, contentType: 'image/webp' };
    case 'image/gif':
      // The first frame, keeping its transparency.
      return { format: SaveFormat.PNG, compress: LOSSLESS, contentType: 'image/png' };
    default:
      // A JPEG, a HEIC, a HEIF, or a type the library did not name.
      return { format: SaveFormat.JPEG, compress: PHOTO_QUALITY, contentType: 'image/jpeg' };
  }
}

const extensionOf = (type: string): string => {
  const subtype = type.split('/')[1]?.split('+')[0] ?? '';
  return subtype === 'jpeg' ? 'jpg' : subtype;
};

/**
 * What the caller may ask of a photo beyond the default (the size it was picked at, written again in its own kind).
 * `maxSide` brings the long side down to that many pixels (never up); `jpeg` writes it as a JPEG whatever it was,
 * at `quality` when given. Left out, a photo is written exactly as before.
 */
export type ReadOptions = { maxSide?: number; jpeg?: boolean; quality?: number };

/** The size to bring a `width` by `height` photo to so its long side is `longest`: null when it already fits. */
export function fitTo(width: number, height: number, longest: number): { width: number } | { height: number } | null {
  if (!(longest > 0) || Math.max(width, height) <= longest) return null;
  return width >= height ? { width: longest } : { height: longest };
}

/** The photo written again in `how.format`, at the size it was picked (or within `maxSide`): where the new file is. Throws when it cannot be read. */
async function rewrite(uri: string, how: Rewrite, maxSide?: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  try {
    const image = await context.renderAsync();
    try {
      const size = maxSide ? fitTo(image.width, image.height, maxSide) : null;
      if (!size) return (await image.saveAsync({ format: how.format, compress: how.compress })).uri;
      // The size is known only once the photo is read (the phone's own turning of it is applied then), so the resize is a second pass over that image.
      const smaller = ImageManipulator.manipulate(image);
      try {
        const resized = await smaller.resize(size).renderAsync();
        try {
          return (await resized.saveAsync({ format: how.format, compress: how.compress })).uri;
        } finally {
          resized.release();
        }
      } finally {
        smaller.release();
      }
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}

/** Deletes the library's own copy of a picked file, when it is one in the app's cache (never a file of the phone's own). */
function forgetLibraryCopy(uri: string) {
  const cache = Paths.cache.uri;
  if (cache && uri.startsWith(cache)) forgetFile(uri);
}

/** The bytes at `uri`, or `PickFailed` when they cannot be read or there are none. */
async function bytesAt(uri: string): Promise<Blob> {
  let blob: Blob;
  try {
    blob = await (await fetch(uri)).blob();
  } catch {
    throw new PickFailed();
  }
  if (blob.size === 0) throw new PickFailed();
  return blob;
}

/** True when the library handed back a video. */
export const isVideoAsset = (asset: ImagePickerAsset) => asset.type === 'video' || (asset.mimeType ?? '').startsWith('video/');

/**
 * The asset's bytes, the type they go up as, the extension from that type, where the
 * screen can show it, and `discard` for after its upload. Throws `PickFailed` when the
 * file cannot be read.
 */
export async function readPicked(asset: ImagePickerAsset, options: ReadOptions = {}): Promise<PickedImage> {
  if (isVideoAsset(asset)) {
    const blob = await bytesAt(asset.uri);
    const contentType = asset.mimeType ?? 'video/mp4';
    return { blob, contentType, extension: extensionOf(contentType), previewUri: asset.uri, discard: () => forgetLibraryCopy(asset.uri) };
  }
  const how: Rewrite = options.jpeg
    ? { format: SaveFormat.JPEG, compress: options.quality ?? PHOTO_QUALITY, contentType: 'image/jpeg' }
    : rewriteFor(asset.mimeType);
  let copy: string;
  try {
    copy = await rewrite(asset.uri, how, options.maxSide);
  } catch {
    throw new PickFailed();
  } finally {
    // The library's copy still holds the photo's Exif: once written again (or found unreadable), it is not needed.
    forgetLibraryCopy(asset.uri);
  }
  try {
    const blob = await bytesAt(copy);
    return { blob, contentType: how.contentType, extension: extensionOf(how.contentType), previewUri: copy, discard: () => forgetFile(copy) };
  } catch (error) {
    forgetFile(copy);
    throw error;
  }
}
