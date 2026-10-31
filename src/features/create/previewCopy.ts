import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { forgetFile } from '@/features/media/manipulatorCache';
import { fitTo } from '@/features/profile-edit/readPicked';

import type { ChosenFile } from './chosen';
import { PICTURE_PREVIEW_QUALITY, PICTURE_PREVIEW_SIDE } from './model';

/**
 * R-118: the preview of a picture piece is a smaller copy of the creator's own picture, made on the phone with the image manipulator: the long
 * edge at most `PICTURE_PREVIEW_SIDE` px (never enlarged), written as a JPEG at about `PICTURE_PREVIEW_QUALITY`. It is read from the phone's own
 * copy of the picture the creator just chose (before that copy goes at the end of the upload) and held until Send uploads it as the preview of a
 * PAID piece. Null when the phone cannot make it (no copy to read, a picture it cannot decode); the screen then says the picture could not be read.
 * `discard` deletes the app's copy once the preview has gone up, or the piece is given up.
 */
export async function smallCopyOf(file: Pick<ChosenFile, 'previewUri'>): Promise<ChosenFile | null> {
  const uri = file.previewUri;
  if (!uri) return null;
  try {
    const context = ImageManipulator.manipulate(uri);
    try {
      const image = await context.renderAsync();
      try {
        // The size is known only once the picture is read (the phone's own turning of it is applied then), so the resize is a second pass.
        const size = fitTo(image.width, image.height, PICTURE_PREVIEW_SIDE);
        const smaller = size ? ImageManipulator.manipulate(image) : null;
        try {
          const rendered = smaller && size ? await smaller.resize(size).renderAsync() : image;
          try {
            const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: PICTURE_PREVIEW_QUALITY });
            let blob: Blob;
            try {
              blob = await (await fetch(saved.uri)).blob();
            } catch (error) {
              forgetFile(saved.uri);
              throw error;
            }
            if (blob.size === 0) {
              forgetFile(saved.uri);
              return null;
            }
            return { blob, name: 'preview.jpg', contentType: 'image/jpeg', extension: 'jpg', previewUri: saved.uri, discard: () => forgetFile(saved.uri) };
          } finally {
            if (rendered !== image) rendered.release();
          }
        } finally {
          smaller?.release();
        }
      } finally {
        image.release();
      }
    } finally {
      context.release();
    }
  } catch {
    return null;
  }
}
