import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { forgetFile } from '@/features/media/manipulatorCache';

import type { ChosenFile, Frame } from './chosen';

/** A cover is a JPEG of the frame at about the size it was read (`frames.ts`, at most 480 px a side), 85% quality. */
const COMPRESS = 0.85;

/**
 * The frame read out of a person's video (`frames.ts`) as a file the Hub takes for a cover (`content/cover`, R-114): the phone's own
 * native image written as a JPEG. Null when it cannot be written, so the piece is sent without a cover and nothing is said (the person
 * did not choose it, it is the default). `discard` deletes the app's own copy once the upload has settled.
 */
export async function frameFile(frame: Frame): Promise<ChosenFile | null> {
  try {
    const context = ImageManipulator.manipulate(frame);
    try {
      const image = await context.renderAsync();
      try {
        const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: COMPRESS });
        const blob = await (await fetch(saved.uri)).blob();
        if (blob.size === 0) return null;
        return {
          blob,
          name: 'cover.jpg',
          contentType: 'image/jpeg',
          extension: 'jpg',
          previewUri: saved.uri,
          discard: () => forgetFile(saved.uri),
        };
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
