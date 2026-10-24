import { getDocumentAsync } from 'expo-document-picker';
import { launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync, type ImagePickerAsset } from 'expo-image-picker';

import { forgetFile } from '@/features/media/manipulatorCache';
import { PickFailed, readPicked } from '@/features/profile-edit/readPicked';

import { UnreadableFile, type PickedFile } from './types';

/**
 * A26's and A27's pickers on the phone (KYC-06).
 *
 * - **An ID side** is a photo from the camera ("Tap to take a photo"). When the
 *   camera is not allowed the phone's photo library opens instead, which needs
 *   no permission. Every photo is written again without its Exif (no place, no
 *   time, no phone details: `readPicked`, the lead's 8 Oct ruling), and the
 *   bytes go up as a JPEG or a PNG.
 * - **A proof of address** is a PDF or a photo from the phone's files. A photo
 *   is written again the same way; a PDF goes as it is.
 *
 * Both resolve with null when the person closes the picker without choosing,
 * and reject with `UnreadableFile` when the file cannot be read.
 */
const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };

async function fromAsset(asset: ImagePickerAsset, stem: string): Promise<PickedFile> {
  try {
    const picked = await readPicked(asset);
    return { blob: picked.blob, contentType: picked.contentType, name: `${stem}.${picked.extension}`, uri: picked.previewUri, discard: picked.discard };
  } catch (error) {
    if (error instanceof PickFailed) throw new UnreadableFile();
    throw error;
  }
}

export async function pickIdPhoto(stem: string): Promise<PickedFile | null> {
  const allowed = (await requestCameraPermissionsAsync()).granted;
  const result = allowed ? await launchCameraAsync({ mediaTypes: 'images' }) : await launchImageLibraryAsync({ mediaTypes: 'images' });
  const asset = result.canceled ? undefined : result.assets?.[0];
  return asset ? fromAsset(asset, stem) : null;
}

export async function pickProofFile(stem: string): Promise<PickedFile | null> {
  const result = await getDocumentAsync({ type: Object.keys(EXTENSIONS), copyToCacheDirectory: true, multiple: false });
  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return null;
  const type = (asset.mimeType ?? '').toLowerCase();
  if (type.startsWith('image/')) return fromAsset({ uri: asset.uri, mimeType: type } as ImagePickerAsset, stem);
  let blob: Blob;
  try {
    blob = await (await fetch(asset.uri)).blob();
  } catch {
    throw new UnreadableFile();
  }
  if (blob.size === 0) throw new UnreadableFile();
  return { blob, contentType: 'application/pdf', name: asset.name?.trim() || `${stem}.pdf`, uri: asset.uri, discard: () => forgetFile(asset.uri) };
}
