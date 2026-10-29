import { getDocumentAsync } from 'expo-document-picker';
import { launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync, type ImagePickerAsset } from 'expo-image-picker';

import { fileExists, forgetFile } from '@/features/media/manipulatorCache';
import { PickFailed, readPicked, type ReadOptions } from '@/features/profile-edit/readPicked';

import { UnreadableFile, type PickedFile } from './types';

/**
 * A26's and A27's pickers on the phone (KYC-06).
 *
 * - **An ID side** is a photo from the camera ("Tap to take a photo"). When the
 *   camera is not allowed the phone's photo library opens instead, which needs
 *   no permission. Every photo is written again without its Exif (no place, no
 *   time, no phone details: `readPicked`, the lead's 8 Oct ruling), brought down
 *   to `DOCUMENT_LONGEST_SIDE` on its long side and saved as a JPEG, so the
 *   upload over a phone's data is small and quick (OPEN-UPLOAD).
 * - **A proof of address** is a PDF or a photo from the phone's files. A photo
 *   is written again the same way and brought down to the same size (its kind,
 *   JPEG or PNG, is kept); a PDF goes as it is.
 *
 * Both resolve with null when the person closes the picker without choosing,
 * and reject with `UnreadableFile` when the file cannot be read.
 */
const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };

/** The long side, in pixels, a document photo is brought down to: a page of text or an ID card reads well at this size. */
export const DOCUMENT_LONGEST_SIDE = 2000;
/** The JPEG quality of an ID photo. */
const ID_PHOTO_QUALITY = 0.8;

async function fromAsset(asset: ImagePickerAsset, stem: string, options: ReadOptions): Promise<PickedFile> {
  try {
    const picked = await readPicked(asset, options);
    const uri = picked.previewUri;
    return { blob: picked.blob, contentType: picked.contentType, name: `${stem}.${picked.extension}`, uri, stillThere: () => fileExists(uri), discard: picked.discard };
  } catch (error) {
    if (error instanceof PickFailed) throw new UnreadableFile();
    throw error;
  }
}

export async function pickIdPhoto(stem: string): Promise<PickedFile | null> {
  const allowed = (await requestCameraPermissionsAsync()).granted;
  const result = allowed ? await launchCameraAsync({ mediaTypes: 'images' }) : await launchImageLibraryAsync({ mediaTypes: 'images' });
  const asset = result.canceled ? undefined : result.assets?.[0];
  return asset ? fromAsset(asset, stem, { maxSide: DOCUMENT_LONGEST_SIDE, jpeg: true, quality: ID_PHOTO_QUALITY }) : null;
}

export async function pickProofFile(stem: string): Promise<PickedFile | null> {
  const result = await getDocumentAsync({ type: Object.keys(EXTENSIONS), copyToCacheDirectory: true, multiple: false });
  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return null;
  const type = (asset.mimeType ?? '').toLowerCase();
  if (type.startsWith('image/')) return fromAsset({ uri: asset.uri, mimeType: type } as ImagePickerAsset, stem, { maxSide: DOCUMENT_LONGEST_SIDE });
  let blob: Blob;
  try {
    blob = await (await fetch(asset.uri)).blob();
  } catch {
    throw new UnreadableFile();
  }
  if (blob.size === 0) throw new UnreadableFile();
  return { blob, contentType: 'application/pdf', name: asset.name?.trim() || `${stem}.pdf`, uri: asset.uri, stillThere: () => fileExists(asset.uri), discard: () => forgetFile(asset.uri) };
}
