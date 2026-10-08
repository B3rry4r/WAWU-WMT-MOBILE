import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

import type { PickedImage } from './pickImage';

/*
 * One photo or video the phone's photo library handed back (`expo-image-picker`),
 * read into what `POST /uploads/presign` and the upload take. M8's `pickImage.ts`
 * and M36's `pickMedia.ts` (`@/features/works`) both use it on the phone; the web
 * build reads the browser's `File` instead.
 */

/** The picture types every upload folder takes (`IMAGE` in wawu-backend `src/storage/dto/presign-upload.dto.ts`). */
const PICTURE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
/** The JPEG quality a photo in another format (HEIC, GIF) is re-encoded at. */
const CONVERTED_QUALITY = 0.9;

const extensionOf = (type: string): string => {
  const subtype = type.split('/')[1]?.split('+')[0] ?? '';
  return subtype === 'jpeg' ? 'jpg' : subtype;
};

/** A photo the Hub would refuse for its format, written again as a JPEG: where the new file is. */
async function asJpeg(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  try {
    const image = await context.renderAsync();
    try {
      return (await image.saveAsync({ format: SaveFormat.JPEG, compress: CONVERTED_QUALITY })).uri;
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}

/**
 * The asset's bytes, its type (as the library reports it) and the extension from
 * that type. A photo in a format no upload folder takes (an iPhone's HEIC, a GIF)
 * goes up as a JPEG instead of being refused by the Hub; a video goes as it is,
 * and the Hub says if it cannot take it.
 */
export async function readPicked(asset: ImagePickerAsset): Promise<PickedImage> {
  const video = asset.type === 'video';
  let uri = asset.uri;
  let contentType = asset.mimeType ?? (video ? 'video/mp4' : 'image/jpeg');
  if (!video && !PICTURE_TYPES.includes(contentType)) {
    uri = await asJpeg(asset.uri);
    contentType = 'image/jpeg';
  }
  const blob = await (await fetch(uri)).blob();
  return { blob, contentType, extension: extensionOf(contentType), previewUri: uri };
}
