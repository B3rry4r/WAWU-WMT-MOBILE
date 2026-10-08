import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

import type { PickedImage } from './pickImage';

/*
 * One photo or video the phone's photo library handed back (`expo-image-picker`),
 * read into what `POST /uploads/presign` and the upload take. M8's `pickImage.ts`
 * and M36's `pickMedia.ts` (`@/features/works`) both use it on the phone; the web
 * build reads the browser's `File` instead.
 *
 * **A photo never carries where it was taken** (lead ruling, 8 Oct 2026). Every
 * photo is written again as a JPEG before it goes up: the encoder writes the
 * pixels and nothing else, so the camera's EXIF block (the place, the time, the
 * phone) is not in what is uploaded. The photo keeps the size it was picked at;
 * only the Hub's own upload limit applies, as for any file. A video goes as it
 * was chosen.
 */

/** The JPEG quality every picked photo is written again at. */
const PHOTO_QUALITY = 0.9;

const extensionOf = (type: string): string => {
  const subtype = type.split('/')[1]?.split('+')[0] ?? '';
  return subtype === 'jpeg' ? 'jpg' : subtype;
};

/** The photo written again as a JPEG, at the size it was picked: where the new file is. */
async function asJpeg(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  try {
    const image = await context.renderAsync();
    try {
      return (await image.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY })).uri;
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}

/**
 * The asset's bytes, its type and the extension from that type. A photo, whatever
 * its format (JPEG, PNG, WebP, an iPhone's HEIC, a GIF), goes up as the JPEG written
 * from it, so no EXIF block travels with it and no upload folder refuses its type.
 * A video goes as it is, with the type the library reports, and the Hub says if it
 * cannot take it.
 */
export async function readPicked(asset: ImagePickerAsset): Promise<PickedImage> {
  const video = asset.type === 'video' || (asset.mimeType ?? '').startsWith('video/');
  const uri = video ? asset.uri : await asJpeg(asset.uri);
  const contentType = video ? (asset.mimeType ?? 'video/mp4') : 'image/jpeg';
  const blob = await (await fetch(uri)).blob();
  return { blob, contentType, extension: extensionOf(contentType), previewUri: uri };
}
