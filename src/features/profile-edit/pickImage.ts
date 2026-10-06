/** A picture the person chose, ready to upload. */
export type PickedImage = {
  /** The bytes. */
  blob: Blob;
  /** `image/jpeg`, `image/png`: what `POST /uploads/presign` takes as `contentType`. */
  contentType: string;
  /** Without the dot, as `POST /uploads/presign` takes it. */
  extension: string;
  /** Where the screen can show it before it is uploaded. */
  previewUri: string;
};

/**
 * Whether this build can open the phone's photo library. The phone build waits
 * for `expo-image-picker` (SHARED-CHANGES.md row 8, ME-06 row 12): until it is
 * installed there is no way to choose a picture on a phone, so M8 does not draw
 * the camera buttons there rather than draw a button that does nothing. The web
 * build (`pickImage.web.ts`) opens the browser's file chooser.
 */
export const canPickImage = false;

export async function pickImage(): Promise<PickedImage | null> {
  return null;
}
