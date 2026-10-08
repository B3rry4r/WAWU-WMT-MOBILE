import { launchImageLibraryAsync } from 'expo-image-picker';

import { readPicked } from '@/features/profile-edit/readPicked';

import type { PickedFile } from './form';
import { WORK_LIMITS } from './limits';

export type { PickedFile } from './form';

/**
 * Whether this build can open the phone's photo library: yes, with `expo-image-picker` (SHARED-CHANGES ME-11 #1,
 * applied by SHARED-04), so M36 draws its "Add photos or a video" box. The phone's own picker needs no permission.
 * The web build (`pickMedia.web.ts`) opens the browser's file chooser.
 */
export const canPickMedia = true;

/**
 * Resolves with the chosen photos and videos in the order chosen, at most what one work can carry (none when the
 * person closes the library without choosing). A file that cannot be read is left out.
 */
export async function pickMedia(): Promise<PickedFile[]> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: WORK_LIMITS.media,
    orderedSelection: true,
  }).catch(() => null);
  if (!result || result.canceled) return [];
  const read = await Promise.all(result.assets.map((asset) => readPicked(asset).catch(() => null)));
  return read.filter((file): file is PickedFile => file !== null);
}
