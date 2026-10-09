import { launchImageLibraryAsync } from 'expo-image-picker';

import { readPicked } from './readPicked';

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
  /**
   * Phone builds: deletes the app's own copy of the file once its upload has settled,
   * whether it went up or not (SHARED-04, F3). The upload already holds the bytes in
   * `blob`. Not set on the web build, which has no copy of its own.
   */
  discard?: () => void;
};

/**
 * Whether this build can open the phone's photo library: yes, with
 * `expo-image-picker` (SHARED-CHANGES ME-06 #1, applied by SHARED-04), so M8 draws
 * its avatar and cover camera buttons. The phone's own picker needs no
 * permission. The web build (`pickImage.web.ts`) opens the browser's file chooser.
 */
export const canPickImage = true;

/**
 * Resolves with the chosen picture, or null when the person closes the library without
 * choosing. Rejects when the library itself fails or the photo cannot be read
 * (`PickFailed`): M8 says so, where a cancel stays silent.
 */
export async function pickImage(): Promise<PickedImage | null> {
  const result = await launchImageLibraryAsync({ mediaTypes: 'images' });
  const asset = result.canceled ? undefined : result.assets?.[0];
  return asset ? readPicked(asset) : null;
}
