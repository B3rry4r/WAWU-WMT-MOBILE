import { launchImageLibraryAsync } from 'expo-image-picker';

import { isVideoAsset, readPicked } from '@/features/profile-edit/readPicked';

import type { MediaKind, PickedFile } from './form';
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
 * person closes the library without choosing). A file that cannot be read is left out, and `onUnreadable` hears
 * the kind of each one left out, so M36 can say how many (D1). Rejects when the library itself fails.
 */
export async function pickMedia(onUnreadable?: (kinds: MediaKind[]) => void): Promise<PickedFile[]> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: WORK_LIMITS.media,
    orderedSelection: true,
  });
  if (result.canceled || !result.assets) return [];
  const read = await Promise.all(result.assets.map((asset) => readPicked(asset).catch(() => null)));
  const unreadable = result.assets.flatMap((asset, i): MediaKind[] => (read[i] === null ? [isVideoAsset(asset) ? 'video' : 'image'] : []));
  if (unreadable.length > 0) onUnreadable?.(unreadable);
  return read.filter((file): file is PickedFile => file !== null);
}
