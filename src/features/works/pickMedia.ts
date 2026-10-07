import type { PickedFile } from './form';

export type { PickedFile } from './form';

/**
 * Whether this build can open the phone's photo library. The phone build waits for
 * `expo-image-picker` (SHARED-CHANGES.md row 8, ME-11 #1): until it is installed there is no way to
 * choose a photo or a video on a phone, so M36 does not draw the "Add photos or a video" box there
 * rather than draw a box that does nothing. The web build (`pickMedia.web.ts`) opens the browser's
 * file chooser.
 */
export const canPickMedia = false;

export async function pickMedia(): Promise<PickedFile[]> {
  return [];
}
