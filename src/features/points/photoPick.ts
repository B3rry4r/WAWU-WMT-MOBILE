import { launchCameraAsync, requestCameraPermissionsAsync } from 'expo-image-picker';

import type { ChosenFile } from '@/features/create/chosen';
import { readPicked } from '@/features/profile-edit/readPicked';

/**
 * The camera for a tool's photo row (POINTS-14, POINTS-15), on `expo-image-picker` as the ID photo is (KYC-06). The library goes
 * through Create's `pickFile`. The photo is written again without where it was taken (`readPicked`, the 8 Oct ruling) and a HEIC photo
 * leaves as a JPEG, which is what the Hub takes. Resolves with null when the person closes the camera, `refused` when the phone's
 * camera permission is off (the library pick still works), and rejects when the picture cannot be read.
 */
export const canTakePhoto = true;

export async function takePhoto(): Promise<ChosenFile | null | 'refused'> {
  const allowed = (await requestCameraPermissionsAsync()).granted;
  if (!allowed) return 'refused';
  const result = await launchCameraAsync({ mediaTypes: 'images' });
  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return null;
  const picked = await readPicked(asset);
  return { blob: picked.blob, name: asset.fileName ?? `photo.${picked.extension}`, contentType: picked.contentType, extension: picked.extension, previewUri: picked.previewUri, discard: picked.discard };
}
